from __future__ import annotations

import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any

from flask import Flask, redirect, render_template, request, url_for

app = Flask(__name__)
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DATA_FILE = DATA_DIR / "orders.json"
GRID_COLS = 12
GRID_ROWS = 8

COMMON_DRINKS = [
    "Still Water", "Sparkling Water", "Coke", "Diet Coke", "Lemonade", "Orange Juice",
    "Apple Juice", "House Red Wine", "House White Wine", "Prosecco", "Beer", "Gin & Tonic",
    "Vodka Lemonade", "Mocktail", "Tea", "Coffee"
]


def now_iso() -> str:
    return datetime.now().isoformat(timespec="seconds")


def make_id() -> str:
    return uuid.uuid4().hex[:16]


def make_seats(chairs: int) -> list[dict[str, Any]]:
    return [{"position": i, "drink": "", "notes": "", "status": "pending"} for i in range(1, max(1, chairs) + 1)]


def default_data() -> dict[str, Any]:
    return {"tables": [], "sections": ["Main Room"], "servers": ["Unassigned"], "notifications": [], "updated_at": now_iso()}


def clamp(value: int, low: int, high: int) -> int:
    return max(low, min(high, value))


def normalise_data(data: dict[str, Any]) -> dict[str, Any]:
    base = default_data()
    base.update(data if isinstance(data, dict) else {})
    if not isinstance(base.get("tables"), list):
        base["tables"] = []
    if not isinstance(base.get("sections"), list) or not base["sections"]:
        base["sections"] = ["Main Room"]
    if not isinstance(base.get("servers"), list) or not base["servers"]:
        base["servers"] = ["Unassigned"]
    if not isinstance(base.get("notifications"), list):
        base["notifications"] = []

    occupied = set()
    for table in base["tables"]:
        table.setdefault("id", make_id())
        table.setdefault("number", "1")
        table["chairs"] = max(1, int(table.get("chairs") or 1))
        table.setdefault("server", "Unassigned")
        table.setdefault("section", "Main Room")
        table.setdefault("ready_at", "")
        table.setdefault("completed_notice_seen", False)
        col = clamp(int(table.get("grid_col") or 1), 1, GRID_COLS)
        row = clamp(int(table.get("grid_row") or 1), 1, GRID_ROWS)
        while (row, col) in occupied:
            col += 1
            if col > GRID_COLS:
                col = 1
                row = 1 if row >= GRID_ROWS else row + 1
            if len(occupied) >= GRID_COLS * GRID_ROWS:
                break
        table["grid_col"] = col
        table["grid_row"] = row
        occupied.add((row, col))
        seats = table.get("seats") if isinstance(table.get("seats"), list) else []
        table["seats"] = resize_seats(seats, table["chairs"])
    return base


def load_data() -> dict[str, Any]:
    DATA_DIR.mkdir(exist_ok=True)
    if not DATA_FILE.exists():
        save_data(default_data())
    try:
        data = json.loads(DATA_FILE.read_text())
    except json.JSONDecodeError:
        data = default_data()
    return normalise_data(data)


def save_data(data: dict[str, Any]) -> None:
    DATA_DIR.mkdir(exist_ok=True)
    data = normalise_data(data)
    data["updated_at"] = now_iso()
    DATA_FILE.write_text(json.dumps(data, indent=2))


def resize_seats(seats: list[dict[str, Any]], chairs: int) -> list[dict[str, Any]]:
    resized = []
    for i in range(1, max(1, chairs) + 1):
        existing = next((s for s in seats if int(s.get("position", 0)) == i), seats[i - 1] if i - 1 < len(seats) else {})
        resized.append({
            "position": i,
            "drink": existing.get("drink", ""),
            "notes": existing.get("notes", ""),
            "status": existing.get("status", "pending"),
        })
    return resized


def find_table(data: dict[str, Any], table_id: str) -> dict[str, Any] | None:
    return next((t for t in data["tables"] if t.get("id") == table_id), None)


def table_order_count(table: dict[str, Any]) -> int:
    return sum(1 for s in table.get("seats", []) if str(s.get("drink", "")).strip())


def table_ready_count(table: dict[str, Any]) -> int:
    return sum(1 for s in table.get("seats", []) if str(s.get("drink", "")).strip() and s.get("status") == "ready")


def table_status(table: dict[str, Any]) -> str:
    orders = table_order_count(table)
    ready = table_ready_count(table)
    if orders == 0:
        return "No orders"
    if ready == 0:
        return "Sent to bar"
    if ready < orders:
        return "Part ready"
    return "Ready for server"


def status_class(status: str) -> str:
    return {"Ready for server": "ready", "Part ready": "part", "Sent to bar": "pending"}.get(status, "none")


def drink_totals(tables: list[dict[str, Any]]) -> list[tuple[str, int]]:
    totals: dict[str, int] = {}
    for table in tables:
        for seat in table.get("seats", []):
            drink = str(seat.get("drink", "")).strip()
            if drink:
                totals[drink] = totals.get(drink, 0) + 1
    return sorted(totals.items(), key=lambda item: item[1], reverse=True)


def add_notification(data: dict[str, Any], message: str, table_id: str) -> None:
    data["notifications"].insert(0, {"id": make_id(), "table_id": table_id, "message": message, "created_at": now_iso(), "seen": False})
    data["notifications"] = data["notifications"][:30]


@app.template_filter('sum_table_orders')
def sum_table_orders(tables):
    return sum(table_order_count(t) for t in tables)


@app.template_filter('sum_table_ready')
def sum_table_ready(tables):
    return sum(table_ready_count(t) for t in tables)


