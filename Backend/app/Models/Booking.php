<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'service_id',
        'technician_id',
        'status',
        'requested_time',
        'problem_description',
        'quote_cents',
    ];

    protected $casts = [
        'requested_time' => 'datetime',
        'quote_cents' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function technician()
    {
        return $this->belongsTo(User::class, 'technician_id');
    }
    public function events()
    {
        return $this->hasMany(\App\Models\BookingEvent::class)->latest();
    }
}
