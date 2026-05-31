<?php
require_once __DIR__ . '/functions.php';
$data = load_data();
$tables = $data['tables'];
$servers = $data['servers'];
$sections = $data['sections'];
$notifications = $data['notifications'];
$currentPage = basename($_SERVER['PHP_SELF']);
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Banquet Drinks Order Tool</title>
    <link rel="stylesheet" href="assets/styles.css">
</head>
<body>
<header class="hero">
    <div>
        <p class="eyebrow">Banquet drinks service</p>
        <h1>Table-by-table drinks ordering</h1>
        <p class="hero-text">Seat position 1 starts at the head of each table. Continue clockwise for clean delivery and bar prep.</p>
    </div>
    <div class="stats">
        <div><strong><?= count($tables) ?></strong><span>Tables</span></div>
        <div><strong><?= count_orders($tables) ?></strong><span>Orders</span></div>
        <div><strong><?= count_ready($tables) ?></strong><span>Ready</span></div>
        <div><strong><?= count(array_filter($notifications, fn($n) => empty($n['seen']))) ?></strong><span>Alerts</span></div>
    </div>
</header>
<nav class="tabs">
    <a class="<?= $currentPage === 'setup.php' ? 'active' : '' ?>" href="setup.php">Setup / Room Plan</a>
    <a class="<?= $currentPage === 'index.php' ? 'active' : '' ?>" href="index.php">Server Input</a>
    <a class="<?= $currentPage === 'bar.php' ? 'active' : '' ?>" href="bar.php">Bar Prep Screen</a>
</nav>
<main class="page">
