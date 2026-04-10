"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import {
  Users,
  LogOut,
  Menu,
  X,
  House,
  LayoutDashboard,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import NotificationsBell from "@/components/NotificationsBell";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Navbar({ variant = "landing" }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: session } = useSession();

  const isLoggedIn = !!session?.user;

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link href="/" className="group flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-transform group-hover:scale-105">
              <Users className="h-5 w-5" />
            </div>
            <span className="text-2xl font-bold tracking-tight">
              g<span className="text-primary">Match</span>
            </span>
          </Link>

          {/* Right side: theme + bell + hamburger */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <NotificationsBell />
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition hover:bg-muted"
              onClick={() => setMenuOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* Side drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-[100]">
          {/* dark overlay */}
          <div
            className="absolute inset-0 bg-black/30"
            onClick={closeMenu}
          />

          {/* right panel */}
          <div className="absolute right-0 top-0 flex h-full w-80 flex-col border-l border-border bg-background shadow-2xl">
            {/* header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-5">
              <Link
                href="/"
                className="group flex items-center gap-3"
                onClick={closeMenu}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Users className="h-5 w-5" />
                </div>
                <span className="text-2xl font-bold tracking-tight">
                  g<span className="text-primary">Match</span>
                </span>
              </Link>

              <button
                type="button"
                className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/40 text-muted-foreground transition hover:bg-muted"
                onClick={closeMenu}
              >
                <X className="h-7 w-7" />
              </button>
            </div>

            {/* content */}
            <div className="flex flex-1 flex-col px-4 py-6">
              <div className="flex flex-col gap-3">
                <Link href="/" onClick={closeMenu}>
                  <Button
                    variant="ghost"
                    className="h-14 w-full justify-start gap-3 rounded-xl text-base"
                  >
                    <House className="h-5 w-5" />
                    Home
                  </Button>
                </Link>

                <Link href={isLoggedIn ? "/dashboard" : "/login?callbackUrl=/dashboard"} onClick={closeMenu}>
                  <Button
                    variant="ghost"
                    className="h-14 w-full justify-start gap-3 rounded-xl text-base"
                  >
                    <LayoutDashboard className="h-5 w-5" />
                    Dashboard
                  </Button>
                </Link>

                <Link href="/settings" onClick={closeMenu}>
                  <Button
                    variant="ghost"
                    className="h-14 w-full justify-start gap-3 rounded-xl text-base"
                  >
                    <Settings className="h-5 w-5" />
                    Settings
                  </Button>
                </Link>
              </div>

              {isLoggedIn && (
                <div className="mt-6 rounded-2xl border border-border px-4 py-4">
                  <div className="flex items-center gap-3">
                    {session.user.image ? (
                      <Image
                        src={session.user.image}
                        alt={session.user.name || "User"}
                        width={44}
                        height={44}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {(session.user.name || "U").charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="truncate text-base font-medium">
                        {session.user.name}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        {session.user.email}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-auto pt-6">
                {isLoggedIn ? (
                  <Button
                    variant="outline"
                    className="h-14 w-full justify-start gap-3 rounded-xl text-base"
                    onClick={() => {
                      closeMenu();
                      signOut({ callbackUrl: "/" });
                    }}
                  >
                    <LogOut className="h-5 w-5" />
                    Sign Out
                  </Button>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Link href="/login" onClick={closeMenu}>
                      <Button variant="outline" className="h-14 w-full rounded-xl text-base">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/login" onClick={closeMenu}>
                      <Button className="h-14 w-full rounded-xl text-base">
                        Get Started
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}