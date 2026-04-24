"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

function SurveyContent() {
    const { data: session } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const workspaceId = searchParams.get("workspaceId");
    const [workspace, setWorkspace] = useState(null);
    const [textAnswers, setTextAnswers] = useState({});
    const [skills, setSkills] = useState([]);
    const [skillInput, setSkillInput] = useState("");
    const [day, setDay] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [availabilityList, setAvailabilityList] = useState([]);
    
    // Whitelist / Blacklist
    const [whitelistEmails, setWhitelistEmails] = useState([]);
    const [blacklistEmails, setBlacklistEmails] = useState([]);
    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [errors, setErrors] = useState({});
    
    const [formQuestions, setFormQuestions] = useState([]);
    const [isLoadingForm, setIsLoadingForm] = useState(true);

    // Skill autocomplete
    const [skillSuggestions, setSkillSuggestions] = useState([]);
    const [showSkillDropdown, setShowSkillDropdown] = useState(false);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
    const skillInputRef = useRef(null);
    const skillDropdownRef = useRef(null);

    const activeQuestions = (() => {
      const base = [];
      if (!formQuestions.some((q) => q.type === "skill-tag" || q.id === "skills")) {
        base.push({ id: "skills", label: "Skills", type: "skill-tag" });
      }
      if (!formQuestions.some((q) => q.type === "availability-grid" || q.id === "availability")) {
        base.push({ id: "availability", label: "Availability", type: "availability-grid" });
      }
      if (!formQuestions.some((q) => q.id === "whitelist")) {
        base.push({ id: "whitelist", label: "Preferred Teammates", type: "participant-list", listType: "whitelist" });
      }
      if (!formQuestions.some((q) => q.id === "blacklist")) {
        base.push({ id: "blacklist", label: "Avoid Working With", type: "participant-list", listType: "blacklist" });
      }
      return [...base, ...formQuestions];
    })();

    // Fetch all previously used skills across workspace responses
    useEffect(() => {
      if (!workspaceId || !session?.token) return;
      async function fetchPreviousSkills() {
        try {
          const res = await fetch(`${API_URL}/api/response?workspaceId=${workspaceId}`, {
            headers: { Authorization: `Bearer ${session.token}` },
            credentials: "include",
          });
          if (!res.ok) return;
          const data = await res.json();
          const allSkills = new Set();
          (data.responses || []).forEach((r) => {
            const skillAnswer = r.answers?.find((a) => a.questionId === "skills");
            if (Array.isArray(skillAnswer?.value)) {
              skillAnswer.value.forEach((s) => {
                if (typeof s === "string" && s.trim()) allSkills.add(s.trim());
              });
            }
          });
          setSkillSuggestions([...allSkills].sort((a, b) => a.localeCompare(b)));
        } catch (err) {
          console.error("Failed to fetch previous skills:", err);
        }
      }
      fetchPreviousSkills();
    }, [workspaceId, session]);

    // Close skill dropdown when clicking outside
    useEffect(() => {
      function handleClickOutside(e) {
        if (
          skillInputRef.current && !skillInputRef.current.contains(e.target) &&
          skillDropdownRef.current && !skillDropdownRef.current.contains(e.target)
        ) {
          setShowSkillDropdown(false);
          setActiveSuggestionIndex(-1);
        }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    function getFilteredSkillSuggestions() {
      const query = skillInput.trim().toLowerCase();
      const alreadyAdded = new Set(skills.map((s) => s.toLowerCase()));
      if (!query) {
        // Show all unused previous skills when input is focused but empty
        return skillSuggestions.filter((s) => !alreadyAdded.has(s.toLowerCase()));
      }
      const matches = skillSuggestions.filter(
        (s) => s.toLowerCase().includes(query) && !alreadyAdded.has(s.toLowerCase())
      );
      // Append "Add new skill" option if the exact typed value isn't already in suggestions/added
      const exactMatch = skillSuggestions.some((s) => s.toLowerCase() === query);
      const alreadyInSkills = skills.some((s) => s.toLowerCase() === query);
      if (!exactMatch && !alreadyInSkills && skillInput.trim()) {
        matches.push(`__new__:${skillInput.trim()}`);
      }
      return matches;
    }

    function commitSkill(value) {
      const skill = value.startsWith("__new__:") ? value.slice(8) : value;
      const trimmed = skill.trim();
      if (!trimmed || skills.includes(trimmed)) return;
      setSkills([...skills, trimmed]);
      // If it's genuinely new, add it to the local suggestion pool too
      if (!skillSuggestions.includes(trimmed)) {
        setSkillSuggestions((prev) => [...prev, trimmed].sort((a, b) => a.localeCompare(b)));
      }
      setSkillInput("");
      setShowSkillDropdown(false);
      setActiveSuggestionIndex(-1);
      clearError("skills");
    }

    function clearError(field) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }

    useEffect(() => {
      if (!workspaceId || !session?.token) return;
      async function fetchWorkspace() {
        try {
          const res = await fetch(`${API_URL}/api/workspaces/${workspaceId}`, {
            headers: { Authorization: `Bearer ${session.token}` },
          });
          if (res.ok) setWorkspace(await res.json());
        } catch (err) {
          console.error("Failed to fetch workspace:", err);
        }
      }
      fetchWorkspace();
    }, [workspaceId, session]);

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
        whitelistEmails: whitelistEmails.map((email) => email.trim().toLowerCase()),
        blacklistEmails: blacklistEmails.map((email) => email.trim().toLowerCase()),
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
      const filtered = getFilteredSkillSuggestions();

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveSuggestionIndex((i) => Math.min(i + 1, filtered.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveSuggestionIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Escape") {
        setShowSkillDropdown(false);
        setActiveSuggestionIndex(-1);
        return;
      }

      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        // If a suggestion is highlighted, select it
        if (activeSuggestionIndex >= 0 && filtered[activeSuggestionIndex]) {
          commitSkill(filtered[activeSuggestionIndex]);
          return;
        }
        // Otherwise commit whatever is typed
        const trimmed = skillInput.trim().replace(/,$/, "");
        if (trimmed) commitSkill(trimmed);
        return;
      }

      if (e.key === "Backspace" && skillInput === "" && skills.length > 0) {
        setSkills(skills.slice(0, -1));
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

    function handleAddParticipantEmail(type, rawEmail) {
      const email = rawEmail.trim().toLowerCase();
      if (!email) return;

      if (type === "whitelist" && !whitelistEmails.includes(email) && !blacklistEmails.includes(email)) {
        setWhitelistEmails([...whitelistEmails, email]);
      }
      if (type === "blacklist" && !blacklistEmails.includes(email) && !whitelistEmails.includes(email)) {
        setBlacklistEmails([...blacklistEmails, email]);
      }
    }

    function handleRemoveParticipant(type, email) {
      if (type === "whitelist") setWhitelistEmails(whitelistEmails.filter((e) => e !== email));
      if (type === "blacklist") setBlacklistEmails(blacklistEmails.filter((e) => e !== email));
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

      <div className="flex flex-1 items-center justify-center p-6 pt-2">
        <Card className="w-full max-w-lg">
          <CardContent className="p-6 space-y-4">
            {workspace && (
              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Workspace: <span className="text-muted-foreground">{workspace.name}</span></h1>
              </div>
            )}
            <h2 className="text-xl font-semibold">
              Student Survey
            </h2>

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
                      className={`w-full border rounded-lg p-2.5 outline-none transition-colors focus:ring-2 focus:ring-primary bg-background text-foreground dark:bg-background dark:text-foreground dark:border-border ${errors[q.id] ? "border-red-500" : "border-border"}`}
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
                    <div className="relative">
                      <div
                        className={`w-full border rounded-lg p-2 flex flex-wrap gap-2 transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ${errors[q.id] ? "border-red-500" : "border-input bg-background"}`}
                        onClick={() => skillInputRef.current?.focus()}
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
                              onClick={(e) => { e.stopPropagation(); removeSkill(index); }}
                            >
                              ✕
                            </button>
                          </div>
                        ))}

                        <input
                          ref={skillInputRef}
                          className="flex-1 bg-transparent border-none outline-none min-w-[150px] text-sm py-1 placeholder:text-muted-foreground"
                          placeholder={skills.length === 0 ? "Type a skill or pick from suggestions…" : "Add another skill…"}
                          value={skillInput}
                          onChange={(e) => {
                            setSkillInput(e.target.value);
                            setShowSkillDropdown(true);
                            setActiveSuggestionIndex(-1);
                            clearError("skills");
                          }}
                          onFocus={() => setShowSkillDropdown(true)}
                          onKeyDown={handleAddSkill}
                          autoComplete="off"
                        />
                      </div>

                      {/* Autocomplete dropdown */}
                      {showSkillDropdown && getFilteredSkillSuggestions().length > 0 && (
                        <div
                          ref={skillDropdownRef}
                          className="absolute z-50 top-full left-0 mt-1 w-full bg-card border border-border rounded-md shadow-lg max-h-52 overflow-y-auto"
                        >
                          {getFilteredSkillSuggestions().map((s, i) => {
                            const isNew = s.startsWith("__new__:");
                            const label = isNew ? s.slice(8) : s;
                            return (
                              <button
                                key={s}
                                type="button"
                                ref={i === activeSuggestionIndex ? (el) => el?.scrollIntoView({ block: "nearest" }) : null}
                                className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors outline-none
                                  ${i === activeSuggestionIndex ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground"}`}
                                onMouseDown={(e) => { e.preventDefault(); commitSkill(s); }}
                                onMouseEnter={() => setActiveSuggestionIndex(i)}
                              >
                                {isNew ? (
                                  <>
                                    <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-primary/15 text-primary">+ New</span>
                                    <span className="font-medium">{label}</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="w-2 h-2 rounded-full bg-primary/40 shrink-0" />
                                    <span>{label}</span>
                                  </>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {errors[q.id] && (
                        <p className="mt-1 text-sm text-red-600">{errors[q.id]}</p>
                      )}
                    </div>
                  )}

                  {/* WHITELIST / BLACKLIST PARTICIPANT LIST */}
                  {q.type === "participant-list" && (
                    <div className="relative w-full border rounded-lg p-2 transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 border-input bg-background flex flex-col gap-2">
                      <div className="flex flex-wrap gap-2">
                        {(q.listType === "whitelist" ? whitelistEmails : blacklistEmails).map((email, index) => (
                          <div
                            key={index}
                            className={`text-sm font-medium px-3 py-1 rounded-full flex items-center gap-1.5 ${q.listType === "whitelist" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                          >
                            {email}
                            <button
                              type="button"
                              className="hover:opacity-75 transition-colors focus:outline-none"
                              onClick={() => handleRemoveParticipant(q.listType, email)}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>

                      <input
                        className="flex-1 bg-transparent border-none outline-none min-w-[150px] text-sm py-1 placeholder:text-muted-foreground w-full"
                        placeholder="Enter a student email and press Enter"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === ",") {
                            e.preventDefault();
                            const cleaned = e.currentTarget.value.replace(/,$/, "").trim();
                            if (cleaned) {
                              handleAddParticipantEmail(q.listType, cleaned);
                              e.currentTarget.value = "";
                            }
                          }
                        }}
                      />
                    </div>
                  )}

                  {/* AVAILABILITY */}
                  {(q.type === "availability" || q.type === "availability-grid" || q.id === "availability") && (
                    <div className="space-y-3">

                      {/* Day selector */}
                      <select
                        className={`w-auto border rounded p-2 bg-background text-foreground dark:bg-background dark:text-foreground dark:border-border ${errors.availability ? "border-red-500" : "border-border"}`}
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
                      &nbsp;&nbsp;
                      {/* Start time */}
                      <input
                        type="time"
                        className={`w-auto border rounded p-2 bg-background text-foreground dark:bg-background dark:text-foreground dark:border-border ${errors.availability ? "border-red-500" : "border-border"}`}
                        value={startTime}
                        onChange={(e) => {
                          setStartTime(e.target.value);
                          clearError("availability");
                        }}
                      />
                      &nbsp;to&nbsp;
                      {/* End time */}
                      <input
                        type="time"
                        className={`w-auto border rounded p-2 bg-background text-foreground dark:bg-background dark:text-foreground dark:border-border ${errors.availability ? "border-red-500" : "border-border"}`}
                        value={endTime}
                        onChange={(e) => {
                          setEndTime(e.target.value);
                          clearError("availability");
                        }}
                      />
                      &nbsp;&nbsp;
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

                <div className="gap-3 text-center">
                  <Button type="submit" className="w-medium" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Submit Survey"}
                  </Button>
                  &nbsp;&nbsp;&nbsp;
                  <Button type="button" variant="outline" onClick={() => router.back()}>
                    Back
                  </Button>
                </div>
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