"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, FolderOpen, Users, Copy, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export default function OrganizerDashboard() {
  const { data: session, status } = useSession();
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Form state
  const [newName, setNewName] = useState("");
  const [newTeamSize, setNewTeamSize] = useState(4);
  const [newTemplate, setNewTemplate] = useState("blank");

  useEffect(() => {
    if (session?.user?.email) {
      fetchWorkspaces();
    }
  }, [session]);

  async function fetchWorkspaces() {
    try {
      const res = await fetch(
        `${API_URL}/api/workspaces?organizerEmail=${encodeURIComponent(session.user.email)}`
      );
      if (res.ok) {
        const data = await res.json();
        const list = data.workspaces || data;
        setWorkspaces(Array.isArray(list) ? list : []);
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizerEmail: session.user.email,
          name: newName.trim(),
          teamSize: newTeamSize,
          template: newTemplate,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const workspace = data.workspace || data;
        setWorkspaces((prev) => [workspace, ...prev]);
        setNewName("");
        setNewTeamSize(4);
        setNewTemplate("blank");
        setShowCreate(false);
      }
    } catch (err) {
      console.error("Failed to create workspace:", err);
    } finally {
      setCreating(false);
    }
  }

  function copyInviteCode(code, id) {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const statusColors = {
    open: "bg-green-100 text-green-700",
    matching: "bg-yellow-100 text-yellow-700",
    published: "bg-blue-100 text-blue-700",
  };

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

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Your Workspaces
              </h1>
              <p className="mt-1 text-muted-foreground">
                Manage your course or organization workspaces.
              </p>
            </div>
            <Button
              size="lg"
              className="gap-2 shadow-sm"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="h-4 w-4" />
              New Workspace
            </Button>
          </div>

          {/* Create Modal */}
          {showCreate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <Card className="w-full max-w-md">
                <CardContent className="p-6">
                  <h2 className="mb-4 text-xl font-bold">Create Workspace</h2>
                  <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Workspace Name
                      </label>
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
                      <label className="mb-1 block text-sm font-medium">
                        Team Size
                      </label>
                      <input
                        type="number"
                        min={2}
                        max={20}
                        value={newTeamSize}
                        onChange={(e) => setNewTeamSize(parseInt(e.target.value))}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Template
                      </label>
                      <select
                        value={newTemplate}
                        onChange={(e) => setNewTemplate(e.target.value)}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="blank">Blank</option>
                        <option value="software-engineering">
                          Software Engineering
                        </option>
                        <option value="business-case-study">
                          Business Case Study
                        </option>
                        <option value="study-group">Study Group</option>
                        <option value="hackathon">Hackathon</option>
                      </select>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button type="submit" className="flex-1" disabled={creating}>
                        {creating ? "Creating..." : "Create"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setShowCreate(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Workspace Cards or Empty State */}
          {workspaces.length === 0 ? (
            <div className="mt-12 flex flex-col items-center justify-center">
              <Card className="w-full max-w-lg border-dashed border-2 border-border/80 bg-card/40">
                <CardContent className="flex flex-col items-center py-16 text-center">
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                    <FolderOpen className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">No workspaces yet</h3>
                  <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                    Create your first workspace to start building surveys and
                    forming balanced teams for your course.
                  </p>
                  <Button
                    className="mt-6 gap-2"
                    onClick={() => setShowCreate(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Create Your First Workspace
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {workspaces.map((ws) => (
                <Link
                  key={ws._id}
                  href={`/organizer/workspace/${ws._id}`}
                >
                  <Card className="cursor-pointer border transition-colors hover:border-primary">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-lg">{ws.name}</h3>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[ws.status] || ""}`}
                        >
                          {ws.status}
                        </span>
                      </div>

                      <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
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
                          onClick={(e) => {
                            e.preventDefault();
                            copyInviteCode(ws.inviteCode, ws._id);
                          }}
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
      </main>
    </div>
  );
}
