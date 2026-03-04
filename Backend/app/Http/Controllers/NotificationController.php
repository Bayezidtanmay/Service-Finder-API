<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Notification;

class NotificationController extends Controller
{
    // GET /api/notifications?unread=1
    public function index(Request $request)
    {
        $q = Notification::with(['actor:id,name,email,role'])
            ->where('user_id', $request->user()->id)
            ->latest();

        if ($request->boolean('unread')) {
            $q->whereNull('read_at');
        }

        // keep it simple: latest 50
        return $q->take(50)->get();
    }

    // GET /api/notifications/unread-count
    public function unreadCount(Request $request)
    {
        $count = Notification::where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->count();

        return ['count' => $count];
    }

    // PATCH /api/notifications/{notification}/read
    public function markRead(Request $request, Notification $notification)
    {
        if ($notification->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if (!$notification->read_at) {
            $notification->update(['read_at' => now()]);
        }

        return $notification->fresh();
    }

    // PATCH /api/notifications/read-all
    public function markAllRead(Request $request)
    {
        Notification::where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return ['ok' => true];
    }
}
