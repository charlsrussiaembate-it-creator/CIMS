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
        ? "Please contact your system administrator to reset your account password."
        : "Enter your email address to request password assistance.",
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] flex flex-col relative">
      {/* =====================================================
          1. CLEAN STICKY HEADER (76px height, normal document flow)
      ===================================================== */}
      <header className="sticky top-0 z-30 w-full h-[76px] px-6 sm:px-12 lg:px-16 bg-[#f5f5f7]/95 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#1d1d1f] text-sm font-semibold text-white shadow-sm">
            CI
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-[#1d1d1f]">
              CIMS
            </span>
            <span className="block text-[11px] text-[#86868b] -mt-0.5">
              St. Rita's College
            </span>
          </div>
        </div>
      </header>

      {/* =====================================================
          2. MAIN TWO-COLUMN CONTENT (min-height: calc(100vh - 76px))
      ===================================================== */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-[calc(100vh-76px)]">
        {/* =====================================================
            LEFT ~58% — CIMS HERO & 3D ILLUSTRATION
        ===================================================== */}
        <section className="relative flex-1 lg:w-[58%] flex flex-col justify-between p-6 sm:p-10 lg:p-14 pb-14 lg:pb-16">
          {/* Ambient background container with overflow-hidden ONLY on blur circles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div
              className="motion-float absolute -left-36 -top-36 h-[600px] w-[600px] rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(0, 113, 227, 0.08), transparent 70%)",
              }}
            />
            <div
              className="motion-float-reverse absolute -bottom-44 right-0 h-[650px] w-[650px] rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(14, 165, 233, 0.07), transparent 70%)",
              }}
            />
          </div>

          {/* 3D Floating Illustration */}
          <div className="relative z-10 flex-1 flex items-center justify-center py-4 sm:py-6">
            <div className="floating-scene relative h-[320px] w-[320px] sm:h-[380px] sm:w-[380px] lg:h-[400px] lg:w-[400px] flex items-center justify-center">
              <div className="floating-shadow" />

              {/* Main Hero Floating Box */}
              <div className="floating-box-main">
                <div className="floating-box-inner">
                  <div className="floating-box-glass">
                    <div className="floating-box-logo">
                      <span>CI</span>
                    </div>
                    <div className="floating-box-shine" />
                  </div>
                </div>
              </div>

              {/* Satellite Box 1 */}
              <div className="floating-satellite-1">
                <div className="floating-mini-box bg-white/95 shadow-[0_10px_25px_rgba(0,0,0,0.05)] p-3 rounded-2xl flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#0071e3]/10 flex items-center justify-center text-[#0071e3] text-xs font-bold">
                    🖥
                  </div>
                  <div className="text-left pr-1">
                    <div className="text-[11px] font-semibold text-[#1d1d1f]">Inventory</div>
                    <div className="text-[9px] text-[#86868b]">All Systems Ready</div>
                  </div>
                </div>
              </div>

              {/* Satellite Box 2 */}
              <div className="floating-satellite-2">
                <div className="floating-mini-box bg-white/95 shadow-[0_10px_25px_rgba(0,0,0,0.05)] p-3 rounded-2xl flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 text-xs font-bold">
                    ✓
                  </div>
                  <div className="text-left pr-1">
                    <div className="text-[11px] font-semibold text-[#1d1d1f]">Maintenance</div>
                    <div className="text-[9px] text-[#86868b]">Active · Verified</div>
                  </div>
                </div>
              </div>

              {/* Satellite Box 3 */}
              <div className="floating-satellite-3">
                <div className="w-10 h-10 rounded-2xl bg-white/85 shadow-sm flex items-center justify-center text-sm">
                  ⚡
                </div>
              </div>

              {/* Satellite Box 4 */}
              <div className="floating-satellite-4">
                <div className="w-8 h-8 rounded-xl bg-[#0071e3]/15 flex items-center justify-center text-xs text-[#0071e3]">
                  🔧
                </div>
              </div>

              <span className="floating-particle particle-1" />
              <span className="floating-particle particle-2" />
              <span className="floating-particle particle-3" />
              <span className="floating-particle particle-4" />
            </div>
          </div>

          {/* Hero Copy & Typography (Fully visible, not clipped) */}
          <div className="relative z-10 max-w-xl mx-auto lg:mx-0 pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#0071e3]">
              Computer Inventory & Maintenance
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-semibold leading-[1.15] tracking-[-0.035em] text-[#1d1d1f]">
              Keep every computer ready.
            </h1>
            <p className="mt-3 text-sm sm:text-[15px] leading-relaxed text-[#6e6e73]">
              A unified management platform for tracking computer lab inventory, reporting hardware issues, scheduling maintenance, and auditing system events.
            </p>
          </div>
        </section>

        {/* =====================================================
            RIGHT ~42% — INTEGRATED AUTHENTICATION SIDEBAR (STICKY)
        ===================================================== */}
        <section className="lg:w-[42%] lg:sticky lg:top-[76px] lg:self-start lg:h-[calc(100vh-76px)] bg-[#f0f2f5]/50 lg:bg-[#f0f2f5]/60 flex flex-col justify-between p-6 sm:p-10 lg:p-12 pb-10 sm:pb-12 relative overflow-y-auto">
          {/* Form container: Starts in the upper-middle area with ~15-20% top breathing room */}
          <div className="w-full max-w-[420px] mx-auto pt-4 sm:pt-8 lg:pt-10">
            {/* Header */}
            <div className="mb-7">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#86868b]">
                SECURE ACCESS
              </p>

              <h2 className="text-3xl font-semibold tracking-[-0.035em] text-[#1d1d1f]">
                Welcome back.
              </h2>

              <p className="mt-2 text-sm text-[#6e6e73]">
                Sign in to manage your laboratory workspace.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Address */}
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
                  placeholder="admin@demo.com"
                  autoComplete="email"
                  autoFocus
                  className="
                    w-full
                    rounded-xl
                    border
                    border-[#d2d2d7]
                    bg-white
                    px-4
                    py-3.5
                    text-[15px]
                    text-[#1d1d1f]
                    outline-none
                    transition-all
                    placeholder:text-[#86868b]
                    focus:border-[#0071e3]
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
                      rounded-xl
                      border
                      border-[#d2d2d7]
                      bg-white
                      px-4
                      py-3.5
                      pr-20
                      text-[15px]
                      text-[#1d1d1f]
                      outline-none
                      transition-all
                      placeholder:text-[#86868b]
                      focus:border-[#0071e3]
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

              {/* Remember me + Forgot password */}
              <div className="flex items-center justify-between gap-4 pt-1">
                <label className="flex items-center gap-2 text-[13px] text-[#6e6e73] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    className="h-4 w-4 rounded accent-[#0071e3]"
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

              {/* Error Message */}
              {error && (
                <div
                  className="
                    rounded-xl
                    border
                    border-[#ff3b30]/20
                    bg-[#ff3b30]/10
                    p-3.5
                    text-[13px]
                    leading-5
                    text-[#d70015]
                  "
                >
                  {error}
                </div>
              )}

              {/* Notice Message */}
              {notice && (
                <div
                  className="
                    rounded-xl
                    border
                    border-[#0071e3]/20
                    bg-[#0071e3]/10
                    p-3.5
                    text-[13px]
                    leading-5
                    text-[#0071e3]
                  "
                >
                  {notice}
                </div>
              )}

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="
                  w-full
                  rounded-xl
                  bg-[#0071e3]
                  py-3.5
                  text-[15px]
                  font-semibold
                  text-white
                  shadow-md
                  shadow-[#0071e3]/15
                  transition-all
                  hover:bg-[#0077ed]
                  active:scale-[0.99]
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                  focus:outline-none
                  focus:ring-4
                  focus:ring-[#0071e3]/20
                  flex
                  items-center
                  justify-center
                  gap-2
                  mt-3
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

            {/* Footer note directly under form */}
            <p className="mt-6 text-center text-[11px] text-[#86868b]">
              Computer Inventory & Maintenance System · St. Rita's College
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
