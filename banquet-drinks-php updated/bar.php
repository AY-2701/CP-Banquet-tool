<?php require __DIR__ . '/header.php';
$q = strtolower(trim($_GET['q'] ?? ''));
$totals = drink_totals($tables);
?>
<section class="bar-layout">
    <section class="bar-main">
        <div class="panel table-header">
            <div><h2>Bar prep queue</h2><p class="muted">Orders grouped by table with assigned server, section, seat position, drink and notes.</p></div>
            <form method="get" class="search-form"><input name="q" value="<?= h($q) ?>" placeholder="Search table, server, section, drink"><button class="btn" type="submit">Search</button></form>
        </div>

        <?php if ($notifications): ?>
            <div class="panel notifications"><h3>Completion notifications</h3><?php foreach (array_slice($notifications,0,6) as $n): ?><p><?= h($n['message']) ?> <small><?= h(date('H:i', strtotime($n['created_at']))) ?></small></p><?php endforeach; ?></div>
        <?php endif; ?>

        <?php
        $hasOrders = false;
        foreach ($tables as $table):
            $orderedSeats = array_filter($table['seats'] ?? [], function ($seat) use ($q, $table) {
                if (trim($seat['drink'] ?? '') === '') return false;
                if ($q === '') return true;
                $haystack = strtolower('table ' . ($table['number'] ?? '') . ' server ' . ($table['server'] ?? '') . ' section ' . ($table['section'] ?? '') . ' seat ' . ($seat['position'] ?? '') . ' ' . ($seat['drink'] ?? '') . ' ' . ($seat['notes'] ?? ''));
                return str_contains($haystack, $q);
            });
            if (!$orderedSeats) continue;
            $hasOrders = true;
            $status = table_status($table);
        ?>
            <article class="panel queue-card <?= status_class($status) ?>">
                <div class="queue-head">
                    <div>
                        <h3>Table <?= h($table['number']) ?></h3>
                        <p><?= count($orderedSeats) ?> drinks · <?= h($table['server']) ?> · <?= h($table['section']) ?></p>
                        <span class="status <?= status_class($status) ?>"><?= h($status) ?> · <?= table_ready_count($table) ?>/<?= table_order_count($table) ?> ready</span>
                    </div>
                    <form method="post" action="actions.php">
                        <input type="hidden" name="action" value="mark_table_ready">
                        <input type="hidden" name="table_id" value="<?= h($table['id']) ?>">
                        <button class="btn success" type="submit">Complete table order</button>
                    </form>
                </div>
                <div class="queue-list">
                    <?php foreach ($orderedSeats as $seat): ?>
                        <div class="queue-row">
                            <strong>Seat <?= h($seat['position']) ?></strong>
                            <span class="drink-name"><?= h($seat['drink']) ?></span>
                            <span class="muted"><?= h($seat['notes'] ?: 'No notes') ?></span>
                            <span class="status <?= h($seat['status']) ?>"><?= h(ucfirst($seat['status'])) ?></span>
                        </div>
                    <?php endforeach; ?>
                </div>
            </article>
        <?php endforeach; ?>

        <?php if (!$hasOrders): ?><div class="panel empty"><h2>No drink orders yet</h2><p class="muted">Orders will appear here after they are saved on the server input screen.</p></div><?php endif; ?>
    </section>

    <aside class="panel totals">
        <h2>Drink totals</h2>
        <?php if (!$totals): ?><p class="muted">Totals appear after drinks are entered.</p><?php else: foreach ($totals as $drink => $count): ?><div class="total-row"><span><?= h($drink) ?></span><strong><?= h($count) ?></strong></div><?php endforeach; endif; ?>
        <form method="post" action="actions.php" onsubmit="return confirm('Reset all tables and orders?')"><input type="hidden" name="action" value="reset_all"><button class="btn danger full" type="submit">Reset event</button></form>
    </aside>
</section>
<?php require __DIR__ . '/footer.php'; ?>
