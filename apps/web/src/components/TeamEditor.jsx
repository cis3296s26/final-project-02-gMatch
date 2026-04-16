"use client";

import { useState, useRef } from "react";

/**
 * TeamEditor
 * Allows instructors to manually move students between teams (and to/from
 * an "Unassigned" pool) before finalising groups.
 *
 * Props:
 *   teams      – array of arrays of student objects { name, skills, availability }
 *   onTeamsChange(updatedTeams) – called whenever the layout changes
 */
export default function TeamEditor({ teams, onTeamsChange }) {
  // Build unassigned pool from students who appear in no team (empty for now)
  const [unassigned, setUnassigned] = useState([]);

  // Confirmation dialog state
  const [confirm, setConfirm] = useState(null);
  // confirm = { type: "remove"|"unassign", student, teamIndex, studentIndex, resolve }

  // Drag state refs (avoids stale closures inside event handlers)
  const drag = useRef(null);
  // drag = { source: "team"|"unassigned", teamIndex?, studentIndex, student }

  // helpers

  function cloneTeams() {
    return teams.map((t) => [...t]);
  }

  function askConfirm(message) {
    return new Promise((resolve) => {
      setConfirm({ message, resolve });
    });
  }

  function handleConfirmYes() {
    if (confirm?.resolve) confirm.resolve(true);
    setConfirm(null);
  }

  function handleConfirmNo() {
    if (confirm?.resolve) confirm.resolve(false);
    setConfirm(null);
  }

  // drag-and-drop
  function onDragStart(source, teamIndex, studentIndex, student) {
    drag.current = { source, teamIndex, studentIndex, student };
  }

  function onDragOver(e) {
    e.preventDefault(); // allow drop
  }

  function onDropOnTeam(e, targetTeamIndex) {
    e.preventDefault();
    const d = drag.current;
    if (!d) return;

    // Dropped onto the same team → no-op
    if (d.source === "team" && d.teamIndex === targetTeamIndex) return;

    const newTeams = cloneTeams();
    const newUnassigned = [...unassigned];

    // Remove from source
    if (d.source === "team") {
      newTeams[d.teamIndex].splice(d.studentIndex, 1);
    } else {
      newUnassigned.splice(d.studentIndex, 1);
    }

    // Add to target team
    newTeams[targetTeamIndex].push(d.student);

    setUnassigned(newUnassigned);
    onTeamsChange(newTeams);
    drag.current = null;
  }

  function onDropOnUnassigned(e) {
    e.preventDefault();
    const d = drag.current;
    if (!d || d.source === "unassigned") return;

    const newTeams = cloneTeams();
    newTeams[d.teamIndex].splice(d.studentIndex, 1);

    setUnassigned((prev) => [...prev, d.student]);
    onTeamsChange(newTeams);
    drag.current = null;
  }

  // remove / unassign buttons (with confirmation)

  async function handleRemoveFromTeam(teamIndex, studentIndex, student) {
    const ok = await askConfirm(
      `Remove "${student.name}" from Group ${teamIndex + 1}? They will be placed in the Unassigned pool.`
    );
    if (!ok) return;

    const newTeams = cloneTeams();
    newTeams[teamIndex].splice(studentIndex, 1);
    setUnassigned((prev) => [...prev, student]);
    onTeamsChange(newTeams);
  }

  async function handleRemoveFromUnassigned(studentIndex, student) {
    const ok = await askConfirm(
      `Permanently remove "${student.name}" from the roster?`
    );
    if (!ok) return;

    setUnassigned((prev) => prev.filter((_, i) => i !== studentIndex));
  }

  async function handleUnassignAll(teamIndex) {
    const team = teams[teamIndex];
    if (team.length === 0) return;

    const ok = await askConfirm(
      `Move all ${team.length} member(s) from Group ${teamIndex + 1} to Unassigned?`
    );
    if (!ok) return;

    const newTeams = cloneTeams();
    const removed = newTeams[teamIndex].splice(0);
    setUnassigned((prev) => [...prev, ...removed]);
    onTeamsChange(newTeams);
  }

  // render

  return (
    <div className="team-editor">
      {/* ── Confirmation dialog overlay ── */}
      {confirm && (
        <div className="te-overlay" role="dialog" aria-modal="true">
          <div className="te-dialog">
            <p className="te-dialog-msg">{confirm.message}</p>
            <div className="te-dialog-actions">
              <button className="te-btn-danger" onClick={handleConfirmYes}>
                Yes, confirm
              </button>
              <button className="te-btn-cancel" onClick={handleConfirmNo}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Teams grid */}
      <div className="te-grid">
        {teams.map((team, teamIndex) => (
          <div
            key={teamIndex}
            className="te-team-col"
            onDragOver={onDragOver}
            onDrop={(e) => onDropOnTeam(e, teamIndex)}
          >
            <div className="te-team-header">
              <span className="te-team-label">Group {teamIndex + 1}</span>
              <span className="te-team-count">{team.length} member{team.length !== 1 ? "s" : ""}</span>
              {team.length > 0 && (
                <button
                  className="te-unassign-all"
                  title="Move all to Unassigned"
                  onClick={() => handleUnassignAll(teamIndex)}
                >
                  ↩ All
                </button>
              )}
            </div>

            <div className="te-drop-zone" data-empty={team.length === 0}>
              {team.length === 0 && (
                <span className="te-drop-hint">Drop a student here</span>
              )}
              {team.map((student, si) => (
                <div
                  key={`${student.name}-${si}`}
                  className="te-student-chip"
                  draggable
                  onDragStart={() => onDragStart("team", teamIndex, si, student)}
                >
                  <span className="te-drag-handle" title="Drag to move">⠿</span>
                  <span className="te-student-name">{student.name}</span>
                  <button
                    className="te-remove-btn"
                    title="Move to Unassigned"
                    onClick={() => handleRemoveFromTeam(teamIndex, si, student)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Unassigned pool */}
      <div
        className="te-unassigned-pool"
        onDragOver={onDragOver}
        onDrop={onDropOnUnassigned}
      >
        <div className="te-team-header">
          <span className="te-team-label">⚠ Unassigned</span>
          <span className="te-team-count">{unassigned.length} student{unassigned.length !== 1 ? "s" : ""}</span>
        </div>

        <div className="te-drop-zone te-unassigned-zone" data-empty={unassigned.length === 0}>
          {unassigned.length === 0 && (
            <span className="te-drop-hint">All students are assigned · Drop here to unassign</span>
          )}
          {unassigned.map((student, si) => (
            <div
              key={`unassigned-${student.name}-${si}`}
              className="te-student-chip te-student-chip--unassigned"
              draggable
              onDragStart={() => onDragStart("unassigned", null, si, student)}
            >
              <span className="te-drag-handle" title="Drag to a team">⠿</span>
              <span className="te-student-name">{student.name}</span>
              {/* Quick-assign: clicking any team below from chip would require separate UI;
                  for now offer a remove-from-roster button */}
              <button
                className="te-remove-btn te-remove-btn--danger"
                title="Remove from roster entirely"
                onClick={() => handleRemoveFromUnassigned(si, student)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <p className="te-help-text">
        💡 Drag student names between groups or drop onto <strong>Unassigned</strong> to remove from a team.
        Click <strong>×</strong> on a team member to move them to Unassigned (with confirmation).
      </p>
    </div>
  );
}