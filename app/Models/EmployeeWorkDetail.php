<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmployeeWorkDetail extends Model
{
    protected $table = 'employee_work_details';
    protected $connection = 'masterlist';
    public $timestamps = false;

    protected $fillable = [
        'employid',
        'company',
        'department',
        'prodline',
        'job_title',
        'station',
        'team',
        'empstatus',
        'empclass',
        'shift_type',
        'shuttle',
        'date_hired',
        'date_reg',
        'service_length',
    ];

    // 👇 Employee basic info (if you need it)
    public function employee()
    {
        return $this->belongsTo(EmployeeDetail::class, 'employid', 'employid');
    }

    // =========================
    // LOOKUP RELATIONSHIPS
    // =========================


    public function departmentRel()
    {
        return $this->belongsTo(EmpDepartment::class, 'department');
    }
    public function empPositionRel()
    {
        return $this->belongsTo(EmpPosition::class, 'empposition');
    }
    public function jobTitleRel()
    {
        return $this->belongsTo(JobTitle::class, 'job_title');
    }

    public function prodLineRel()
    {
        return $this->belongsTo(ProdLine::class, 'prodline');
    }

    public function stationRel()
    {
        return $this->belongsTo(Station::class, 'station');
    }
}
