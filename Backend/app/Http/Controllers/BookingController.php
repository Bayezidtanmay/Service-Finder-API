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
            'quote_cents' => null,
            'technician_id' => null,
        ]);

        return $booking->load(['service']);
    }

    // USER: list my bookings
    public function myBookings(Request $request)
    {
        return Booking::with(['service', 'technician'])
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
            'status' => ['nullable', 'string', 'in:requested,accepted,quoted,in_progress,completed,cancelled'],
            'requested_time' => ['nullable', 'date'],
        ]);

        $booking->update($data);

        return $booking->load(['service', 'user', 'technician']);
    }

    // TECHNICIAN: view assigned bookings + unassigned requested bookings
    public function technicianBookings(Request $request)
    {
        $techId = $request->user()->id;

        return Booking::with(['service', 'user'])
            ->where(function ($q) use ($techId) {
                $q->where('technician_id', $techId)
                    ->orWhere(function ($q2) {
                        $q2->whereNull('technician_id')
                            ->where('status', 'requested');
                    });
            })
            ->latest()
            ->get();
    }

    // TECHNICIAN: accept booking + update quote/status
    public function technicianUpdate(Request $request, Booking $booking)
    {
        $techId = $request->user()->id;

        $data = $request->validate([
            // "accept" is optional - when present it assigns booking to current technician
            'action' => ['nullable', 'string', 'in:accept'],

            // Optional updates
            'status' => ['nullable', 'string', 'in:requested,accepted,quoted,in_progress,completed,cancelled'],
            'quote_cents' => ['nullable', 'integer', 'min:0'],
            'requested_time' => ['nullable', 'date'],
        ]);

        // Accept flow (works even if booking was unassigned)
        if (($data['action'] ?? null) === 'accept') {
            // already assigned to another technician
            if ($booking->technician_id !== null && $booking->technician_id !== $techId) {
                return response()->json(['message' => 'Booking already assigned to another technician.'], 409);
            }

            // assign to me if unassigned
            if ($booking->technician_id === null) {
                $booking->technician_id = $techId;
            }

            // if requested -> accepted
            if ($booking->status === 'requested') {
                $booking->status = 'accepted';
            }
        }

        // If booking is assigned and not mine => forbid
        if ($booking->technician_id !== null && $booking->technician_id !== $techId) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        // Apply optional updates
        if (array_key_exists('status', $data) && $data['status'] !== null) {
            $booking->status = $data['status'];
        }

        if (array_key_exists('quote_cents', $data)) {
            $booking->quote_cents = $data['quote_cents'];

            // If quote set and booking in early states, move to "quoted"
            if ($data['quote_cents'] !== null && in_array($booking->status, ['requested', 'accepted'], true)) {
                $booking->status = 'quoted';
            }
        }

        if (array_key_exists('requested_time', $data)) {
            $booking->requested_time = $data['requested_time'];
        }

        $booking->save();

        return $booking->load(['service', 'user']);
    }
}
