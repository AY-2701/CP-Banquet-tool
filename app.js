const STORAGE_KEY = "banquet-drinks-static-v1";
const rows = 8;
const cols = 10;
let selectedCell = { row: 1, col: 1 };
let state = loadState();

function defaultState() {
  return {
    tables: [],
    nextTableNumber: 1,
    notifications: []
  };
}

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultState();
  } catch {
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  render();
}

function createSeats(count) {
  return Array.from({ length: count }, (_, index) => ({
    position: index + 1,
    drink: "",
    notes: "",
    status: "pending"
  }));
}

function notify(message) {
  state.notifications.unshift({ message, at: new Date().toISOString() });
  state.notifications = state.notifications.slice(0, 20);
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2400);
}

function switchView(view) {
  document.querySelectorAll("nav button").forEach(btn => btn.classList.toggle("active", btn.dataset.view === view));
  document.querySelectorAll(".view").forEach(section => section.classList.toggle("active", section.id === view));
  render();
}

document.querySelectorAll("nav button").forEach(btn => btn.addEventListener("click", () => switchView(btn.dataset.view)));

document.getElementById("addTable").addEventListener("click", () => {
  const number = document.getElementById("tableNumber").value.trim() || String(state.nextTableNumber);
  const chairs = Math.max(1, Number(document.getElementById("chairCount").value) || 1);
  const server = document.getElementById("serverName").value.trim();
  const section = document.getElementById("sectionName").value.trim() || "Unassigned";
  const cellTaken = state.tables.some(t => t.row === selectedCell.row && t.col === selectedCell.col);

  if (cellTaken) {
    notify("That grid cell already has a table.");
    return;
  }

  state.tables.push({
    id: crypto.randomUUID(),
    number,
    chairs,
    server,
    section,
    row: selectedCell.row,
    col: selectedCell.col,
    status: "pending",
    seats: createSeats(chairs)
  });
  state.nextTableNumber = Math.max(Number(number) + 1 || state.nextTableNumber + 1, state.nextTableNumber + 1);
  document.getElementById("tableNumber").value = state.nextTableNumber;
  notify(`Table ${number} added to the room plan.`);
  saveState();
});

document.getElementById("orderTableSelect").addEventListener("change", renderSeatOrders);
document.getElementById("barSearch").addEventListener("input", renderBar);

function updateSeat(tableId, position, field, value) {
  const table = state.tables.find(t => t.id === tableId);
  const seat = table?.seats.find(s => s.position === position);
  if (!seat) return;
  seat[field] = value;
  if (field === "drink") seat.status = value.trim() ? "pending" : "pending";
  table.status = table.seats.some(s => s.drink && s.status !== "ready") ? "pending" : table.seats.some(s => s.drink) ? "ready" : "pending";
  saveState();
}

function markTableReady(tableId) {
  const table = state.tables.find(t => t.id === tableId);
  if (!table) return;
  table.seats.forEach(seat => {
    if (seat.drink.trim()) seat.status = "ready";
  });
  table.status = "ready";
  notify(`Table ${table.number} completed. Notify ${table.server || "assigned server"}.`);
  saveState();
}

function deleteTable(tableId) {
  const table = state.tables.find(t => t.id === tableId);
  if (!table) return;
  const first = confirm(`Delete Table ${table.number}? This will remove all orders for this table.`);
  if (!first) return;
  const second = confirm(`Final confirmation: permanently delete Table ${table.number}?`);
  if (!second) return;
  state.tables = state.tables.filter(t => t.id !== tableId);
  notify(`Table ${table.number} deleted.`);
  saveState();
}

function resizeTable(tableId, chairs) {
  const table = state.tables.find(t => t.id === tableId);
  if (!table) return;
  const count = Math.max(1, Number(chairs) || 1);
  const oldSeats = table.seats.slice(0, count);
  while (oldSeats.length < count) {
    oldSeats.push({ position: oldSeats.length + 1, drink: "", notes: "", status: "pending" });
  }
  table.chairs = count;
  table.seats = oldSeats.map((seat, i) => ({ ...seat, position: i + 1 }));
  saveState();
}

function moveTable(tableId) {
  const table = state.tables.find(t => t.id === tableId);
  if (!table) return;
  const targetTaken = state.tables.some(t => t.id !== tableId && t.row === selectedCell.row && t.col === selectedCell.col);
  if (targetTaken) {
    notify("Select an empty grid cell before moving a table.");
    return;
  }
  table.row = selectedCell.row;
  table.col = selectedCell.col;
  notify(`Table ${table.number} moved.`);
  saveState();
}

