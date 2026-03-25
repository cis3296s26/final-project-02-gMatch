"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";

export default function SurveyPage() {
    const [name, setName] = useState("");
    const [skills, setSkills] = useState([]);
    const [skillInput, setSkillInput] = useState("");
    const [availability, setAvailability] = useState("");
    const [submitted, setSubmitted] = useState(false);

    //to make the survey dynamic (concept)
    const questions = [
      { id: "name", label: "Name", type: "text" },
      { id: "skills", label: "Skills", type: "skills" },
      { id: "availability", label: "Availability", type: "availability" },
    ];

    function handleSubmit(e){
        e.preventDefault();

        console.log({ name, skills, availability });

        setSubmitted(true);
    }

    function handleAddSkill(e) {
      if (e.key === "Enter") {
        e.preventDefault();

        const newSkill = skillInput.trim();

        if (newSkill !== "" && !skills.includes(newSkill)) {
          setSkills([...skills, newSkill]);
          setSkillInput("");
        }
      }
    }

    function removeSkill(index) {
      setSkills(skills.filter((_, i) => i !== index));
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
              {questions.map((q) => (
                <div key={q.id}>
                  <p className="text-sm font-medium mb-1">{q.label}</p>

                  {/* TEXT */}
                  {q.type === "text" && (
                    <input
                      className="w-full border rounded p-2"
                      placeholder={q.label}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  )}

                  {/* SKILLS */}
                  {q.type === "skills" && (
                    <div>
                      <input
                        className="w-full border rounded p-2"
                        placeholder="Type a skill and press Enter"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={handleAddSkill}
                      />

                      <div className="flex flex-wrap gap-2 mt-2">
                        {skills.map((skill, index) => (
                          <div
                            key={index}
                            className="bg-blue-500 text-white px-3 py-1 rounded-full flex items-center gap-2"
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() => removeSkill(index)}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AVAILABILITY */}
                  {q.type === "availability" && (
                    <textarea
                      className="w-full border rounded p-2"
                      placeholder="Days and times..."
                      value={availability}
                      onChange={(e) => setAvailability(e.target.value)}
                    />
                  )}
                </div>
              ))}

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