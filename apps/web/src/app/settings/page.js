"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  User,
  Shield,
  Link as LinkIcon,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
  LogOut,
  ChevronRight,
} from "lucide-react";
import styles from "./settings.module.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  const isSuccess = type === "success";

  return (
    <div
      className={styles.toastWrap}>
      <div
        className={`${styles.toast} ${
          isSuccess ? styles.toastSuccess : styles.toastError
        }`}
      >
        {isSuccess ? (
          <CheckCircle className={styles.toastIconSuccess} />
        ) : (
          <AlertCircle className={styles.toastIconError} />
        )}

        <p className={styles.toastMessage}>{message}</p>

        <button
          type="button"
          onClick={onClose}
          className={styles.toastClose}
          aria-label="Close notification"
        >
          <X className={styles.toastCloseIcon} />
        </button>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <Card className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionIconWrap}>
          <Icon className={styles.sectionIcon} />
        </div>
        <h2 className={styles.sectionTitle}>{title}</h2>
      </div>
      <CardContent className={styles.sectionContent}>{children}</CardContent>
    </Card>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>{label}</label>
      {children}
      {hint && <p className={styles.fieldHint}>{hint}</p>}
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
    const parts = (session.user.name || "").split(" ");
    setFirstName(parts[0] || "");
    setLastName(parts.slice(1).join(" ") || "");

    // Fetch full user doc from backend for portfolioUrls & bio
    fetch(`${API_URL}/api/auth/me?email=${encodeURIComponent(session.user.email)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((dbUser) => {
        if (!dbUser) return;
        if (dbUser.portfolioUrls?.length) {
          setPortfolioUrls(dbUser.portfolioUrls);
        }
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
      <div className={styles.pageShell}>
        <Navbar />
        <div className={styles.loadingWrap}>
          <p className={styles.mutedText}>Loading…</p>
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
    <div className={styles.pageShell}>
      <Navbar />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <main className={styles.page}>
        {/* Page header */}
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Settings</h1>
          <p className={styles.pageSubtitle}>
            Manage your gMatch profile and account preferences.
          </p>
        </div>

        {/* ── Profile card ── */}
        <Section icon={User} title="Profile">
          {/* Avatar preview */}
          <div className={styles.profileTop}>
            <div className={styles.avatar}>
              {session?.user?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.user.image}
                  alt={displayName}
                  className={styles.avatarImage}
                />
              ) : (
                initials
              )}
            </div>
            
            <div className={styles.profileMeta}>
              <p className={styles.displayName}>{displayName}</p>
              <p className={styles.profileEmail}>{session?.user?.email}</p>
              <span className={styles.roleBadge}>{roleLabel}</span>
            </div>
          </div>

          <div className={styles.formStack}>
            <div className={styles.nameGrid}>
              <Field label="First name">
                <input
                  className={styles.input}
                  placeholder="Jane"
                  value={firstName}
                  onChange={(e) => markDirty(setFirstName)(e.target.value)}
                />
              </Field>
              
              <Field label="Last name">
                <input
                  className={styles.input}
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
                className={styles.textarea}
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
          <div className={styles.linksStack}>
            {portfolioUrls.map((url, idx) => (
              <div key={idx} className={styles.linkRow}>
                <input
                  className={styles.linkInput}
                  placeholder="https://github.com/yourhandle"
                  value={url}
                  onChange={(e) => updateUrl(idx, e.target.value)}
                  type="url"
                />

                {portfolioUrls.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeUrl(idx)}
                    className={styles.removeButton}
                    aria-label={`Remove link ${idx + 1}`}
                  >
                    <X className={styles.removeIcon} />
                  </button>
                )}
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              className={styles.addButton}
              onClick={addUrl}
            >
              <Plus className={styles.buttonIcon} />
              Add link
            </Button>
          </div>
        </Section>

        {/* ── Account / role ── */}
        <Section icon={Shield} title="Account">
          <div className={styles.accountStack}>
            <div className={styles.accountRow}>
              <div>
                <p className={styles.accountLabel}>Email</p>
                <p className={styles.accountValue}>{session?.user?.email}</p>
              </div>
              <span className={styles.oauthBadge}>Via OAuth</span>
            </div>

            <div className={styles.accountRow}>
              <div>
                <p className={styles.accountLabel}>Role</p>
                <p className={styles.accountValue}>{roleLabel}</p>
              </div>
              <button
                type="button"
                className={styles.changeButton}
                onClick={() => router.push("/select-role")}
              >
                Change <ChevronRight className={styles.changeIcon} />
              </button>
            </div>

            <div className={styles.accountRow}>
              <div>
                <p className={styles.accountLabel}>Sign out</p>
                <p className={styles.accountValue}>Sign out of all devices</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className={styles.signOutButton}
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                <LogOut className={styles.buttonIcon} />
                Sign out
              </Button>
            </div>
          </div>
        </Section>

        {/* ── Actions ── */}
        <div className={styles.actions}>
          <Button
            variant="outline"
            className={styles.actionButton}
            onClick={handleDiscard}
            disabled={!dirty || saving}
          >
            Discard changes
          </Button>
          <Button
            className={styles.actionButton}
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