"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export default function ParticipantWorkspacePage() {
    const { id } = useParams();

    const [workspace, setWorkspace] = useState(null);

    const { data: session } = useSession();

    const router = useRouter();

    useEffect(() => {
        async function fetchWorkspace() {
            try {
                const res = await fetch(`${API_URL}/api/workspaces/${id}`, {
                    headers: {
                        Authorization: `Bearer ${session?.token}`,
                    },
                });

                const data = await res.json();

                console.log("API Response:", data);

                setWorkspace(data.workspace || data);
            } catch (err) {
                console.error(err);
            }
        }

        if (id) fetchWorkspace();
    }, [id]);

    if (!workspace) return <p>Loading...</p>;

    const userTeam = workspace.teams?.find(team =>
        team.members.some(member => member.name === session?.user?.name)
    );

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">

            {/* Back Button */}
            <Button
                variant="ghost"
                className="mb-2 flex items-center gap-2 text-blue-600 hover:text-blue-700"
                onClick={() => router.push("/dashboard")}
            >
                <ArrowLeft className="h-4 w-4" />
                Back To Dashboard
            </Button>

            {/* WorkSpace Header Card */}
            <div className="rounded-xl border bg-card p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4">Your Team</h2>
                {workspace.status === "published" ? (
                    userTeam ? (
                        <div className="rounded-lg border p-4 bg-muted/30">
                            <p className="font-semibold mb-2">Team</p>

                            <ul className="space-y-1 text-sm">
                                {userTeam.members.map((member, i) => (
                                    <li key={i} className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span>{member.name}</span>

                                            {member.name === session?.user?.name && (
                                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                                    You
                                                </span>
                                            )}
                                        </div>

                                        {member.availability?.length > 0 && (
                                            <p className="text-xs text-muted-foreground ml-1">
                                                {member.availability.join(", ")}
                                            </p>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            You are not assigned to a team yet.
                        </p>
                    )
                ) : (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <p className="text-sm text-muted-foreground">
                            Teams not published yet
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}