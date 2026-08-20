<?php

return [

    'default' => env('DB_CONNECTION', 'pgsql'),

    'connections' => [

        'sqlite' => [
            'driver'                  => 'sqlite',
            'url'                     => env('DB_URL'),
            'database'                => env('DB_DATABASE', database_path('database.sqlite')),
            'prefix'                  => '',
            'foreign_key_constraints' => env('DB_FOREIGN_KEYS', true),
            'busy_timeout'            => null,
            'journal_mode'            => null,
            'synchronous'             => null,
        ],

        /*
        |----------------------------------------------------------------------
        | PostgreSQL — Primary database
        |----------------------------------------------------------------------
        | Used in Docker (and production). The 'schema' can be changed if you
        | need to isolate tables from other apps sharing the same PG server.
        */
        'pgsql' => [
            'driver'         => 'pgsql',
            'url'            => env('DB_URL'),
            'host'           => env('DB_HOST', '127.0.0.1'),
            'port'           => env('DB_PORT', '5432'),
            'database'       => env('DB_DATABASE', 'taskmanagement'),
            'username'       => env('DB_USERNAME', 'postgres'),
            'password'       => env('DB_PASSWORD', ''),
            'charset'        => 'utf8',
            'prefix'         => '',
            'prefix_indexes' => true,
            'search_path'    => 'public',
            'sslmode'        => 'prefer',
        ],

        /*
        |----------------------------------------------------------------------
        | SQLite — Used ONLY for automated tests
        |----------------------------------------------------------------------
        | Tests use an in-memory SQLite database so they:
        | 1. Run fast (no TCP connection overhead)
        | 2. Are fully isolated from dev/staging data
        | 3. Don't require a running PostgreSQL instance
        | Configured in phpunit.xml via env('DB_CONNECTION', 'sqlite')
        */
        'testing' => [
            'driver'   => 'sqlite',
            'database' => ':memory:',
            'prefix'   => '',
        ],
    ],

    'migrations' => [
        'table'  => 'migrations',
        'update_date_on_publish' => true,
    ],

    'redis' => [
        'client' => env('REDIS_CLIENT', 'phpredis'),
        'default' => [
            'host'     => env('REDIS_HOST', '127.0.0.1'),
            'password' => env('REDIS_PASSWORD'),
            'port'     => env('REDIS_PORT', '6379'),
            'database' => env('REDIS_DB', '0'),
        ],
        'cache' => [
            'host'     => env('REDIS_HOST', '127.0.0.1'),
            'password' => env('REDIS_PASSWORD'),
            'port'     => env('REDIS_PORT', '6379'),
            'database' => env('REDIS_CACHE_DB', '1'),
        ],
    ],
];
