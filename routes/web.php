<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect('/app');
});

Route::get('/app', function () {
    return file_get_contents(public_path('app/index.html'));
});

Route::get('/app/style.css', function () {
    return response(file_get_contents(public_path('app/style.css')), 200)
        ->header('Content-Type', 'text/css');
});

Route::get('/app/app.js', function () {
    return response(file_get_contents(public_path('app/app.js')), 200)
        ->header('Content-Type', 'application/javascript');
});
