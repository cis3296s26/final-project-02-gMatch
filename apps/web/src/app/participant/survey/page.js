"use client";

import { useState, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

function SurveyContent() {
    const { data: session } = useSession();
    const searchParams = useSearchParams();
    const workspaceId = searchParams.get("workspaceId");
    const [name, setName] = useState("");
    const [skills, setSkills] = useState([]);
    const [skillInput, setSkillInput] = useState("");
    const [day, setDay] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [availabilityList, setAvailabilityList] = useState([]);
    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [errors, setErrors] = useState({});

    //to make the survey dynamic (concept)
    const questions = [
      { id: "name", label: "Name", type: "text" },
      { id: "skills", label: "Skills", type: "skills" },
      { id: "availability", label: "Availability", type: "availability" },
    ];

    function clearError(field) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }

    async function handleSubmit(e) {
      e.preventDefault();
      setSubmitError("");

      const nextErrors = {};

      if (!name.trim()) {
        nextErrors.name = "Please enter your name.";
      }

      if (skills.length === 0) {
        nextErrors.skills = "Please add at least one skill.";
      }

      if (availabilityList.length === 0) {
        nextErrors.availability = "Please add at least one availability slot.";
      }

      if (!workspaceId) {
        nextErrors.form = "Missing workspace. Open this survey from a workspace link.";
      }

      if (Object.keys(nextErrors).length > 0) {
        setErrors(nextErrors);
        return;
      }

      const responseData = {
        workspaceId: workspaceId,
        participantId: session?.user?.id,
        answers: [
          { questionId: "name", value: name.trim() },
          { questionId: "skills", value: skills },
          { questionId: "availability", value: availabilityList },
        ],
      };

      try {
        setIsSubmitting(true);

      if (name && skills.length > 0 && availabilityList.length > 0) {
        const responseData = {
          workspaceId: workspaceId,
          participantId: session?.user?.id,
          answers: [
            { questionId: "name", value: name },
            { questionId: "skills", value: skills },
            { questionId: "availability", value: availabilityList },
          ],
        };

        const res = await fetch(`${API_URL}/api/response`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.token || ""}`,
          },
          body: JSON.stringify(responseData),
        });

        if (!res.ok) {
          throw new Error("Failed to submit survey");
        }

        await res.json();
        setSubmitted(true);
        }
      } catch (error) {
        console.error(error);
        setSubmitError("Could not submit survey. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    }

    function handleAddSkill(e) {
      if (e.key === "Backspace" && skillInput === "" && skills.length > 0) {
        setSkills(skills.slice(0, -1));
        return;
      }

      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();

        let newSkill = skillInput.trim();

        // remove trailing comma if it exists
        if (newSkill.endsWith(",")) {
          newSkill = newSkill.slice(0, -1).trim();
        }

        if (newSkill !== "" && !skills.includes(newSkill)) {
          setSkills([...skills, newSkill]);
        }

        setSkillInput("");
      }
    }

    function addAvailability() {
      if (!day || !startTime || !endTime) {
        setErrors((prev) => ({
          ...prev,
          availability: "Please select a day, start time, and end time.",
        }));
        return;
      }

      if (startTime >= endTime) {
        setErrors((prev) => ({
          ...prev,
          availability: "End time must be after start time.",
        }));
        return;
      }

      const newEntry = {
        day,
        startTime,
        endTime,
      };

      const exists = availabilityList.some(
        (item) =>
          item.day === day &&
          item.startTime === startTime &&
          item.endTime === endTime
      );

      if (exists) {
        setErrors((prev) => ({
          ...prev,
          availability: "That availability slot is already added.",
        }));
        return;
      }

      setAvailabilityList([...availabilityList, newEntry]);
      setStartTime("");
      setEndTime("");
      setDay("");
      clearError("availability");
    }

    function removeSkill(index) {
      setSkills(skills.filter((_, i) => i !== index));
    }

    function formatTime(time) {
      const [hour, minute] = time.split(":");
      const h = parseInt(hour);
      const ampm = h >= 12 ? "PM" : "AM";
      const formattedHour = h % 12 || 12;

      return `${formattedHour}:${minute} ${ampm}`;
    }

    if (submitted) {
      return (
        <div className="flex min-h-screen flex-col bg-background">
          <Navbar />
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <h1 className="text-2xl font-bold">
              Survey Submitted!
            </h1>

            <Link href="/participant/dashboard">
              <Button>
                Back to Dashboard
              </Button>
            </Link>
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
                  <p className="text-sm font-medium mb-1">
                    {q.label} <span className="text-red-500">*</span>
                  </p>

                  {/* TEXT */}
                  {q.type === "text" && (
                    <>
                    <input
                      className={`w-full border rounded p-2 ${errors.name ? "border-red-500" : ""}`}
                      placeholder={q.label}
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        clearError("name");
                      }}
                    />

                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                    )}
                  </>
                )}
    
                  {/* SKILLS */}
                  {q.type === "skills" && (
                    <div
                      className={`w-full border rounded p-2 flex flex-wrap gap-2 ${errors.skills ? "border-red-500" : ""}`}
                    >
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

                      <input
                        className="flex-1 outline-none min-w-[120px]"
                        placeholder="Type a skill, press Enter or comma"
                        value={skillInput}
                        onChange={(e) => {
                          setSkillInput(e.target.value);
                          clearError("skills");
                        }}
                        onKeyDown={handleAddSkill}
                      />
                    </div>
                  )}

                  {/* AVAILABILITY */}
                  {q.type === "availability" && (
                    <div className="space-y-3">

                      {/* Day selector */}
                      <select
                        className={`w-full border rounded p-2 ${errors.availability ? "border-red-500" : ""}`}
                        value={day}
                        onChange={(e) => {
                          setDay(e.target.value);
                          clearError("availability");
                        }}
                      >
                        <option value="">Select a day</option>
                        <option>Monday</option>
                        <option>Tuesday</option>
                        <option>Wednesday</option>
                        <option>Thursday</option>
                        <option>Friday</option>
                        <option>Saturday</option>
                        <option>Sunday</option>
                      </select>

                      {/* Start time */}
                      <input
                        type="time"
                        className={`w-full border rounded p-2 ${errors.availability ? "border-red-500" : ""}`}
                        value={startTime}
                        onChange={(e) => {
                          setStartTime(e.target.value);
                          clearError("availability");
                        }}
                      />

                      {/* End time */}
                      <input
                        type="time"
                        className={`w-full border rounded p-2 ${errors.availability ? "border-red-500" : ""}`}
                        value={endTime}
                        onChange={(e) => {
                          setEndTime(e.target.value);
                          clearError("availability");
                        }}
                      />

                      {/* Add button */}
                      <Button type="button" onClick={addAvailability}>
                        Add Availability
                      </Button>

                      {errors.availability && (
                        <p className="text-sm text-red-600">{errors.availability}</p>
                      )}

                      {/* Display slots */}
                      <div className="space-y-2">
                        {availabilityList.map((item, index) => (
                          <div
                            key={index}
                            className="bg-muted border rounded p-2 text-sm flex justify-between items-center"
                          >
                            {item.day}: {formatTime(item.startTime)} - {formatTime(item.endTime)}
                            <button
                              type="button"
                              onClick={() =>
                                setAvailabilityList(
                                  availabilityList.filter((_, i) => i !== index)
                                )
                              }
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <>
                {errors.form && (
                  <p className="text-sm text-red-600">{errors.form}</p>
                )}

                {submitError && (
                  <p className="text-sm text-red-600">{submitError}</p>
                )}

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Survey"}
                </Button>
              </>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SurveyPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">Loading…</p></div>}>
      <SurveyContent />
    </Suspense>
  );
}