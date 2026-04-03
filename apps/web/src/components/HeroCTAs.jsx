"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HeroCTAs() {
  const { data: session } = useSession();
  const target = session ? "/dashboard" : "/login?callbackUrl=/dashboard";

  return (
    <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
      <Link href={target}>
        <Button size="lg" className="h-12 gap-2 px-6 text-base font-semibold">
          Create a Workspace
          <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
      <Link href={target}>
        <Button variant="outline" size="lg" className="h-12 gap-2 px-6 text-base font-semibold">
          Join a Team
          <Users className="h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}
