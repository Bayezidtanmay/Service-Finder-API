<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'service_id',
        'technician_id',
        'status',
        'requested_time',
        'problem_description',
        'quote_cents',
    ];

    /**
     * Booking belongs to the user who created it.
     */
    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    /**
     * Booking belongs to a service.
     */
    public function service()
    {
        return $this->belongsTo(\App\Models\Service::class);
    }

    /**
     * Booking belongs to a technician (user).
     */
    public function technician()
    {
        return $this->belongsTo(\App\Models\User::class, 'technician_id');
    }
}
