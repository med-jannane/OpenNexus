<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('histories', function (Blueprint $table) {
            $table->foreignId('discussion_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('role')->default('user'); // user or assistant
        });
    }

    public function down(): void
    {
        Schema::table('histories', function (Blueprint $table) {
            $table->dropForeign(['discussion_id']);
            $table->dropColumn(['discussion_id', 'role']);
        });
    }
};
