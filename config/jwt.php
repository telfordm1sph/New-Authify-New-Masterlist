<?php

return [
    'secret' => env('JWT_SECRET'),
    'algo'   => 'HS256',
    'expiry' => [
        'personal' => 8,
        'shared'   => 24,
    ],
];