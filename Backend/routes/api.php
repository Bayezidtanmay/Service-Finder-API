<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\BookingEventController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\AdminAnalyticsController;
use App\Http\Controllers\NotificationController;

/*
|--------------------------------------------------------------------------
| Public (no auth)
|--------------------------------------------------------------------------
*/

Route::get('/health', fn() => response()->json(['status' => 'ok']));

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

// Public: list services (for everyone)
Route::get('/services', [ServiceController::class, 'index']);

/*
|--------------------------------------------------------------------------
| Protected (auth:sanctum)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    /*
    |--------------------------------------------------------------------------
    | USER routes
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:user')->group(function () {
        Route::post('/bookings', [BookingController::class, 'store']);
        Route::get('/bookings/me', [BookingController::class, 'myBookings']);
    });

    /*
    |--------------------------------------------------------------------------
    | TECHNICIAN routes
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:technician')->group(function () {
        Route::get('/technician/bookings', [BookingController::class, 'technicianBookings']);
        Route::patch('/technician/bookings/{booking}', [BookingController::class, 'technicianUpdate']);
    });

    /*
    |--------------------------------------------------------------------------
    | ADMIN routes
    |--------------------------------------------------------------------------
    */

    Route::middleware('role:admin')->group(function () {
        // Manage services
        Route::post('/services', [ServiceController::class, 'store']);
        Route::patch('/services/{service}', [ServiceController::class, 'update']);
        Route::delete('/services/{service}', [ServiceController::class, 'destroy']);

        // Manage bookings
        Route::get('/admin/bookings', [BookingController::class, 'index']);
        Route::patch('/admin/bookings/{booking}', [BookingController::class, 'adminUpdate']);
        Route::get('/admin/technicians', [AdminController::class, 'technicians'])->middleware('role:admin');
    });

    Route::get('/bookings/{booking}/events', [BookingEventController::class, 'index']);

    Route::get('/profile', [ProfileController::class, 'show']);
    Route::patch('/profile', [ProfileController::class, 'update']);
    Route::post('/profile/avatar', [ProfileController::class, 'uploadAvatar']);
    Route::delete('/profile/avatar', [ProfileController::class, 'deleteAvatar']);

    Route::get('/admin/analytics', [AdminAnalyticsController::class, 'index'])->middleware('role:admin');

    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markRead']);
    Route::patch('/notifications/read-all', [NotificationController::class, 'markAllRead']);
});
