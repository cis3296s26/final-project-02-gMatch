"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Copy, Check, Users, Trash2, Save, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export default function WorkspaceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editName, setEditName] = useState("");
  const [editTeamSize, setEditTeamSize] = useState(4);

  useEffect(() => {
    fetchWorkspace();
  }, [id]);

  async function fetchWorkspace() {
    try {
      const res = await fetch(`${API_URL}/api/workspaces/${id}`);
      if (res.ok) {
        const data = await res.json();
        setWorkspace(data);
        setEditName(data.name);
        setEditTeamSize(data.teamSize);
      }
    } catch (err) {
      console.error("Failed to fetch workspace:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/workspaces/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, teamSize: editTeamSize }),
      });
      if (res.ok) {
        const updated = await res.json();
        setWorkspace(updated);
      }
    } catch (err) {
      console.error("Failed to update workspace:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this workspace?")) return;
    try {
      const res = await fetch(`${API_URL}/api/workspaces/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/organizer/dashboard");
      }
    } catch (err) {
      console.error("Failed to delete workspace:", err);
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(workspace.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar variant="dashboard" />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar variant="dashboard" />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Workspace not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar variant="dashboard" />

      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Back link */}
          <Link
            href="/organizer/dashboard"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          {/* Invite Code Banner */}
          <Card className="mb-6">
            <CardContent className="flex flex-col items-center gap-3 py-6 sm:flex-row sm:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Share this invite code with participants
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <code className="rounded-lg bg-muted px-4 py-2 text-2xl font-bold font-mono tracking-widest">
                    {workspace.inviteCode}
                  </code>
                  <button
                    onClick={copyCode}
                    className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    {copied ? (
                      <Check className="h-5 w-5 text-green-600" />
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              <div className="text-center sm:text-right">
                <p className="text-2xl font-bold">
                  {workspace.participants?.length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Participants</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Edit Section */}
            <Card>
              <CardContent className="p-5">
                <h2 className="mb-4 text-lg font-semibold">Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Team Size
                    </label>
                    <input
                      type="number"
                      min={2}
                      max={20}
                      value={editTeamSize}
                      onChange={(e) =>
                        setEditTeamSize(parseInt(e.target.value))
                      }
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      className="gap-1.5"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      <Save className="h-4 w-4" />
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={handleDelete}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Participants List */}
            <Card>
              <CardContent className="p-5">
                <h2 className="mb-4 text-lg font-semibold">
                  Participants ({workspace.participants?.length || 0})
                </h2>
                {workspace.participants?.length > 0 ? (
                  <ul className="space-y-3">
                    {workspace.participants.map((p) => (
                      <li
                        key={p._id}
                        className="flex items-center gap-3 rounded-lg border border-border p-3"
                      >
                        {p.avatar ? (
                          <img
                            src={p.avatar}
                            alt={p.name}
                            className="h-8 w-8 rounded-full"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                            {(p.name || "U").charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium">{p.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {p.email}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex flex-col items-center py-8 text-center">
                    <Users className="mb-2 h-8 w-8 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">
                      No participants yet. Share the invite code to get started.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
