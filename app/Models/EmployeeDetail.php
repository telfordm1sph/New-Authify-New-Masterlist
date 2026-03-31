<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmployeeDetail extends Model
{
    protected $table = 'employee_details';
    protected $connection = 'masterlist';
    protected $primaryKey = 'employid';
    public $timestamps = false;

    protected $fillable = [
        'employid',
        'firstname',
        'middlename',
        'lastname',
        'nickname',
        'birthday',
        'emp_sex',
        'email',
        'contact_no',
        'civil_status',
        'educational_attainment',
        'accstatus',
        'biometric_status',
        'created_at',
    ];

    public function auth()
    {
        return $this->hasOne(EmployeeAuth::class, 'employid', 'employid');
    }
}
