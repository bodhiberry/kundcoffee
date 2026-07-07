"use client";

import { useState } from "react";
import { Receipt, Menu, X } from "lucide-react";
import Link from "next/link";

const SITE_URL = "https://www.xolacloud.com";
const LOGIN_URL = "/login";
const SIGNUP_URL = "/signup";

const NAV_LINKS = [
  { label: "Features", href: `${SITE_URL}/#features` },
  { label: "How It Works", href: `${SITE_URL}/#how-it-works` },
  { label: "FAQ", href: `${SITE_URL}/#faq` },
  { label: "Contact", href: `${SITE_URL}/#contact` },
];

export default function AuthNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <a
          href={SITE_URL}
          className="flex items-center gap-2 text-lg font-bold tracking-tight text-zinc-900"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-900 text-white">
            <Receipt size={16} strokeWidth={2.25} />
          </span>
          XolaCloud
        </a>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href={LOGIN_URL}
            className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900"
          >
            Log in
          </Link>
          <Link
            href={SIGNUP_URL}
            className="rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-zinc-800"
          >
            Sign Up &amp; Try it free
          </Link>
        </div>

        {/* Hamburger */}
        <button
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          className="relative z-50 flex h-10 w-10 items-center justify-center rounded-md border border-zinc-200 md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="absolute inset-x-0 top-full z-40 border-b border-zinc-200 bg-white px-6 pb-6 pt-2 shadow-lg md:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900"
              >
                {l.label}
              </a>
            ))}
            <div className="my-3 border-t border-zinc-100" />
            <Link
              href={LOGIN_URL}
              className="rounded-md px-3 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900"
            >
              Log in
            </Link>
            <Link
              href={SIGNUP_URL}
              className="mt-1 rounded-md bg-zinc-900 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              Sign Up &amp; Try it free
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
