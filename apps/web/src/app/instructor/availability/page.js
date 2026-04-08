"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import Navbar from "@/components/Navbar";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export default function AvailabilityPage() {
    const { data: session } = useSession();

    const [students, setStudents] = useState([]);
    const [workspaces, setWorkspaces] = useState([]);
    const [activeWorkspaceId, setActiveWorkspaceId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const localStorageKey = useMemo(() => {
        const email = session?.user?.email || "guest";
        return `gmatch_workspaces_${email}`;
    }, [session]);
    
    useEffect(() => {
        loadWorkspaces();
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [session]);

    useEffect(() => {
        if (workspaces.length > 0) {
        const urlParams = new URLSearchParams(window.location.search);
        const urlWsId = urlParams.get("workspaceId");

        if (urlWsId && workspaces.some((w) => w._id === urlWsId)) {
            setActiveWorkspaceId(urlWsId);
        } else if (!activeWorkspaceId) {
            setActiveWorkspaceId(workspaces[0]._id);
        }
        }
    }, [workspaces, activeWorkspaceId]);

    useEffect(() => {
        if (!activeWorkspaceId) {
        setLoading(false);
        return;
        }

        fetchResponses();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeWorkspaceId, session]);

    const loadWorkspaces = async () => {
        setError("");

        try {
        const response = await fetch(`${API_BASE_URL}/api/workspaces`, {
            credentials: "include",
            headers: {
            Authorization: `Bearer ${session?.token || ""}`,
            },
        });

        if (!response.ok) {
            throw new Error("Backend unavailable");
        }

        const data = await response.json();
        const fetchedWorkspaces = data.workspaces || [];
        setWorkspaces(fetchedWorkspaces);

        if (fetchedWorkspaces.length > 0 && !activeWorkspaceId) {
            setActiveWorkspaceId(fetchedWorkspaces[0]._id);
        } else if (fetchedWorkspaces.length === 0) {
            setLoading(false);
        }
        } catch (_err) {
        const saved = localStorage.getItem(localStorageKey);
        const parsed = saved ? JSON.parse(saved) : [];

        setWorkspaces(parsed);

        if (parsed.length > 0 && !activeWorkspaceId) {
            setActiveWorkspaceId(parsed[0]._id);
        } else {
            setLoading(false);
        }
        }
    };

    const fetchResponses = async () => {
        setLoading(true);
        setError("");

        try {
        const res = await fetch(
            `${API_BASE_URL}/api/response?workspaceId=${activeWorkspaceId}`,
            {
            headers: {
                Authorization: `Bearer ${session?.token || ""}`,
            },
            credentials: "include",
            }
        );

        if (!res.ok) {
            throw new Error("Could not load survey responses.");
        }

        const data = await res.json();

        const mapped = (data.responses || []).map((r) => {
            const nameAnswer = r.answers?.find((a) => a.questionId === "name");
            const availAnswer = r.answers?.find(
            (a) => a.questionId === "availability"
            );

            const availability = Array.isArray(availAnswer?.value)
            ? availAnswer.value
                .map((v) => {
                    if (typeof v === "string") return v;

                    if (v?.day && v?.startTime && v?.endTime) {
                    return `${v.day} ${v.startTime}-${v.endTime}`;
                    }

                    if (v?.day) return v.day;

                    return null;
                })
                .filter(Boolean)
            : [];

            return {
            name: nameAnswer?.value || "Unknown",
            availability,
            };
        });

        setStudents(mapped);
        } catch (err) {
        console.error("Failed to fetch survey responses:", err);
        setError("Could not load availability data.");
        } finally {
        setLoading(false);
        }
    };

    const allSlots = Array.from(
        new Set(students.flatMap((student) => student.availability || []))
    );

    return (
        <>
        <Navbar />

        <main className="min-h-screen bg-background p-6">
            <div className="mx-auto max-w-7xl space-y-6">
            <Link
                href="/instructor"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Instructor Dashboard
            </Link>

            <Card className="shadow-sm">
                <CardHeader>
                <CardTitle>Availability Grid</CardTitle>
                <CardDescription>
                    View student availability collected from survey responses.
                </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                {loading ? (
                    <p className="text-sm text-muted-foreground">
                    Loading availability...
                    </p>
                ) : error ? (
                    <p className="text-sm text-red-500">{error}</p>
                ) : students.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                    No survey responses yet.
                    </p>
                ) : allSlots.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                    No availability data found in survey responses.
                    </p>
                ) : (
                    <>
                    <div className="flex flex-wrap gap-3">
                        <Badge>Available</Badge>
                        <Badge variant="secondary">Not Available</Badge>
                    </div>

                    <div className="overflow-x-auto rounded-md border">
                        <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead className="min-w-[180px]">Student</TableHead>
                            {allSlots.map((slot) => (
                                <TableHead key={slot} className="whitespace-nowrap">
                                {slot}
                                </TableHead>
                            ))}
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {students.map((student) => (
                            <TableRow key={student.name}>
                                <TableCell className="font-medium">
                                {student.name}
                                </TableCell>

                                {allSlots.map((slot) => {
                                const isAvailable =
                                    student.availability.includes(slot);

                                return (
                                    <TableCell key={slot}>
                                    {isAvailable ? (
                                        <Badge>Available</Badge>
                                    ) : (
                                        <Badge variant="secondary">—</Badge>
                                    )}
                                    </TableCell>
                                );
                                })}
                            </TableRow>
                            ))}
                        </TableBody>
                        </Table>
                    </div>
                    </>
                )}
                </CardContent>
            </Card>
            </div>
        </main>
        </>
    );
    }