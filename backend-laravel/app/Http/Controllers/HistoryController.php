<?php

namespace App\Http\Controllers;

use App\Models\History;
use Illuminate\Http\Request;

class HistoryController extends Controller
{
    public function index(Request $request)
    {
        $query = $request->user()->histories();
        
        if ($request->has('discussion_id')) {
            $query->where('discussion_id', $request->discussion_id);
        }

        return $query->oldest()->get();
    }

    public function store(Request $request)
    {
        $request->validate([
            'discussion_id' => 'required|exists:discussions,id',
            'action' => 'required|string',
            'role' => 'nullable|string|in:user,assistant',
            'details' => 'nullable|array',
        ]);

        $history = $request->user()->histories()->create([
            'discussion_id' => $request->discussion_id,
            'action' => $request->action,
            'role' => $request->role ?? 'user',
            'details' => $request->details,
        ]);

        return response()->json($history, 201);
    }
}
