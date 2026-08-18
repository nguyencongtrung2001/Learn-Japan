"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "./theme-provider";

const navLinks = [
  { href: "/", label: "Trang chủ", icon: "🏠" },
  { href: "/alphabet", label: "Bảng chữ cái", icon: "🔠" },
  { href: "/kana-to-romaji", label: "Kana → Romaji", icon: "✍️" },
  { href: "/romaji-to-kana", label: "Romaji → Kana", icon: "🔤" },
  { href: "/folders", label: "Bộ thẻ", icon: "📂" },
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-border backdrop-blur-xl bg-background/80">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 group"
            id="header-logo"
          >
            <span className="text-2xl transition-transform duration-300 group-hover:scale-110">
              🌸
            </span>
            <span className="text-lg font-bold gradient-text hidden sm:inline">
              仮名マスター
            </span>
            <span className="text-lg font-bold gradient-text sm:hidden">
              KanaMaster
            </span>
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden lg:flex items-center gap-0.5" id="desktop-nav">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 whitespace-nowrap
                    ${
                      isActive
                        ? "bg-indigo/15 text-indigo-light border border-indigo/30"
                        : "text-foreground-muted hover:text-foreground hover:bg-surface-hover"
                    }
                  `}
                >
                  <span className="mr-1.5">{link.icon}</span>
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Actions: Theme Toggle & Mobile Menu */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-lg hover:bg-surface-hover transition-colors text-foreground-muted hover:text-foreground"
              aria-label="Toggle theme"
            >
              {mounted ? (theme === "dark" ? "🌙" : "☀️") : "⚪"}
            </button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden flex flex-col gap-1.5 p-2 rounded-lg hover:bg-surface-hover transition-colors"
              aria-label="Toggle menu"
              id="mobile-menu-toggle"
            >
              <span
                className={`w-5 h-0.5 bg-foreground-muted transition-all duration-300 ${
                  isMenuOpen ? "rotate-45 translate-y-2" : ""
                }`}
              />
              <span
                className={`w-5 h-0.5 bg-foreground-muted transition-all duration-300 ${
                  isMenuOpen ? "opacity-0" : ""
                }`}
              />
              <span
                className={`w-5 h-0.5 bg-foreground-muted transition-all duration-300 ${
                  isMenuOpen ? "-rotate-45 -translate-y-2" : ""
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile navigation dropdown */}
      <div
        className={`lg:hidden border-t border-border overflow-hidden transition-all duration-300 ${
          isMenuOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
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
                  block px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                  ${
                    isActive
                      ? "bg-indigo/15 text-indigo-light border border-indigo/30"
                      : "text-foreground-muted hover:text-foreground hover:bg-surface-hover"
                  }
                `}
              >
                <span className="mr-2">{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
