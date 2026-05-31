document.addEventListener('input', (event) => {
  if (!event.target.matches('input[name^="drink"]')) return;
  const card = event.target.closest('.seat-card');
  if (!card) return;
  card.style.borderColor = event.target.value.trim() ? '#f6c453' : '';
});

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('grid-place-form');
  const mode = document.getElementById('grid_mode');
  const colInput = document.getElementById('grid_col');
  const rowInput = document.getElementById('grid_row');
  const selectedText = document.getElementById('selected-cell-text');

  function syncMode() {
    if (!mode) return;
    const moving = mode.value === 'move';
    document.querySelectorAll('.move-only').forEach((el) => el.classList.toggle('hidden', !moving));
    document.querySelectorAll('.add-only').forEach((el) => el.classList.toggle('hidden', moving));
  }

  if (mode) {
    mode.addEventListener('change', syncMode);
    syncMode();
  }

  document.querySelectorAll('.empty-cell').forEach((cell) => {
    cell.addEventListener('click', () => {
      if (!form || !colInput || !rowInput) return;
      document.querySelectorAll('.empty-cell.selected').forEach((el) => el.classList.remove('selected'));
      cell.classList.add('selected');
      colInput.value = cell.dataset.col;
      rowInput.value = cell.dataset.row;
      if (selectedText) selectedText.textContent = `Selected row ${cell.dataset.row}, column ${cell.dataset.col}. Saving...`;
      form.submit();
    });
  });
});
