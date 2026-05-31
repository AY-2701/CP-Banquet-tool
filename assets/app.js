const STORAGE_KEY = 'banquet-drinks-pages-php-style-v2';
const ROWS = 7;
const COLS = 10;
const DEFAULT_SERVERS = ['Unassigned', 'Server 1', 'Server 2', 'Server 3', 'Server 4'];
const DEFAULT_SECTIONS = ['Main Room', 'Front Left', 'Front Right', 'Back Left', 'Back Right'];

let selectedCell = { row: 1, col: 1 };
let activeTableId = '';
let state = loadState();

function uid(){ return (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()+Math.random())); }
function defaultState(){
  return { servers: DEFAULT_SERVERS, sections: DEFAULT_SECTIONS, tables: [], notifications: [], nextTableNumber: 1 };
}
function loadState(){
  try { return { ...defaultState(), ...(JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}) }; }
  catch { return defaultState(); }
}
function saveState(renderNow = true){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); if(renderNow) render(); }
function h(value){ return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch])); }
function createSeats(count){ return Array.from({length: count}, (_,i) => ({ position: i+1, drink:'', notes:'', status:'pending' })); }
function toast(message){
  state.notifications.unshift({ id: uid(), message, at: new Date().toISOString(), seen:false });
  state.notifications = state.notifications.slice(0, 30);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  const el = document.getElementById('toast'); el.textContent = message; el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2600);
}
function tableOrders(t){ return t.seats.filter(s => s.drink.trim()).length; }
function tableReady(t){ return t.seats.filter(s => s.drink.trim() && s.status === 'ready').length; }
function tableStatus(t){
  const orders = tableOrders(t), ready = tableReady(t);
  if(!orders) return 'No orders';
  if(ready === orders) return 'Ready for server';
  if(ready > 0) return 'Part ready';
  return 'Pending';
}
function statusClass(status){
  if(status === 'Ready for server') return 'ready';
  if(status === 'Part ready') return 'part';
  if(status === 'No orders') return 'none';
  return 'pending';
}
function sortedTables(){ return [...state.tables].sort((a,b) => Number(a.number) - Number(b.number) || String(a.number).localeCompare(String(b.number))); }
function currentTable(){
  if(!activeTableId && state.tables[0]) activeTableId = state.tables[0].id;
  return state.tables.find(t => t.id === activeTableId) || state.tables[0] || null;
}

function switchView(view){
  document.querySelectorAll('.tabs a').forEach(a => a.classList.toggle('active', a.dataset.view === view));
  document.querySelectorAll('.app-view').forEach(s => s.classList.toggle('active', s.id === view));
  history.replaceState(null, '', '#' + view);
  render();
}

document.querySelectorAll('.tabs a').forEach(a => a.addEventListener('click', e => { e.preventDefault(); switchView(a.dataset.view); }));

