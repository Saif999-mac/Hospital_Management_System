"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { LucideIcon, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils"; // shadcn's classnames helper, added by `shadcn init`
import { ThemeToggle } from "./theme-toggle";
import { useState } from "react";
import { NotificationBell } from "./notification-bell";

export type NavItem = { label: string; href: string; icon: LucideIcon };

export function DashboardShell({
  navItems,
  roleLabel,
  children,
}: {
  navItems: NavItem[];
  roleLabel: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavLinks = () => (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {navItems.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)} // close drawer after tapping a link on mobile
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 flex-col border-r bg-background md:flex">
        <div className="border-b px-6 py-5">
          <span className="text-lg font-bold">MediCare HMS</span>
          <p className="text-xs text-muted-foreground">{roleLabel}</p>
        </div>
        <NavLinks />
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* backdrop — tapping it closes the drawer */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col bg-background">
            <div className="flex items-center justify-between border-b px-6 py-5">
              <div>
                <span className="text-lg font-bold">MediCare HMS</span>
                <p className="text-xs text-muted-foreground">{roleLabel}</p>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavLinks />
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-3">
            {/* Hamburger button — only visible below md, opens the drawer above */}
            <button
              className="md:hidden cursor-pointer"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="font-medium md:hidden">MediCare HMS</span>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <NotificationBell />
            <ThemeToggle />
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
