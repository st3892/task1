import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "./components/navigation";
import BakeryMark from "./components/bakery-mark";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Whisk Takers — Cook up a joke",
  description: "Cook up AI jokes and rate fresh creations and classic laughs with Like or Boo.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <Navigation />
        {children}
        <footer className="site-footer">
          <span>Whisk Takers<span className="brand-dot">.</span></span>
          <span className="footer-note">Baked with questionable judgment. <span className="footer-secret" tabIndex={0} aria-label="Whisk: Do not lick the production database."><BakeryMark /><span className="secret-tooltip" role="tooltip">Do not lick the production database.</span></span></span>
        </footer>
      </body>
    </html>
  );
}
