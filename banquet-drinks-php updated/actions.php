<?php
require_once __DIR__ . '/functions.php';

$action = $_POST['action'] ?? '';
$data = load_data();
$tables = $data['tables'];

switch ($action) {
    case 'save_setup':
        $servers = array_values(array_filter(array_map('trim', explode("\n", $_POST['servers'] ?? '')), fn($v) => $v !== ''));
        $sections = array_values(array_filter(array_map('trim', explode("\n", $_POST['sections'] ?? '')), fn($v) => $v !== ''));
        $data['servers'] = $servers ?: ['Unassigned'];
        $data['sections'] = $sections ?: ['Main Room'];
        save_data($data);
        redirect_to('setup.php');

    case 'add_table':
        $tableNumber = trim($_POST['table_number'] ?? '');
        $chairs = max(1, (int)($_POST['chairs'] ?? 1));
        if ($tableNumber === '') $tableNumber = (string)(count($tables) + 1);
        $tables[] = [
            'id' => make_id(),
            'number' => $tableNumber,
            'chairs' => $chairs,
            'server' => trim($_POST['server'] ?? 'Unassigned'),
            'section' => trim($_POST['section'] ?? 'Main Room'),
            'grid_col' => min(12, max(1, (int)($_POST['grid_col'] ?? 1))),
            'grid_row' => min(8, max(1, (int)($_POST['grid_row'] ?? 1))),
            'x' => min(95, max(5, (int)($_POST['x'] ?? 50))),
            'y' => min(95, max(5, (int)($_POST['y'] ?? 50))),
            'ready_at' => '',
            'completed_notice_seen' => false,
            'seats' => make_seats($chairs)
        ];
        $data['tables'] = $tables;
        save_data($data);
        redirect_to($_POST['return_to'] ?? 'index.php');

    case 'update_table_meta':
        $tableId = $_POST['table_id'] ?? '';
        $index = find_table_index($tables, $tableId);
        if ($index !== false) {
            $tables[$index]['server'] = trim($_POST['server'] ?? 'Unassigned');
            $tables[$index]['section'] = trim($_POST['section'] ?? 'Main Room');
        }
        $data['tables'] = $tables;
        save_data($data);
        redirect_to($_POST['return_to'] ?? 'setup.php');


    case 'place_table_grid':
        $col = min(12, max(1, (int)($_POST['grid_col'] ?? 1)));
        $row = min(8, max(1, (int)($_POST['grid_row'] ?? 1)));
        $mode = $_POST['grid_mode'] ?? 'add';

        if ($mode === 'move') {
            $tableId = $_POST['move_table_id'] ?? '';
            $index = find_table_index($tables, $tableId);
            if ($index !== false) {
                $tables[$index]['grid_col'] = $col;
                $tables[$index]['grid_row'] = $row;
                $tables[$index]['x'] = (int)round(($col / 12) * 100);
                $tables[$index]['y'] = (int)round(($row / 8) * 100);
            }
        } else {
            $tableNumber = trim($_POST['table_number'] ?? '');
            $chairs = max(1, (int)($_POST['chairs'] ?? 1));
            if ($tableNumber === '') $tableNumber = (string)(count($tables) + 1);
            $tables[] = [
                'id' => make_id(),
                'number' => $tableNumber,
                'chairs' => $chairs,
                'server' => trim($_POST['server'] ?? 'Unassigned'),
                'section' => trim($_POST['section'] ?? 'Main Room'),
                'grid_col' => $col,
                'grid_row' => $row,
                'x' => (int)round(($col / 12) * 100),
                'y' => (int)round(($row / 8) * 100),
                'ready_at' => '',
                'completed_notice_seen' => false,
                'seats' => make_seats($chairs)
            ];
        }
        $data['tables'] = $tables;
        save_data($data);
        redirect_to($_POST['return_to'] ?? 'setup.php');

    case 'delete_table':
        $tableId = $_POST['table_id'] ?? '';
        $confirm = trim($_POST['confirm_table_number'] ?? '');
        $index = find_table_index($tables, $tableId);
        if ($index !== false && $confirm === (string)$tables[$index]['number']) {
            array_splice($tables, $index, 1);
        }
        $data['tables'] = $tables;
        save_data($data);
        redirect_to('index.php');

    case 'resize_table':
        $tableId = $_POST['table_id'] ?? '';
        $chairs = max(1, (int)($_POST['chairs'] ?? 1));
        $index = find_table_index($tables, $tableId);
        if ($index !== false) {
            $tables[$index]['chairs'] = $chairs;
            $tables[$index]['seats'] = resize_seats($tables[$index]['seats'] ?? [], $chairs);
        }
        $data['tables'] = $tables;
        save_data($data);
        redirect_to('index.php?table=' . urlencode($tableId));

    case 'save_orders':
        $tableId = $_POST['table_id'] ?? '';
        $index = find_table_index($tables, $tableId);
        if ($index !== false) {
            foreach ($tables[$index]['seats'] as &$seat) {
                $position = (int)$seat['position'];
                $previousDrink = trim($seat['drink'] ?? '');
                $newDrink = trim($_POST['drink'][$position] ?? '');
                $seat['drink'] = $newDrink;
                $seat['notes'] = trim($_POST['notes'][$position] ?? '');
                if ($previousDrink !== $newDrink) $seat['status'] = 'pending';
            }
            unset($seat);
            $tables[$index]['ready_at'] = '';
            $tables[$index]['completed_notice_seen'] = false;
        }
        $data['tables'] = $tables;
        save_data($data);
        redirect_to('index.php?table=' . urlencode($tableId));

    case 'clear_table':
        $tableId = $_POST['table_id'] ?? '';
        $index = find_table_index($tables, $tableId);
        if ($index !== false) {
            foreach ($tables[$index]['seats'] as &$seat) {
                $seat['drink'] = '';
                $seat['notes'] = '';
                $seat['status'] = 'pending';
            }
            unset($seat);
            $tables[$index]['ready_at'] = '';
            $tables[$index]['completed_notice_seen'] = false;
        }
        $data['tables'] = $tables;
        save_data($data);
        redirect_to('index.php?table=' . urlencode($tableId));

    case 'mark_table_ready':
        $tableId = $_POST['table_id'] ?? '';
        $index = find_table_index($tables, $tableId);
        if ($index !== false) {
            foreach ($tables[$index]['seats'] as &$seat) if (trim($seat['drink'] ?? '') !== '') $seat['status'] = 'ready';
            unset($seat);
            $tables[$index]['ready_at'] = date('c');
            $tables[$index]['completed_notice_seen'] = false;
            $message = 'Table ' . $tables[$index]['number'] . ' is ready for ' . ($tables[$index]['server'] ?: 'Unassigned') . ' in ' . ($tables[$index]['section'] ?: 'Main Room') . '.';
            $data['tables'] = $tables;
            add_notification($data, $message, $tableId);
            save_data($data);
        }
        redirect_to('bar.php');

    case 'mark_notice_seen':
        $tableId = $_POST['table_id'] ?? '';
        $index = find_table_index($tables, $tableId);
        if ($index !== false) $tables[$index]['completed_notice_seen'] = true;
        $data['tables'] = $tables;
        save_data($data);
        redirect_to('index.php?table=' . urlencode($tableId));

    case 'reset_all':
        save_data(default_data());
        redirect_to('index.php');

    default:
        redirect_to('index.php');
}
