<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'name',
        'city',
        'address',
        'description',
        'base_price_cents',
        'is_active',
    ];

    /**
     * Service belongs to a category.
     */
    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Service has many bookings.
     */
    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }
}
