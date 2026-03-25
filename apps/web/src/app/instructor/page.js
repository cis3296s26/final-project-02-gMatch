"use client";

import { useState } from "react";
import StrategyFactory from "@/services/StrategyFactory";

export default function DashboardPage() {
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

  // Demo student data (same as before)
  const students = [
    { name: "Alice", availability: ["Mon", "Wed"], skills: ["Java"] },
    { name: "Brian", availability: ["Mon"], skills: ["UI"] },
    { name: "Carla", availability: ["Wed"], skills: ["DB"] },
    { name: "David", availability: ["Mon", "Wed"], skills: ["Beginner"] }
  ];

  const generateTeams = () => {
    const strategyInstance = StrategyFactory.create(strategy);
    
    // using minSize for now
    const generatedTeams = strategyInstance.generate(students, minSize);
    const actionLabel = hasGenerated ? "regenerated" : "generated";

    setTeams(generatedTeams);
    setHasGenerated(true);
    setLastGeneratedStrategy(strategy);
    setStatusMessage(`Teams ${actionLabel} successfully.`);
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
    <div
      style={{
        padding: "40px",
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#f8fafc",
        minHeight: "100vh"
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto"
        }}
      >
        <h2
          style={{
            fontSize: "32px",
            marginBottom: "24px",
            color: "#111827"
          }}
        >
          Instructor Dashboard
        </h2>

        {/* Team Config */}
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
                value={minSize}
                onChange={(e) => setMinSize(parseInt(e.target.value))}
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
                value={maxSize}
                onChange={(e) => setMaxSize(parseInt(e.target.value))}
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

        {/* Strategy */}
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
          
        {/* Strategy help toggle */}
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

            Use a provided matching strategy when generating teams for the first time. To regenerate teams, choose a different strategy and click Regenerate Teams.
          </p>
        )}
      </div>

        {/* Survey Questions */}
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
              <li
                key={i}
                style={{
                  marginBottom: "10px",
                  color: "#374151"
                }}
              >
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

        {/* Generate Button */}
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

        {/* Results */}
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

          {hasGenerated && (
            <p style= {{ marginTop: 0, marginBottom: "16px", color: "#374151" }}>
              <strong>Last Generated Using:</strong>{" "}
              {formatStrategyName(lastGeneratedStrategy)}
            </p>  
          )}

          {teams.length === 0 && (
            <p style={{ color: "#6b7280" }}>No teams generated yet.</p>
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
              {team.map((s) => s.name).join(" + ")}
            </div>
          ))}
        </div>

        {/* Config Preview */}
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
          <p style={{ color: "#374151" }}>
            <strong>Team Size:</strong> {minSize} - {maxSize}
          </p>

          <p style={{ color: "#374151" }}>
            <strong>Strategy:</strong>{" "}
            {strategy === "WeightedHybridStrategy"
              ? "Weighted Hybrid"
              : strategy === "AvailabilityOnlyStrategy"
              ? "Availability Only"
              : strategy === "SkillBalancedStrategy"
              ? "Skill Balanced"
              : strategy}
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
  );
}