function addTable(){
  const number = document.getElementById('newTableNumber').value.trim() || String(state.nextTableNumber);
  const chairs = Math.max(1, Number(document.getElementById('newChairs').value) || 1);
  const server = document.getElementById('newServer').value.trim() || 'Unassigned';
  const section = document.getElementById('newSection').value.trim() || 'Main Room';
  if(state.tables.some(t => t.row === selectedCell.row && t.col === selectedCell.col)) { toast('Select an empty grid cell before adding a table.'); return; }
  if(!state.servers.includes(server)) state.servers.push(server);
  if(!state.sections.includes(section)) state.sections.push(section);
  const table = { id:uid(), number, chairs, server, section, row:selectedCell.row, col:selectedCell.col, completed_notice_seen:false, seats:createSeats(chairs) };
  state.tables.push(table);
  activeTableId = table.id;
  state.nextTableNumber = Math.max(Number(number)+1 || state.nextTableNumber+1, state.nextTableNumber+1);
  toast(`Table ${number} added to ${section}.`);
  saveState();
}
function resizeTable(tableId, chairs){
  const t = state.tables.find(x => x.id === tableId); if(!t) return;
  const count = Math.max(1, Number(chairs) || 1);
  const next = t.seats.slice(0, count);
  while(next.length < count) next.push({ position: next.length+1, drink:'', notes:'', status:'pending' });
  t.chairs = count; t.seats = next.map((s,i) => ({...s, position:i+1})); t.completed_notice_seen = false; saveState();
}
function updateMeta(tableId){
  const t = state.tables.find(x => x.id === tableId); if(!t) return;
  const server = document.getElementById('metaServer').value.trim() || 'Unassigned';
  const section = document.getElementById('metaSection').value.trim() || 'Main Room';
  if(!state.servers.includes(server)) state.servers.push(server);
  if(!state.sections.includes(section)) state.sections.push(section);
  t.server = server; t.section = section; saveState(); toast(`Table ${t.number} assignment updated.`);
}
function updateSeat(tableId, position, field, value){
  const t = state.tables.find(x => x.id === tableId); if(!t) return;
  const s = t.seats.find(x => x.position === position); if(!s) return;
  s[field] = value;
  if(field === 'drink') { s.status = value.trim() ? 'pending' : 'pending'; t.completed_notice_seen = false; }
  saveState();
}
function setSeatReady(tableId, position, ready){
  const t = state.tables.find(x => x.id === tableId); const s = t?.seats.find(x => x.position === position); if(!s) return;
  if(s.drink.trim()) s.status = ready ? 'ready' : 'pending';
  if(tableStatus(t) !== 'Ready for server') t.completed_notice_seen = false;
  saveState();
}
function markTableReady(tableId){
  const t = state.tables.find(x => x.id === tableId); if(!t) return;
  t.seats.forEach(s => { if(s.drink.trim()) s.status = 'ready'; });
  t.completed_notice_seen = false;
  toast(`Notification: Table ${t.number} is ready for ${t.server || 'the assigned server'}.`);
  saveState();
}
function acknowledge(tableId){ const t = state.tables.find(x => x.id === tableId); if(t) { t.completed_notice_seen = true; saveState(); } }
function clearTable(tableId){ const t = state.tables.find(x => x.id === tableId); if(!t) return; if(confirm(`Clear all orders for Table ${t.number}?`)){ t.seats.forEach(s => {s.drink='';s.notes='';s.status='pending'}); t.completed_notice_seen=false; saveState(); } }
function deleteTable(tableId){
  const t = state.tables.find(x => x.id === tableId); if(!t) return;
  if(!confirm(`Delete Table ${t.number}? This will remove all orders for this table.`)) return;
  const typed = prompt(`Extra confirmation required. Type table number ${t.number} to permanently delete it.`);
  if(typed !== String(t.number)){ toast('Delete cancelled: table number did not match.'); return; }
  state.tables = state.tables.filter(x => x.id !== tableId); activeTableId = state.tables[0]?.id || ''; toast(`Table ${t.number} deleted.`); saveState();
}
function moveTable(tableId){
  const t = state.tables.find(x => x.id === tableId); if(!t) return;
  if(state.tables.some(x => x.id !== tableId && x.row === selectedCell.row && x.col === selectedCell.col)){ toast('Select an empty grid cell before moving this table.'); return; }
  t.row = selectedCell.row; t.col = selectedCell.col; toast(`Table ${t.number} moved on the room plan.`); saveState();
}

