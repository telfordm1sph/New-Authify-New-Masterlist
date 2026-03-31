<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmpDepartment extends Model
{
    protected $table = 'departments';
    protected $connection = 'masterlist';
    public $timestamps = false;

    protected $fillable = [
        'dept_name',
        'pl_name',
        'dept_head_id',
        'dept_head_name',
    ];
}
