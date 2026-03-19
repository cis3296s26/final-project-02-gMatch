import { KeyRound, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Participant Dashboard — gMatch",
  description: "Join a workspace, fill out your survey, and collaborate with your team.",
};

export default function ParticipantDashboard() {
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

          {/* Empty state */}
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
                  Enter an invite code from your instructor or organizer to join a workspace and start your survey.
                </p>
                <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row">
                  <div className="flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2">
                    <KeyRound className="h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Enter invite code"
                      maxLength={6}
                      className="w-36 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                      disabled
                    />
                  </div>
                  <Button className="gap-2">
                    Join Workspace
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
