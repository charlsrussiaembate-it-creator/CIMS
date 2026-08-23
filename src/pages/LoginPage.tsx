import { useState } from "react";
import type { FormEvent } from "react";

interface LoginPageProps {
  onLogin: (role: "admin" | "staff") => void;
}

const demoAccounts = {
  "admin@demo.com": { password: "admin123", role: "admin" as const },
  "staff@demo.com": { password: "staff123", role: "staff" as const },
};

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError("Enter your email and password to continue.");
      return;
    }

    const account = demoAccounts[email.trim().toLowerCase() as keyof typeof demoAccounts];

    if (!account || account.password !== password) {
      setError("Use one of the demo accounts shown below.");
      return;
    }

    onLogin(account.role);
  }

  return (
    <main className="min-h-full bg-[#0b1120] text-white lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden border-r border-white/10 bg-[#10233b] lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full border-[36px] border-[#0ea5e9]/15" />
        <div className="absolute -bottom-28 -left-20 h-72 w-72 rounded-full border-[48px] border-[#f59e0b]/10" />
        <div className="relative">
          <div className="mb-16 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0ea5e9] text-lg font-bold text-[#07111e]">C</div>
            <span className="text-sm font-semibold tracking-[0.18em] text-white/90">CIMS</span>
          </div>
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.22em] text-[#38bdf8]">Laboratory operations</p>
          <h1 className="max-w-lg text-5xl font-semibold leading-[1.05] tracking-tight text-white xl:text-6xl">
            Keep every computer ready.
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-[#9db0c6]">
            A clear view of inventory, reported problems, and maintenance work for your computer laboratories.
          </p>
        </div>
        <div className="relative flex items-center gap-3 text-xs text-[#7890aa]">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.12)]" />
          System ready
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0ea5e9] text-lg font-bold text-[#07111e]">C</div>
              <span className="text-sm font-semibold tracking-[0.18em] text-white/90">CIMS</span>
            </div>
          </div>

          <div className="mb-8">
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-[#38bdf8]">Secure access</p>
            <h2 className="text-3xl font-semibold tracking-tight text-white">Welcome back</h2>
            <p className="mt-2 text-sm text-[#8193aa]">Sign in to manage your laboratory workspace.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-[#9db0c6]">Email address</span>
              <input
                type="email"
                value={email}
                onChange={event => { setEmail(event.target.value); setError(""); }}
                placeholder="you@school.edu"
                autoComplete="email"
                className="w-full rounded-lg border border-[#30445d] bg-[#111c2d] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-[#52657d] focus:border-[#0ea5e9] focus:ring-2 focus:ring-[#0ea5e9]/20"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-[#9db0c6]">Password</span>
              <input
                type="password"
                value={password}
                onChange={event => { setPassword(event.target.value); setError(""); }}
                placeholder="Enter your password"
                autoComplete="current-password"
                className="w-full rounded-lg border border-[#30445d] bg-[#111c2d] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-[#52657d] focus:border-[#0ea5e9] focus:ring-2 focus:ring-[#0ea5e9]/20"
              />
            </label>

            {error && <p className="text-sm text-rose-400" role="alert">{error}</p>}

            <button type="submit" className="w-full rounded-lg bg-[#0ea5e9] px-4 py-3 text-sm font-semibold text-[#07111e] transition-colors hover:bg-[#38bdf8] focus:outline-none focus:ring-2 focus:ring-[#38bdf8] focus:ring-offset-2 focus:ring-offset-[#0b1120]">
              Sign in
            </button>
          </form>

          <p className="mt-8 border-t border-white/10 pt-5 text-center text-xs text-[#647891]">
            Demo admin: <span className="font-mono text-[#91a6bd]">admin@demo.com / admin123</span>
            <br />
            Demo staff: <span className="font-mono text-[#91a6bd]">staff@demo.com / staff123</span>
          </p>
        </div>
      </section>
    </main>
  );
}
