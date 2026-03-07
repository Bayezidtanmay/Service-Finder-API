<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Booking;
use App\Models\Review;

class AdminAnalyticsController extends Controller
{
    public function index(Request $request)
    {
        $days = (int)($request->query('days', 30));
        if ($days < 7) $days = 7;
        if ($days > 180) $days = 180;

        $from = now()->subDays($days - 1)->startOfDay();

        $statusCounts = Booking::select('status', DB::raw('COUNT(*) as c'))
            ->groupBy('status')
            ->pluck('c', 'status');

        $trendRaw = Booking::select(
            DB::raw('DATE(created_at) as day'),
            DB::raw('COUNT(*) as total'),
            DB::raw("SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as completed"),
            DB::raw("SUM(CASE WHEN status='cancelled' THEN 1 ELSE 0 END) as cancelled")
        )
            ->where('created_at', '>=', $from)
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('day')
            ->get();

        $trendByDay = [];
        foreach ($trendRaw as $row) {
            $trendByDay[$row->day] = [
                'day' => $row->day,
                'total' => (int)$row->total,
                'completed' => (int)$row->completed,
                'cancelled' => (int)$row->cancelled,
            ];
        }

        $trend = [];
        for ($i = 0; $i < $days; $i++) {
            $d = $from->copy()->addDays($i)->toDateString();
            $trend[] = $trendByDay[$d] ?? [
                'day' => $d,
                'total' => 0,
                'completed' => 0,
                'cancelled' => 0,
            ];
        }

        $revenueRaw = Booking::select(
            DB::raw('DATE(created_at) as day'),
            DB::raw("SUM(CASE WHEN status='completed' THEN COALESCE(quote_cents,0) ELSE 0 END) as revenue_cents")
        )
            ->where('created_at', '>=', $from)
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('day')
            ->get();

        $revByDay = [];
        foreach ($revenueRaw as $row) {
            $revByDay[$row->day] = (int)$row->revenue_cents;
        }

        $revenue = [];
        for ($i = 0; $i < $days; $i++) {
            $d = $from->copy()->addDays($i)->toDateString();
            $revenue[] = [
                'day' => $d,
                'revenue_cents' => $revByDay[$d] ?? 0,
            ];
        }

        $topServices = Booking::query()
            ->join('services', 'services.id', '=', 'bookings.service_id')
            ->select(
                'services.id',
                'services.name',
                DB::raw('COUNT(*) as bookings_count')
            )
            ->groupBy('services.id', 'services.name')
            ->orderByDesc('bookings_count')
            ->limit(8)
            ->get();

        // ✅ New: technician rating leaderboard
        $topTechnicians = Review::query()
            ->join('users', 'users.id', '=', 'reviews.technician_id')
            ->select(
                'users.id',
                'users.name',
                'users.email',
                DB::raw('AVG(reviews.rating) as avg_rating'),
                DB::raw('COUNT(reviews.id) as reviews_count')
            )
            ->groupBy('users.id', 'users.name', 'users.email')
            ->havingRaw('COUNT(reviews.id) > 0')
            ->orderByDesc('avg_rating')
            ->orderByDesc('reviews_count')
            ->limit(8)
            ->get()
            ->map(function ($t) {
                return [
                    'id' => $t->id,
                    'name' => $t->name,
                    'email' => $t->email,
                    'avg_rating' => round((float)$t->avg_rating, 1),
                    'reviews_count' => (int)$t->reviews_count,
                ];
            });

        $totalBookings = Booking::count();
        $completed = Booking::where('status', 'completed')->count();
        $cancelled = Booking::where('status', 'cancelled')->count();

        $avgQuote = Booking::whereIn('status', ['quoted', 'completed'])
            ->whereNotNull('quote_cents')
            ->avg('quote_cents');

        // ✅ New: overall review stats
        $reviewStats = [
            'total_reviews' => Review::count(),
            'avg_rating' => round((float)(Review::avg('rating') ?? 0), 1),
        ];

        return response()->json([
            'days' => $days,
            'kpi' => [
                'total_bookings' => $totalBookings,
                'completed' => $completed,
                'cancelled' => $cancelled,
                'completion_rate' => $totalBookings ? round(($completed / $totalBookings) * 100, 1) : 0,
                'avg_quote_cents' => $avgQuote ? (int) round($avgQuote) : null,
            ],
            'review_stats' => $reviewStats,
            'status_counts' => $statusCounts,
            'trend' => $trend,
            'revenue' => $revenue,
            'top_services' => $topServices,
            'top_technicians' => $topTechnicians,
        ]);
    }
}
