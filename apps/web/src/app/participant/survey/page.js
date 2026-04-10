"use client";

import { useEffect, useState, Suspense } from "react";
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
    const [textAnswers, setTextAnswers] = useState({});
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
    
    const [formQuestions, setFormQuestions] = useState([]);
    const [isLoadingForm, setIsLoadingForm] = useState(true);

    const activeQuestions = (() => {
      const base = [];
      if (!formQuestions.some((q) => q.type === "skill-tag" || q.id === "skills")) {
        base.push({ id: "skills", label: "Skills", type: "skill-tag" });
      }
      if (!formQuestions.some((q) => q.type === "availability-grid" || q.id === "availability")) {
        base.push({ id: "availability", label: "Availability", type: "availability-grid" });
      }
      return [...base, ...formQuestions];
    })();

    function clearError(field) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }

    useEffect(() => {
      async function fetchFormQuestions() {
        if (!workspaceId || !session?.token) {
          setIsLoadingForm(false);
          return;
        }

        try {
          setIsLoadingForm(true);

          const res = await fetch(`${API_URL}/api/forms/${workspaceId}`, {
            headers: {
              Authorization: `Bearer ${session?.token || ""}`,
            },
            credentials: "include",
          });

          if (!res.ok) {
            throw new Error("Failed to load form questions");
          }

          const data = await res.json();
          setFormQuestions(data.form?.questions || []);
        } catch (error) {
          console.error("Failed to load form questions:", error);
          setFormQuestions([]);
        } finally {
          setIsLoadingForm(false);
        }
      }

      fetchFormQuestions();
    }, [workspaceId, session]);

    async function handleSubmit(e) {
      e.preventDefault();
      setSubmitError("");

      const nextErrors = {};
      
      activeQuestions.forEach((q) => {
        if ((q.type === "short-text" || q.type === "text" || q.type === "multiple-choice") && !(textAnswers[q.id] || "").trim()) {
          nextErrors[q.id] = `Please answer ${q.label}.`;
        }
        if ((q.type === "skill-tag" || q.id === "skills") && skills.length === 0) {
          nextErrors[q.id] = "Please add at least one skill.";
        }
        if ((q.type === "availability-grid" || q.id === "availability") && availabilityList.length === 0) {
          nextErrors[q.id] = "Please add at least one availability slot.";
        }
      });

      if (!workspaceId) {
        nextErrors.form = "Missing workspace. Open this survey from a workspace link.";
      }

      if (Object.keys(nextErrors).length > 0) {
        setErrors(nextErrors);
        return;
      }

      const answers = [];
      activeQuestions.forEach((q) => {
        if (q.type === "short-text" || q.type === "text" || q.type === "multiple-choice") {
          answers.push({ questionId: q.id, value: (textAnswers[q.id] || "").trim() });
        }
        if (q.type === "skill-tag" || q.id === "skills") {
          answers.push({ questionId: q.id, value: skills });
        }
        if (q.type === "availability-grid" || q.id === "availability") {
          answers.push({ questionId: q.id, value: availabilityList });
        }
      });

      const responseData = {
        workspaceId,
        participantId: session?.user?.id,
        answers,
      };

      try {
        setIsSubmitting(true);

        const res = await fetch(`${API_URL}/api/response`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.token || ""}`,
          },
          credentials: "include",
          body: JSON.stringify(responseData),
        });

        if (!res.ok) {
          throw new Error("Failed to submit survey");
        }

        await res.json();
        setSubmitted(true);
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

    if (isLoadingForm) {
      return (
        <div className="flex min-h-screen flex-col bg-background">
          <Navbar />
          <div className="flex flex-1 items-center justify-center">
            <p className="text-muted-foreground">Loading survey...</p>
          </div>
        </div>
      );
    }

    if (submitted) {
      return (
        <div className="flex min-h-screen flex-col bg-background">
          <Navbar />
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <h1 className="text-2xl font-bold">
              Survey Submitted!
            </h1>

            <Link href="/dashboard">
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
              {activeQuestions.map((q) => (
                <div key={q.id}>
                  <p className="text-sm font-medium mb-1">
                    {q.label} <span className="text-red-500">*</span>
                  </p>

                  {/* DYNAMIC TEXT QUESTIONS */}
                  {(q.type === "text" || q.type === "short-text") && (
                    <>
                    <input
                      className={`w-full border rounded p-2 ${errors[q.id] ? "border-red-500" : ""}`}
                      placeholder={q.label}
                      value={textAnswers[q.id] || ""}
                      onChange={(e) => {
                        setTextAnswers({ ...textAnswers, [q.id]: e.target.value });
                        clearError(q.id);
                      }}
                    />

                    {errors[q.id] && (
                      <p className="mt-1 text-sm text-red-600">{errors[q.id]}</p>
                    )}
                  </>
                )}
    
                  {/* MULTIPLE CHOICE QUESTIONS */}
                  {q.type === "multiple-choice" && (
                    <>
                    <select
                      className={`w-full border rounded-lg p-2.5 outline-none transition-colors focus:ring-2 focus:ring-primary ${errors[q.id] ? "border-red-500" : "bg-card border-border"}`}
                      value={textAnswers[q.id] || ""}
                      onChange={(e) => {
                        setTextAnswers({ ...textAnswers, [q.id]: e.target.value });
                        clearError(q.id);
                      }}
                    >
                      <option value="">Select an option</option>
                      {q.options?.map((opt, i) => (
                        <option key={i} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>

                    {errors[q.id] && (
                      <p className="mt-1 text-sm text-red-600">{errors[q.id]}</p>
                    )}
                  </>
                  )}
    
                  {/* SKILLS */}
                  {(q.type === "skills" || q.type === "skill-tag" || q.id === "skills") && (
                    <div
                      className={`w-full border rounded-lg p-2 flex flex-wrap gap-2 transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ${errors[q.id] ? "border-red-500" : "border-input bg-background"}`}
                    >
                      {skills.map((skill, index) => (
                        <div
                          key={index}
                          className="bg-primary/10 text-primary text-sm font-medium px-3 py-1 rounded-full flex items-center gap-1.5"
                        >
                          {skill}
                          <button
                            type="button"
                            className="text-primary/70 hover:text-primary transition-colors focus:outline-none"
                            onClick={() => removeSkill(index)}
                          >
                            ✕
                          </button>
                        </div>
                      ))}

                      <input
                        className="flex-1 bg-transparent border-none outline-none min-w-[150px] text-sm py-1 placeholder:text-muted-foreground"
                        placeholder="Type a skill, press Enter or comma..."
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
                  {(q.type === "availability" || q.type === "availability-grid" || q.id === "availability") && (
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