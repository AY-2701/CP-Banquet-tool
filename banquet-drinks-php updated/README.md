# Banquet Drinks PHP Tool

A PHP-based web tool for banquet drinks service.

## Run locally

```bash
cd banquet-drinks-php
php -S localhost:8000
```

Open `http://localhost:8000`.

## Main features

- Create banquet tables with table number and chair count.
- Seat 1 is treated as the head of the table.
- Take drinks orders by seat position.
- Assign tables to specific servers.
- Create room sections such as Front, VIP, Bar Side or Window Side.
- Click-to-place room plan grid for adding or moving tables.
- Bar/prep interface grouped by table.
- Per-table order and ready status.
- Completion notifications when a table is marked ready.
- Extra confirmation before deleting tables.
- JSON file storage, no database required.

## Pages

- `index.php` — server order input.
- `bar.php` — bar/prep screen.
- `setup.php` — setup lists, sections, servers and clickable room plan grid.
