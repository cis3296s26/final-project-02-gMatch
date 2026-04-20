"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import StrategyFactory from "@/services/StrategyFactory";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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

  // Drag-and-drop state
  const [draggedStudent, setDraggedStudent] = useState(null); // { student, fromTeam }
  const [dragOverTarget, setDragOverTarget] = useState(null); // teamIndex or 'unassigned'
  const [unassignedStudents, setUnassignedStudents] = useState([]);

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState(null); // { type, student, fromTeam, message, onConfirm }

  const [questions, setQuestions] = useState([
    "What days are you available?",
    "What skills do you have?"
  ]);
  const [newQuestion, setNewQuestion] = useState("");
  const [newQuestionType, setNewQuestionType] = useState("multiple-choice");
  const [newQuestionOptions, setNewQuestionOptions] = useState("");
  const [questionMessage, setQuestionMessage] = useState("");
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isSavingQuestions, setIsSavingQuestions] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceMaxGroupSize, setWorkspaceMaxGroupSize] = useState(4);
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(null);
  const [workspaceMessage, setWorkspaceMessage] = useState("");
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);

  const [students, setStudents] = useState([]);

  const localStorageKey = useMemo(() => {
    const email = session?.user?.email || "guest";
    return `gmatch_workspaces_${email}`;
  }, [session]);

  useEffect(() => {
    loadWorkspaces();
  }, [session]);

  useEffect(() => {
    // If we have workspaces, and there's a workspaceId in the URL, select it
    if (workspaces.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const urlWsId = urlParams.get("workspaceId");
      if (urlWsId && workspaces.some((w) => w._id === urlWsId)) {
        setActiveWorkspaceId(urlWsId);
      }
    }
  }, [workspaces]);

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

  useEffect(() => {
    if (!activeWorkspaceId || !session?.token) return;

    async function fetchFormQuestions() {
      setIsLoadingQuestions(true);
      setQuestionMessage("");

      try {
        const res = await fetch(`${API_BASE_URL}/api/forms/${activeWorkspaceId}`, {
          headers: {
            Authorization: `Bearer ${session?.token || ""}`,
          },
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error("Failed to load form questions");
        }

        const data = await res.json();
        const savedQuestions = data.form?.questions || [];

        if (savedQuestions.length > 0) {
          setQuestions(savedQuestions);
        } else {
          setQuestions([]);
        }
      } catch (error) {
        console.error("Failed to load form questions:", error);
        setQuestions([]);
        setQuestionMessage("Could not load survey questions.");
      } finally {
        setIsLoadingQuestions(false);
      }
    }

    fetchFormQuestions();
  }, [activeWorkspaceId, session]);

  const saveQuestionsToBackend = async (nextQuestions) => {
    if (!activeWorkspaceId || !session?.token) {
      setQuestionMessage("Please select a workspace first.");
      return false;
    }

    setIsSavingQuestions(true);
    setQuestionMessage("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/forms/${activeWorkspaceId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.token || ""}`,
        },
        credentials: "include",
        body: JSON.stringify({ questions: nextQuestions }),
      });

      if (!res.ok) {
        throw new Error("Failed to save form questions");
      }

      const data = await res.json();
      setQuestions(data.form?.questions || []);
      setQuestionMessage("Survey questions saved.");
      return true;
    } catch (error) {
      console.error("Failed to save form questions:", error);
      setQuestionMessage("Could not save survey questions.");
      return false;
    } finally {
      setIsSavingQuestions(false);
    }
  };

  // Fetch survey responses when active workspace changes
  useEffect(() => {
    if (!activeWorkspaceId) return;
    async function fetchResponses() {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/response?workspaceId=${activeWorkspaceId}`,
          {
            headers: { Authorization: `Bearer ${session?.token || ""}` },
            credentials: "include",
          }
        );
        if (res.ok) {
          const data = await res.json();
          const mapped = (data.responses || []).map((r) => {
            const nameAnswer = r.answers?.find((a) => a.questionId === "name");
            const skillsAnswer = r.answers?.find((a) => a.questionId === "skills");

            // Prefer the structured availabilityGrid (populated by server on submit).
            // Fall back to legacy answers array for older records.
            let availability = [];
            if (r.availabilityGrid && Object.keys(r.availabilityGrid).length > 0) {
              for (const [day, times] of Object.entries(r.availabilityGrid)) {
                for (const time of times) {
                  availability.push(`${day} ${time}`);
                }
              }
            } else {
              const availAnswer = r.answers?.find((a) => a.questionId === "availability");
              availability = Array.isArray(availAnswer?.value)
                ? availAnswer.value
                    .map((v) => {
                      if (typeof v === "string") return v;
                      if (v?.day && v?.startTime && v?.endTime)
                        return `${v.day} ${v.startTime}-${v.endTime}`;
                      if (v?.day) return v.day;
                      return null;
                    })
                    .filter(Boolean)
                : [];
            }

            return {
              name: nameAnswer?.value || r.participantId?.name || "Unknown",
              skills: Array.isArray(skillsAnswer?.value) ? skillsAnswer.value : [],
              availability,
            };
          });
          setStudents(mapped);
        }
      } catch (err) {
        console.error("Failed to fetch survey responses:", err);
      }
    }
    fetchResponses();
  }, [activeWorkspaceId, session]);

  const loadWorkspaces = async () => {
    setWorkspaceMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/workspaces`, {
        credentials: "include",
        headers: { Authorization: `Bearer ${session?.token || ""}` },
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

  const availabilityHref = activeWorkspaceId
  ? `/instructor/availability?workspaceId=${activeWorkspaceId}`
  : "/instructor/availability";

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

  // ── Drag-and-Drop handlers ────────────────────────────────────────
  const handleDragStart = (e, student, fromTeam) => {
    setDraggedStudent({ student, fromTeam });
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, targetTeam) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverTarget(targetTeam);
  };

  const handleDragLeave = () => {
    setDragOverTarget(null);
  };

  const handleDropOnTeam = (e, toTeamIndex) => {
    e.preventDefault();
    setDragOverTarget(null);
    if (!draggedStudent) return;

    const { student, fromTeam } = draggedStudent;

    // Drop onto the same team → no-op
    if (fromTeam === toTeamIndex) {
      setDraggedStudent(null);
      return;
    }

    const newTeams = teams.map((t) => [...t]);
    let newUnassigned = [...unassignedStudents];

    // Remove from source
    if (fromTeam === "unassigned") {
      newUnassigned = newUnassigned.filter((s) => s.name !== student.name);
    } else {
      newTeams[fromTeam] = newTeams[fromTeam].filter((s) => s.name !== student.name);
    }

    // Add to destination team
    newTeams[toTeamIndex] = [...newTeams[toTeamIndex], student];

    setTeams(newTeams);
    setUnassignedStudents(newUnassigned);
    setDraggedStudent(null);
    setStatusMessage("Team updated. Remember to save changes.");
  };

  const handleDropOnUnassigned = (e) => {
    e.preventDefault();
    setDragOverTarget(null);
    if (!draggedStudent) return;

    const { student, fromTeam } = draggedStudent;

    if (fromTeam === "unassigned") {
      setDraggedStudent(null);
      return;
    }

    const newTeams = teams.map((t) => [...t]);
    newTeams[fromTeam] = newTeams[fromTeam].filter((s) => s.name !== student.name);

    setTeams(newTeams);
    setUnassignedStudents((prev) => [...prev, student]);
    setDraggedStudent(null);
    setStatusMessage("Student moved to unassigned. Remember to save changes.");
  };

  const handleDragEnd = () => {
    setDraggedStudent(null);
    setDragOverTarget(null);
  };

  // ── Confirmation helpers ─────────────────────────────────────────
  const askConfirmRemoveFromTeam = (student, teamIndex) => {
    setConfirmDialog({
      message: `Remove "${student.name}" from Group ${teamIndex + 1} and make them unassigned?`,
      onConfirm: () => {
        const newTeams = teams.map((t) => [...t]);
        newTeams[teamIndex] = newTeams[teamIndex].filter((s) => s.name !== student.name);
        setTeams(newTeams);
        setUnassignedStudents((prev) => [...prev, student]);
        setConfirmDialog(null);
        setStatusMessage("Student moved to unassigned. Remember to save changes.");
      },
    });
  };

  const askConfirmRemoveUnassigned = (student) => {
    setConfirmDialog({
      message: `Permanently remove "${student.name}" from the unassigned pool?`,
      onConfirm: () => {
        setUnassignedStudents((prev) => prev.filter((s) => s.name !== student.name));
        setConfirmDialog(null);
        setStatusMessage("Student removed. Remember to save changes.");
      },
    });
  };

  // Save manually adjusted teams
  const saveAdjustedTeams = async () => {
    const adjustedTeams = teams.filter((t) => t.length > 0);
    try {
      await saveTeamsToBackendWorkspace(adjustedTeams);
      setStatusMessage(`Adjusted teams saved to "${activeWorkspace.name}".`);
    } catch (_err) {
      saveTeamsToLocalWorkspace(adjustedTeams);
      setStatusMessage(`Adjusted teams saved locally to "${activeWorkspace.name}".`);
    }
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

    if (students && Array.isArray(students) && students.length === 0) {
      setStatusMessage("There are no students in the workspace. You need at least 2 students to generate teams.");
      return;
    }

    if (students && Array.isArray(students) && students.length === 1) {
      console.log(students);
      setStatusMessage("There is only one student in the workspace. You need at least 2 students to generate teams.");
      return;
    }

    // ensure all students have availability and skills arrays (strategies expect this shape). If not, let the user know that one or more students are missing this data
    const studentsMissingData = students.filter((s) => !s.availability || !s.skills);
    if (studentsMissingData.length > 0) {
      setStatusMessage(
        `Please ensure all students have availability and skills arrays. The following students are missing this data: ${studentsMissingData.map((s) => s.name).join(", ")}`
      );
      return;
    }

    const strategyInstance = StrategyFactory.create(strategy);
    const generatedTeams = strategyInstance.generate(students, Number(minSize));
    const actionLabel = hasGenerated ? "regenerated" : "generated";

    setTeams(generatedTeams);
    setHasGenerated(true);
    setLastGeneratedStrategy(strategy);
    setUnassignedStudents([]);

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

  const addQuestion = async () => {
    const trimmedQuestion = newQuestion.trim();

    if (!trimmedQuestion) {
      setQuestionMessage("Please enter a question.");
      return;
    }

    let questionId = `q_${Date.now()}`;

    if (newQuestionType === "availability-grid") {
      questionId = "availability";
    }

    if (newQuestionType === "skill-tag") {
      questionId = "skills";
    }

    const normalizedQuestions = questions.map((question, index) => {
      if (typeof question === "string") {
        return {
          id: `q_${index + 1}`,
          type: question.toLowerCase().includes("skill") ? "skill-tag" : "availability-grid",
          label: question,
          tag: "",
          options: [],
        };
      }

      return question;
    });

    if (normalizedQuestions.some((question) => question.id === questionId)) {
      setQuestionMessage("That question type already exists in this workspace.");
      return;
    }

    const nextQuestion = {
      id: questionId,
      type: newQuestionType,
      label: trimmedQuestion,
      tag: "",
      options:
        newQuestionType === "multiple-choice"
          ? newQuestionOptions
              .split(",")
              .map((option) => option.trim())
              .filter(Boolean)
          : [],
    };

    const nextQuestions = [...normalizedQuestions, nextQuestion];
    const saved = await saveQuestionsToBackend(nextQuestions);

    if (saved) {
      setNewQuestion("");
      setNewQuestionType("multiple-choice");
      setNewQuestionOptions("");
    }
  };

  const removeQuestion = async (index) => {
    const normalizedQuestions = questions.map((question, i) => {
      if (typeof question === "string") {
        return {
          id: `q_${i + 1}`,
          type: question.toLowerCase().includes("skill") ? "skill-tag" : "availability-grid",
          label: question,
          tag: "",
          options: [],
        };
      }

      return question;
    });

    const nextQuestions = normalizedQuestions.filter((_, i) => i !== index);
    await saveQuestionsToBackend(nextQuestions);
  };

  const formatStrategyName = (value) => {
    if (value === "WeightedHybridStrategy") return "Weighted Hybrid";
    if (value === "AvailabilityOnlyStrategy") return "Availability Only";
    if (value === "SkillBalancedStrategy") return "Skill Balanced";
    return value;
  };

  async function handlePublishTeams() {
    if (!activeWorkspaceId) {
      setStatusMessage("No workspace selected.");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/workspaces/${activeWorkspaceId}/publish`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session?.token || ""}`,
          },
          credentials: "include",
        }
      );

      if (res.ok) {
        setStatusMessage("Teams published successfully!");
        await loadWorkspaces();
      } else {
        const err = await res.json();
        setStatusMessage(err.error || "Failed to publish teams.");
      }
    } catch (err) {
      console.error(err);
      setStatusMessage("Error publishing teams.");
    }
  }

  return (
    <>
      <Navbar />

      <div className="instructor-page">
        <div className="instructor-container">
          {activeWorkspaceId && (
            <Link
              href={`/organizer/workspace/${activeWorkspaceId}`}
              className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              style={{ textDecoration: 'none' }}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Workspace
            </Link>
          )}
          <h2 className="instructor-title">Manage Workspace</h2>

          <div className="top-actions-row">
            <Link
              href={availabilityHref} 
              className="instructor-button availability-grid-button"
              style={{ textDecoration: "none", display: "inline-block" }}
            >
              View Availability Grid
            </Link>
          </div>

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

            {isLoadingQuestions && (
              <p className="instructor-muted">Loading saved questions...</p>
            )}

            <ul className="question-list">
              {questions.map((q, i) => (
                <li key={q?.id || i}>
                  <div>
                    <div>{typeof q === "string" ? q : q.label}</div>
                    {typeof q !== "string" && (
                      <div className="instructor-muted">
                        Type: {q.type}
                        {q.type === "multiple-choice" && q.options?.length > 0
                          ? ` | Options: ${q.options.join(", ")}`
                          : ""}
                      </div>
                    )}
                  </div>
                  <button
                    className="remove-button"
                    onClick={() => removeQuestion(i)}
                    disabled={isSavingQuestions}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>

            <div className="inline-input-row">
              <select
                className="instructor-select"
                value={newQuestionType}
                onChange={(e) => setNewQuestionType(e.target.value)}
              >
                <option value="multiple-choice">Multiple Choice</option>
                <option value="availability-grid">Availability Grid</option>
                <option value="skill-tag">Skill Tag</option>
              </select>
            </div>

            <div className="inline-input-row">
              <input
                className="instructor-input"
                type="text"
                placeholder="Add new question"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
              />
              <button
                className="instructor-button"
                onClick={addQuestion}
                disabled={isSavingQuestions}
              >
                {isSavingQuestions ? "Saving..." : "Add Question"}
              </button>
            </div>

            {newQuestionType === "multiple-choice" && (
              <div className="inline-input-row">
                <input
                  className="instructor-input"
                  type="text"
                  placeholder="Enter options separated by commas"
                  value={newQuestionOptions}
                  onChange={(e) => setNewQuestionOptions(e.target.value)}
                />
              </div>
            )}

            {questionMessage && (
              <p className="instructor-message">{questionMessage}</p>
            )}
          </div>

          <div className="actions-row">
            <button className="instructor-button-dark" onClick={generateTeams}>
              Generate Teams
            </button>

            {hasGenerated && (
              <>
                <button
                  className="instructor-button-secondary"
                  onClick={generateTeams}
                >
                  Regenerate Teams
                </button>

                <button
                  className="instructor-button"
                  onClick={handlePublishTeams}
                >  
                Publish Teams
                </button>
              </>
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

            {teams.length > 0 && (
              <>
                <p className="instructor-muted" style={{ marginBottom: 16, fontSize: 13 }}>
                  Drag student names between groups, or use the × button to make a student unassigned.
                </p>

                <div className="team-dnd-grid">
                  {teams.map((team, index) => (
                    <div
                      key={index}
                      className={`team-box team-drop-zone${dragOverTarget === index ? " drop-target" : ""}`}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDropOnTeam(e, index)}
                    >
                      <div className="team-box-header">
                        <strong>Group {index + 1}</strong>
                        <span className="team-count">{team.length} student{team.length !== 1 ? "s" : ""}</span>
                      </div>
                      <div className="team-members-list">
                        {team.length === 0 && (
                          <span className="team-empty-hint">Drop a student here</span>
                        )}
                        {team.map((s, si) => (
                          <div
                            key={`${s.name}-${si}`}
                            className={`student-chip${draggedStudent?.student?.name === s.name && draggedStudent?.fromTeam === index ? " dragging" : ""}`}
                            draggable
                            onDragStart={(e) => handleDragStart(e, s, index)}
                            onDragEnd={handleDragEnd}
                          >
                            <span className="student-chip-name">{s.name}</span>
                            <button
                              className="chip-remove-btn"
                              title="Make unassigned"
                              onClick={() => askConfirmRemoveFromTeam(s, index)}
                            >×</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Unassigned pool */}
                <div
                  className={`unassigned-pool${dragOverTarget === "unassigned" ? " drop-target" : ""}`}
                  onDragOver={(e) => handleDragOver(e, "unassigned")}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDropOnUnassigned}
                >
                  <div className="team-box-header">
                    <strong>Unassigned Students</strong>
                    <span className="team-count">{unassignedStudents.length}</span>
                  </div>
                  {unassignedStudents.length === 0 ? (
                    <span className="team-empty-hint">Drag students here to unassign them</span>
                  ) : (
                    <div className="team-members-list">
                      {unassignedStudents.map((s, i) => (
                        <div
                          key={`unassigned-${s.name}-${i}`}
                          className={`student-chip unassigned-chip${draggedStudent?.student?.name === s.name && draggedStudent?.fromTeam === "unassigned" ? " dragging" : ""}`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, s, "unassigned")}
                          onDragEnd={handleDragEnd}
                        >
                          <span className="student-chip-name">{s.name}</span>
                          <button
                            className="chip-remove-btn"
                            title="Remove permanently"
                            onClick={() => askConfirmRemoveUnassigned(s)}
                          >×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 16 }}>
                  <button className="instructor-button" onClick={saveAdjustedTeams}>
                    Save Adjustments
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Confirmation Dialog */}
          {confirmDialog && (
            <div className="confirm-overlay">
              <div className="confirm-modal">
                <p className="confirm-message">{confirmDialog.message}</p>
                <div className="confirm-actions">
                  <button
                    className="instructor-button-dark"
                    onClick={confirmDialog.onConfirm}
                  >
                    Yes, confirm
                  </button>
                  <button
                    className="instructor-button-secondary"
                    onClick={() => setConfirmDialog(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

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
                <li key={q?.id || i}>{typeof q === "string" ? q : q.label}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}