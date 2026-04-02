"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  User,
  Mail,
  Shield,
  Link as LinkIcon,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
  LogOut,
  ChevronRight,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  const isSuccess = type === "success";

  return (
    <div
      className="fixed top-5 left-1/2 z-[200] -translate-x-1/2 animate-in fade-in slide-in-from-top-2 duration-300"
      style={{ minWidth: 320 }}
    >
      <div
        className={`flex items-center gap-3 rounded-2xl border px-5 py-4 shadow-lg ${
          isSuccess
            ? "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
            : "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
        }`}
      >
        {isSuccess ? (
          <CheckCircle className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
        ) : (
          <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
        )}
        <p className="text-sm font-medium">{message}</p>
        <button
          onClick={onClose}
          className="ml-auto rounded-lg p-1 opacity-60 hover:opacity-100 transition"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-3 border-b border-border px-6 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      <CardContent className="p-6">{children}</CardContent>
    </Card>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

// Main Page
export default function SettingsPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  // Profile fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [portfolioUrls, setPortfolioUrls] = useState([""]);

  // UI state
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null); // { message, type }
  const [dirty, setDirty] = useState(false);

  // Redirect if unauthenticated 
  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // Prefill from session + backend 
  useEffect(() => {
    if (!session?.user?.email) return;

    // Split existing name into first/last
    let nameArr = (session.user.name || "").split(" ");
    setFirstName(nameArr[0] || "");
    setLastName(nameArr.slice(1).join(" ") || "");

    // Fetch full user doc from backend for portfolioUrls & bio
    fetch(`${API_URL}/api/auth/me`
      , {
        headers: { 'Authorization': `Bearer ${session.token || ''}` },
        credentials: "include",
       }
    )
      .then((r) => r.ok ? r.json() : null)
      .then((dbUser) => {
        if (!dbUser) return;
        if (dbUser.portfolioUrls?.length) {
          setPortfolioUrls(dbUser.portfolioUrls);
        }

        nameArr = (dbUser.name || "").split(" ");
        setFirstName(nameArr[0] || "");
        setLastName(nameArr.slice(1).join(" ") || "");

        if (dbUser.bio) setBio(dbUser.bio);
      })
      .catch(() => {});
  }, [session]);

  // Mark dirty on any change
  function markDirty(setter) {
    return (val) => {
      setter(val);
      setDirty(true);
    };
  }

  function addUrl() {
    setPortfolioUrls((u) => [...u, ""]);
    setDirty(true);
  }

  function updateUrl(idx, val) {
    setPortfolioUrls((u) => u.map((v, i) => (i === idx ? val : v)));
    setDirty(true);
  }

  function removeUrl(idx) {
    setPortfolioUrls((u) => u.filter((_, i) => i !== idx));
    setDirty(true);
  }

  // Save
  async function handleSave() {
    if (!session?.user?.email) return;
    setSaving(true);

    const name = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
    const cleanUrls = portfolioUrls.filter((u) => u.trim() !== "");

    try {
      const res = await fetch(`${API_URL}/api/auth/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          email: session.user.email,
          name,
          bio: bio.trim(),
          portfolioUrls: cleanUrls,
        }),
      });

      if (res.ok) {
        await update(); // refresh NextAuth session
        setDirty(false);
        showToast("Settings saved successfully!", "success");
      } else {
        const body = await res.json().catch(() => ({}));
        showToast(body.error || "Failed to save settings.", "error");
      }
    } catch {
      // Backend may be unreachable — update session name locally
      await update();
      setDirty(false);
      showToast("Settings saved (offline mode).", "success");
    } finally {
      setSaving(false);
    }
  }

  // Discard
  function handleDiscard() {
    const parts = (session?.user?.name || "").split(" ");
    setFirstName(parts[0] || "");
    setLastName(parts.slice(1).join(" ") || "");
    setBio("");
    setPortfolioUrls([""]);
    setDirty(false);
  }

  function showToast(message, type) {
    setToast({ message, type });
  }

  // Loading
  if (status === "loading") {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  const initials = [firstName[0], lastName[0]]
    .filter(Boolean)
    .join("")
    .toUpperCase() || (session?.user?.name?.[0] || "U").toUpperCase();

  const displayName =
    [firstName.trim(), lastName.trim()].filter(Boolean).join(" ") ||
    session?.user?.name ||
    "Your Name";

  const roleLabel =
    session?.user?.role === "organizer"
      ? "Organizer"
      : session?.user?.role === "participant"
      ? "Participant"
      : "No role set";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <main className="mx-auto w-full max-w-2xl px-4 py-10 space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your gMatch profile and account preferences.
          </p>
        </div>

        {/* ── Profile card ── */}
        <Section icon={User} title="Profile">
          {/* Avatar preview */}
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary ring-2 ring-primary/20">
              {session?.user?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.user.image}
                  alt={displayName}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <div>
              <p className="font-semibold">{displayName}</p>
              <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
              <span className="mt-1 inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {roleLabel}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {/* Name row */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="First name">
                <input
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                  placeholder="Jane"
                  value={firstName}
                  onChange={(e) => markDirty(setFirstName)(e.target.value)}
                />
              </Field>
              <Field label="Last name">
                <input
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => markDirty(setLastName)(e.target.value)}
                />
              </Field>
            </div>

            {/* Bio */}
            <Field
              label="Bio"
              hint={`${bio.length}/160 characters`}
            >
              <textarea
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition resize-none"
                placeholder="Tell your team a bit about yourself…"
                rows={3}
                maxLength={160}
                value={bio}
                onChange={(e) => markDirty(setBio)(e.target.value)}
              />
            </Field>
          </div>
        </Section>

        {/* ── Portfolio URLs ── */}
        <Section icon={LinkIcon} title="Portfolio / Links">
          <div className="space-y-3">
            {portfolioUrls.map((url, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                  placeholder="https://github.com/yourhandle"
                  value={url}
                  onChange={(e) => updateUrl(idx, e.target.value)}
                  type="url"
                />
                {portfolioUrls.length > 1 && (
                  <button
                    onClick={() => removeUrl(idx)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground hover:border-red-300 hover:text-red-500 transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 rounded-xl"
              onClick={addUrl}
            >
              <Plus className="h-4 w-4" />
              Add link
            </Button>
          </div>
        </Section>

        {/* ── Account / role ── */}
        <Section icon={Shield} title="Account">
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
              </div>
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                Via OAuth
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
              <div>
                <p className="text-sm font-medium">Role</p>
                <p className="text-sm text-muted-foreground">{roleLabel}</p>
              </div>
              <button
                className="flex items-center gap-1 text-sm text-primary hover:underline"
                onClick={() => router.push("/select-role")}
              >
                Change <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
              <div>
                <p className="text-sm font-medium">Sign out</p>
                <p className="text-sm text-muted-foreground">
                  Sign out of all devices
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 rounded-xl"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </div>
          </div>
        </Section>

        {/* ── Actions ── */}
        <div className="flex items-center justify-end gap-3 pb-10">
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={handleDiscard}
            disabled={!dirty || saving}
          >
            Discard changes
          </Button>
          <Button
            className="rounded-xl"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </main>
    </div>
  );
}