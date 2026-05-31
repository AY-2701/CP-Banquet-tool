# Banquet Drinks Ordering System — Python/Flask

A Python web tool for banquet drinks service. It lets you set up banquet tables, assign servers and sections, take drink orders by seat position, and show the bar a table-by-table prep queue.

## Features

- Add tables with custom chair counts
- Seat position 1 is treated as the head of the table
- Drink orders and notes per seat
- Assigned server per table
- Section creation and assignment
- Clickable room-plan grid for adding tables
- Move existing tables on the grid
- Bar/prep screen grouped by table
- Per-table ready status
- Completion notifications when a table order is ready
- Extra confirmation before deleting a table
- JSON file storage, no database required

## Project structure

```text
banquet-drinks-python/
├── app.py
├── requirements.txt
├── Procfile
├── wsgi.py
├── README.md
├── .gitignore
├── data/
│   └── orders.json
├── static/
│   ├── app.js
│   └── styles.css
└── templates/
    ├── base.html
    ├── index.html
    ├── setup.html
    └── bar.html
```

## Run locally

```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
python app.py
```

Open:

```text
http://127.0.0.1:5000
```

## GitHub upload

1. Create a new GitHub repository.
2. Upload all files from this folder, or run:

```bash
git init
git add .
git commit -m "Initial Python banquet drinks app"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git push -u origin main
```

## Deployment note

GitHub can host the source code, but GitHub Pages does not run Python/Flask apps. Deploy this to a Python-capable host such as Render, Railway, Fly.io, PythonAnywhere, or a VPS.
