import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Logo } from "../components/Logo";

export default function LoginPage() {
  const { user, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch {
      setError("Email or password is incorrect.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    /*
      Removed: min-h-screen + place-items-center (grid centering)
      These cause the form to be vertically locked in the visible viewport.
      When the mobile keyboard opens and shrinks the viewport, the focused
      input disappears behind it with no way to scroll.

      Fix: use a plain scrollable column layout with generous top/bottom
      padding instead. The browser then naturally scrolls the focused input
      above the keyboard — which is how every mobile-friendly form works.
    */
    <div className="flex min-h-screen flex-col items-center bg-paper px-4 py-12">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-4">
          <div className="flex items-center justify-center rounded-2xl bg-ink px-8 py-6">
            <Logo size="lg" />
          </div>
          <p className="text-sm text-ink-soft">Raw materials &amp; inventory</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-line bg-surface p-6 shadow-sm"
        >
          <label className="block text-sm font-medium text-ink-soft" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            /*
              fontSize 16px is critical on iOS — anything smaller causes
              Safari to auto-zoom the page when an input is focused, which
              breaks the layout. Tailwind's text-base is exactly 16px.
            */
            className="mt-1.5 w-full rounded-lg border border-line bg-paper px-3 py-2 text-base text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/25"
          />

          <label className="mt-4 block text-sm font-medium text-ink-soft" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-line bg-paper px-3 py-2 text-base text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/25"
          />

          {error && (
            <p className="mt-3 rounded-lg bg-alert-soft px-3 py-2 text-sm text-alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-5 w-full rounded-lg py-2.5 font-medium text-paper transition disabled:opacity-60"
            style={{ backgroundColor: "#1D4ED8" }}
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {/* Bottom padding so the form is never flush against the keyboard */}
        <div className="h-16" />
      </div>
    </div>
  );
}
