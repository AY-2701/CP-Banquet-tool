<?php
const DATA_FILE = __DIR__ . '/data/orders.json';

function default_data(): array {
    return [
        'tables' => [],
        'sections' => ['Main Room'],
        'servers' => ['Unassigned'],
        'notifications' => [],
        'updated_at' => date('c')
    ];
}

function normalise_data(array $data): array {
    $default = default_data();
    $data = array_merge($default, $data);
    if (!is_array($data['tables'])) $data['tables'] = [];
    if (!is_array($data['sections']) || !$data['sections']) $data['sections'] = ['Main Room'];
    if (!is_array($data['servers']) || !$data['servers']) $data['servers'] = ['Unassigned'];
    if (!is_array($data['notifications'])) $data['notifications'] = [];
    foreach ($data['tables'] as &$table) {
        $table['server'] = $table['server'] ?? 'Unassigned';
        $table['section'] = $table['section'] ?? 'Main Room';
        if (!isset($table['grid_col'])) {
            $table['grid_col'] = isset($table['x']) ? max(1, min(12, (int)round(((int)$table['x'] / 100) * 12))) : 1;
        }
        if (!isset($table['grid_row'])) {
            $table['grid_row'] = isset($table['y']) ? max(1, min(8, (int)round(((int)$table['y'] / 100) * 8))) : 1;
        }
        $table['grid_col'] = max(1, min(12, (int)$table['grid_col']));
        $table['grid_row'] = max(1, min(8, (int)$table['grid_row']));
        $table['x'] = isset($table['x']) ? (int)$table['x'] : (int)round(($table['grid_col'] / 12) * 100);
        $table['y'] = isset($table['y']) ? (int)$table['y'] : (int)round(($table['grid_row'] / 8) * 100);
        $table['ready_at'] = $table['ready_at'] ?? '';
        $table['completed_notice_seen'] = $table['completed_notice_seen'] ?? false;
        $table['seats'] = $table['seats'] ?? make_seats((int)($table['chairs'] ?? 1));
    }
    unset($table);
    return $data;
}

function load_data(): array {
    if (!file_exists(DATA_FILE)) save_data(default_data());
    $json = file_get_contents(DATA_FILE);
    $data = json_decode($json, true);
    if (!is_array($data)) $data = default_data();
    return normalise_data($data);
}

function save_data(array $data): void {
    $data = normalise_data($data);
    $data['updated_at'] = date('c');
    file_put_contents(DATA_FILE, json_encode($data, JSON_PRETTY_PRINT), LOCK_EX);
}

function redirect_to(string $path): never { header('Location: ' . $path); exit; }
function h(string|int|null $value): string { return htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8'); }
function make_id(): string { return bin2hex(random_bytes(8)); }

function make_seats(int $chairs): array {
    $seats = [];
    for ($i = 1; $i <= $chairs; $i++) {
        $seats[] = ['position' => $i, 'drink' => '', 'notes' => '', 'status' => 'pending'];
    }
    return $seats;
}

function find_table_index(array $tables, string $tableId): int|false {
    foreach ($tables as $index => $table) if (($table['id'] ?? '') === $tableId) return $index;
    return false;
}

function resize_seats(array $seats, int $chairs): array {
    $newSeats = [];
    for ($i = 1; $i <= $chairs; $i++) {
        $existing = $seats[$i - 1] ?? null;
        $newSeats[] = [
            'position' => $i,
            'drink' => $existing['drink'] ?? '',
            'notes' => $existing['notes'] ?? '',
            'status' => $existing['status'] ?? 'pending'
        ];
    }
    return $newSeats;
}

function table_order_count(array $table): int {
    $count = 0;
    foreach (($table['seats'] ?? []) as $seat) if (trim($seat['drink'] ?? '') !== '') $count++;
    return $count;
}

function table_ready_count(array $table): int {
    $count = 0;
    foreach (($table['seats'] ?? []) as $seat) if (trim($seat['drink'] ?? '') !== '' && ($seat['status'] ?? '') === 'ready') $count++;
    return $count;
}

function table_status(array $table): string {
    $orders = table_order_count($table);
    $ready = table_ready_count($table);
    if ($orders === 0) return 'No orders';
    if ($ready === 0) return 'Sent to bar';
    if ($ready < $orders) return 'Part ready';
    return 'Ready for server';
}

function status_class(string $status): string {
    return match ($status) {
        'Ready for server' => 'ready',
        'Part ready' => 'part',
        'Sent to bar' => 'pending',
        default => 'none'
    };
}

function drink_totals(array $tables): array {
    $totals = [];
    foreach ($tables as $table) foreach (($table['seats'] ?? []) as $seat) {
        $drink = trim($seat['drink'] ?? '');
        if ($drink === '') continue;
        $totals[$drink] = ($totals[$drink] ?? 0) + 1;
    }
    arsort($totals);
    return $totals;
}

function count_orders(array $tables): int { return array_sum(array_map('table_order_count', $tables)); }
function count_ready(array $tables): int { return array_sum(array_map('table_ready_count', $tables)); }

function add_notification(array &$data, string $message, string $tableId): void {
    array_unshift($data['notifications'], [
        'id' => make_id(),
        'table_id' => $tableId,
        'message' => $message,
        'created_at' => date('c'),
        'seen' => false
    ]);
    $data['notifications'] = array_slice($data['notifications'], 0, 30);
}
