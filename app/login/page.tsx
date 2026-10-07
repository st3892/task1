"use client";

import BakeryMark from "../components/bakery-mark";

import { createClient } from "../../lib/client";

export default function LoginPage() {
  const handleGoogleLogin = async () => {
    const supabase = createClient();

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <main id="main-content" className="page-shell login-shell">
      <section className="card login-card">
        <div className="login-story">
          <span className="eyebrow">SAVE A SEAT AT THE COUNTER</span>
          <h1>A little sugar.<br />A little chaos.<br /><span>Your kind of place.</span></h1>
          <p>Cook up something funny. Taste the latest batch. Make yourself at home.</p>
          <div className="login-smile" aria-hidden="true">✳</div>
          <span className="small-note">A little humor goes a long way.</span>
        </div>
        <div className="login-form">
          <span className="brand-mark"><BakeryMark /></span>
          <h2>Welcome to Whisk Takers</h2>
          <p>Sign in to cook up jokes, join the taste test, and make this corner yours.</p>
          <button className="button google-button" onClick={handleGoogleLogin}>
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.89-1.74 2.98-4.3 2.98-7.36Z"/><path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.04.97-3.38.97-2.6 0-4.81-1.76-5.6-4.12H3.06v2.59A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.4 13.93A6 6 0 0 1 6.09 12c0-.67.11-1.32.31-1.93V7.48H3.06A10 10 0 0 0 2 12c0 1.61.38 3.14 1.06 4.52l3.34-2.59Z"/><path fill="#EA4335" d="M12 5.95c1.47 0 2.79.5 3.82 1.49l2.86-2.86A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.94 5.48l3.34 2.59C7.19 7.71 9.4 5.95 12 5.95Z"/></svg>
            Continue with Google
          </button>
          <span className="small-note">One less password to remember.</span>
        </div>
      </section>
    </main>
  );
}
