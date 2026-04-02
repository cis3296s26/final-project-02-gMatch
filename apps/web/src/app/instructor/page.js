"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import StrategyFactory from "@/services/StrategyFactory";
import Navbar from "@/components/Navbar";
import "./instructor.css";

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
        credentials: "include",
        headers: { 'Authorization': `Bearer ${session.token || ''}` },
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
          "Content-Type": "application/json",
          'Authorization': `Bearer ${session.token || ''}`
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
          "Content-Type": "application/json",
          'Authorization': `Bearer ${session.token || ''}`
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

      <div className="instructor-page">
        <div className="instructor-container">
          <h2 className="instructor-title">Manage Workspace</h2>

          <div className="instructor-card">
            <h3>Workspace</h3>

            {workspaces.length === 0 ? (
              <p className="instructor-muted">
                No workspaces yet. Create one to separate classes into saved
                workspaces.
              </p>
            ) : (
              <>
                <div className="workspace-tabs">
                  {workspaces.map((workspace) => (
                    <button
                      key={workspace._id}
                      onClick={() => setActiveWorkspaceId(workspace._id)}
                      className={`workspace-tab ${
                        workspace._id === activeWorkspaceId ? "active" : ""
                      }`}
                    >
                      {workspace.name}
                    </button>
                  ))}
                </div>

                {activeWorkspace && (
                  <div className="workspace-details">
                    <p>
                      <strong>Selected Workspace:</strong> {activeWorkspace.name}
                    </p>
                    <p>
                      <strong>Workspace Code:</strong> {activeWorkspace.inviteCode}
                    </p>
                    <p>
                      <strong>Max Group Size:</strong> {activeWorkspace.teamSize}
                    </p>
                    <p>
                      <strong>Saved Teams:</strong>{" "}
                      {activeWorkspace.teams?.length || 0}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="instructor-card">
            <h3>Team Configuration</h3>

            <div className="instructor-row">
              <div className="instructor-team-field">
                <label className="instructor-label">Min Team Size</label>
                <input
                  className="instructor-input"
                  type="number"
                  min="1"
                  value={minSize}
                  onChange={(e) => {
                    const value = e.target.value;
                    setMinSize(value === "" ? "" : Number(value));
                  }}
                />
              </div>

              <div className="instructor-team-field">
                <label className="instructor-label">Max Team Size</label>
                <input
                  className="instructor-input"
                  type="number"
                  min="1"
                  value={maxSize}
                  onChange={(e) => {
                    const value = e.target.value;
                    setMaxSize(value === "" ? "" : Number(value));
                  }}
                />
              </div>
            </div>
          </div>

          <div className="instructor-card">
            <h3>Matching Strategy</h3>

            <select
              className="instructor-select"
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
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
              className="instructor-link-button"
              onClick={() => setShowStrategyHelp(!showStrategyHelp)}
            >
              {showStrategyHelp ? "Hide details" : "Learn more"}
            </button>

            {showStrategyHelp && (
              <p className="strategy-help">
                Use a provided matching strategy when generating teams for the
                first time. To regenerate teams, choose a different strategy and
                click Regenerate Teams.
              </p>
            )}
          </div>

          <div className="instructor-card">
            <h3>Survey Questions</h3>

            <ul className="question-list">
              {questions.map((q, i) => (
                <li key={i}>
                  {q}
                  <button
                    className="remove-button"
                    onClick={() => removeQuestion(i)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>

            <div className="inline-input-row">
              <input
                className="instructor-input"
                type="text"
                placeholder="Add new question"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
              />
              <button className="instructor-button" onClick={addQuestion}>
                Add Question
              </button>
            </div>
          </div>

          <div className="actions-row">
            <button className="instructor-button-dark" onClick={generateTeams}>
              Generate Teams
            </button>

            {hasGenerated && (
              <button
                className="instructor-button-secondary"
                onClick={generateTeams}
              >
                Regenerate Teams
              </button>
            )}
          </div>

          <div className="instructor-card">
            <h3>Generated Teams</h3>

            {statusMessage && (
              <p className="instructor-message">{statusMessage}</p>
            )}

            {hasGenerated && lastGeneratedStrategy && (
              <p className="instructor-text">
                <strong>Last Generated Using:</strong>{" "}
                {formatStrategyName(lastGeneratedStrategy)}
              </p>
            )}

            {teams.length === 0 && (
              <p className="instructor-muted">
                No teams saved in this workspace yet.
              </p>
            )}

            {teams.map((team, index) => (
              <div key={index} className="team-box">
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

          <div className="instructor-card">
            <h3>Current Configuration</h3>

            {activeWorkspace && (
              <>
                <p className="instructor-text">
                  <strong>Active Workspace:</strong> {activeWorkspace.name}
                </p>
                <p className="instructor-text">
                  <strong>Workspace Code:</strong> {activeWorkspace.inviteCode}
                </p>
                <p className="instructor-text">
                  <strong>Saved Team Count:</strong>{" "}
                  {activeWorkspace.teams?.length || 0}
                </p>
              </>
            )}

            <p className="instructor-text">
              <strong>Team Size:</strong>{" "}
              {minSize === "" ? "-" : minSize} - {maxSize === "" ? "-" : maxSize}
            </p>

            <p className="instructor-text">
              <strong>Strategy:</strong> {formatStrategyName(strategy)}
            </p>

            <p className="instructor-text">
              <strong>Questions:</strong>
            </p>
            <ul className="config-list">
              {questions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}