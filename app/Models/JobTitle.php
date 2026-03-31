<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JobTitle extends Model
{
    protected $table = 'job_title';
    protected $connection = 'masterlist';
    public $timestamps = false;

    protected $fillable = [
        'application_id',
        'position',
        'job_desc',
        'job_quali',
        'department',
        'position_level',
        'station',
        'status',
    ];
}
