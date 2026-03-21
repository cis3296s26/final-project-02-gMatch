"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Users, GraduationCap, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export default function SelectRolePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    // If user already has a role, redirect to their dashboard
    if (session?.user?.role === "organizer") {
      router.push("/organizer/dashboard");
    } else if (session?.user?.role === "participant") {
      router.push("/participant/dashboard");
    }
  }, [status, session, router]);

  async function handleSelectRole(role) {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: session.user.email, role }),
      });

      if (res.ok) {
        // Refresh the session to pick up the new role
        await update();
        router.push(role === "organizer" ? "/organizer/dashboard" : "/participant/dashboard");
      }
    } catch (err) {
      console.error("Failed to set role:", err);
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Users className="h-5 w-5" />
            </div>
            <span className="text-2xl font-bold tracking-tight">
              g<span className="text-primary">Match</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold">How will you use gMatch?</h1>
          <p className="mt-1 text-muted-foreground">
            Choose your role to get started. You can change this later.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card
            className="cursor-pointer border-2 border-border transition-colors hover:border-primary"
            onClick={() => !loading && handleSelectRole("organizer")}
          >
            <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                <Briefcase className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-lg font-semibold">I&apos;m an Organizer</h2>
              <p className="text-sm text-muted-foreground">
                Create workspaces, build surveys, and generate balanced teams.
              </p>
              <Button className="mt-2 w-full" disabled={loading}>
                {loading ? "Setting up..." : "Continue as Organizer"}
              </Button>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer border-2 border-border transition-colors hover:border-primary"
            onClick={() => !loading && handleSelectRole("participant")}
          >
            <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                <GraduationCap className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-lg font-semibold">I&apos;m a Participant</h2>
              <p className="text-sm text-muted-foreground">
                Join a workspace, fill out your survey, and collaborate with your team.
              </p>
              <Button variant="outline" className="mt-2 w-full" disabled={loading}>
                {loading ? "Setting up..." : "Continue as Participant"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
