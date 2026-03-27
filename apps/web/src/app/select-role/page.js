"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { Users, GraduationCap, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

function SelectRoleContent() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (session?.user?.role === "organizer") {
      router.push(callbackUrl || "/organizer/dashboard");
    } else if (session?.user?.role === "participant") {
      router.push(callbackUrl || "/participant/dashboard");
    }
  }, [status, session, router, callbackUrl]);

  function getRedirect(role) {
    if (callbackUrl) return callbackUrl;
    return role === "organizer" ? "/organizer/dashboard" : "/participant/dashboard";
  }

  async function handleSelectRole(role) {
    setLoading(true);
    setError("");
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(`${API_URL}/api/auth/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: session.user.email, role }),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.ok) {
        await update();
        router.push(getRedirect(role));
      } else {
        setError("Could not save your role. The server may be down — please try again.");
      }
    } catch (err) {
      console.warn("Role update failed, redirecting anyway:", err.message);
      router.push(getRedirect(role));
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

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-center text-sm text-red-700">
            {error}
          </div>
        )}

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

export default function SelectRolePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>}>
      <SelectRoleContent />
    </Suspense>
  );
}
