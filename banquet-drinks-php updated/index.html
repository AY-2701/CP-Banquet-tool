<?php require __DIR__ . '/header.php';
$activeId = $_GET['table'] ?? ($tables[0]['id'] ?? '');
$activeIndex = find_table_index($tables, $activeId);
$activeTable = $activeIndex !== false ? $tables[$activeIndex] : ($tables[0] ?? null);
?>
<section class="layout">
    <aside class="panel sidebar">
        <h2>Add table</h2>
        <form method="post" action="actions.php" class="stack">
            <input type="hidden" name="action" value="add_table">
            <input type="hidden" name="return_to" value="index.php">
            <label>Table number<input name="table_number" placeholder="e.g. 12"></label>
            <label>Number of chairs<input type="number" name="chairs" min="1" value="10"></label>
            <label>Assigned server
                <select name="server"><?php foreach ($servers as $server): ?><option><?= h($server) ?></option><?php endforeach; ?></select>
            </label>
            <label>Section
                <select name="section"><?php foreach ($sections as $section): ?><option><?= h($section) ?></option><?php endforeach; ?></select>
            </label>
            <button class="btn primary" type="submit">Add table</button>
        </form>

        <h2 class="mt">Table updates</h2>
        <div class="notice-list">
            <?php foreach ($tables as $table): $status = table_status($table); ?>
                <a class="notice-row <?= status_class($status) ?>" href="index.php?table=<?= h($table['id']) ?>">
                    <strong>Table <?= h($table['number']) ?> · <?= h($status) ?></strong>
                    <span><?= h($table['server']) ?> · <?= table_ready_count($table) ?>/<?= table_order_count($table) ?> ready</span>
                </a>
            <?php endforeach; ?>
        </div>
    </aside>

    <section class="main-area">
        <?php foreach ($tables as $table): if (table_status($table) === 'Ready for server' && empty($table['completed_notice_seen'])): ?>
            <div class="panel alert-panel">
                <strong>Notification:</strong> Table <?= h($table['number']) ?> is ready for <?= h($table['server']) ?>.
                <form method="post" action="actions.php">
                    <input type="hidden" name="action" value="mark_notice_seen">
                    <input type="hidden" name="table_id" value="<?= h($table['id']) ?>">
                    <button class="btn success" type="submit">Acknowledge</button>
                </form>
            </div>
        <?php endif; endforeach; ?>

        <?php if ($activeTable): $activeStatus = table_status($activeTable); ?>
            <div class="panel table-header">
                <div>
                    <h2>Table <?= h($activeTable['number']) ?></h2>
                    <p class="muted">Position 1 is the head of the table. Assigned to <?= h($activeTable['server']) ?> in <?= h($activeTable['section']) ?>.</p>
                    <span class="status <?= status_class($activeStatus) ?>"><?= h($activeStatus) ?> · <?= table_ready_count($activeTable) ?>/<?= table_order_count($activeTable) ?> ready</span>
                </div>
                <div class="actions-row">
                    <form method="post" action="actions.php" class="inline-form">
                        <input type="hidden" name="action" value="resize_table">
                        <input type="hidden" name="table_id" value="<?= h($activeTable['id']) ?>">
                        <label>Chairs<input type="number" name="chairs" min="1" value="<?= h($activeTable['chairs']) ?>"></label>
                        <button class="btn" type="submit">Update</button>
                    </form>
                    <form method="post" action="actions.php" onsubmit="return confirm('Clear all orders for this table?')">
                        <input type="hidden" name="action" value="clear_table">
                        <input type="hidden" name="table_id" value="<?= h($activeTable['id']) ?>">
                        <button class="btn warning" type="submit">Clear orders</button>
                    </form>
                </div>
            </div>

            <div class="panel meta-panel">
                <h3>Table assignment</h3>
                <form method="post" action="actions.php" class="meta-grid">
                    <input type="hidden" name="action" value="update_table_meta">
                    <input type="hidden" name="table_id" value="<?= h($activeTable['id']) ?>">
                    <input type="hidden" name="return_to" value="index.php?table=<?= h($activeTable['id']) ?>">
                    <label>Server<select name="server"><?php foreach ($servers as $server): ?><option <?= $server === ($activeTable['server'] ?? '') ? 'selected' : '' ?>><?= h($server) ?></option><?php endforeach; ?></select></label>
                    <label>Section<select name="section"><?php foreach ($sections as $section): ?><option <?= $section === ($activeTable['section'] ?? '') ? 'selected' : '' ?>><?= h($section) ?></option><?php endforeach; ?></select></label>
                    <label>Plan X %<input type="number" name="x" min="5" max="95" value="<?= h($activeTable['x']) ?>"></label>
                    <label>Plan Y %<input type="number" name="y" min="5" max="95" value="<?= h($activeTable['y']) ?>"></label>
                    <button class="btn" type="submit">Save assignment</button>
                </form>
            </div>

            <details class="panel delete-panel">
                <summary>Delete this table</summary>
                <form method="post" action="actions.php" class="delete-confirm">
                    <input type="hidden" name="action" value="delete_table">
                    <input type="hidden" name="table_id" value="<?= h($activeTable['id']) ?>">
                    <p class="muted">Extra confirmation required: type table number <strong><?= h($activeTable['number']) ?></strong> to delete it.</p>
                    <input name="confirm_table_number" placeholder="Type <?= h($activeTable['number']) ?>">
                    <button class="btn danger" type="submit">Permanently delete table</button>
                </form>
            </details>

            <form method="post" action="actions.php">
                <input type="hidden" name="action" value="save_orders">
                <input type="hidden" name="table_id" value="<?= h($activeTable['id']) ?>">
                <div class="seat-grid">
                    <?php foreach ($activeTable['seats'] as $seat): ?>
                        <article class="seat-card <?= (int)$seat['position'] === 1 ? 'head-seat' : '' ?>">
                            <div class="seat-top">
                                <div class="seat-number"><?= h($seat['position']) ?></div>
                                <div><h3>Seat position <?= h($seat['position']) ?></h3><p><?= (int)$seat['position'] === 1 ? 'Head of table' : 'Clockwise position' ?></p></div>
                            </div>
                            <label>Drink order<input list="drink-options" name="drink[<?= h($seat['position']) ?>]" value="<?= h($seat['drink']) ?>" placeholder="e.g. Gin & Tonic"></label>
                            <label>Notes<textarea name="notes[<?= h($seat['position']) ?>]" placeholder="e.g. no ice, lemon, allergy"><?= h($seat['notes']) ?></textarea></label>
                            <span class="status <?= h($seat['status']) ?>"><?= h(ucfirst($seat['status'])) ?></span>
                        </article>
                    <?php endforeach; ?>
                </div>
                <button class="btn primary sticky-save" type="submit">Save table orders</button>
            </form>
        <?php else: ?>
            <div class="panel empty"><h2>Add a table to begin</h2></div>
        <?php endif; ?>
    </section>
</section>
<datalist id="drink-options">
    <option value="Still Water"><option value="Sparkling Water"><option value="Coke"><option value="Diet Coke">
    <option value="Lemonade"><option value="Orange Juice"><option value="House Red Wine"><option value="House White Wine">
    <option value="Prosecco"><option value="Beer"><option value="Gin & Tonic"><option value="Vodka Lemonade">
    <option value="Mocktail"><option value="Tea"><option value="Coffee">
</datalist>
<?php require __DIR__ . '/footer.php'; ?>
