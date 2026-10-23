"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "./theme-provider";

const navLinks = [
  { href: "/", label: "Trang chủ", icon: "🏠" },
  { href: "/folders", label: "Bộ thẻ", icon: "📂" },
  { href: "/tracker", label: "Theo dõi", icon: "📅" },
  { href: "/note", label: "Ghi chú", icon: "📋" },
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
    <header className="sticky top-0 z-40 border-b border-border backdrop-blur-xl bg-background/80">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 group"
            id="header-logo"
          >
            <span className="text-2xl transition-transform duration-300 group-hover:scale-110">
              📚
            </span>
            <span className="text-lg sm:text-xl font-black gradient-text">
              Flashcard App
            </span>
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center gap-4 lg:gap-6" id="desktop-nav">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    flex items-center gap-1.5 py-1.5 text-sm sm:text-[15px] transition-colors duration-200 whitespace-nowrap
                    ${isActive
                      ? "text-foreground font-bold"
                      : "text-foreground-muted hover:text-foreground font-medium"
                    }
                  `}
                >
                  <span className="text-base">{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Actions: Theme Toggle & Mobile Menu */}
          <div className="flex items-center gap-2 sm:gap-2.5">
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
              className="md:hidden flex flex-col gap-1.5 p-2 rounded-lg hover:bg-surface-hover transition-colors"
              aria-label="Toggle menu"
              id="mobile-menu-toggle"
            >
              <span
                className={`w-5 h-0.5 bg-foreground-muted transition-all duration-300 ${isMenuOpen ? "rotate-45 translate-y-2" : ""
                  }`}
              />
              <span
                className={`w-5 h-0.5 bg-foreground-muted transition-all duration-300 ${isMenuOpen ? "opacity-0" : ""
                  }`}
              />
              <span
                className={`w-5 h-0.5 bg-foreground-muted transition-all duration-300 ${isMenuOpen ? "-rotate-45 -translate-y-2" : ""
                  }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile navigation dropdown */}
      <div
        className={`md:hidden border-t border-border overflow-hidden transition-all duration-300 ${isMenuOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
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
                  flex items-center gap-2.5 py-2 text-sm sm:text-[15px] transition-colors duration-200
                  ${isActive
                    ? "text-foreground font-bold"
                    : "text-foreground-muted hover:text-foreground font-medium"
                  }
                `}
              >
                <span className="text-base">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
