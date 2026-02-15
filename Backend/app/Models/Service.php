<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

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

    protected $casts = [
        'category_id' => 'integer',
        'base_price_cents' => 'integer',
        'is_active' => 'boolean',
    ];

    /**
     * Service belongs to a category.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Service has many bookings.
     */
    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }
}
