"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus, FolderOpen, Users, Copy, Check, Loader2,
  KeyRound, LogOut, CheckCircle, AlertCircle, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  const isSuccess = type === "success";
  return (
    <div className="fixed top-6 right-6 z-[200]">
      <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg ${
        isSuccess
          ? "border-green-200 bg-green-50 text-green-800"
          : "border-red-200 bg-red-50 text-red-800"
      }`}>
        {isSuccess ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
        <p className="text-sm font-medium">{message}</p>
        <button onClick={onClose} className="ml-2"><X className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

export default function UnifiedDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [organizerWs, setOrganizerWs] = useState([]);
  const [participantWs, setParticipantWs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Create workspace state
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTeamSize, setNewTeamSize] = useState(4);

  // Join workspace state
  const [inviteCode, setInviteCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/dashboard");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.token) {
      fetchAll();
    }
  }, [session]);

  async function fetchAll() {
    try {
      const [orgRes, partRes] = await Promise.all([
        fetch(`${API_URL}/api/workspaces`, {
          headers: { Authorization: `Bearer ${session.token}` },
        }),
        fetch(`${API_URL}/api/workspaces/participant`, {
          headers: { Authorization: `Bearer ${session.token}` },
        }),
      ]);

      if (orgRes.ok) {
        const d = await orgRes.json();
        setOrganizerWs(d.workspaces || d || []);
      }
      if (partRes.ok) {
        const d = await partRes.json();
        setParticipantWs(d.workspaces || d || []);
      }
    } catch (err) {
      console.error("Failed to fetch workspaces:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/api/workspaces`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          organizerEmail: session.user.email,
          name: newName.trim(),
          teamSize: newTeamSize,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        const ws = data.workspace || data;
        setOrganizerWs((prev) => [ws, ...prev]);
        setNewName("");
        setNewTeamSize(4);
        setShowCreate(false);
        setToast({ message: `Workspace "${ws.name}" created!`, type: "success" });
      } else {
        setToast({ message: data.error || data.message || "Failed to create workspace", type: "error" });
      }
    } catch (err) {
      setToast({ message: "Failed to create workspace", type: "error" });
    } finally {
      setCreating(false);
    }
  }

  async function handleJoin(e) {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setJoining(true);
    try {
      const res = await fetch(`${API_URL}/api/workspaces/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          inviteCode: inviteCode.trim(),
          participantEmail: session.user.email,
        }),
      });
      if (res.ok) {
        setInviteCode("");
        setToast({ message: "Joined workspace!", type: "success" });
        fetchAll();
      } else {
        const data = await res.json();
        setToast({ message: data.error || data.message || "Failed to join", type: "error" });
      }
    } catch (err) {
      setToast({ message: "Could not connect to server", type: "error" });
    } finally {
      setJoining(false);
    }
  }

  async function handleLeave(workspaceId, name) {
    if (!confirm(`Leave "${name}"?`)) return;
    try {
      const res = await fetch(`${API_URL}/api/workspaces/${workspaceId}/leave`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.token}` },
      });
      if (res.ok) {
        setToast({ message: `Left "${name}"`, type: "success" });
        fetchAll();
      }
    } catch {
      setToast({ message: "Failed to leave workspace", type: "error" });
    }
  }

  function copyCode(code, id) {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar variant="dashboard" />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar variant="dashboard" />

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>
              <p className="mt-1 text-muted-foreground">
                Manage your workspaces and team assignments.
              </p>
            </div>
            <div className="flex gap-3">
              <Button size="lg" className="gap-2 shadow-sm" onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4" />
                Create Workspace
              </Button>
            </div>
          </div>

          {/* Join Section */}
          <Card className="mt-6">
            <CardContent className="p-5">
              <h2 className="mb-3 text-lg font-semibold">Join a Workspace</h2>
              <form onSubmit={handleJoin} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2">
                  <KeyRound className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Enter invite code"
                    maxLength={6}
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    className="w-36 bg-transparent text-sm uppercase tracking-widest outline-none placeholder:text-muted-foreground/60 placeholder:normal-case placeholder:tracking-normal"
                  />
                </div>
                <Button type="submit" className="gap-2" disabled={joining || !inviteCode.trim()}>
                  {joining ? "Joining..." : "Join Workspace"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Create Modal */}
          {showCreate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <Card className="w-full max-w-md">
                <CardContent className="p-6">
                  <h2 className="mb-4 text-xl font-bold">Create Workspace</h2>
                  <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium">Workspace Name</label>
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="e.g. CIS 3296 Spring 2026"
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Team Size</label>
                      <input
                        type="number"
                        min={2}
                        max={20}
                        value={newTeamSize}
                        onChange={(e) => setNewTeamSize(parseInt(e.target.value) || 2)}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button type="submit" className="flex-1" disabled={creating}>
                        {creating ? "Creating..." : "Create"}
                      </Button>
                      <Button type="button" variant="outline" className="flex-1" onClick={() => setShowCreate(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── Organizer Workspaces ── */}
          <div className="mt-10">
            <h2 className="text-xl font-semibold tracking-tight">
              Your Workspaces
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                (created by you)
              </span>
            </h2>

            {organizerWs.length === 0 ? (
              <div className="mt-4 flex flex-col items-center justify-center">
                <Card className="w-full max-w-lg border-dashed border-2 border-border/80 bg-card/40">
                  <CardContent className="flex flex-col items-center py-12 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                      <FolderOpen className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold">No workspaces yet</h3>
                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                      Create your first workspace to start building surveys and forming teams.
                    </p>
                    <Button className="mt-4 gap-2" onClick={() => setShowCreate(true)}>
                      <Plus className="h-4 w-4" />
                      Create Workspace
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {organizerWs.map((ws) => (
                  <Link key={ws._id} href={`/organizer/workspace/${ws._id}`}>
                    <Card className="cursor-pointer border transition-colors hover:border-primary">
                      <CardContent className="p-5">
                        <h3 className="font-semibold text-lg">{ws.name}</h3>
                        <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Users className="h-4 w-4" />
                            {ws.participants?.length || 0} participants
                          </div>
                          <div>Team size: {ws.teamSize}</div>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <code className="rounded bg-muted px-2 py-1 text-xs font-mono">
                            {ws.inviteCode}
                          </code>
                          <button
                            onClick={(e) => { e.preventDefault(); copyCode(ws.inviteCode, ws._id); }}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            {copiedId === ws._id ? (
                              <Check className="h-3.5 w-3.5 text-green-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* ── Joined Workspaces ── */}
          <div className="mt-10">
            <h2 className="text-xl font-semibold tracking-tight">
              Joined Workspaces
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                (as participant)
              </span>
            </h2>

            {participantWs.length === 0 ? (
              <div className="mt-4 flex flex-col items-center justify-center">
                <Card className="w-full max-w-lg border-dashed border-2 border-border/80 bg-card/40">
                  <CardContent className="flex flex-col items-center py-12 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                      <Users className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold">No joined workspaces</h3>
                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                      Enter an invite code above to join a workspace and start collaborating.
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {participantWs.map((ws) => (
                  <Card key={ws._id} className="border transition-colors hover:border-primary">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-lg">{ws.name}</h3>
                          <span className="mt-1 inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                            Joined
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleLeave(ws._id, ws.name)}
                          className="inline-flex items-center gap-1 rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                        >
                          <LogOut className="h-4 w-4" />
                          Leave
                        </button>
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Users className="h-4 w-4" />
                          {ws.participants?.length || 0} participants
                        </div>
                        <div>Team size: {ws.teamSize}</div>
                      </div>
                      <Link
                        href={`/participant/survey?workspaceId=${ws._id}`}
                        className="mt-3 inline-block text-sm font-medium text-primary"
                      >
                        Fill out survey →
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
