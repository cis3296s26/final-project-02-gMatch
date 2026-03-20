"use client";

import { useState } from "react";
import StrategyFactory from "@/services/StrategyFactory";

export default function DashboardPage() {
  const [minSize, setMinSize] = useState(2);
  const [maxSize, setMaxSize] = useState(4);
  const [strategy, setStrategy] = useState("WeightedHybridStrategy");
  const [teams, setTeams] = useState([]);

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

    setTeams(generatedTeams);
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

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h2>Instructor Dashboard</h2>

      {/* Team Config */}
      <div>
        <h3>Team Configuration</h3>

        <label>Min Team Size</label>
        <input
          type="number"
          value={minSize}
          onChange={(e) => setMinSize(parseInt(e.target.value))}
        />

        <label>Max Team Size</label>
        <input
          type="number"
          value={maxSize}
          onChange={(e) => setMaxSize(parseInt(e.target.value))}
        />
      </div>

      {/* Strategy */}
      <div style={{ marginTop: "20px" }}>
        <h3>Matching Strategy</h3>

        <select
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
      </div>

      {/* Survey Questions */}
      <div style={{ marginTop: "20px" }}>
        <h3>Survey Questions</h3>

        <ul>
          {questions.map((q, i) => (
            <li key={i}>
              {q}
              <button
                onClick={() => removeQuestion(i)}
                style={{ marginLeft: "10px" }}
              >
                ❌
              </button>
            </li>
          ))}
        </ul>

        <input
          type="text"
          placeholder="Add new question"
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
        />
        <button onClick={addQuestion}>Add Question</button>
      </div>

      {/* Generate Button */}
      <div style={{ marginTop: "30px" }}>
        <button onClick={generateTeams}>Generate Teams</button>
      </div>

      {/* Results */}
      <div style={{ marginTop: "30px" }}>
        <h3>Generated Teams</h3>

        {teams.length === 0 && <p>No teams generated yet.</p>}

        {teams.map((team, index) => (
          <p key={index}>
            <strong>Group {index + 1}:</strong>{" "}
            {team.map((s) => s.name).join(" + ")}
          </p>
        ))}
      </div>

      {/* Config Preview */}
      <div
        style={{
          marginTop: "40px",
          background: "#f5f5f5",
          padding: "15px",
          borderRadius: "8px"
        }}
      >
        <h3>Current Configuration</h3>
        <p><strong>Team Size:</strong> {minSize} - {maxSize}</p>
        <p><strong>Strategy:</strong> {strategy}</p>

        <p><strong>Questions:</strong></p>
        <ul>
          {questions.map((q, i) => (
            <li key={i}>{q}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}