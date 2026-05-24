<?php

namespace App\Http\Controllers;

use App\Models\Discussion;
use Illuminate\Http\Request;

class DiscussionController extends Controller
{
    public function index(Request $request)
    {
        return $request->user()->discussions()->latest()->get();
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
        ]);

        $discussion = $request->user()->discussions()->create([
            'title' => $request->title,
        ]);

        return response()->json($discussion, 201);
    }

    public function show(Request $request, Discussion $discussion)
    {
        if ($discussion->user_id !== $request->user()->id) {
            abort(403);
        }

        return $discussion->load('messages');
    }

    public function destroy(Request $request, Discussion $discussion)
    {
        if ($discussion->user_id !== $request->user()->id) {
            abort(403);
        }

        $discussion->delete();

        return response()->json(['message' => 'Discussion deleted']);
    }
}
