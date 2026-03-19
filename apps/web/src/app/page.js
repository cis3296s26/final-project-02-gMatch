import Link from "next/link";
import { Users, FileUser, SlidersHorizontal, MessageSquare, ArrowRight, LayoutTemplate, Shield, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";

const features = [
  {
    icon: SlidersHorizontal,
    title: "Smart Matching Engine",
    description:
      "Configurable weighting sliders let organizers prioritize schedule compatibility, role diversity, or experience balance.",
  },
  {
    icon: FileUser,
    title: "Dynamic Form Builder",
    description:
      "Build custom intake surveys with multiple-choice, availability grids, and skill-tag selectors.",
  },
  {
    icon: MessageSquare,
    title: "Real-Time Collaboration",
    description:
      "Once teams are published, members get a dedicated workspace with real-time chat.",
  },
  {
    icon: Shield,
    title: "Whitelist & Blacklist",
    description:
      "Participants can request teammates or flag incompatibilities as hard constraints.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description:
      "Visualize skill distributions, schedule heatmaps, and tag imbalances before generating teams.",
  },
  {
    icon: LayoutTemplate,
    title: "Template",
    description:
      "Start from pre-built templates for Software Engineering, Business Case Studies, Hackathons, or Study Groups.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar variant="landing" />

      {/* Hero */}
      <section className="py-24 sm:py-32 lg:py-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3.5 py-1.5 text-sm font-medium text-primary">
              <Users className="h-3.5 w-3.5" />
              Smart Team Formation Platform
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Build Better Teams,{" "}
              <span className="text-primary">Automatically</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              gMatch uses structured surveys and configurable algorithms to create balanced,
              compatible project teams. No more manual spreadsheets or random assignments.
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="/organizer/dashboard">
                <Button size="lg" className="h-12 gap-2 px-6 text-base font-semibold">
                  Create a Workspace
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/participant/dashboard">
                <Button variant="outline" size="lg" className="h-12 gap-2 px-6 text-base font-semibold">
                  Join a Team
                  <Users className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border/60 bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need for <span className="text-primary">smarter team formation</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              From custom surveys to intelligent matching — gMatch handles the heavy lifting
              so you can focus on teaching.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="border-border/60 bg-card transition-colors hover:border-primary/30"
              >
                <CardContent className="p-6">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-border bg-muted/50 px-8 py-16 text-center sm:px-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to build better teams?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
              Get started in minutes. Create a workspace, build your survey, and let gMatch
              handle the matching.
            </p>
            <div className="mt-8">
              <Link href="/organizer/dashboard">
                <Button size="lg" className="h-12 gap-2 px-6 text-base font-semibold">
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4 text-primary" />
            <span className="font-medium text-foreground">gMatch</span>
            <span>· CIS 3296</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Built with Next.js, Express & MongoDB
          </p>
        </div>
      </footer>
    </div>
  );
}
