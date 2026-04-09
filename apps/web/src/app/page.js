import Link from "next/link";
import { Users, FileUser, SlidersHorizontal, MessageSquare, ArrowRight, LayoutTemplate, Shield, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import HeroCTAs from "@/components/HeroCTAs";

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

            <HeroCTAs />
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
