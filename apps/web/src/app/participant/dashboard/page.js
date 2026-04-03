"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { KeyRound, Users, FolderOpen, Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export default function ParticipantDashboard() {
  const { data: session, status } = useSession();
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (session?.user?.email) {
      fetchWorkspaces();
    }
  }, [session]);

  async function fetchWorkspaces() {
    try {
      const res = await fetch(
        `${API_URL}/api/workspaces/participant`,
        {
          headers: { 'Authorization': `Bearer ${session.token || ''}` },
          credentials: "include",
        }
      );
      if (res.ok) {
        const data = await res.json();

        setWorkspaces(data.workspaces || []);
      }
    } catch (err) {
      console.error("Failed to fetch workspaces:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin(e) {
    e.preventDefault();
    console.log('hello');
    if (!inviteCode.trim()) return;
    setJoining(true);
    setError("");

    console.log('here');

    try {
      const res = await fetch(`${API_URL}/api/workspaces/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.token || ''}`
        },
        body: JSON.stringify({
          inviteCode: inviteCode.trim(),
          participantEmail: session.user.email,
        }),
      });

      if (res.ok) {
        setInviteCode("");
        fetchWorkspaces();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to join workspace");
      }
    } catch (err) {
      setError("Could not connect to server");
    } finally {
      setJoining(false);
    }
  }

  async function handleLeaveWorkspace(workspaceId, workspaceName) {
    const confirmed = window.confirm(
      `Are you sure you want to leave "${workspaceName}"?`
    );  

    if (!confirmed) return;

    try {
      const res = await fetch(`${API_URL}/api/workspaces/${workspaceId}/leave`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.token || ""}`,
        },
      }); 
      
      if (res.ok) {
        fetchWorkspaces();
      } else {
        const data = await res.json();
        setError(data.message || "Failed to leave workspace");
      }    
    } catch (err) {
      setError("Could not connect to server");
    }
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

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Your Teams
            </h1>
            <p className="mt-1 text-muted-foreground">
              View your workspaces and team assignments.
            </p>
          </div>

          {/* Join Section */}
          <Card className="mt-6">
            <CardContent className="p-5">
              <h2 className="mb-3 text-lg font-semibold">Join a Workspace</h2>
              <form
                onSubmit={handleJoin}
                className="flex flex-col gap-3 sm:flex-row sm:items-end"
              >
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
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
            </CardContent>
          </Card>

          {/* Joined Workspaces */}
          {workspaces.length === 0 ? (
            <div className="mt-12 flex flex-col items-center justify-center">
              <Card className="w-full max-w-lg border-dashed border-2 border-border/80 bg-card/40">
                <CardContent className="flex flex-col items-center py-16 text-center">
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">
                    You haven&apos;t joined a workspace yet
                  </h3>
                  <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                    Enter an invite code from your instructor or organizer to
                    join a workspace and start your survey.
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {workspaces.map((ws) => (
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
                        onClick={() => handleLeaveWorkspace(ws._id, ws.name)}
                        className="inline-flex items-center gap-1 rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" />
                        Leave Workspace
                      </button>
                    </div>
                    {ws.organizerId && (
                      <p className="mt-3 text-sm text-muted-foreground">
                        Organized by {ws.organizerId.name || ws.organizerId.email}
                      </p>
                    )}
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
      </main>
    </div>
  );
}
