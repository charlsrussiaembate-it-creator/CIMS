import { useState } from "react";
import type { FormEvent } from "react";
import { api } from "../api";

interface LoginPageProps {
  onLogin: (role: "admin" | "staff") => void;
}

const demoAccounts = {
  "admin@demo.com": { password: "admin123", role: "admin" as const },
  "staff@demo.com": { password: "staff123", role: "staff" as const },
};

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState(
    () => localStorage.getItem("cims-remembered-email") ?? "",
  );
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(() =>
    Boolean(localStorage.getItem("cims-remembered-email")),
  );
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Enter your email and password to continue.");
      return;
    }

    setIsLoading(true);

    try {
      // Authenticate against backend database
      const response = await api.login(email.trim(), password);

      if (rememberMe) {
        localStorage.setItem("cims-remembered-email", email.trim());
      } else {
        localStorage.removeItem("cims-remembered-email");
      }

      onLogin(response.user.role);
    } catch (err: any) {
      // Check demo accounts as graceful fallback
      const account =
        demoAccounts[email.trim().toLowerCase() as keyof typeof demoAccounts];
      if (account && account.password === password) {
        if (rememberMe) {
          localStorage.setItem("cims-remembered-email", email.trim());
        } else {
          localStorage.removeItem("cims-remembered-email");
        }
        onLogin(account.role);
        return;
      }

      setError(err?.message || "Invalid credentials or unable to reach database.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleForgotPassword() {
    setError("");
    setNotice(
      email.trim()
        ? "Demo mode: use the password shown below to sign in."
        : "Enter your email to request a password reset.",
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f5f7] text-[#1d1d1f] lg:grid lg:grid-cols-[1.1fr_0.9fr]">
      {/* =====================================================
          LEFT — MOTION GRAPHIC
      ===================================================== */}

      <section className="relative hidden min-h-screen overflow-hidden bg-[#f5f5f7] lg:flex lg:flex-col lg:justify-between">
        {/* Soft ambient background */}
        <div className="absolute inset-0">
          <div
            className="motion-float absolute -left-48 -top-48 h-[600px] w-[600px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(0,122,255,0.10), transparent 68%)",
            }}
          />

          <div
            className="motion-float-reverse absolute -bottom-56 -right-48 h-[650px] w-[650px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(14,165,233,0.08), transparent 68%)",
            }}
          />
        </div>

        {/* Branding */}
        <div className="relative z-10 p-12">
          <div className="logo-appear flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#1d1d1f] text-sm font-semibold text-white shadow-lg">
              C
            </div>

            <span className="text-sm font-semibold tracking-[0.18em] text-[#1d1d1f]">
              CIMS
            </span>
          </div>
        </div>

        {/* =================================================
            FLOATING BOX 3D MOTION GRAPHIC
        ================================================= */}

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="floating-scene relative h-[440px] w-[440px] flex items-center justify-center">
            {/* Ambient Shadow Plane */}
            <div className="floating-shadow" />

            {/* Orbiting dashed track */}
            <div className="floating-orbit-track" />

            {/* Main Hero Floating Box */}
            <div className="floating-box-main">
              <div className="floating-box-inner">
                <div className="floating-box-glass">
                  <div className="floating-box-logo">
                    <span>C</span>
                  </div>
                  <div className="floating-box-shine" />
                </div>
              </div>
            </div>

            {/* Satellite Floating Box 1 (Top Right) */}
            <div className="floating-satellite-1">
              <div className="floating-mini-box bg-white/90 shadow-[0_12px_32px_rgba(0,0,0,0.08)] border border-black/[0.04] p-3 rounded-2xl flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#0071e3]/10 flex items-center justify-center text-[#0071e3] text-xs font-bold">
                  🖥
                </div>
                <div className="text-left pr-1">
                  <div className="text-[11px] font-semibold text-[#1d1d1f]">Inventory</div>
                  <div className="text-[9px] text-[#86868b]">All Systems Ready</div>
                </div>
              </div>
            </div>

            {/* Satellite Floating Box 2 (Bottom Left) */}
            <div className="floating-satellite-2">
              <div className="floating-mini-box bg-white/90 shadow-[0_12px_32px_rgba(0,0,0,0.08)] border border-black/[0.04] p-3 rounded-2xl flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 text-xs font-bold">
                  ✓
                </div>
                <div className="text-left pr-1">
                  <div className="text-[11px] font-semibold text-[#1d1d1f]">Status</div>
                  <div className="text-[9px] text-[#86868b]">Active · Verified</div>
                </div>
              </div>
            </div>

            {/* Satellite Floating Box 3 (Top Left depth) */}
            <div className="floating-satellite-3">
              <div className="w-10 h-10 rounded-2xl bg-white/70 backdrop-blur-md shadow-md border border-black/[0.04] flex items-center justify-center text-sm">
                ⚡
              </div>
            </div>

            {/* Satellite Floating Box 4 (Bottom Right depth) */}
            <div className="floating-satellite-4">
              <div className="w-8 h-8 rounded-xl bg-[#0071e3]/15 backdrop-blur-md border border-[#0071e3]/20 flex items-center justify-center text-xs text-[#0071e3]">
                🔧
              </div>
            </div>

            {/* Kinetic Floating Accent Dots */}
            <span className="floating-particle particle-1" />
            <span className="floating-particle particle-2" />
            <span className="floating-particle particle-3" />
            <span className="floating-particle particle-4" />
          </div>
        </div>

        {/* Bottom description */}
        <div className="relative z-10 p-12">
          <div className="content-appear max-w-md">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-[#86868b]">
              Computer Inventory & Maintenance
            </p>

            <h1 className="text-4xl font-semibold leading-[1.08] tracking-[-0.035em] text-[#1d1d1f] xl:text-5xl">
              Keep every computer ready.
            </h1>

            <p className="mt-5 max-w-sm text-[15px] leading-7 text-[#6e6e73]">
              A simple way to monitor inventory, reported problems, and
              maintenance across your computer laboratories.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          RIGHT — LOGIN
      ===================================================== */}

      <section className="flex min-h-screen items-center justify-center px-6 py-12 sm:px-10 lg:bg-white">
        <div className="content-appear w-full max-w-[390px]">
          {/* Mobile logo */}
          <div className="mb-12 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#1d1d1f] text-sm font-semibold text-white">
                C
              </div>

              <span className="text-sm font-semibold tracking-[0.18em] text-[#1d1d1f]">
                CIMS
              </span>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-9">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-[#86868b]">
              Secure access
            </p>

            <h2 className="text-[32px] font-semibold tracking-[-0.035em] text-[#1d1d1f]">
              Welcome back.
            </h2>

            <p className="mt-2 text-[15px] leading-6 text-[#6e6e73]">
              Sign in to manage your laboratory workspace.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <label className="block">
              <span className="mb-2 block text-[13px] font-medium text-[#6e6e73]">
                Email address
              </span>

              <input
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError("");
                }}
                placeholder="you@school.edu"
                autoComplete="email"
                className="
                  w-full
                  rounded-[12px]
                  border
                  border-[#d2d2d7]
                  bg-[#f5f5f7]
                  px-4
                  py-3.5
                  text-[15px]
                  text-[#1d1d1f]
                  outline-none
                  transition-all
                  placeholder:text-[#86868b]
                  focus:border-[#0071e3]
                  focus:bg-white
                  focus:ring-4
                  focus:ring-[#0071e3]/10
                "
              />
            </label>

            {/* Password */}
            <label className="block">
              <span className="mb-2 block text-[13px] font-medium text-[#6e6e73]">
                Password
              </span>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError("");
                    setNotice("");
                  }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="
                    w-full
                    rounded-[12px]
                    border
                    border-[#d2d2d7]
                    bg-[#f5f5f7]
                    px-4
                    py-3.5
                    pr-20
                    text-[15px]
                    text-[#1d1d1f]
                    outline-none
                    transition-all
                    placeholder:text-[#86868b]
                    focus:border-[#0071e3]
                    focus:bg-white
                    focus:ring-4
                    focus:ring-[#0071e3]/10
                  "
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="
                    absolute
                    inset-y-0
                    right-4
                    text-[13px]
                    font-medium
                    text-[#0071e3]
                    transition-opacity
                    hover:opacity-70
                  "
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between gap-4">
              <label className="flex items-center gap-2 text-[13px] text-[#6e6e73]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="h-4 w-4 accent-[#0071e3]"
                />
                Remember me
              </label>

              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-[13px] font-medium text-[#0071e3] transition-opacity hover:opacity-70"
              >
                Forgot password?
              </button>
            </div>

            {/* Error */}
            {error && (
              <p
                className="rounded-xl bg-red-500/[0.07] px-4 py-3 text-[13px] text-red-600"
                role="alert"
              >
                {error}
              </p>
            )}

            {/* Notice */}
            {notice && (
              <p
                className="rounded-xl bg-blue-500/[0.07] px-4 py-3 text-[13px] text-[#0071e3]"
                role="status"
              >
                {notice}
              </p>
            )}

            {/* Sign in */}
            <button
              type="submit"
              disabled={isLoading}
              className="
                w-full
                rounded-[12px]
                bg-[#0071e3]
                px-4
                py-3.5
                text-[15px]
                font-medium
                text-white
                shadow-[0_6px_18px_rgba(0,113,227,0.18)]
                transition-all
                duration-200
                hover:bg-[#0077ed]
                hover:shadow-[0_8px_24px_rgba(0,113,227,0.23)]
                active:scale-[0.99]
                disabled:opacity-60
                disabled:cursor-not-allowed
                focus:outline-none
                focus:ring-4
                focus:ring-[#0071e3]/20
                flex
                items-center
                justify-center
                gap-2
              "
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>Connecting to Database...</span>
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-8 border-t border-[#d2d2d7]/70 pt-5">
            <p className="mb-3 text-center text-[11px] font-medium uppercase tracking-[0.14em] text-[#86868b]">
              Demo accounts
            </p>

            <p className="text-center text-[12px] text-[#86868b]">
              Admin:{" "}
              <span className="font-mono text-[#6e6e73]">
                admin@demo.com / admin123
              </span>
            </p>

            <p className="mt-1 text-center text-[12px] text-[#86868b]">
              Staff:{" "}
              <span className="font-mono text-[#6e6e73]">
                staff@demo.com / staff123
              </span>
            </p>
          </div>

          <p className="mt-8 text-center text-[11px] text-[#aeaeb2]">
            Computer Inventory & Maintenance System
          </p>
        </div>
      </section>
    </main>
  );
}
