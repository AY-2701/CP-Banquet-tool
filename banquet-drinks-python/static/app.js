const gridMode = document.querySelector('#grid_mode');
const addOnly = document.querySelector('.add-only');
const moveOnly = document.querySelector('.move-only');
const form = document.querySelector('#grid-place-form');
const rowInput = document.querySelector('#grid_row');
const colInput = document.querySelector('#grid_col');
const selectedText = document.querySelector('#selected-cell-text');

function updateGridMode() {
  if (!gridMode) return;
  const moving = gridMode.value === 'move';
  addOnly?.classList.toggle('hidden', moving);
  moveOnly?.classList.toggle('hidden', !moving);
}

gridMode?.addEventListener('change', updateGridMode);
updateGridMode();

document.querySelectorAll('.empty-cell').forEach((cell) => {
  cell.addEventListener('click', () => {
    document.querySelectorAll('.empty-cell').forEach((c) => c.classList.remove('selected'));
    cell.classList.add('selected');
    rowInput.value = cell.dataset.row;
    colInput.value = cell.dataset.col;
    if (selectedText) selectedText.textContent = `Selected row ${cell.dataset.row}, column ${cell.dataset.col}. Submitting...`;
    setTimeout(() => form?.submit(), 100);
  });
});
