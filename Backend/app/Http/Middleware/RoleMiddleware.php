<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, ...$roles)
    {
        $user = $request->user(); // Sanctum authenticated user

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        // Make it safe (trim + lowercase)
        $role = strtolower(trim((string) ($user->role ?? '')));

        $allowed = array_map(fn($r) => strtolower(trim($r)), $roles);

        if (!$role || !in_array($role, $allowed, true)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return $next($request);
    }
}
