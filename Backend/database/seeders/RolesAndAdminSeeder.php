<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\Hash;

class RolesAndAdminSeeder extends Seeder
{
    public function run(): void
    {
        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $techRole  = Role::firstOrCreate(['name' => 'technician']);
        $userRole  = Role::firstOrCreate(['name' => 'user']);

        $admin = User::firstOrCreate(
            ['email' => 'admin@test.fi'],
            ['name' => 'Admin', 'password' => Hash::make('password123')]
        );
        $admin->assignRole($adminRole);

        $tech = User::firstOrCreate(
            ['email' => 'tech@test.fi'],
            ['name' => 'Tech', 'password' => Hash::make('password123')]
        );
        $tech->assignRole($techRole);

        $user = User::firstOrCreate(
            ['email' => 'user@test.fi'],
            ['name' => 'User', 'password' => Hash::make('password123')]
        );
        $user->assignRole($userRole);
    }
}
