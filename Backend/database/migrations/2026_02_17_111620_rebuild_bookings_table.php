<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Drop the current useless table
        Schema::dropIfExists('bookings');

        // Recreate with proper columns
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('service_id')->constrained()->cascadeOnDelete();

            // optional: technician assigned later
            $table->foreignId('technician_id')->nullable()->constrained('users')->nullOnDelete();

            $table->string('status')->default('pending'); // pending, accepted, rejected, completed

            $table->dateTime('requested_time')->nullable();
            $table->text('problem_description')->nullable();

            // quote the admin/technician can set later
            $table->unsignedInteger('quote_cents')->nullable();

            $table->timestamps();

            $table->index(['user_id', 'created_at']);
            $table->index(['service_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');

        // optional: restore minimal version (not needed usually)
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
        });
    }
};
