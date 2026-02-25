"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="square" strokeLinejoin="miter" d="M4 5h4v4H4V5zM14 5h4v4h-4V5zM4 15h4v4H4v-4zM14 15h4v4h-4v-4z" />
      </svg>
    ),
  },
  {
    id: "members",
    label: "Directory",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="square" strokeLinejoin="miter" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: "verses",
    label: "Library",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="square" strokeLinejoin="miter" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    id: "record",
    label: "Session",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="square" strokeLinejoin="miter" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    ),
  },
  {
    id: "goal",
    label: "Objective",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="square" strokeLinejoin="miter" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

interface LayoutProps {
  children: React.ReactNode;
  activeItem?: string;
  onNavigate?: (id: string) => void;
}

export function Layout({ children, activeItem = "dashboard", onNavigate }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavClick = (id: string) => {
    onNavigate?.(id);
    setMobileOpen(false);
  };

  return (
    <div className="flex h-screen bg-[var(--bg-color)] overflow-hidden">
      {/* Mobile backdrop overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-black/80 lg:hidden z-40 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Desktop Sidebar (Mechanical Command Center) */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 300 : 88, transition: { duration: 0.1, ease: "linear" } }}
        className="hidden lg:flex flex-col bg-[var(--bg-color)] border-r-[var(--base-border-width)] border-[var(--text-color)] z-50 relative"
      >
        {/* Logo area */}
        <div className="h-20 flex items-center justify-between px-6 border-b-[var(--base-border-width)] border-[var(--text-color)] bg-[var(--text-color)] text-[var(--bg-color)]">
          <motion.div
            animate={{ opacity: sidebarOpen ? 1 : 0, width: sidebarOpen ? "auto" : 0 }}
            transition={{ duration: 0.1 }}
            className="flex items-center gap-4 overflow-hidden"
          >
            <div className="w-10 h-10 bg-[var(--bg-color)] border-[var(--base-border-width)] border-[var(--bg-color)] flex items-center justify-center flex-shrink-0">
              <span className="font-black text-[var(--text-color)] text-2xl leading-none pt-1">P</span>
            </div>
            <span className="font-black text-[var(--bg-color)] text-3xl whitespace-nowrap tracking-tighter uppercase relative top-0.5">
              PASUK
            </span>
          </motion.div>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-10 h-10 flex items-center justify-center brutalist-border bg-[var(--bg-color)] text-[var(--text-color)] hover:bg-[var(--text-color)] hover:text-[var(--bg-color)] hover:border-[var(--bg-color)] transition-none active:translate-y-1"
          >
            <motion.svg
              animate={{ rotate: sidebarOpen ? 0 : 180 }}
              transition={{ duration: 0.1 }}
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={3} d="M15 19l-7-7 7-7" />
            </motion.svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-4">
          {navItems.map((item) => {
            const isActive = activeItem === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-4 brutalist-border transition-none text-left relative overflow-hidden group ${isActive
                    ? "bg-[var(--text-color)] text-[var(--bg-color)] shadow-[4px_4px_0_0_var(--text-color)] transform -translate-y-1 -translate-x-1"
                    : "bg-[var(--bg-color)] text-[var(--text-color)] hover:bg-[var(--text-color)] hover:text-[var(--bg-color)]"
                  }`}
              >
                <div className="flex-shrink-0 z-10 transition-colors">
                  {item.icon}
                </div>
                <motion.span
                  animate={{ opacity: sidebarOpen ? 1 : 0, width: sidebarOpen ? "auto" : 0 }}
                  transition={{ duration: 0.1 }}
                  className="text-xl font-bold uppercase tracking-widest whitespace-nowrap overflow-hidden z-10"
                >
                  {item.label}
                </motion.span>

                {/* Active Indicator Strip */}
                {isActive && sidebarOpen && (
                  <div className="absolute right-0 top-0 bottom-0 w-2 bg-[var(--success-color)] border-l-[var(--base-border-width)] border-[var(--text-color)]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Keyboard shortcut hint */}
        <motion.div
          animate={{ opacity: sidebarOpen ? 1 : 0 }}
          className="p-6 border-t-[var(--base-border-width)] border-[var(--text-color)] bg-[var(--text-color)] text-[var(--bg-color)]"
        >
          <div className="flex justify-between items-center w-full uppercase font-black tracking-widest text-sm">
            <span>Query Dir</span>
            <kbd className="px-3 py-1 bg-[var(--bg-color)] text-[var(--text-color)] border-[var(--base-border-width)] border-[var(--bg-color)] shadow-[2px_2px_0_0_var(--bg-color)] font-bold">CMD+K</kbd>
          </div>
        </motion.div>
      </motion.aside>

      {/* Mobile sidebar (Brutalized) */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ duration: 0.2, ease: "linear" }}
            className="fixed inset-y-0 left-0 w-80 bg-[var(--bg-color)] border-r-[var(--base-border-width)] border-[var(--text-color)] lg:hidden z-50 flex flex-col brutalist-shadow"
          >
            <div className="h-20 flex items-center justify-between px-6 border-b-[var(--base-border-width)] border-[var(--text-color)] bg-[var(--text-color)] text-[var(--bg-color)]">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[var(--bg-color)] border-[var(--base-border-width)] border-[var(--bg-color)] flex items-center justify-center flex-shrink-0">
                  <span className="font-black text-[var(--text-color)] text-2xl leading-none pt-1">P</span>
                </div>
                <span className="font-black text-[var(--bg-color)] text-3xl tracking-tighter uppercase relative top-0.5">PASUK</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 brutalist-border bg-[var(--bg-color)] text-[var(--text-color)] hover:bg-[var(--error-color)]"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                  <path strokeLinecap="square" strokeLinejoin="miter" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-4">
              {navItems.map((item) => {
                const isActive = activeItem === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-4 px-4 py-4 brutalist-border transition-none text-left relative ${isActive
                        ? "bg-[var(--text-color)] text-[var(--bg-color)] shadow-[4px_4px_0_0_var(--text-color)] transform -translate-y-1 -translate-x-1"
                        : "bg-[var(--bg-color)] text-[var(--text-color)] active:bg-[var(--text-color)] active:text-[var(--bg-color)]"
                      }`}
                  >
                    <div className="flex-shrink-0">{item.icon}</div>
                    <span className="text-xl font-bold uppercase tracking-widest">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Top Marquee */}
        <div className="marquee-container flex-shrink-0 z-10 hidden md:block border-t-0">
          <div className="marquee-content">
            <span>// PASUK VERIFICATION SYSTEM OFFLINE // AUTHENTICATION REQUIRED // SECURE LINE ESTABLISHED // PSALM 23 // JOHN 3:16 // INITIATE VERIFICATION SEQUENCE //</span>
          </div>
        </div>

        {/* Mobile top bar */}
        <div className="h-16 bg-[var(--bg-color)] border-b-[var(--base-border-width)] border-[var(--text-color)] flex items-center px-4 lg:hidden sticky top-0 z-30">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 brutalist-border bg-[var(--text-color)] text-[var(--bg-color)] mr-4"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="square" strokeLinejoin="miter" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[var(--text-color)] border-[var(--base-border-width)] border-[var(--text-color)] flex items-center justify-center flex-shrink-0">
              <span className="font-black text-[var(--bg-color)] text-xl leading-none">P</span>
            </div>
            <span className="font-black text-[var(--text-color)] text-2xl uppercase tracking-tighter border-b-4 border-[var(--text-color)] leading-none">Pasuk</span>
          </div>
        </div>

        {/* Scrollable content area */}
        <main className="flex-1 overflow-y-auto w-full max-w-none">
          {children}
        </main>
      </div>
    </div>
  );
}