function render() {
  renderStats();
  renderRoomGrid();
  renderTables();
  renderOrderSelect();
  renderSeatOrders();
  renderBar();
  renderSections();
}

function renderStats() {
  const orders = state.tables.reduce((sum, table) => sum + table.seats.filter(s => s.drink.trim()).length, 0);
  const ready = state.tables.reduce((sum, table) => sum + table.seats.filter(s => s.drink.trim() && s.status === "ready").length, 0);
  const sections = new Set(state.tables.map(t => t.section).filter(Boolean));
  document.getElementById("statTables").textContent = state.tables.length;
  document.getElementById("statOrders").textContent = orders;
  document.getElementById("statReady").textContent = ready;
  document.getElementById("statSections").textContent = sections.size;
}

function renderRoomGrid() {
  const grid = document.getElementById("roomGrid");
  grid.innerHTML = "";
  for (let row = 1; row <= rows; row++) {
    for (let col = 1; col <= cols; col++) {
      const table = state.tables.find(t => t.row === row && t.col === col);
      const cell = document.createElement("button");
      cell.className = "cell";
      if (selectedCell.row === row && selectedCell.col === col) cell.classList.add("selected");
      if (table) cell.classList.add("has-table");
      cell.innerHTML = table ? `T${table.number}<br><small>${table.section}</small>` : `${row},${col}`;
      cell.addEventListener("click", () => {
        selectedCell = { row, col };
        if (table) switchView("orders");
        const select = document.getElementById("orderTableSelect");
        if (table && select) select.value = table.id;
        render();
      });
      grid.appendChild(cell);
    }
  }
}

function renderTables() {
  const list = document.getElementById("tableList");
  list.innerHTML = "";
  if (!state.tables.length) {
    list.innerHTML = "<p>No tables yet. Select a grid cell and add your first table.</p>";
    return;
  }
  state.tables
    .slice()
    .sort((a,b) => Number(a.number) - Number(b.number))
    .forEach(table => {
      const orders = table.seats.filter(s => s.drink.trim()).length;
      const card = document.createElement("article");
      card.className = "table-card";
      card.innerHTML = `
        <header>
          <div>
            <strong>Table ${table.number}</strong>
            <p>Server: ${table.server || "Unassigned"} · Section: ${table.section}</p>
            <p>Grid cell: row ${table.row}, col ${table.col}</p>
          </div>
          <span class="badge ${table.status === "ready" ? "ready" : "pending"}">${table.status}</span>
        </header>
        <div class="form-grid">
          <label>Chairs <input type="number" min="1" value="${table.chairs}" data-resize="${table.id}"></label>
          <label>Server <input value="${table.server || ""}" data-server="${table.id}"></label>
          <label>Section <input value="${table.section || ""}" data-section="${table.id}"></label>
          <label>Orders <input value="${orders}" disabled></label>
        </div>
        <div class="actions">
          <button data-order="${table.id}">Open orders</button>
          <button data-move="${table.id}">Move to selected grid cell</button>
          <button class="danger" data-delete="${table.id}">Delete table</button>
        </div>
      `;
      list.appendChild(card);
    });

  list.querySelectorAll("[data-resize]").forEach(input => input.addEventListener("change", e => resizeTable(e.target.dataset.resize, e.target.value)));
  list.querySelectorAll("[data-server]").forEach(input => input.addEventListener("change", e => {
    const table = state.tables.find(t => t.id === e.target.dataset.server);
    table.server = e.target.value;
    saveState();
  }));
  list.querySelectorAll("[data-section]").forEach(input => input.addEventListener("change", e => {
    const table = state.tables.find(t => t.id === e.target.dataset.section);
    table.section = e.target.value || "Unassigned";
    saveState();
  }));
  list.querySelectorAll("[data-order]").forEach(btn => btn.addEventListener("click", e => {
    document.getElementById("orderTableSelect").value = e.target.dataset.order;
    switchView("orders");
  }));
  list.querySelectorAll("[data-move]").forEach(btn => btn.addEventListener("click", e => moveTable(e.target.dataset.move)));
  list.querySelectorAll("[data-delete]").forEach(btn => btn.addEventListener("click", e => deleteTable(e.target.dataset.delete)));
}

