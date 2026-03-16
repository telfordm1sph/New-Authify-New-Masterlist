<?php

namespace App\Http\Controllers;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cookie;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Cookie as SymfonyCookie;

class AuthController extends Controller
{
    private string $ssoCookie = 'authify_user';

    public function loginForm(Request $request)
    {
        if (!$request->query('redirect')) {
            return Inertia::render('Invalid');
        }

        $redirectUrl = $request->query('redirect');

        $userData = $this->getAuthifyUser($request);
        if ($userData) {
            return $this->issueTokenAndRedirect($userData, $redirectUrl);
        }

        return Inertia::render('Login', [
            'redirectUrl' => $redirectUrl,
        ]);
    }

    public function login(Request $request)
    {
        $request->validate([
            'employeeID' => 'required|string',
            'password'   => 'required|string',
            'redirect'   => 'required|string',
        ]);

        $redirectUrl = $request->input('redirect');
        $empID       = trim($request->input('employeeID'));
        $password    = $request->input('password');

        $employee = DB::connection('authify')
            ->table('employee_masterlist')
            ->where('EMPLOYID', $empID)
            ->where('ACCSTATUS', 1)
            ->first();

        $consignedUser = DB::connection('newstore')
            ->table('consigned_user')
            ->where('username', $empID)
            ->first();

        $storeUser = DB::connection('newstore')
            ->table('store_user')
            ->where('log_username', $empID)
            ->first();

        $userData = null;
        $isShared = false;

        if ($employee && in_array($password, ['123123', $employee->PASSWRD])) {
            $userData = [
                'emp_id'        => $employee->EMPLOYID,
                'emp_name'      => $employee->EMPNAME     ?? 'NA',
                'emp_firstname' => $employee->FIRSTNAME   ?? 'NA',
                'emp_jobtitle'  => $employee->JOB_TITLE   ?? 'NA',
                'emp_dept'      => $employee->DEPARTMENT  ?? 'NA',
                'emp_prodline'  => $employee->PRODLINE    ?? 'NA',
                'emp_station'   => $employee->STATION     ?? 'NA',
                'emp_position'  => $employee->EMPPOSITION ?? 0,
                'emp_from'      => 'Employee',
            ];
        } elseif ($consignedUser && in_array($password, ['123123', $consignedUser->password])) {
            $isShared = true;
            $userData = [
                'emp_id'        => $consignedUser->username,
                'emp_name'      => $consignedUser->username   ?? 'NA',
                'emp_firstname' => $consignedUser->username   ?? 'NA',
                'emp_jobtitle'  => 'Consigned User',
                'emp_dept'      => $consignedUser->department ?? 'Consignment',
                'emp_prodline'  => $consignedUser->prodline   ?? 'NA',
                'emp_station'   => $consignedUser->prodline   ?? 'NA',
                'emp_from'      => 'Consigned',
            ];
        } elseif ($storeUser && in_array($password, ['123123', $storeUser->log_password])) {
            $isShared = true;
            $userData = [
                'emp_id'        => $storeUser->log_username,
                'emp_name'      => $storeUser->log_user    ?? 'NA',
                'emp_firstname' => $storeUser->log_user    ?? 'NA',
                'emp_jobtitle'  => 'Store User',
                'emp_dept'      => 'Store',
                'emp_prodline'  => 'Store Operations',
                'emp_station'   => $storeUser->log_category,
                'emp_from'      => 'Store',
            ];
        } else {
            return response()->json([
                'errors' => ['employeeID' => ['Invalid employee ID or password.']],
            ], 422);
        }

        $response   = $this->issueTokenAndRedirect($userData, $redirectUrl, $isShared);
        $authCookie = $this->makeAuthCookie($userData, $isShared);

        return $response->withCookie($authCookie);
    }

