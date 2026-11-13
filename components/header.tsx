"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppLogo } from "./app-logo";
import { useLanguage } from "./language-provider";
import { LanguageSelector } from "./language-selector";
import { ThemeToggle } from "./theme-toggle";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useLanguage();

  const navLinks = [
    { href: "/", label: t("nav", "home") },
    { href: "/folders", label: t("nav", "folders") },
    { href: "/alphabet", label: t("nav", "alphabet") },
    { href: "/tracker", label: t("nav", "tracker") },
    { href: "/note", label: t("nav", "notes") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-[#E2E4E9] bg-white/95 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between gap-3">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group shrink-0"
            id="header-logo"
          >
            <div className="relative w-8 h-8 rounded-xl overflow-hidden transition-transform duration-300 group-hover:scale-110 flex-shrink-0">
              <AppLogo className="w-full h-full" />
            </div>
            <span className="text-xl font-black text-[#4255FF] tracking-tight">
              Quizlet
            </span>
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center gap-1" id="desktop-nav">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    px-3 py-1.5 rounded-lg text-sm transition-all duration-200
                    ${isActive
                      ? "bg-[#EDEFF4] text-[#1A1D28] font-bold"
                      : "text-[#586380] hover:bg-[#EDEFF4] hover:text-[#1A1D28] font-medium"
                    }
                  `}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right actions: Language Selector + Theme Toggle + Mobile menu toggle */}
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <ThemeToggle />

            {/* Mobile hamburger */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden flex flex-col gap-1.5 p-2 rounded-lg hover:bg-[#EDEFF4] transition-colors"
              aria-label="Toggle menu"
              id="mobile-menu-toggle"
            >
              <span
                className={`w-5 h-0.5 bg-[#586380] transition-all duration-300 ${
                  isMenuOpen ? "rotate-45 translate-y-2" : ""
                }`}
              />
              <span
                className={`w-5 h-0.5 bg-[#586380] transition-all duration-300 ${
                  isMenuOpen ? "opacity-0" : ""
                }`}
              />
              <span
                className={`w-5 h-0.5 bg-[#586380] transition-all duration-300 ${
                  isMenuOpen ? "-rotate-45 -translate-y-2" : ""
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile navigation dropdown */}
      <div
        className={`md:hidden border-t border-[#E2E4E9] overflow-hidden transition-all duration-300 bg-white ${
          isMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="px-4 py-3 space-y-1" id="mobile-nav">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className={`
                  block py-2 px-3 rounded-lg text-sm transition-colors duration-200
                  ${isActive
                    ? "bg-[#EDEFF4] text-[#1A1D28] font-bold"
                    : "text-[#586380] hover:bg-[#EDEFF4] hover:text-[#1A1D28] font-medium"
                  }
                `}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
