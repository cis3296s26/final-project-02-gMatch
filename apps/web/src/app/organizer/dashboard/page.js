import Link from "next/link";
import { Plus, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Organizer Dashboard — gMatch",
  description: "Create workspaces, build surveys, and generate balanced teams.",
};

export default function OrganizerDashboard() {
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
            <Button size="lg" className="gap-2 shadow-sm">
              <Plus className="h-4 w-4" />
              New Workspace
            </Button>
          </div>

          {/* Empty state */}
          <div className="mt-12 flex flex-col items-center justify-center">
            <Card className="w-full max-w-lg border-dashed border-2 border-border/80 bg-card/40">
              <CardContent className="flex flex-col items-center py-16 text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <FolderOpen className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">No workspaces yet</h3>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  Create your first workspace to start building surveys and forming balanced teams for your course.
                </p>
                <Button className="mt-6 gap-2">
                  <Plus className="h-4 w-4" />
                  Create Your First Workspace
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
