import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Eye,
    EyeOff,
    ShieldCheck,
    ArrowRight,
    Fingerprint,
    Lock,
    Zap,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

function getAppInfo(redirectUrl) {
    const fallback = { name: "Internal Portal", domain: "" };
    if (!redirectUrl) return fallback;
    try {
        const raw = /^https?:\/\//i.test(redirectUrl)
            ? redirectUrl
            : `https://${redirectUrl}`;
        const url = new URL(raw);
        const host = url.hostname;
        const port = url.port ? `:${url.port}` : "";
        const domain = `${host}${port}`;
        const pathSegment = url.pathname.split("/").filter(Boolean)[0] ?? "";
        const label = pathSegment || host.split(".")[0];
        const name =
            label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
        return { name, domain };
    } catch {
        return fallback;
    }
}

function MeshBackground() {
    return (
        <>
            <div className="absolute inset-0 dark:hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-200/60 blur-[100px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-200/50 blur-[100px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-sky-100/80 blur-[80px]" />
            </div>
            <div className="absolute inset-0 hidden dark:block">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-900/40 blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-900/30 blur-[120px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-slate-800/60 blur-[80px]" />
            </div>
            <svg
                className="absolute inset-0 w-full h-full opacity-[0.035] dark:opacity-[0.06]"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <pattern
                        id="dots"
                        width="24"
                        height="24"
                        patternUnits="userSpaceOnUse"
                    >
                        <circle cx="1.5" cy="1.5" r="1.5" fill="currentColor" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#dots)" />
            </svg>
        </>
    );
}

function Pill({ icon: Icon, label }) {
    return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/30 dark:bg-white/5 border border-white/50 dark:border-white/10 backdrop-blur-sm text-slate-700 dark:text-slate-300 text-xs font-medium shadow-sm">
            <Icon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            {label}
        </div>
    );
}

