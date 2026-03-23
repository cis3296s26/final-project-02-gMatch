"use client";

import link from "next/link"
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";

export default function SurveyPage() {
    const [name, setName] = useState("");
    const [skills, setSkills] = useState("");
    const [availability, setAvailability] = useState("");
    const [submitted, setSubmitted] = useState(false);

    function handleSubmit(e){
        e.prventDefault();

        console.log({ name, skills, availability });

        setSubmitted(true);
    }

    if (submitted) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <h1 className="text-2xl font-bold">
            Survey Submitted!
          </h1>
        </div>
      </div>
    );
  }

    return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <div className="flex flex-1 items-center justify-center p-6">
        <Card className="w-full max-w-lg">
          <CardContent className="p-6 space-y-4">
            <h1 className="text-2xl font-bold text-center">
              Student Survey
            </h1>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">Name</p>
                <input
                  className="w-full border rounded p-2"
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Skills</p>
                <input
                  className="w-full border rounded p-2"
                  placeholder="JavaScript, Python..."
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                />
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Availability</p>
                <textarea
                  className="w-full border rounded p-2"
                  placeholder="Days and times..."
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full">
                Submit Survey
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}