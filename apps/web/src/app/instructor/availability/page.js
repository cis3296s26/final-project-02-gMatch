"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";

import Navbar from "@/components/Navbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

const DAYS_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function sortSlots(slots) {
  return [...slots].sort((a, b) => {
    const [dayA, timeA = ""] = a.split(" ");
    const [dayB, timeB = ""] = b.split(" ");
    const dA = DAYS_ORDER.indexOf(dayA);
    const dB = DAYS_ORDER.indexOf(dayB);
    if (dA !== dB) return dA - dB;
    return timeA.localeCompare(timeB);
  });
}

export default function AvailabilityPage() {
  const { data: session } = useSession();

  const [students, setStudents] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [conflictsDetected, setConflictsDetected] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const localStorageKey = useMemo(() => {
    const email = session?.user?.email || "guest";
    return `gmatch_workspaces_${email}`;
  }, [session]);

  const loadWorkspaces = useCallback(async () => {
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/workspaces`, {
        credentials: "include",
        headers: { Authorization: `Bearer ${session?.token || ""}` },
      });
      if (!response.ok) throw new Error("Backend unavailable");

      const data = await response.json();
      const fetched = data.workspaces || [];
      setWorkspaces(fetched);

      if (fetched.length > 0 && !activeWorkspaceId) {
        // Prefer workspaceId from URL
        const urlWsId = new URLSearchParams(window.location.search).get("workspaceId");
        const match = urlWsId && fetched.some((w) => w._id === urlWsId);
        setActiveWorkspaceId(match ? urlWsId : fetched[0]._id);
      }
    } catch {
      const saved = localStorage.getItem(localStorageKey);
      const parsed = saved ? JSON.parse(saved) : [];
      setWorkspaces(parsed);
      if (parsed.length > 0 && !activeWorkspaceId) {
        setActiveWorkspaceId(parsed[0]._id);
      } else {
        setLoading(false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, localStorageKey]);

  const fetchResponses = useCallback(async () => {
    if (!activeWorkspaceId) { setLoading(false); return; }
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/response?workspaceId=${activeWorkspaceId}`,
        {
          headers: { Authorization: `Bearer ${session?.token || ""}` },
          credentials: "include",
        }
      );

      if (!res.ok) throw new Error("Could not load survey responses.");

      const data = await res.json();

      // Map responses — use availabilityGrid (structured) if present,
      // otherwise fall back to answers array for legacy data.
      const mapped = (data.responses || []).map((r) => {
        const nameAnswer = r.answers?.find((a) => a.questionId === "name");
        const skillsAnswer = r.answers?.find((a) => a.questionId === "skills");

        // Build slot list from availabilityGrid (new) or availability answer (legacy)
        let slots = [];

        if (r.availabilityGrid && Object.keys(r.availabilityGrid).length > 0) {
          for (const [day, times] of Object.entries(r.availabilityGrid)) {
            for (const time of times) {
              slots.push(`${day} ${time}`);
            }
          }
        } else {
          // Legacy path: answers array
          const availAnswer = r.answers?.find((a) => a.questionId === "availability");
          if (Array.isArray(availAnswer?.value)) {
            slots = availAnswer.value
              .map((v) => {
                if (typeof v === "string") return v;
                if (v?.day && v?.startTime && v?.endTime)
                  return `${v.day} ${v.startTime}-${v.endTime}`;
                if (v?.day) return v.day;
                return null;
              })
              .filter(Boolean);
          }
        }

        return {
          id: r._id,
          name: nameAnswer?.value || r.participantId?.name || "Unknown",
          skills: Array.isArray(skillsAnswer?.value) ? skillsAnswer.value : [],
          slots,
        };
      });

      setStudents(mapped);
      setConflictsDetected(data.conflictsDetected || 0);
      setConflicts(data.conflicts || []);
    } catch (err) {
      console.error("Failed to fetch survey responses:", err);
      setError("Could not load availability data.");
    } finally {
      setLoading(false);
    }
  }, [activeWorkspaceId, session]);

  useEffect(() => { loadWorkspaces(); }, [loadWorkspaces]);
  useEffect(() => { if (activeWorkspaceId) fetchResponses(); }, [activeWorkspaceId, fetchResponses]);

  const activeWorkspace = workspaces.find((w) => w._id === activeWorkspaceId);

  // All unique day+time slots across all students, sorted
  const allSlots = useMemo(
    () => sortSlots(Array.from(new Set(students.flatMap((s) => s.slots)))),
    [students]
  );

  // Group slots by day for column grouping display
  const slotsByDay = useMemo(() => {
    const map = {};
    for (const slot of allSlots) {
      const day = slot.split(" ")[0];
      if (!map[day]) map[day] = [];
      map[day].push(slot);
    }
    return map;
  }, [allSlots]);

  // Coverage: how many students cover each slot
  const slotCoverage = useMemo(() => {
    const coverage = {};
    for (const slot of allSlots) {
      coverage[slot] = students.filter((s) => s.slots.includes(slot)).length;
    }
    return coverage;
  }, [allSlots, students]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-full space-y-6">
          <Link
            href={activeWorkspaceId ? `/instructor?workspaceId=${activeWorkspaceId}` : "/instructor"}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Instructor Dashboard
          </Link>

          {/* Workspace selector */}
          {workspaces.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {workspaces.map((ws) => (
                <button
                  key={ws._id}
                  onClick={() => setActiveWorkspaceId(ws._id)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium border transition-colors ${
                    ws._id === activeWorkspaceId
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:border-primary hover:text-foreground"
                  }`}
                >
                  {ws.name}
                </button>
              ))}
            </div>
          )}

          {/* Conflict alert */}
          {!loading && conflictsDetected > 0 && (
            <div className="flex items-start gap-3 rounded-lg border border-yellow-300 bg-yellow-50 p-4 dark:border-yellow-700 dark:bg-yellow-950">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-400" />
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-300">
                  {conflictsDetected} scheduling conflict{conflictsDetected !== 1 ? "s" : ""} detected
                </p>
                <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-400">
                  Some participant pairs share no common availability slots. Consider reaching out or adjusting team assignments.
                </p>
              </div>
            </div>
          )}

          {!loading && conflictsDetected === 0 && students.length > 1 && (
            <div className="flex items-center gap-3 rounded-lg border border-green-300 bg-green-50 p-4 dark:border-green-700 dark:bg-green-950">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
              <p className="text-sm font-medium text-green-800 dark:text-green-300">
                No conflicts detected — all participants share at least one common slot.
              </p>
            </div>
          )}

          {/* Main grid card */}
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>
                  Availability Grid
                  {activeWorkspace && (
                    <span className="ml-2 text-base font-normal text-muted-foreground">
                      — {activeWorkspace.name}
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  Survey responses from {students.length} participant{students.length !== 1 ? "s" : ""}.
                  Slots are colour-coded by coverage.
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={fetchResponses} className="gap-1.5 shrink-0">
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </Button>
            </CardHeader>

            <CardContent className="space-y-4">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading availability…</p>
              ) : error ? (
                <p className="text-sm text-red-500">{error}</p>
              ) : students.length === 0 ? (
                <p className="text-sm text-muted-foreground">No survey responses yet.</p>
              ) : allSlots.length === 0 ? (
                <p className="text-sm text-muted-foreground">No availability data found in survey responses.</p>
              ) : (
                <>
                  {/* Legend */}
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-3 w-3 rounded-sm bg-emerald-500" />
                      Available
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-3 w-3 rounded-sm bg-muted border" />
                      Not available
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-3 w-3 rounded-sm bg-emerald-200" />
                      Partial coverage
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        {/* Day group header row */}
                        <TableRow className="bg-muted/40">
                          <TableHead className="min-w-[160px] border-r">Participant</TableHead>
                          {Object.entries(slotsByDay).map(([day, daySlots]) => (
                            <TableHead
                              key={day}
                              colSpan={daySlots.length}
                              className="text-center border-r font-semibold"
                            >
                              {day}
                            </TableHead>
                          ))}
                        </TableRow>
                        {/* Time slot sub-header row */}
                        <TableRow>
                          <TableHead className="border-r" />
                          {allSlots.map((slot, i) => {
                            const timeOnly = slot.split(" ").slice(1).join(" ");
                            const isLastInDay =
                              i === allSlots.length - 1 ||
                              allSlots[i + 1].split(" ")[0] !== slot.split(" ")[0];
                            const coveragePct = students.length > 0
                              ? slotCoverage[slot] / students.length
                              : 0;

                            return (
                              <TableHead
                                key={slot}
                                className={`whitespace-nowrap text-center text-xs ${isLastInDay ? "border-r" : ""}`}
                                title={`${slot} — ${slotCoverage[slot]}/${students.length} available`}
                              >
                                <div>{timeOnly || slot}</div>
                                <div
                                  className={`mt-1 text-[10px] font-normal ${
                                    coveragePct >= 0.7
                                      ? "text-emerald-700"
                                      : coveragePct >= 0.3
                                      ? "text-yellow-600"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {slotCoverage[slot]}/{students.length}
                                </div>
                              </TableHead>
                            );
                          })}
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {students.map((student) => (
                          <TableRow key={student.id || student.name}>
                            <TableCell className="font-medium border-r">
                              <div>{student.name}</div>
                              {student.skills.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {student.skills.map((sk) => (
                                    <span
                                      key={sk}
                                      className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary"
                                    >
                                      {sk}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </TableCell>

                            {allSlots.map((slot, i) => {
                              const isAvail = student.slots.includes(slot);
                              const isLastInDay =
                                i === allSlots.length - 1 ||
                                allSlots[i + 1].split(" ")[0] !== slot.split(" ")[0];

                              return (
                                <TableCell
                                  key={slot}
                                  className={`text-center ${isLastInDay ? "border-r" : ""} ${
                                    isAvail ? "bg-emerald-50 dark:bg-emerald-950" : ""
                                  }`}
                                >
                                  {isAvail ? (
                                    <span className="text-emerald-600 text-base">✓</span>
                                  ) : (
                                    <span className="text-muted-foreground/30 text-xs">—</span>
                                  )}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Conflict detail table */}
                  {conflicts.length > 0 && (
                    <div className="mt-6">
                      <h3 className="mb-2 text-sm font-semibold text-yellow-800 dark:text-yellow-300">
                        Conflict Details
                      </h3>
                      <div className="rounded-md border border-yellow-200 dark:border-yellow-800 overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-yellow-50 dark:bg-yellow-950">
                              <TableHead>#</TableHead>
                              <TableHead>Participant A</TableHead>
                              <TableHead>Participant B</TableHead>
                              <TableHead>Issue</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {conflicts.map((c, i) => {
                              const nameA =
                                students.find(
                                  (s) =>
                                    s.id === String(c.participantA) ||
                                    s.id === c.participantA?._id
                                )?.name || String(c.participantA);
                              const nameB =
                                students.find(
                                  (s) =>
                                    s.id === String(c.participantB) ||
                                    s.id === c.participantB?._id
                                )?.name || String(c.participantB);

                              return (
                                <TableRow key={i}>
                                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                                  <TableCell className="font-medium">{nameA}</TableCell>
                                  <TableCell className="font-medium">{nameB}</TableCell>
                                  <TableCell className="text-sm text-yellow-700 dark:text-yellow-400">
                                    No overlapping availability
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}