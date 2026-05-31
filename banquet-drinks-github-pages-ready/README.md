# Banquet Drinks Ordering Tool — GitHub Pages Version

This version is fully static and works on GitHub Pages.

## Features

- Clickable room-plan grid
- Add banquet tables to grid cells
- Assign tables to servers
- Create sections
- Seat-by-seat drink orders
- Seat 1 marked as the head of the table
- Bar prep queue grouped by table
- Per-table ready status
- Completion notification when a table is marked ready
- Double confirmation before deleting tables
- Browser localStorage persistence

## Deploy to GitHub Pages

1. Create a new GitHub repository.
2. Upload these files to the repository root:
   - `index.html`
   - `style.css`
   - `app.js`
   - `README.md`
3. Go to **Settings → Pages**.
4. Under **Build and deployment**, choose:
   - Source: **Deploy from a branch**
   - Branch: **main**
   - Folder: **/root**
5. Save and open the GitHub Pages URL after it finishes deploying.

## Important

This static GitHub Pages version stores data in the browser using `localStorage`.

That means it is suitable for demos and single-device use. For multiple staff devices syncing live, deploy the Python/Flask version to a server such as Render, Railway, Fly.io, or a VPS, and add a real database.
