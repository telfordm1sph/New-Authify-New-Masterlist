<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmpPosition extends Model
{
    protected $table = 'emp_position';
    protected $connection = 'masterlist';
    public $timestamps = false;

    protected $fillable = [
        'emp_position_name',

    ];
}
