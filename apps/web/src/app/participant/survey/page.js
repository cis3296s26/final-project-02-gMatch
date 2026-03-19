"use client";

import link from "next/link"
import { useState } from "react";

export default function SurveyPage() {
    const [name, setName] = useState("");
    const [skill, setSkill] = useState("");
    const [availability, setAvailability] = useState("");

    function handleSubmit(e){
        e.prventDefault();

        console.log("Name:", name);
        console.log("Skills", skill);
        console.log("Availability:", availability);

        alert("Form Submitted");
    }

    return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Student Survey</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Your Name"
          className="border p-2 rounded"
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="text"
          placeholder="Your Skills"
          className="border p-2 rounded"
          onChange={(e) => setSkill(e.target.value)}
        />

        <textarea
          placeholder="Your Availability"
          className="border p-2 rounded"
          onChange={(e) => setAvailability(e.target.value)}
        />

        <button className="bg-blue-500 text-white p-2 rounded">
          Submit
        </button>
      </form>
    </div>
  );
}