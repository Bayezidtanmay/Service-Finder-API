<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Booking;
use App\Models\BookingEvent;
use App\Models\Notification;
use App\Models\User;

class BookingController extends Controller
{
    private function logEvent(Booking $booking, Request $request, array $data): void
    {
        BookingEvent::create([
            'booking_id'  => $booking->id,
            'actor_id'    => $request->user()?->id,
            'type'        => $data['type'],
            'from_status' => $data['from_status'] ?? null,
            'to_status'   => $data['to_status'] ?? null,
            'quote_cents' => $data['quote_cents'] ?? null,
            'message'     => $data['message'] ?? null,
            'meta'        => $data['meta'] ?? null,
        ]);
    }

    /**
     * Create notifications for booking stakeholders (user, technician, admins),
     * excluding the actor themselves.
     */
    private function notifyBookingUsers(
        Booking $booking,
        ?User $actor,
        string $type,
        string $title,
        ?string $message = null,
        ?string $url = null
    ): void {
        $targets = [];

        // customer
        if ($booking->user_id) $targets[] = $booking->user_id;

        // assigned technician
        if ($booking->technician_id) $targets[] = $booking->technician_id;

        // admins
        $adminIds = User::where('role', 'admin')->pluck('id')->all();
        $targets = array_merge($targets, $adminIds);

        // unique + remove nulls + remove actor
        $targets = array_values(array_unique(array_filter($targets)));
        if ($actor?->id) {
            $targets = array_values(array_filter($targets, fn($id) => $id !== $actor->id));
        }

        foreach ($targets as $uid) {
            Notification::create([
                'user_id'    => $uid,
                'booking_id' => $booking->id,
                'actor_id'   => $actor?->id,
                'type'       => $type,
                'title'      => $title,
                'message'    => $message,
                'url'        => $url,
            ]);
        }
    }

    // USER: create booking request
    public function store(Request $request)
    {
        // IMPORTANT: when uploading file, frontend should send multipart/form-data
        $data = $request->validate([
            'service_id' => ['required', 'exists:services,id'],
            'requested_time' => ['nullable', 'date'],
            'problem_description' => ['nullable', 'string'],

            // image file
            'problem_photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'], // 5MB
        ]);

        $path = null;
        if ($request->hasFile('problem_photo')) {
            $path = $request->file('problem_photo')->store('bookings', 'public');
        }

        $booking = Booking::create([
            'user_id' => $request->user()->id,
            'service_id' => $data['service_id'],
            'requested_time' => $data['requested_time'] ?? null,
            'problem_description' => $data['problem_description'] ?? null,
            'problem_photo_path' => $path,
            'status' => 'requested',
        ]);

        // timeline event
        $this->logEvent($booking, $request, [
            'type' => 'created',
            'to_status' => 'requested',
            'message' => $path ? 'Booking created (photo attached)' : 'Booking created',
        ]);

        // Load relations for better notification text
        $booking->load(['service']);

        // NOTIFICATION: booking created (admins will see it; user won't be notified because actor=user excluded)
        $this->notifyBookingUsers(
            $booking,
            $request->user(),
            'booking_created',
            "New booking #{$booking->id}",
            "Service: " . ($booking->service?->name ?? 'Service') . ($path ? " (photo attached)" : ""),
            '/admin'
        );

        $this->notifyBookingUsers(
            $booking,
            $request->user(),
            'booking_accepted',
            "Booking #{$booking->id} accepted",
            "Technician accepted the booking.",
            "/bookings/me"
        );

        $this->notifyBookingUsers(
            $booking,
            $request->user(),
            'quote_added',
            "Quote updated for booking #{$booking->id}",
            "New quote: €" . number_format(($booking->quote_cents ?? 0) / 100, 2),
            "/bookings/me"
        );

        $this->notifyBookingUsers(
            $booking,
            $request->user(),
            'status_changed',
            "Status changed for booking #{$booking->id}",
            "New status: " . ($booking->status ?? "requested"),
            "/bookings/me"
        );

