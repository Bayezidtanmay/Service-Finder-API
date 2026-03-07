<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Review;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    // USER: create review for completed booking
    public function store(Request $request, Booking $booking)
    {
        $user = $request->user();

        if ($booking->user_id !== $user->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($booking->status !== 'completed') {
            return response()->json(['message' => 'You can review only completed bookings'], 422);
        }

        if (!$booking->technician_id) {
            return response()->json(['message' => 'This booking has no technician'], 422);
        }

        if ($booking->review) {
            return response()->json(['message' => 'Review already submitted'], 422);
        }

        $data = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:2000'],
        ]);

        $review = Review::create([
            'booking_id' => $booking->id,
            'user_id' => $user->id,
            'technician_id' => $booking->technician_id,
            'rating' => $data['rating'],
            'comment' => $data['comment'] ?? null,
        ]);

        return $review->load(['user', 'technician']);
    }
}
