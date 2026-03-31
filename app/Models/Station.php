<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Station extends Model
{
    protected $table = 'stations';
    protected $connection = 'masterlist';
    public $timestamps = false;

    protected $fillable = [
        'station_name',
    ];
}
