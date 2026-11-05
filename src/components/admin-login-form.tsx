"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") })
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not sign in.");
      router.push("/admin");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="login-wrap"><form className="login-card" onSubmit={submit}>
    <Link className="brand" href="/"><span className="brand-mark">✿</span> Little Paws</Link>
    <h1 style={{ marginTop: 28 }}>Welcome back</h1>
    <p>Sign in to manage breed profiles, dog listings, and customer inquiries.</p>
    <div className="field"><label htmlFor="admin-email">Administrator email</label><input id="admin-email" name="email" type="email" autoComplete="username" required maxLength={254} /></div>
    <div className="field"><label htmlFor="admin-password">Password</label><input id="admin-password" name="password" type="password" autoComplete="current-password" required maxLength={200} /></div>
    {error && <p className="status-message error" role="alert">{error}</p>}
    <button className="button" type="submit" disabled={busy} style={{ width: "100%", marginTop: 8 }}>{busy ? "Signing in…" : "Sign in"}</button>
    <p className="muted-note" style={{ marginTop: 20 }}>Admin access is configured through the server environment and database.</p>
    <Link className="text-link" href="/" style={{ display: "inline-block", marginTop: 12 }}>← Back to the website</Link>
  </form></main>;
}
