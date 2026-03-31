<?php

namespace App\Http\Controllers;

use App\Services\AuthService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AuthController extends Controller
{
    protected $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    public function login(Request $request)
    {
        $this->purgeOverstayingTokens();

        $credentials = $request->validate([
            'employeeID' => ['required'],
            'password'   => ['required'],
        ]);

        $redirectUrl = $request->input('redirect') ?? $request->query('redirect');

        // 🚀 SERVICE CALL
        $result = $this->authService->login($credentials, $redirectUrl);

        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'message' => $result['message'],
            ], 401);
        }

        $emp_data = $result['data'];

        // 💾 Save session
        DB::connection('authify')
            ->table('authify_sessions')
            ->insert($emp_data);

        // 🍪 Internal login
        if (!$redirectUrl) {
            $cookie = cookie('authify_token', $emp_data['token'], 60 * 24 * 7);

            return response()->json([
                'success'      => true,
                'redirect_url' => route('authify.home'),
            ])->withCookie($cookie);
        }

        // 🌐 External redirect
        $separator  = str_contains($redirectUrl, '?') ? '&' : '?';
        $redirectTo = $redirectUrl . $separator . 'key=' . $emp_data['token'];

        return response()->json([
            'success'      => true,
            'redirect_url' => $redirectTo,
        ]);
    }

    public function loginForm(Request $request)
    {
        return Inertia::render('Login', [
            'redirectUrl' => $request->query('redirect'),
        ]);
    }

    public function validate(Request $request)
    {
        $token = $request->query('token');

        $record = DB::connection('authify')
            ->table('authify_sessions')
            ->where('token', $token)
            ->first();

        if (!$record) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid Token',
            ]);
        }

        return response()->json([
            'status' => 'success',
            'data' => $record,
        ]);
    }

    public function logout(Request $request)
    {
        $token = $request->query('token');

        DB::connection('authify')
            ->table('authify_sessions')
            ->where('token', $token)
            ->delete();

        session()->flush();

        return redirect()->route('sso.login');
    }

    protected function purgeOverstayingTokens()
    {
        DB::connection('authify')
            ->table('authify_sessions')
            ->where('generated_at', '<', now()->subHours(12))
            ->delete();
    }
}
