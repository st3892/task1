import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "./components/navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tech Jokes — A little break from serious code",
  description: "A little tech humor for your day. Browse jokes and make yourself at home.",
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
          <span>Tech Jokes<span className="brand-dot">.</span></span>
          <span>A little less serious. A little more human.</span>
        </footer>
      </body>
    </html>
  );
}