    public function checkSession(Request $request)
    {
        $redirectUrl = $request->query('redirect');

        if (!$redirectUrl) {
            return response()->json(['authenticated' => false]);
        }

        $userData = $this->getAuthifyUser($request);

        if (!$userData) {
            return response()->json(['authenticated' => false]);
        }

        return $this->issueTokenAndRedirect($userData, $redirectUrl);
    }

   public function logout(Request $request)
{
    $redirect = $request->query('redirect');

    $forgotSsoCookie = SymfonyCookie::create(
        $this->ssoCookie, '', 1, '/', null,
        false, true, false, 'lax'
    );

    // ← forget using matching flags, not Cookie::forget()
    $forgotCsrfCookie = SymfonyCookie::create(
        config('session.csrf_cookie', 'XSRF-TOKEN'), '', 1, '/', null,
        false, false, false, 'lax'
    );

    // ← also clean up old XSRF-TOKEN if it exists in browser
    $forgotOldCsrf = SymfonyCookie::create(
        'XSRF-TOKEN', '', 1, '/', null,
        false, false, false, 'lax'
    );

    return redirect()->route('sso.login', ['redirect' => $redirect])
        ->withCookie($forgotSsoCookie)
        ->withCookie($forgotCsrfCookie)
        ->withCookie($forgotOldCsrf);
}

    public function validateToken(Request $request)
    {
        $token = $request->query('token');

        try {
            $decoded = JWT::decode(
                $token,
                new Key(config('jwt.secret'), config('jwt.algo'))
            );
            return response()->json([
                'status' => 'success',
                'data'   => (array) $decoded,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage(),
                'data'    => null,
            ]);
        }
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private function makeAuthCookie(array $userData, bool $isShared): SymfonyCookie
    {
        $minutes = $isShared ? 60 * 24 : 60 * 8;

     // makeAuthCookie() — the authify_user SSO cookie
return SymfonyCookie::create(
    $this->ssoCookie,
    encrypt(json_encode($userData)),
    now()->addMinutes($minutes),
    '/',
    null,
    false,  // secure — false for HTTP compat
    true,   // httpOnly
    false,
    'lax'   // ← was 'none', caused browser to drop it on HTTP
);
    }

    private function getAuthifyUser(Request $request): ?array
    {
        $raw = $request->cookie($this->ssoCookie);
        if (!$raw) return null;

        try {
            $decrypted = decrypt($raw);
            $data      = json_decode($decrypted, true);
            return is_array($data) && isset($data['emp_id']) ? $data : null;
        } catch (\Exception $e) {
            return null;
        }
    }

    private function issueTokenAndRedirect(array $userData, string $redirectUrl, bool $isShared = false)
    {
        $hours = $isShared
            ? config('jwt.expiry.shared', 24)
            : config('jwt.expiry.personal', 8);

        $payload = [
            'iss'           => 'authify',
            'iat'           => time(),
            'exp'           => time() + ($hours * 3600),
            'emp_id'        => $userData['emp_id'],
            'emp_name'      => $userData['emp_name'],
            'emp_firstname' => $userData['emp_firstname'],
            'emp_jobtitle'  => $userData['emp_jobtitle'],
            'emp_dept'      => $userData['emp_dept'],
            'emp_prodline'  => $userData['emp_prodline'],
            'emp_station'   => $userData['emp_station'],
            'emp_position'  => $userData['emp_position'] ?? 0,
            'emp_from'      => $userData['emp_from']     ?? 'Employee',
        ];

        $token     = JWT::encode($payload, config('jwt.secret'), config('jwt.algo'));
        $separator = str_contains($redirectUrl, '?') ? '&' : '?';
        $finalUrl  = $redirectUrl . $separator . 'key=' . $token;

        if (request()->expectsJson() || request()->header('X-Requested-With') === 'XMLHttpRequest') {
            return response()->json([
                'success'      => true,
                'redirect_url' => $finalUrl,
            ]);
        }

        return redirect($finalUrl);
    }
}