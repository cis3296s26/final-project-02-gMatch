"use client";

import Link from "next/link";
import { Users, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Navbar({ variant = "landing" }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const isDashboard = variant === "dashboard";

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform group-hover:scale-105">
            <Users className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            g<span className="text-primary">Match</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-3 md:flex">
          {isDashboard ? (
            <>
              {/* User avatar placeholder */}
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                U
              </div>
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href="#features">
                <Button variant="ghost" size="sm">Features</Button>
              </Link>
              <Link href="/organizer/dashboard">
                <Button variant="outline" size="sm">Sign In</Button>
              </Link>
              <Link href="/organizer/dashboard">
                <Button size="sm">Get Started</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="border-t border-border/60 bg-background px-4 pb-4 pt-2 md:hidden">
          <div className="flex flex-col gap-2">
            {isDashboard ? (
              <Button variant="ghost" size="sm" className="justify-start gap-1.5 text-muted-foreground">
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            ) : (
              <>
                <Link href="#features" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start">Features</Button>
                </Link>
                <Link href="/organizer/dashboard">
                  <Button variant="outline" size="sm" className="w-full">Sign In</Button>
                </Link>
                <Link href="/organizer/dashboard">
                  <Button size="sm" className="w-full">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
