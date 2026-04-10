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

      {/* Asymmetric Bolder Hero */}
      <section className="relative overflow-hidden pt-32 pb-20 lg:pt-48 lg:pb-32">
        {/* Typographic / Shape Ambient Background */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-32 -mb-32 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px]" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-12 gap-16 lg:gap-8 items-center">
            
            <div className="lg:col-span-8">
              <div className="mb-8 inline-flex items-center gap-2 rounded-none border-l-4 border-primary bg-muted/60 pl-3 pr-4 py-2 text-sm font-bold text-foreground uppercase tracking-widest">
                <Users className="h-4 w-4 text-primary" />
                The Group Matching Engine
              </div>
              
              <h1 className="text-6xl sm:text-8xl lg:text-[7.5rem] font-black tracking-tighter leading-[0.9] text-foreground mb-8">
                Build Teams. <br />
                <span className="text-primary italic pr-4">Instantly.</span>
              </h1>
              
              <p className="max-w-2xl text-xl sm:text-2xl font-medium leading-relaxed text-muted-foreground mb-12">
                Drop the infinite spreadsheets. gMatch maps overlapping schedules, distinct skillsets, and hard constraints into mathematically optimized rosters in seconds.
              </p>

              <div className="scale-110 origin-left">
                <HeroCTAs />
              </div>
            </div>

            <div className="lg:col-span-4 hidden lg:block">
               {/* Abstract Typography Art Element for Bolder Aesthetic */}
               <div className="h-full w-full flex items-center justify-center p-8 bg-card border-[0.5px] border-border/40 rounded-3xl shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500">
                  <div className="text-[12rem] font-black leading-none text-muted opacity-30 select-none">
                    <span className="text-foreground">g</span><span className="text-primary opacity-80">M</span>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Amplification Grid */}
      <section className="py-24 bg-foreground text-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="mb-20 max-w-3xl">
            <h2 className="text-5xl sm:text-6xl font-black tracking-tighter leading-none mb-6">
              Total Control. <br /> Zero Friction.
            </h2>
            <p className="text-xl text-muted-foreground font-medium">
              A meticulously engineered pipeline from participant intake to automated publishing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
            {features.map((feature, i) => (
              <div key={i} className="flex flex-col group items-start">
                <div className="bg-primary/20 text-background p-4 rounded-2xl mb-6 transition-transform duration-300 group-hover:-translate-y-2">
                  <feature.icon className="h-8 w-8 text-background stroke-[2.5px]" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight mb-3 text-background">
                  {feature.title}
                </h3>
                <p className="text-muted text-base leading-relaxed font-medium">
                  {feature.description}
                </p>
              </div>
            ))}
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
