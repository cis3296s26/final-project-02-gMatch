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
                <h1 className="text-3xl font-bold">{workspace.name}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    {workspace.participants?.length} participants
                </p>
            </div>

            {/* Teams */}
            <div className="rounded-xl border bg-card p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-2">Teams</h2>

                {workspace.status === "published" ? (
                <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
                    <p className="text-sm font-medium text-green-700">
                        Teams have been published
                    </p>
                </div>
                ) : (
                <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="text-sm text-muted-foreground">
                        Teams not published yet
                    </p>
                </div>
                )}
            </div>
        </div>
    );
}