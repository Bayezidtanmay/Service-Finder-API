<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\BookingController;

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

Route::get('/services', [ServiceController::class, 'index']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // USER
    Route::post('/bookings', [BookingController::class, 'store'])->middleware('role:user');
    Route::get('/bookings/me', [BookingController::class, 'myBookings'])->middleware('role:user');

    // TECHNICIAN
    Route::get('/technician/bookings', [BookingController::class, 'technicianBookings'])->middleware('role:technician');
    Route::patch('/technician/bookings/{booking}', [BookingController::class, 'technicianUpdate'])->middleware('role:technician');

    // ADMIN
    Route::post('/services', [ServiceController::class, 'store'])->middleware('role:admin');
    Route::patch('/services/{service}', [ServiceController::class, 'update'])->middleware('role:admin');
    Route::delete('/services/{service}', [ServiceController::class, 'destroy'])->middleware('role:admin');

    Route::get('/admin/bookings', [BookingController::class, 'index'])->middleware('role:admin');
    Route::patch('/admin/bookings/{booking}', [BookingController::class, 'adminUpdate'])->middleware('role:admin');
});
