<?php

use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Check if the application is in maintenance mode
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Composer autoloader — loads all classes from vendor/ and app/
require __DIR__.'/../vendor/autoload.php';

// Bootstrap the application (bootstrap/app.php) and handle the HTTP request
$app = require_once __DIR__.'/../bootstrap/app.php';

$app->handleRequest(Request::capture());
