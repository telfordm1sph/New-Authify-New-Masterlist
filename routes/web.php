<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

Route::get('/login',          [AuthController::class, 'loginForm'])->name('sso.login');
Route::post('/login',         [AuthController::class, 'login'])->name('sso.login.post');
Route::get('/logout',         [AuthController::class, 'logout'])->name('sso.logout');
Route::get('/validate-token', [AuthController::class, 'validateToken'])->name('sso.validate');
Route::get('/check-session',  [AuthController::class, 'checkSession'])->name('sso.check');

// Redirect root to login
Route::get('/', function () {
    return redirect()->route('sso.login', [
        'redirect' => request()->query('redirect')
    ]);
});