function renderStats(){
  const orders = state.tables.reduce((sum,t) => sum + tableOrders(t), 0);
  const ready = state.tables.reduce((sum,t) => sum + tableReady(t), 0);
  document.getElementById('statTables').textContent = state.tables.length;
  document.getElementById('statOrders').textContent = orders;
  document.getElementById('statReady').textContent = ready;
  document.getElementById('statSections').textContent = new Set(state.tables.map(t => t.section).filter(Boolean)).size;
}
function notificationsHtml(){
  const ready = state.tables.filter(t => tableStatus(t)==='Ready for server' && !t.completed_notice_seen);
  if(!ready.length) return '';
  return `<div class="notification-wrap">${ready.map(t => `<div class="panel alert-panel"><div><strong>Notification:</strong> Table ${h(t.number)} is ready for ${h(t.server || 'assigned server')}.</div><button class="btn success" data-ack="${t.id}">Acknowledge</button></div>`).join('')}</div>`;
}
function renderOrders(){
  const active = currentTable();
  const tableOptions = sortedTables().map(t => `<a class="table-link ${active?.id===t.id?'selected':''}" data-select-table="${t.id}"><strong>Table ${h(t.number)} · ${h(tableStatus(t))}</strong><span>${h(t.server)} · ${tableReady(t)}/${tableOrders(t)} ready</span></a>`).join('') || '<p class="muted">No tables yet. Add a table in setup.</p>';
  const activeStatus = active ? tableStatus(active) : '';
  document.getElementById('orders').innerHTML = `
    ${notificationsHtml()}
    <section class="layout">
      <aside class="panel sidebar">
        <h2>Add table</h2>
        <div class="stack">
          <input type="hidden"><label>Table number<input id="quickTableNumber" placeholder="e.g. 12" value="${h(state.nextTableNumber)}"></label>
          <label>Number of chairs<input id="quickChairs" type="number" min="1" value="10"></label>
          <label>Assigned server<input id="quickServer" list="server-list" placeholder="Server name"></label>
          <label>Section<input id="quickSection" list="section-list" placeholder="Section"></label>
          <button class="btn primary" id="quickAdd">Add table</button>
        </div>
        <h2 class="mt">Table updates</h2><div class="notice-list">${tableOptions}</div>
      </aside>
      <section class="main-area">
        ${active ? `
          <div class="panel table-header"><div><h2>Table ${h(active.number)}</h2><p class="muted">Position 1 is the head of the table. Assigned to ${h(active.server)} in ${h(active.section)}.</p><span class="status ${statusClass(activeStatus)}">${h(activeStatus)} · ${tableReady(active)}/${tableOrders(active)} ready</span></div><div class="actions-row"><label>Chairs<input id="activeChairs" type="number" min="1" value="${active.chairs}"></label><button class="btn warning" data-clear="${active.id}">Clear orders</button></div></div>
          <div class="panel meta-panel"><h3>Table assignment</h3><div class="meta-grid compact"><label>Server<input id="metaServer" list="server-list" value="${h(active.server)}"></label><label>Section<input id="metaSection" list="section-list" value="${h(active.section)}"></label><button class="btn" data-save-meta="${active.id}">Save assignment</button></div></div>
          <details class="panel delete-panel"><summary>Delete this table</summary><div class="delete-confirm"><p class="muted">Extra confirmation required: you will be asked to type table number <strong>${h(active.number)}</strong>.</p><button class="btn danger" data-delete="${active.id}">Permanently delete table</button></div></details>
          <div class="seat-grid">${active.seats.map(s => `<article class="seat-card ${s.position===1?'head-seat':''}"><div class="seat-top"><div class="seat-number">${s.position}</div><div><h3>Seat position ${s.position}</h3><p>${s.position===1?'Head of table':'Clockwise position'}</p></div></div><label>Drink order<input list="drink-options" data-drink="${s.position}" value="${h(s.drink)}" placeholder="e.g. Gin & Tonic"></label><label>Notes<textarea data-notes="${s.position}" placeholder="e.g. no ice, lemon, allergy">${h(s.notes)}</textarea></label><div class="seat-status-actions"><span class="status ${s.status}">${h(s.status[0].toUpperCase()+s.status.slice(1))}</span>${s.drink.trim()?`<button class="btn small" data-seat-ready="${s.position}">Ready</button><button class="btn small" data-seat-pending="${s.position}">Pending</button>`:''}</div></article>`).join('')}</div><button class="btn primary sticky-save" id="saveToast">Save table orders</button>` : `<div class="panel empty"><h2>Add a table to begin</h2></div>`}
      </section>
    </section>`;
  bindCommon(document.getElementById('orders'));
  const quick = document.getElementById('quickAdd'); if(quick) quick.onclick = () => { document.getElementById('newTableNumber').value = document.getElementById('quickTableNumber').value; document.getElementById('newChairs').value = document.getElementById('quickChairs').value; document.getElementById('newServer').value = document.getElementById('quickServer').value; document.getElementById('newSection').value = document.getElementById('quickSection').value; addTable(); };
  const chairs = document.getElementById('activeChairs'); if(chairs && active) chairs.onchange = e => resizeTable(active.id, e.target.value);
  if(document.getElementById('saveToast')) document.getElementById('saveToast').onclick = () => toast('Table orders saved.');
}
function renderBar(){
  const q = (document.getElementById('barSearch')?.value || '').toLowerCase();
  const tables = sortedTables().map(t => ({...t, seats:t.seats.filter(s => s.drink.trim())})).filter(t => t.seats.length).filter(t => !q || [t.number,t.server,t.section,...t.seats.flatMap(s => [s.position,s.drink,s.notes])].join(' ').toLowerCase().includes(q));
  const drinkCounts = {};
  state.tables.forEach(t => t.seats.forEach(s => { if(s.drink.trim()) drinkCounts[s.drink.trim()] = (drinkCounts[s.drink.trim()]||0)+1; }));
  document.getElementById('bar').innerHTML = `
    <section class="bar-layout"><section class="bar-main"><div class="panel table-header"><div><h2>Bar prep queue</h2><p class="muted">Grouped by table, with seat position and notes for accurate delivery.</p></div><form class="search-form" onsubmit="return false"><input id="barSearch" placeholder="Search table, drink or seat" value="${h(document.getElementById('barSearch')?.value || '')}"></form></div>
    ${tables.length ? tables.map(t => `<article class="panel queue-card ${statusClass(tableStatus(t))}"><div class="queue-head"><div><h3>Table ${h(t.number)}</h3><p>${h(t.server)} · ${h(t.section)} · ${t.seats.length} drinks to prepare</p></div><button class="btn success" data-ready-table="${t.id}">Mark table ready</button></div><div class="queue-list">${t.seats.map(s => `<div class="queue-row"><div><strong>Seat ${s.position}</strong></div><div class="drink-name">${h(s.drink)}</div><div class="muted">${h(s.notes || 'No notes')}</div><span class="status ${s.status}">${h(s.status)}</span></div>`).join('')}</div></article>`).join('') : '<div class="panel empty"><h2>No drink orders yet.</h2></div>'}</section>
    <aside class="panel totals"><h3>Drink totals</h3>${Object.entries(drinkCounts).sort((a,b)=>b[1]-a[1]).map(([d,c]) => `<div class="total-row"><span>${h(d)}</span><strong>${c}</strong></div>`).join('') || '<p class="muted">Totals appear once orders are entered.</p>'}<h3 class="mt">Notifications</h3>${state.notifications.slice(0,6).map(n => `<div class="notice-row"><strong>${h(n.message)}</strong><span>${new Date(n.at).toLocaleString()}</span></div>`).join('') || '<p class="muted">No notifications yet.</p>'}</aside></section>`;
  bindCommon(document.getElementById('bar'));
  document.getElementById('barSearch').oninput = renderBar;
}
function renderSetup(){
  const cells = [];
  for(let r=1;r<=ROWS;r++) for(let c=1;c<=COLS;c++){
    const t = state.tables.find(x => x.row===r && x.col===c);
    cells.push(`<button class="grid-cell ${t?'occupied':'empty-cell'} ${selectedCell.row===r&&selectedCell.col===c?'selected':''}" data-cell="${r},${c}">${t?`<span class="grid-table ${statusClass(tableStatus(t))}"><strong>${h(t.number)}</strong><span>${h(t.section)}</span><em>${h(t.server)}</em></span>`:'<span>+</span>'}</button>`);
  }
  document.getElementById('setup').innerHTML = `
    <section class="setup-layout"><aside class="panel sidebar"><h2>Add table to grid</h2><div class="stack"><p class="selected-cell">Selected cell: row ${selectedCell.row}, column ${selectedCell.col}</p><label>Table number<input id="newTableNumber" value="${h(state.nextTableNumber)}"></label><label>Number of chairs<input id="newChairs" type="number" min="1" value="10"></label><label>Assigned server<input id="newServer" list="server-list" placeholder="Server name"></label><label>Section<input id="newSection" list="section-list" placeholder="Section name"></label><button class="btn primary" id="addTableBtn">Add table to selected cell</button></div><h2 class="mt">Sections</h2>${state.sections.map(s => `<div class="notice-row"><strong>${h(s)}</strong><span>${state.tables.filter(t=>t.section===s).length} table(s)</span></div>`).join('')}</aside><section class="main-area"><div class="panel"><h2>Clickable room plan</h2><p class="muted">Click an empty cell, then add a table. Click an occupied cell to select that table for editing or moving.</p><div class="room-grid" style="--rows:${ROWS};--cols:${COLS}">${cells.join('')}</div></div><div class="table-editor-grid">${sortedTables().map(t => `<article class="panel mini-editor"><h3>Table ${h(t.number)}</h3><p class="muted">${h(t.server)} · ${h(t.section)} · row ${t.row}, col ${t.col}</p><span class="status ${statusClass(tableStatus(t))}">${h(tableStatus(t))}</span><div class="actions-row mt"><button class="btn" data-select-table="${t.id}">Open orders</button><button class="btn" data-move="${t.id}">Move to selected cell</button><button class="btn danger" data-delete="${t.id}">Delete</button></div></article>`).join('') || '<div class="panel empty"><h2>No tables placed yet.</h2></div>'}</div></section></section>`;
  bindCommon(document.getElementById('setup'));
  document.getElementById('addTableBtn').onclick = addTable;
  document.querySelectorAll('[data-cell]').forEach(btn => btn.onclick = () => { const [row,col]=btn.dataset.cell.split(',').map(Number); selectedCell={row,col}; const t = state.tables.find(x=>x.row===row&&x.col===col); if(t) activeTableId=t.id; render(); });
}
function bindCommon(root){
  root.querySelectorAll('[data-select-table]').forEach(el => el.onclick = () => { activeTableId = el.dataset.selectTable; switchView('orders'); });
  root.querySelectorAll('[data-clear]').forEach(el => el.onclick = () => clearTable(el.dataset.clear));
  root.querySelectorAll('[data-delete]').forEach(el => el.onclick = () => deleteTable(el.dataset.delete));
  root.querySelectorAll('[data-save-meta]').forEach(el => el.onclick = () => updateMeta(el.dataset.saveMeta));
  root.querySelectorAll('[data-ready-table]').forEach(el => el.onclick = () => markTableReady(el.dataset.readyTable));
  root.querySelectorAll('[data-ack]').forEach(el => el.onclick = () => acknowledge(el.dataset.ack));
  root.querySelectorAll('[data-move]').forEach(el => el.onclick = () => moveTable(el.dataset.move));
  const t = currentTable();
  root.querySelectorAll('[data-drink]').forEach(el => el.oninput = () => updateSeat(t.id, Number(el.dataset.drink), 'drink', el.value));
  root.querySelectorAll('[data-notes]').forEach(el => el.oninput = () => updateSeat(t.id, Number(el.dataset.notes), 'notes', el.value));
  root.querySelectorAll('[data-seat-ready]').forEach(el => el.onclick = () => setSeatReady(t.id, Number(el.dataset.seatReady), true));
  root.querySelectorAll('[data-seat-pending]').forEach(el => el.onclick = () => setSeatReady(t.id, Number(el.dataset.seatPending), false));
}
function renderDatalists(){
  let old = document.getElementById('server-list'); if(old) old.remove(); old = document.getElementById('section-list'); if(old) old.remove();
  document.body.insertAdjacentHTML('beforeend', `<datalist id="server-list">${state.servers.map(s=>`<option value="${h(s)}"></option>`).join('')}</datalist><datalist id="section-list">${state.sections.map(s=>`<option value="${h(s)}"></option>`).join('')}</datalist>`);
}
function render(){ renderDatalists(); renderStats(); renderOrders(); renderBar(); renderSetup(); }

render();
switchView((location.hash || '#orders').replace('#',''));
