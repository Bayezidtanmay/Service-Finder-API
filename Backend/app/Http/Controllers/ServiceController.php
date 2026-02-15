<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Service;

class ServiceController extends Controller
{
    public function index(Request $request)
    {
        $q = Service::query()->where('is_active', true);

        if ($request->filled('city')) $q->where('city', $request->city);
        if ($request->filled('category_id')) $q->where('category_id', $request->category_id);

        return $q->latest()->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'category_id' => ['required', 'exists:categories,id'],
            'name' => ['required', 'string'],
            'city' => ['required', 'string'],
            'address' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
            'base_price_cents' => ['required', 'integer', 'min:0'],
            'is_active' => ['boolean'],
        ]);

        return Service::create($data);
    }

    public function update(Request $request, Service $service)
    {
        $data = $request->validate([
            'category_id' => ['sometimes', 'exists:categories,id'],
            'name' => ['sometimes', 'string'],
            'city' => ['sometimes', 'string'],
            'address' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
            'base_price_cents' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $service->update($data);
        return $service;
    }

    public function destroy(Service $service)
    {
        $service->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
