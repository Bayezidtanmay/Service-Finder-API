<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BookingEvent extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_id',
        'actor_id',
        'type',
        'from_status',
        'to_status',
        'quote_cents',
        'message',
        'meta',
    ];

    protected $casts = [
        'meta' => 'array',
    ];

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }

    public function actor()
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
