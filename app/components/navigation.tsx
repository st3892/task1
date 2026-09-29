"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Jokes" },
  { href: "/secret", label: "Members only" },
  { href: "/profile", label: "Profile" },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <nav className="nav-inner" aria-label="Main navigation">
        <Link href="/" className="brand">
          <span className="brand-mark" aria-hidden="true">:)</span>
          Tech Jokes<span className="brand-dot">.</span>
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
        <Link href="/login" className="button button-small" aria-current={pathname === "/login" ? "page" : undefined}>Sign in <span aria-hidden="true">↗</span></Link>
      </nav>
    </header>
  );
}