def table_sort_key(table):
    value = str(table.get('number', '0'))
    return int(value) if value.isdigit() else 999999


@app.context_processor
def inject_helpers():
    return dict(
        table_order_count=table_order_count,
        table_ready_count=table_ready_count,
        table_status=table_status,
        status_class=status_class,
        common_drinks=COMMON_DRINKS,
        grid_cols=GRID_COLS,
        grid_rows=GRID_ROWS,
    )


@app.route("/")
def index():
    data = load_data()
    tables = sorted(data["tables"], key=table_sort_key)
    active_id = request.args.get("table") or (tables[0]["id"] if tables else "")
    active_table = find_table(data, active_id) if active_id else None
    return render_template("index.html", data=data, tables=tables, active_table=active_table)


@app.route("/setup")
def setup():
    data = load_data()
    table_by_cell = {(int(t.get("grid_row", 1)), int(t.get("grid_col", 1))): t for t in data["tables"]}
    return render_template("setup.html", data=data, table_by_cell=table_by_cell)


@app.route("/bar")
def bar():
    data = load_data()
    query = request.args.get("q", "").strip().lower()
    return render_template("bar.html", data=data, query=query, totals=drink_totals(data["tables"]))


@app.post("/action")
def action():
    data = load_data()
    action_name = request.form.get("action", "")
    return_to = request.form.get("return_to") or url_for("index")

    if action_name == "save_setup":
        data["servers"] = [x.strip() for x in request.form.get("servers", "").splitlines() if x.strip()] or ["Unassigned"]
        data["sections"] = [x.strip() for x in request.form.get("sections", "").splitlines() if x.strip()] or ["Main Room"]

    elif action_name in {"add_table", "place_table_grid"}:
        mode = request.form.get("grid_mode", "add")
        if action_name == "place_table_grid" and mode == "move":
            table = find_table(data, request.form.get("move_table_id", ""))
            if table:
                table["grid_col"] = clamp(int(request.form.get("grid_col") or 1), 1, GRID_COLS)
                table["grid_row"] = clamp(int(request.form.get("grid_row") or 1), 1, GRID_ROWS)
        else:
            chairs = max(1, int(request.form.get("chairs") or 10))
            number = request.form.get("table_number", "").strip() or str(len(data["tables"]) + 1)
            data["tables"].append({
                "id": make_id(), "number": number, "chairs": chairs,
                "server": request.form.get("server", data["servers"][0]),
                "section": request.form.get("section", data["sections"][0]),
                "grid_col": clamp(int(request.form.get("grid_col") or 1), 1, GRID_COLS),
                "grid_row": clamp(int(request.form.get("grid_row") or 1), 1, GRID_ROWS),
                "ready_at": "", "completed_notice_seen": False, "seats": make_seats(chairs),
            })

    elif action_name == "resize_table":
        table = find_table(data, request.form.get("table_id", ""))
        if table:
            table["chairs"] = max(1, int(request.form.get("chairs") or table.get("chairs", 1)))
            table["seats"] = resize_seats(table.get("seats", []), table["chairs"])
            return_to = url_for("index", table=table["id"])

    elif action_name == "update_table_meta":
        table = find_table(data, request.form.get("table_id", ""))
        if table:
            table["server"] = request.form.get("server", table.get("server", "Unassigned"))
            table["section"] = request.form.get("section", table.get("section", "Main Room"))

    elif action_name == "save_orders":
        table = find_table(data, request.form.get("table_id", ""))
        if table:
            drinks = request.form.getlist("drink")
            notes = request.form.getlist("notes")
            for i, seat in enumerate(table.get("seats", [])):
                old_drink = seat.get("drink", "")
                seat["drink"] = drinks[i].strip() if i < len(drinks) else ""
                seat["notes"] = notes[i].strip() if i < len(notes) else ""
                if seat["drink"] != old_drink or not seat["drink"]:
                    seat["status"] = "pending"
            table["completed_notice_seen"] = False
            table["ready_at"] = ""
            return_to = url_for("index", table=table["id"])

    elif action_name == "mark_table_ready":
        table = find_table(data, request.form.get("table_id", ""))
        if table:
            for seat in table.get("seats", []):
                if str(seat.get("drink", "")).strip():
                    seat["status"] = "ready"
            table["ready_at"] = now_iso()
            table["completed_notice_seen"] = False
            add_notification(data, f"Table {table.get('number')} is ready for {table.get('server')}.", table["id"])
            return_to = url_for("bar")

    elif action_name == "mark_notice_seen":
        table = find_table(data, request.form.get("table_id", ""))
        if table:
            table["completed_notice_seen"] = True
            for n in data.get("notifications", []):
                if n.get("table_id") == table["id"]:
                    n["seen"] = True

    elif action_name == "clear_table":
        table = find_table(data, request.form.get("table_id", ""))
        if table:
            table["seats"] = make_seats(int(table.get("chairs", 1)))
            table["ready_at"] = ""
            table["completed_notice_seen"] = False
            return_to = url_for("index", table=table["id"])

    elif action_name == "delete_table":
        table_id = request.form.get("table_id", "")
        table = find_table(data, table_id)
        if table and request.form.get("confirm_table_number", "").strip() == str(table.get("number")):
            data["tables"] = [t for t in data["tables"] if t.get("id") != table_id]

    elif action_name == "reset_all":
        data["tables"] = []
        data["notifications"] = []
        return_to = url_for("index")

    save_data(data)
    return redirect(return_to)


if __name__ == "__main__":
    app.run(debug=True)