export default function Login({ redirectUrl }) {
    const [showPassword, setShowPassword] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});
    const [mounted, setMounted] = useState(false);
    const pollRef = useRef(null);

    const [data, setData] = useState({
        employeeID: "",
        password: "",
        redirect: redirectUrl,
    });

    useEffect(() => {
        setMounted(true);
    }, []);

    // Poll /check-session every 2s — if another tab already logged in,
    // this tab will get a JWT silently without re-entering credentials
    useEffect(() => {
        pollRef.current = setInterval(async () => {
            try {
                const res = await axios.get(
                    `/check-session?redirect=${encodeURIComponent(redirectUrl)}`,
                );
                if (res.data?.success && res.data?.redirect_url) {
                    clearInterval(pollRef.current);
                    window.location.href = res.data.redirect_url;
                }
            } catch (_) {
                // not authenticated yet — keep polling
            }
        }, 2000);

        return () => clearInterval(pollRef.current);
    }, [redirectUrl]);

    function handleChange(field, value) {
        setData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        try {
            const response = await axios.post(route("sso.login.post"), data, {
                validateStatus: (status) => status < 500,
            });

            if (response.data?.success && response.data?.redirect_url) {
                clearInterval(pollRef.current);
                window.location.href = response.data.redirect_url;
                return;
            }

            if (response.status === 422) {
                const validationErrors = response.data?.errors ?? {};
                setErrors(validationErrors);
                const firstError = Object.values(validationErrors)[0];
                if (firstError)
                    toast.error(
                        Array.isArray(firstError) ? firstError[0] : firstError,
                    );
            } else {
                toast.error("Login failed. Please try again.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setProcessing(false);
        }
    }

    return (
        <div className="relative min-h-screen flex bg-slate-50 dark:bg-slate-950 overflow-hidden">
            <MeshBackground />

            {/* LEFT — branding panel */}
            <div
                className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-14"
                style={{
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? "translateX(0)" : "translateX(-20px)",
                    transition: "all 0.7s cubic-bezier(0.22, 1, 0.36, 1)",
                }}
            >
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <ShieldCheck className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-semibold text-slate-800 dark:text-slate-100 tracking-tight text-sm">
                        Authify
                    </span>
                </div>

                <div className="relative">
                    <div className="relative rounded-3xl p-10 overflow-hidden bg-white/40 dark:bg-white/[0.04] border border-white/70 dark:border-white/10 shadow-2xl shadow-blue-900/10 dark:shadow-blue-900/30 backdrop-blur-xl">
                        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-50/60 via-transparent to-indigo-50/40 dark:from-blue-950/30 dark:via-transparent dark:to-indigo-950/20 pointer-events-none" />
                        <div className="relative z-10">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-8 bg-blue-100/80 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                Single Sign-On Active
                            </div>

                            <h1
                                className="text-4xl font-bold leading-tight mb-3 text-slate-900 dark:text-white"
                                style={{
                                    fontFamily:
                                        "'Georgia', 'Times New Roman', serif",
                                }}
                            >
                                One identity,
                                <br />
                                <span className="text-blue-600 dark:text-blue-400">
                                    every system.
                                </span>
                            </h1>

                            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8 max-w-xs">
                                Authify SSO lets you securely access all
                                internal systems with a single set of
                                credentials — no passwords to juggle.
                            </p>

                            <div className="flex flex-wrap gap-2">
                                <Pill
                                    icon={ShieldCheck}
                                    label="End-to-end encrypted"
                                />
                                <Pill
                                    icon={Fingerprint}
                                    label="Identity verified"
                                />
                                <Pill icon={Zap} label="Instant access" />
                            </div>
                        </div>
                    </div>
                </div>

                <p className="text-xs text-slate-400 dark:text-slate-600">
                    © {new Date().getFullYear()} Authify · Internal use only
                </p>
            </div>

            {/* Divider */}
            <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-slate-200 dark:via-slate-700/50 to-transparent self-stretch my-8" />

            {/* RIGHT — login form */}
            <div
                className="flex-1 flex items-center justify-center px-6 py-12 relative z-10"
                style={{
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? "translateX(0)" : "translateX(20px)",
                    transition: "all 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.08s",
                }}
            >
                <div className="w-full max-w-[380px]">
                    {/* Mobile logo */}
                    <div className="flex lg:hidden items-center justify-center gap-2 mb-8">
                        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                            <ShieldCheck className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                            Authify
                        </span>
                    </div>

                    <Card className="border-slate-200/80 dark:border-slate-800/80 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-xl text-slate-900 dark:text-slate-50">
                                Welcome back
                            </CardTitle>
                            <CardDescription className="text-slate-500 dark:text-slate-400">
                                Sign in with your employee credentials
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Employee ID */}
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="employeeID"
                                        className="text-slate-700 dark:text-slate-300 text-sm"
                                    >
                                        Employee ID
                                    </Label>
                                    <Input
                                        id="employeeID"
                                        type="text"
                                        placeholder="e.g. EMP-00123"
                                        value={data.employeeID}
                                        onChange={(e) =>
                                            handleChange(
                                                "employeeID",
                                                e.target.value,
                                            )
                                        }
                                        disabled={processing}
                                        autoFocus
                                        className={`h-10 text-sm bg-slate-50/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-blue-500 focus-visible:border-blue-500 transition-colors ${
                                            errors.employeeID
                                                ? "border-red-400 dark:border-red-500 focus-visible:ring-red-400"
                                                : ""
                                        }`}
                                    />
                                    {errors.employeeID && (
                                        <p className="text-xs text-red-500 dark:text-red-400">
                                            {Array.isArray(errors.employeeID)
                                                ? errors.employeeID[0]
                                                : errors.employeeID}
                                        </p>
                                    )}
                                </div>

                                {/* Password */}
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="password"
                                        className="text-slate-700 dark:text-slate-300 text-sm"
                                    >
                                        Password
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={
                                                showPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            placeholder="Enter your password"
                                            value={data.password}
                                            onChange={(e) =>
                                                handleChange(
                                                    "password",
                                                    e.target.value,
                                                )
                                            }
                                            disabled={processing}
                                            className={`h-10 pr-10 text-sm bg-slate-50/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-blue-500 focus-visible:border-blue-500 transition-colors ${
                                                errors.password
                                                    ? "border-red-400 dark:border-red-500 focus-visible:ring-red-400"
                                                    : ""
                                            }`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowPassword(!showPassword)
                                            }
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                                            tabIndex={-1}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="w-4 h-4" />
                                            ) : (
                                                <Eye className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <p className="text-xs text-red-500 dark:text-red-400">
                                            {Array.isArray(errors.password)
                                                ? errors.password[0]
                                                : errors.password}
                                        </p>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full h-10 mt-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-medium text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200"
                                >
                                    {processing ? (
                                        <span className="flex items-center gap-2">
                                            <svg
                                                className="animate-spin w-4 h-4"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                />
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                                />
                                            </svg>
                                            Signing in...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            Sign in
                                            <ArrowRight className="w-4 h-4" />
                                        </span>
                                    )}
                                </Button>
                            </form>

                            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
                                <p className="text-center text-xs text-slate-400 dark:text-slate-600">
                                    Need help?{" "}
                                    <a
                                        href="#"
                                        className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors underline underline-offset-2"
                                    >
                                        Contact IT Support
                                    </a>
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <p className="text-center text-xs text-slate-400 dark:text-slate-600 mt-4">
                        Protected by Authify SSO · Internal access only
                    </p>
                </div>
            </div>
        </div>
    );
}
