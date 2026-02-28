<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use Illuminate\Http\Request;

class BookingEventController extends Controller
{
    // GET /api/bookings/{booking}/events
    public function index(Request $request, Booking $booking)
    {
        $u = $request->user();

        // Authorization:
        $isOwner = $booking->user_id === $u->id;
        $isTech  = $booking->technician_id === $u->id;
        $isAdmin = $u->role === 'admin';

        if (!($isOwner || $isTech || $isAdmin)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return $booking->events()
            ->with(['actor:id,name,email,role'])
            ->get();
    }
}