        return $booking->load(['service', 'user', 'technician']);
    }

    // USER: list my bookings
    public function myBookings(Request $request)
    {
        return Booking::with(['service', 'review'])
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

        // capture old values
        $oldTech   = $booking->technician_id;
        $oldQuote  = $booking->quote_cents;
        $oldStatus = $booking->status;

        $booking->update($data);

        // Load relations (used in messages)
        $booking->load(['service', 'user', 'technician']);

        // technician changed
        if (array_key_exists('technician_id', $data) && $oldTech !== $booking->technician_id) {
            $this->logEvent($booking, $request, [
                'type' => 'technician_assigned',
                'message' => $booking->technician_id
                    ? "Technician assigned (ID {$booking->technician_id})"
                    : "Technician unassigned",
                'meta' => [
                    'from' => $oldTech,
                    'to' => $booking->technician_id,
                ],
            ]);

            $this->notifyBookingUsers(
                $booking,
                $request->user(),
                'technician_assigned',
                "Technician updated for booking #{$booking->id}",
                $booking->technician_id
                    ? "Assigned to: " . ($booking->technician?->name ?? $booking->technician?->email ?? "Technician")
                    : "Technician unassigned",
                '/admin'
            );
        }

        // quote changed
        if (array_key_exists('quote_cents', $data) && $oldQuote !== $booking->quote_cents) {
            $this->logEvent($booking, $request, [
                'type' => 'quote_set',
                'quote_cents' => $booking->quote_cents,
                'message' => 'Quote updated',
                'meta' => [
                    'from' => $oldQuote,
                    'to' => $booking->quote_cents,
                ],
            ]);

            $euros = $booking->quote_cents == null ? "-" : number_format($booking->quote_cents / 100, 2);

            $this->notifyBookingUsers(
                $booking,
                $request->user(),
                'quote_added',
                "Quote updated for booking #{$booking->id}",
                "New quote: €{$euros}",
                '/bookings/me'
            );
        }

        // status changed
        if (array_key_exists('status', $data) && $oldStatus !== $booking->status) {
            $this->logEvent($booking, $request, [
                'type' => 'status_changed',
                'from_status' => $oldStatus,
                'to_status' => $booking->status,
                'message' => 'Status updated',
            ]);

            $this->notifyBookingUsers(
                $booking,
                $request->user(),
                'status_changed',
                "Status changed for booking #{$booking->id}",
                "New status: " . ($booking->status ?? "requested"),
                '/bookings/me'
            );
        }

        return $booking->load(['service', 'user', 'technician']);
    }

    // TECHNICIAN: view bookings (unassigned requested + assigned to me)
    public function technicianBookings(Request $request)
    {
        return Booking::with(['service', 'user'])
            ->where(function ($q) use ($request) {
                $q->where('technician_id', $request->user()->id)
                    ->orWhere(function ($q2) {
                        $q2->whereNull('technician_id')->where('status', 'requested');
                    });
            })
            ->latest()
            ->get();
    }

    // TECHNICIAN: accept or update
    public function technicianUpdate(Request $request, Booking $booking)
    {
        $u = $request->user();

        // Accept flow: { action: "accept" }
        if ($request->input('action') === 'accept') {
            // only allow accepting unassigned requested
            if ($booking->technician_id || $booking->status !== 'requested') {
                return response()->json(['message' => 'Cannot accept this booking'], 422);
            }

            $oldStatus = $booking->status;

            $booking->update([
                'technician_id' => $u->id,
                'status' => 'accepted',
            ]);

            $booking->load(['service', 'user', 'technician']);

            $this->logEvent($booking, $request, [
                'type' => 'accepted',
                'from_status' => $oldStatus,
                'to_status' => 'accepted',
                'message' => 'Technician accepted booking',
            ]);

            $this->logEvent($booking, $request, [
                'type' => 'technician_assigned',
                'message' => "Technician assigned (ID {$u->id})",
                'meta' => ['to' => $u->id],
            ]);

            // NOTIFICATION: accepted
            $this->notifyBookingUsers(
                $booking,
                $u,
                'booking_accepted',
                "Booking #{$booking->id} accepted",
                "Technician accepted the booking.",
                '/bookings/me'
            );

            return $booking->load(['service', 'user']);
        }

        // Normal update flow (must be assigned to this technician)
        if ($booking->technician_id !== $u->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $request->validate([
            'status' => ['nullable', 'string'],
            'quote_cents' => ['nullable', 'integer', 'min:0'],
        ]);

        $oldStatus = $booking->status;
        $oldQuote  = $booking->quote_cents;

        $booking->update($data);
        $booking->load(['service', 'user', 'technician']);

        // quote changed
        if (array_key_exists('quote_cents', $data) && $oldQuote !== $booking->quote_cents) {
            $this->logEvent($booking, $request, [
                'type' => 'quote_set',
                'quote_cents' => $booking->quote_cents,
                'message' => 'Quote updated',
                'meta' => ['from' => $oldQuote, 'to' => $booking->quote_cents],
            ]);

            $euros = $booking->quote_cents == null ? "-" : number_format($booking->quote_cents / 100, 2);

            $this->notifyBookingUsers(
                $booking,
                $u,
                'quote_added',
                "Quote updated for booking #{$booking->id}",
                "New quote: €{$euros}",
                '/bookings/me'
            );
        }

        // status changed
        if (array_key_exists('status', $data) && $data['status'] && $oldStatus !== $booking->status) {
            $this->logEvent($booking, $request, [
                'type' => 'status_changed',
                'from_status' => $oldStatus,
                'to_status' => $booking->status,
                'message' => 'Status updated',
            ]);

            $this->notifyBookingUsers(
                $booking,
                $u,
                'status_changed',
                "Status changed for booking #{$booking->id}",
                "New status: " . ($booking->status ?? "requested"),
                '/bookings/me'
            );
        }

        return $booking->load(['service', 'user']);
    }
}
