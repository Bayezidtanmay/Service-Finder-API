<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Booking;

class BookingController extends Controller
{
    // USER: create booking request
    public function store(Request $request)
    {
        $data = $request->validate([
            'service_id' => ['required', 'exists:services,id'],
            'requested_time' => ['nullable', 'date'],
            'problem_description' => ['nullable', 'string'],
        ]);

        $booking = Booking::create([
            'user_id' => $request->user()->id,
            'service_id' => $data['service_id'],
            'requested_time' => $data['requested_time'] ?? null,
            'problem_description' => $data['problem_description'] ?? null,
            'status' => 'requested',
        ]);

        return $booking;
    }

    // USER: list my bookings
    public function myBookings(Request $request)
    {
        return Booking::with('service')
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get();
    }

    // ADMIN: list all bookings
    public function index()
    {
        return Booking::with(['service', 'user', 'technician'])
            ->latest()
            ->get();
    }

    // ADMIN: assign technician + set quote/status
    public function adminUpdate(Request $request, Booking $booking)
    {
        $data = $request->validate([
            'technician_id' => ['nullable', 'exists:users,id'],
            'quote_cents' => ['nullable', 'integer', 'min:0'],
            'status' => ['nullable', 'string'],
        ]);

        $booking->update($data);
        return $booking->load(['service', 'user', 'technician']);
    }

    // TECHNICIAN: view assigned bookings
    public function technicianBookings(Request $request)
    {
        return Booking::with(['service', 'user'])
            ->where('technician_id', $request->user()->id)
            ->latest()
            ->get();
    }

    // TECHNICIAN: update status
    public function technicianUpdate(Request $request, Booking $booking)
    {
        if ($booking->technician_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $request->validate([
            'status' => ['required', 'string'],
        ]);

        $booking->update(['status' => $data['status']]);
        return $booking->load(['service', 'user']);
    }
}
