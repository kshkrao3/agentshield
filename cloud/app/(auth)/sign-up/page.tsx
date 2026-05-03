"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { AuthPanel } from "@/components/auth-panel";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ghLoading, setGhLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await authClient.signUp.email({ name, email, password });
    setLoading(false);
    if (error) { setError(error.message ?? "Sign up failed"); return; }
    router.push("/onboarding");
  }

  async function handleGitHub() {
    setGhLoading(true);
    await authClient.signIn.social({ provider: "github", callbackURL: "/onboarding" });
  }

  return (
    <main className="min-h-screen grid lg:grid-cols-2">
      <AuthPanel />

      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Get started free</h1>
            <p className="text-muted-foreground text-sm mt-1">
              10K events/month · No credit card required
            </p>
          </div>

          <button
            onClick={handleGitHub}
            disabled={ghLoading}
            className="w-full h-11 rounded-lg bg-[#24292e] text-white font-medium flex items-center justify-center gap-3 hover:bg-[#1a1f24] disabled:opacity-60 transition-colors mb-6"
          >
            <GitHubIcon />
            {ghLoading ? "Redirecting…" : "Continue with GitHub"}
          </button>

          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-6">
            <div className="flex-1 border-t" />OR<div className="flex-1 border-t" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Name</label>
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Password</label>
              <input
                type="password"
                placeholder="8+ characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                className="w-full h-10 px-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                required
              />
            </div>
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50 transition-opacity text-sm"
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-sm text-center text-muted-foreground">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-foreground font-medium hover:underline">
              Sign in
            </Link>
          </p>

          <p className="mt-4 text-xs text-center text-muted-foreground">
            By signing up you agree to our Terms &amp; Privacy Policy.
          </p>
        </div>
      </div>
    </main>
  );
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z" />
    </svg>
  );
}
