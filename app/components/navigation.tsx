"use client";

import Link from "next/link";
import BakeryMark from "./bakery-mark";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "../../lib/client";

const links = [
  { href: "/", label: "Home" },
  { href: "/secret", label: "Voting" },
  { href: "/profile", label: "Profile" },
];

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    let revision = 0;

    async function verifyUser() {
      const currentRevision = ++revision;
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (active && currentRevision === revision) {
          setAuthenticated(!error && !!user);
        }
      } catch {
        if (active && currentRevision === revision) setAuthenticated(false);
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        revision++;
        setAuthenticated(false);
        router.refresh();
      } else {
        // Verify outside the auth callback so it does not hold Supabase's auth lock.
        queueMicrotask(() => { if (active) void verifyUser(); });
      }
    });
    void verifyUser();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router]);

  async function handleSignOut() {
    setSigningOut(true);
    setAuthError(null);
    try {
      const { error } = await createClient().auth.signOut();
      if (error) {
        setAuthError("Couldn’t sign out. Please try again.");
        return;
      }
      setAuthenticated(false);
      router.refresh();
    } catch {
      setAuthError("Couldn’t sign out. Please try again.");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <header className="site-header">
      <nav className="nav-inner" aria-label="Main navigation">
        <Link href="/" className="brand">
          <span className="brand-mark"><BakeryMark /></span>
          Whisk Takers<span className="brand-dot">.</span>
        </Link>
        <div className="nav-links">
          {links.map((link) => (
            <Link key={link.href} href={link.href}
              className={pathname === link.href ? "nav-link active" : "nav-link"}
              aria-current={pathname === link.href ? "page" : undefined}>
              {link.label}
            </Link>
          ))}
        </div>
        {authenticated ? <button className="button button-small" onClick={handleSignOut} disabled={signingOut}>{signingOut ? "Signing out…" : "Sign out"}</button> : <Link href="/login" className="button button-small" aria-current={pathname === "/login" ? "page" : undefined}>Sign in <span aria-hidden="true">↗</span></Link>}
        {authError && <p className="small-note" role="alert">{authError}</p>}
      </nav>
    </header>
  );
}
