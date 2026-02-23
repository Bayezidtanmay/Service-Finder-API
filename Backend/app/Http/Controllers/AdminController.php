<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    // GET /api/admin/technicians
    public function technicians(Request $request)
    {
        return User::query()
            ->select('id', 'name', 'email', 'role')
            ->where('role', 'technician')
            ->orderBy('name')
            ->get();
    }
}
