"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button"

const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

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
        <div className="p-6">
            <Button
                variant="outline"
                className="mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-700"
                onClick={() => router.push("/dashboard")}
            >
                <ArrowLeft className="h-4 w-4" />
                Back To Dashboard
            </Button>

            <h1 className="text-2xl font-bold">{workspace.name}</h1>

            <p className="mt-2 text-sm text-gray-400">
                Participants: {workspace.participants?.length}
            </p>

        {/* Teams */}
        <div className="mt-6">
            <h2 className="text-lg font-semibold">Teams</h2>

            {workspace.status === "published" ? (
            <div className="mt-3 border p-4 rounded">
                <p className="text-sm text-gray-400">
                Teams have been published.
                </p>
            </div>
            ) : (
            <div className="mt-3 border p-4 rounded">
                <p className="text-sm text-gray-400">
                Teams not published yet
                </p>
            </div>
            )}
        </div>
        </div>
    );
}