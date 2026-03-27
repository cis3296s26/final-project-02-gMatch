"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import StrategyFactory from "@/services/StrategyFactory";
import Navbar from "@/components/Navbar";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export default function DashboardPage() {
  const { data: session } = useSession();

  const [minSize, setMinSize] = useState(2);
  const [maxSize, setMaxSize] = useState(4);
  const [strategy, setStrategy] = useState("WeightedHybridStrategy");
  const [teams, setTeams] = useState([]);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [lastGeneratedStrategy, setLastGeneratedStrategy] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [showStrategyHelp, setShowStrategyHelp] = useState(false);

  const [questions, setQuestions] = useState([
    "What days are you available?",
    "What skills do you have?"
  ]);
  const [newQuestion, setNewQuestion] = useState("");

  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceMaxGroupSize, setWorkspaceMaxGroupSize] = useState(4);
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(null);
  const [workspaceMessage, setWorkspaceMessage] = useState("");
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);

  const students = [
    { name: "Alice", availability: ["Mon", "Wed"], skills: ["Java"] },
    { name: "Brian", availability: ["Mon"], skills: ["UI"] },
    { name: "Carla", availability: ["Wed"], skills: ["DB"] },
    { name: "David", availability: ["Mon", "Wed"], skills: ["Beginner"] }
  ];

  const localStorageKey = useMemo(() => {
    const email = session?.user?.email || "guest";
    return `gmatch_workspaces_${email}`;
  }, [session]);

  useEffect(() => {
    loadWorkspaces();
  }, [session]);

  useEffect(() => {
    const selectedWorkspace =
      workspaces.find((workspace) => workspace._id === activeWorkspaceId) || null;

    if (selectedWorkspace?.teams?.length > 0) {
      const restoredTeams = selectedWorkspace.teams.map(
        (team) => team.members || []
      );
      setTeams(restoredTeams);
      setHasGenerated(true);
    } else {
      setTeams([]);
      setHasGenerated(false);
    }
  }, [activeWorkspaceId, workspaces]);

  const loadWorkspaces = async () => {
    setWorkspaceMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/workspaces`, {
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error("Backend unavailable");
      }

      const data = await response.json();
      const fetchedWorkspaces = data.workspaces || [];

      setWorkspaces(fetchedWorkspaces);

      if (fetchedWorkspaces.length > 0 && !activeWorkspaceId) {
        setActiveWorkspaceId(fetchedWorkspaces[0]._id);
      }
    } catch (_error) {
      const saved = localStorage.getItem(localStorageKey);
      const parsed = saved ? JSON.parse(saved) : [];

      setWorkspaces(parsed);

      if (parsed.length > 0 && !activeWorkspaceId) {
        setActiveWorkspaceId(parsed[0]._id);
      }
    }
  };

  const persistLocalWorkspaces = (
    updatedWorkspaces,
    nextActiveWorkspaceId = null
  ) => {
    localStorage.setItem(localStorageKey, JSON.stringify(updatedWorkspaces));
    setWorkspaces(updatedWorkspaces);

    if (nextActiveWorkspaceId) {
      setActiveWorkspaceId(nextActiveWorkspaceId);
    }
  };

  const generateLocalWorkspaceCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";

    for (let i = 0; i < 6; i += 1) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return code;
  };

  const createWorkspace = async () => {
    setWorkspaceMessage("");

    const trimmedName = workspaceName.trim();

    if (!trimmedName) {
      setWorkspaceMessage("Please enter a workspace name.");
      return;
    }

    if (workspaceMaxGroupSize === "" || Number(workspaceMaxGroupSize) < 2) {
      setWorkspaceMessage("Max group size must be at least 2.");
      return;
    }

    setIsCreatingWorkspace(true);

    const payload = {
      name: trimmedName,
      teamSize: Number(workspaceMaxGroupSize)
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/workspaces`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Could not save workspace to backend");
      }

      const data = await response.json();
      const newWorkspace = data.workspace;

      const updatedWorkspaces = [...workspaces, newWorkspace];
      setWorkspaces(updatedWorkspaces);
      setActiveWorkspaceId(newWorkspace._id);

      setWorkspaceMessage(
        `Workspace created. Code: ${newWorkspace.inviteCode}`
      );
      setWorkspaceName("");
      setWorkspaceMaxGroupSize(4);
    } catch (_error) {
      const localWorkspace = {
        _id: `${Date.now()}`,
        name: trimmedName,
        teamSize: Number(workspaceMaxGroupSize),
        inviteCode: generateLocalWorkspaceCode(),
        createdAt: new Date().toISOString(),
        teams: []
      };

      const updatedWorkspaces = [...workspaces, localWorkspace];
      persistLocalWorkspaces(updatedWorkspaces, localWorkspace._id);

      setWorkspaceMessage(
        `Workspace created locally. Code: ${localWorkspace.inviteCode}`
      );
      setWorkspaceName("");
      setWorkspaceMaxGroupSize(4);
    } finally {
      setIsCreatingWorkspace(false);
    }
  };

  const activeWorkspace =
    workspaces.find((workspace) => workspace._id === activeWorkspaceId) || null;

  const saveTeamsToLocalWorkspace = (generatedTeams) => {
    if (!activeWorkspace) return;

    const updatedWorkspaces = workspaces.map((workspace) =>
      workspace._id === activeWorkspace._id
        ? {
            ...workspace,
            teams: generatedTeams.map((team) => ({
              members: team
            }))
          }
        : workspace
    );

    persistLocalWorkspaces(updatedWorkspaces, activeWorkspace._id);
  };

  const saveTeamsToBackendWorkspace = async (generatedTeams) => {
    if (!activeWorkspace) return false;

    const response = await fetch(
      `${API_BASE_URL}/api/workspaces/${activeWorkspace._id}/teams`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ teams: generatedTeams })
      }
    );

    if (!response.ok) {
      throw new Error("Could not save teams to backend");
    }

    const data = await response.json();
    const updatedWorkspace = data.workspace;

    setWorkspaces((prev) =>
      prev.map((workspace) =>
        workspace._id === updatedWorkspace._id ? updatedWorkspace : workspace
      )
    );

    return true;
  };

  const generateTeams = async () => {
    if (!activeWorkspace) {
      setStatusMessage("Please create and select a workspace first.");
      return;
    }

    if (minSize === "" || Number(minSize) < 1) {
      setStatusMessage("Please enter a valid minimum team size.");
      return;
    }

    if (maxSize === "" || Number(maxSize) < Number(minSize)) {
      setStatusMessage(
        "Please enter a valid maximum team size greater than or equal to the minimum."
      );
      return;
    }

    const strategyInstance = StrategyFactory.create(strategy);
    const generatedTeams = strategyInstance.generate(students, Number(minSize));
    const actionLabel = hasGenerated ? "regenerated" : "generated";

    setTeams(generatedTeams);
    setHasGenerated(true);
    setLastGeneratedStrategy(strategy);

    try {
      await saveTeamsToBackendWorkspace(generatedTeams);
      setStatusMessage(
        `Teams ${actionLabel} and saved to "${activeWorkspace.name}".`
      );
    } catch (_error) {
      saveTeamsToLocalWorkspace(generatedTeams);
      setStatusMessage(
        `Teams ${actionLabel} and saved locally to "${activeWorkspace.name}".`
      );
    }
  };

  const addQuestion = () => {
    if (newQuestion.trim() !== "") {
      setQuestions([...questions, newQuestion]);
      setNewQuestion("");
    }
  };

  const removeQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const formatStrategyName = (value) => {
    if (value === "WeightedHybridStrategy") return "Weighted Hybrid";
    if (value === "AvailabilityOnlyStrategy") return "Availability Only";
    if (value === "SkillBalancedStrategy") return "Skill Balanced";
    return value;
  };

  return (
    <>
      <Navbar />

      <div
        style={{
          padding: "40px"
        }}
      >
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <h2
            style={{
              fontSize: "32px",
              marginBottom: "24px",
              color: "#111827"
            }}
          >
            Instructor Dashboard
          </h2>

          <div
            style={{
              backgroundColor: "#ffffff",
              padding: "24px",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              marginBottom: "20px"
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: "16px", color: "#111827" }}>
              Create Workspace
            </h3>

            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <div style={{ flex: 2, minWidth: "240px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "bold",
                    color: "#374151"
                  }}
                >
                  Workspace Name
                </label>
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="Ex: CIS 4398 Section 1"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                    fontSize: "14px",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div style={{ flex: 1, minWidth: "180px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "bold",
                    color: "#374151"
                  }}
                >
                  Max Group Size
                </label>
                <input
                  type="number"
                  min="2"
                  value={workspaceMaxGroupSize}
                  onChange={(e) => {
                    const value = e.target.value;
                    setWorkspaceMaxGroupSize(value === "" ? "" : Number(value));
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                    fontSize: "14px",
                    boxSizing: "border-box"
                  }}
                />
              </div>
            </div>

            <div style={{ marginTop: "16px" }}>
              <button
                onClick={createWorkspace}
                disabled={isCreatingWorkspace}
                style={{
                  padding: "12px 18px",
                  border: "none",
                  borderRadius: "8px",
                  backgroundColor: "#2563eb",
                  color: "#ffffff",
                  fontWeight: "bold",
                  cursor: isCreatingWorkspace ? "not-allowed" : "pointer",
                  opacity: isCreatingWorkspace ? 0.7 : 1
                }}
              >
                {isCreatingWorkspace ? "Creating..." : "Create Workspace"}
              </button>
            </div>

            {workspaceMessage && (
              <p
                style={{
                  marginTop: "14px",
                  marginBottom: 0,
                  color: "#2563eb",
                  fontWeight: "bold"
                }}
              >
                {workspaceMessage}
              </p>
            )}
          </div>

          <div
            style={{
              backgroundColor: "#ffffff",
              padding: "24px",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              marginBottom: "20px"
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: "16px", color: "#111827" }}>
              Workspaces
            </h3>

            {workspaces.length === 0 ? (
              <p style={{ color: "#6b7280", margin: 0 }}>
                No workspaces yet. Create one to separate classes into saved
                workspaces.
              </p>
            ) : (
              <>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "10px",
                    marginBottom: "16px"
                  }}
                >
                  {workspaces.map((workspace) => {
                    const isActive = workspace._id === activeWorkspaceId;

                    return (
                      <button
                        key={workspace._id}
                        onClick={() => setActiveWorkspaceId(workspace._id)}
                        style={{
                          padding: "10px 14px",
                          borderRadius: "999px",
                          border: isActive
                            ? "1px solid #1d4ed8"
                            : "1px solid #d1d5db",
                          backgroundColor: isActive ? "#dbeafe" : "#ffffff",
                          color: isActive ? "#1d4ed8" : "#374151",
                          fontWeight: "bold",
                          cursor: "pointer"
                        }}
                      >
                        {workspace.name}
                      </button>
                    );
                  })}
                </div>

                {activeWorkspace && (
                  <div
                    style={{
                      padding: "16px",
                      borderRadius: "10px",
                      backgroundColor: "#f9fafb",
                      border: "1px solid #e5e7eb"
                    }}
                  >
                    <p style={{ margin: "0 0 8px 0", color: "#374151" }}>
                      <strong>Selected Workspace:</strong> {activeWorkspace.name}
                    </p>
                    <p style={{ margin: "0 0 8px 0", color: "#374151" }}>
                      <strong>Workspace Code:</strong> {activeWorkspace.inviteCode}
                    </p>
                    <p style={{ margin: "0 0 8px 0", color: "#374151" }}>
                      <strong>Max Group Size:</strong> {activeWorkspace.teamSize}
                    </p>
                    <p style={{ margin: 0, color: "#374151" }}>
                      <strong>Saved Teams:</strong>{" "}
                      {activeWorkspace.teams?.length || 0}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          <div
            style={{
              backgroundColor: "#ffffff",
              padding: "24px",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              marginBottom: "20px"
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: "16px", color: "#111827" }}>
              Team Configuration
            </h3>

            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <div style={{ flex: "1", minWidth: "200px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "bold",
                    color: "#374151"
                  }}
                >
                  Min Team Size
                </label>
                <input
                  type="number"
                  min="1"
                  value={minSize}
                  onChange={(e) => {
                    const value = e.target.value;
                    setMinSize(value === "" ? "" : Number(value));
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                    fontSize: "14px",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div style={{ flex: "1", minWidth: "200px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "bold",
                    color: "#374151"
                  }}
                >
                  Max Team Size
                </label>
                <input
                  type="number"
                  min="1"
                  value={maxSize}
                  onChange={(e) => {
                    const value = e.target.value;
                    setMaxSize(value === "" ? "" : Number(value));
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                    fontSize: "14px",
                    boxSizing: "border-box"
                  }}
                />
              </div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: "#ffffff",
              padding: "24px",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              marginBottom: "20px"
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: "16px", color: "#111827" }}>
              Matching Strategy
            </h3>

            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                fontSize: "14px",
                backgroundColor: "#ffffff"
              }}
            >
              <option value="WeightedHybridStrategy">
                Weighted Hybrid (Default)
              </option>
              <option value="AvailabilityOnlyStrategy">
                Availability Only
              </option>
              <option value="SkillBalancedStrategy">
                Skill Balanced
              </option>
            </select>

            <button
              type="button"
              onClick={() => setShowStrategyHelp(!showStrategyHelp)}
              style={{
                marginTop: "12px",
                padding: 0,
                border: "none",
                background: "none",
                color: "#2563eb",
                fontSize: "14px",
                cursor: "pointer",
                textDecoration: "underline"
              }}
            >
              {showStrategyHelp ? "Hide details" : "Learn more"}
            </button>

            {showStrategyHelp && (
              <p
                style={{
                  marginTop: "10px",
                  marginBottom: 0,
                  color: "#6b7280",
                  fontSize: "14px",
                  lineHeight: "1.5"
                }}
              >
                Use a provided matching strategy when generating teams for the
                first time. To regenerate teams, choose a different strategy and
                click Regenerate Teams.
              </p>
            )}
          </div>

          <div
            style={{
              backgroundColor: "#ffffff",
              padding: "24px",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              marginBottom: "20px"
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: "16px", color: "#111827" }}>
              Survey Questions
            </h3>

            <ul style={{ paddingLeft: "20px", marginBottom: "16px" }}>
              {questions.map((q, i) => (
                <li key={i} style={{ marginBottom: "10px", color: "#374151" }}>
                  {q}
                  <button
                    onClick={() => removeQuestion(i)}
                    style={{
                      marginLeft: "10px",
                      padding: "4px 10px",
                      border: "none",
                      borderRadius: "6px",
                      backgroundColor: "#fee2e2",
                      color: "#b91c1c",
                      cursor: "pointer"
                    }}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <input
                type="text"
                placeholder="Add new question"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: "250px",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid #d1d5db",
                  fontSize: "14px"
                }}
              />
              <button
                onClick={addQuestion}
                style={{
                  padding: "10px 16px",
                  border: "none",
                  borderRadius: "8px",
                  backgroundColor: "#2563eb",
                  color: "#ffffff",
                  fontWeight: "bold",
                  cursor: "pointer"
                }}
              >
                Add Question
              </button>
            </div>
          </div>

          <div style={{ marginTop: "30px", marginBottom: "20px" }}>
            <button
              onClick={generateTeams}
              style={{
                padding: "12px 18px",
                border: "none",
                borderRadius: "8px",
                backgroundColor: "#111827",
                color: "#ffffff",
                fontWeight: "bold",
                cursor: "pointer"
              }}
            >
              Generate Teams
            </button>

            {hasGenerated && (
              <button
                onClick={generateTeams}
                style={{
                  padding: "12px 18px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  backgroundColor: "#ffffff",
                  color: "#111827",
                  fontWeight: "bold",
                  cursor: "pointer",
                  marginLeft: "10px"
                }}
              >
                Regenerate Teams
              </button>
            )}
          </div>

          <div
            style={{
              backgroundColor: "#ffffff",
              padding: "24px",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              marginBottom: "20px"
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: "16px", color: "#111827" }}>
              Generated Teams
            </h3>

            {statusMessage && (
              <p
                style={{
                  marginTop: "0",
                  marginBottom: "12px",
                  color: "#2563eb",
                  fontWeight: "bold"
                }}
              >
                {statusMessage}
              </p>
            )}

            {hasGenerated && lastGeneratedStrategy && (
              <p style={{ marginTop: 0, marginBottom: "16px", color: "#374151" }}>
                <strong>Last Generated Using:</strong>{" "}
                {formatStrategyName(lastGeneratedStrategy)}
              </p>
            )}

            {teams.length === 0 && (
              <p style={{ color: "#6b7280" }}>
                No teams saved in this workspace yet.
              </p>
            )}

            {teams.map((team, index) => (
              <div
                key={index}
                style={{
                  marginBottom: "10px",
                  padding: "12px",
                  borderRadius: "8px",
                  backgroundColor: "#eff6ff",
                  border: "1px solid #bfdbfe"
                }}
              >
                <strong>Group {index + 1}:</strong>{" "}
                {team.map((s, studentIndex) => (
                  <span key={`${s.name}-${studentIndex}`}>
                    {s.name}
                    {studentIndex < team.length - 1 ? " + " : ""}
                  </span>
                ))}
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: "20px",
              background: "#ffffff",
              padding: "24px",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: "16px", color: "#111827" }}>
              Current Configuration
            </h3>

            {activeWorkspace && (
              <>
                <p style={{ color: "#374151" }}>
                  <strong>Active Workspace:</strong> {activeWorkspace.name}
                </p>
                <p style={{ color: "#374151" }}>
                  <strong>Workspace Code:</strong> {activeWorkspace.inviteCode}
                </p>
                <p style={{ color: "#374151" }}>
                  <strong>Saved Team Count:</strong>{" "}
                  {activeWorkspace.teams?.length || 0}
                </p>
              </>
            )}

            <p style={{ color: "#374151" }}>
              <strong>Team Size:</strong>{" "}
              {minSize === "" ? "-" : minSize} - {maxSize === "" ? "-" : maxSize}
            </p>

            <p style={{ color: "#374151" }}>
              <strong>Strategy:</strong> {formatStrategyName(strategy)}
            </p>

            <p style={{ color: "#374151", marginBottom: "8px" }}>
              <strong>Questions:</strong>
            </p>
            <ul style={{ paddingLeft: "20px", margin: 0, color: "#4b5563" }}>
              {questions.map((q, i) => (
                <li key={i} style={{ marginBottom: "6px" }}>
                  {q}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}