import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Candidates from "./components/Candidates";
import Outreach from "./components/Outreach";
import FollowUps from "./components/FollowUps";
import "./App.css";

const STORAGE_KEY = "medrecruit_candidates";

function loadCandidates() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveCandidates(candidates) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(candidates));
}

export default function App() {
  const [section, setSection] = useState("candidates");
  const [candidates, setCandidates] = useState(loadCandidates);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  useEffect(() => {
    saveCandidates(candidates);
  }, [candidates]);

  const handleSetCandidates = (updated) => {
    setCandidates(updated);
  };

  return (
    <div className="app-shell">
      <Sidebar active={section} onSelect={setSection} />
      <main className="main-content">
        {section === "dashboard" && <Dashboard candidates={candidates} />}
        {section === "candidates" && (
          <Candidates
            candidates={candidates}
            setCandidates={handleSetCandidates}
            selectedCandidate={selectedCandidate}
            setSelectedCandidate={setSelectedCandidate}
          />
        )}
        {section === "outreach" && <Outreach />}
        {section === "followups" && (
          <FollowUps
            candidates={candidates}
            setCandidates={handleSetCandidates}
            setSelectedCandidate={setSelectedCandidate}
            setSection={setSection}
          />
        )}
      </main>
    </div>
  );
}
