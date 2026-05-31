<?php require __DIR__ . '/header.php'; ?>
<?php
$gridCols = 12;
$gridRows = 8;
$tableByCell = [];
foreach ($tables as $table) {
    $col = (int)($table['grid_col'] ?? 1);
    $row = (int)($table['grid_row'] ?? 1);
    $tableByCell[$row . '-' . $col] = $table;
}
?>
<section class="setup-layout">
    <aside class="panel sidebar">
        <h2>Setup lists</h2>
        <p class="muted">Add one server or room section per line. These appear on table setup and assignment screens.</p>
        <form method="post" action="actions.php" class="stack">
            <input type="hidden" name="action" value="save_setup">
            <label>Servers<textarea name="servers"><?= h(implode("\n", $servers)) ?></textarea></label>
            <label>Sections<textarea name="sections"><?= h(implode("\n", $sections)) ?></textarea></label>
            <button class="btn primary" type="submit">Save setup lists</button>
        </form>

        <h2 class="mt">Click-to-place table</h2>
        <p class="muted">Fill in the table details, then click an empty grid space in the room plan. To move a table, choose it below and click a new grid space.</p>
        <form id="grid-place-form" method="post" action="actions.php" class="stack grid-place-controls">
            <input type="hidden" name="action" value="place_table_grid">
            <input type="hidden" name="return_to" value="setup.php">
            <input type="hidden" name="grid_col" id="grid_col" value="">
            <input type="hidden" name="grid_row" id="grid_row" value="">
            <label>Mode
                <select name="grid_mode" id="grid_mode">
                    <option value="add">Add new table</option>
                    <option value="move">Move existing table</option>
                </select>
            </label>
            <label class="move-only hidden">Table to move
                <select name="move_table_id">
                    <?php foreach ($tables as $table): ?>
                        <option value="<?= h($table['id']) ?>">Table <?= h($table['number']) ?> — <?= h($table['section'] ?? 'Main Room') ?></option>
                    <?php endforeach; ?>
                </select>
            </label>
            <div class="add-only stack">
                <label>Table number<input name="table_number" placeholder="e.g. 12"></label>
                <label>Chairs<input type="number" name="chairs" min="1" value="10"></label>
                <label>Server<select name="server"><?php foreach ($servers as $server): ?><option><?= h($server) ?></option><?php endforeach; ?></select></label>
                <label>Section<select name="section"><?php foreach ($sections as $section): ?><option><?= h($section) ?></option><?php endforeach; ?></select></label>
            </div>
            <p class="muted selected-cell" id="selected-cell-text">No grid space selected yet.</p>
        </form>
    </aside>

    <section class="main-area">
        <div class="panel table-header">
            <div>
                <h2>Room plan overview</h2>
                <p class="muted">Click any empty square to place a table. Existing tables can be opened, or moved by switching the setup mode to “Move existing table”.</p>
            </div>
        </div>

        <div class="room-grid panel" style="--cols: <?= $gridCols ?>; --rows: <?= $gridRows ?>;">
            <?php for ($row = 1; $row <= $gridRows; $row++): ?>
                <?php for ($col = 1; $col <= $gridCols; $col++): ?>
                    <?php $cellKey = $row . '-' . $col; $table = $tableByCell[$cellKey] ?? null; ?>
                    <?php if ($table): $status = table_status($table); ?>
                        <div class="grid-cell occupied" data-row="<?= $row ?>" data-col="<?= $col ?>">
                            <a class="grid-table <?= status_class($status) ?>" href="index.php?table=<?= h($table['id']) ?>" title="Open Table <?= h($table['number']) ?>">
                                <strong><?= h($table['number']) ?></strong>
                                <span><?= h($table['section'] ?? 'Main Room') ?></span>
                                <em><?= h($table['server'] ?? 'Unassigned') ?></em>
                            </a>
                        </div>
                    <?php else: ?>
                        <button class="grid-cell empty-cell" type="button" data-row="<?= $row ?>" data-col="<?= $col ?>" aria-label="Place table at row <?= $row ?> column <?= $col ?>">
                            <span>+</span>
                        </button>
                    <?php endif; ?>
                <?php endfor; ?>
            <?php endfor; ?>
        </div>

        <div class="table-editor-grid">
            <?php foreach ($tables as $table): ?>
                <article class="panel mini-editor">
                    <h3>Table <?= h($table['number']) ?></h3>
                    <p class="muted">Grid: row <?= h($table['grid_row'] ?? 1) ?>, column <?= h($table['grid_col'] ?? 1) ?></p>
                    <form method="post" action="actions.php" class="meta-grid compact">
                        <input type="hidden" name="action" value="update_table_meta">
                        <input type="hidden" name="table_id" value="<?= h($table['id']) ?>">
                        <input type="hidden" name="return_to" value="setup.php">
                        <label>Server<select name="server"><?php foreach ($servers as $server): ?><option <?= $server === ($table['server'] ?? '') ? 'selected' : '' ?>><?= h($server) ?></option><?php endforeach; ?></select></label>
                        <label>Section<select name="section"><?php foreach ($sections as $section): ?><option <?= $section === ($table['section'] ?? '') ? 'selected' : '' ?>><?= h($section) ?></option><?php endforeach; ?></select></label>
                        <button class="btn" type="submit">Update assignment</button>
                    </form>
                </article>
            <?php endforeach; ?>
        </div>
    </section>
</section>
<?php require __DIR__ . '/footer.php'; ?>