function renderOrderSelect() {
  const select = document.getElementById("orderTableSelect");
  const current = select.value;
  select.innerHTML = state.tables.map(t => `<option value="${t.id}">Table ${t.number} — ${t.server || "No server"} — ${t.section}</option>`).join("");
  if (state.tables.some(t => t.id === current)) select.value = current;
}

function renderSeatOrders() {
  const select = document.getElementById("orderTableSelect");
  const wrap = document.getElementById("seatOrders");
  const table = state.tables.find(t => t.id === select.value) || state.tables[0];
  if (!table) {
    wrap.innerHTML = "<p>No tables available. Add tables in setup first.</p>";
    return;
  }
  select.value = table.id;
  wrap.innerHTML = table.seats.map(seat => `
    <article class="seat-card ${seat.position === 1 ? "head" : ""}">
      <h3>Seat ${seat.position}${seat.position === 1 ? " · Head of table" : ""}</h3>
      <label>Drink <input value="${escapeHtml(seat.drink)}" placeholder="e.g. Coke, no ice" data-drink="${seat.position}"></label>
      <label>Notes <textarea data-notes="${seat.position}" placeholder="Lemon, no ice, allergy etc.">${escapeHtml(seat.notes)}</textarea></label>
      <span class="badge ${seat.status === "ready" ? "ready" : "pending"}">${seat.status}</span>
    </article>
  `).join("");
  wrap.querySelectorAll("[data-drink]").forEach(input => input.addEventListener("input", e => updateSeat(table.id, Number(e.target.dataset.drink), "drink", e.target.value)));
  wrap.querySelectorAll("[data-notes]").forEach(input => input.addEventListener("input", e => updateSeat(table.id, Number(e.target.dataset.notes), "notes", e.target.value)));
}

function renderBar() {
  const q = document.getElementById("barSearch")?.value?.toLowerCase() || "";
  const queue = document.getElementById("barQueue");
  const totals = document.getElementById("drinkTotals");
  const filteredTables = state.tables
    .map(table => ({ ...table, seats: table.seats.filter(s => s.drink.trim()) }))
    .filter(table => table.seats.length)
    .filter(table => !q || [table.number, table.server, table.section, ...table.seats.flatMap(s => [s.drink, s.notes, String(s.position)])].join(" ").toLowerCase().includes(q));

  queue.innerHTML = filteredTables.length ? filteredTables.map(table => `
    <article class="queue-card">
      <header>
        <div>
          <strong>Table ${table.number}</strong>
          <p>Server: ${table.server || "Unassigned"} · Section: ${table.section}</p>
        </div>
        <button onclick="markTableReady('${table.id}')">Mark table ready</button>
      </header>
      ${table.seats.map(seat => `
        <div class="total-row">
          <span>Seat ${seat.position}: <strong>${escapeHtml(seat.drink)}</strong><br><small>${escapeHtml(seat.notes || "No notes")}</small></span>
          <span class="badge ${seat.status === "ready" ? "ready" : "pending"}">${seat.status}</span>
        </div>
      `).join("")}
    </article>
  `).join("") : "<p>No drink orders yet.</p>";

  const drinkCounts = {};
  state.tables.forEach(table => table.seats.forEach(seat => {
    if (seat.drink.trim()) drinkCounts[seat.drink.trim()] = (drinkCounts[seat.drink.trim()] || 0) + 1;
  }));
  const rows = Object.entries(drinkCounts).sort((a,b) => b[1] - a[1]);
  totals.innerHTML = rows.length ? rows.map(([drink, count]) => `<div class="total-row"><strong>${escapeHtml(drink)}</strong><span class="badge">${count}</span></div>`).join("") : "<p>No totals yet.</p>";
}

function renderSections() {
  const sectionList = document.getElementById("sectionList");
  const groups = {};
  state.tables.forEach(t => {
    groups[t.section || "Unassigned"] = groups[t.section || "Unassigned"] || [];
    groups[t.section || "Unassigned"].push(t);
  });
  sectionList.innerHTML = Object.entries(groups).length ? Object.entries(groups).map(([section, tables]) => `
    <article class="section-card">
      <strong>${escapeHtml(section)}</strong>
      <p>${tables.length} table(s): ${tables.map(t => "Table " + escapeHtml(t.number)).join(", ")}</p>
    </article>
  `).join("") : "<p>No sections yet. Add a section when creating or editing a table.</p>";
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

render();
