import { useState } from "react";
import { twoWeeksFromToday, todayFormatted, generateId, STATUSES } from "../utils";

export default function Candidates({
  candidates,
  setCandidates,
  selectedCandidate,
  setSelectedCandidate,
}) {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const filtered = search.trim()
    ? candidates.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.email.toLowerCase().includes(search.toLowerCase()) ||
          c.program.toLowerCase().includes(search.toLowerCase()) ||
          c.state.toLowerCase().includes(search.toLowerCase()) ||
          c.status.toLowerCase().includes(search.toLowerCase())
      )
    : candidates;

  function handleDelete(id) {
    setCandidates(candidates.filter((c) => c.id !== id));
    setSelectedCandidate(null);
  }

  function handleAdd(candidate) {
    setCandidates([...candidates, candidate]);
    setSelectedCandidate(candidate);
    setShowAdd(false);
  }

  function handleCSVUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const rows = text.split("\n").filter((r) => r.trim());
      if (rows.length < 2) return;
      const imported = rows.slice(1).map((row) => {
        const cols = row.split(",");
        return {
          id: generateId(),
          name: cols[0] || "",
          email: cols[1] || "",
          phone: cols[2] || "",
          program: cols[3] || "",
          state: cols[4] || "",
          bioNotes: cols[5] || "",
          status: cols[6] || "New Lead",
          followUpDate: cols[7] || twoWeeksFromToday(),
          notes: cols[8] || "",
          dateAdded: todayFormatted(),
          lastContactDate: "",
          outreachCount: 0,
          hasResponded: false,
        };
      });
      setCandidates(imported);
      setSelectedCandidate(imported[0] || null);
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  async function handlePDFUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";

    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url
      ).toString();

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        fullText += content.items.map((item) => item.str).join(" ") + "\n";
      }

      const candidate = extractCandidateFromText(fullText);
      setCandidates((prev) => [...prev, candidate]);
      setSelectedCandidate(candidate);
    } catch (err) {
      console.error("PDF parse error:", err);
      alert("Could not read PDF. Make sure it is a text-based PDF (not a scanned image).");
    }
  }

  function extractCandidateFromText(text) {
    const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean);

    // Look in the first 10 lines for a short line that looks like a name:
    // 2-5 words, each starting with a capital letter, no numbers or symbols
    const nameLine = lines.slice(0, 10).find((line) => {
      const words = line.split(/\s+/);
      return (
        words.length >= 2 &&
        words.length <= 5 &&
        words.every((w) => /^[A-Z][a-zA-Z\'\-\.]+$/.test(w))
      );
    });
    const name = nameLine || lines[0]?.split(/\s+/).slice(0, 3).join(" ") || "Unknown Candidate";

    const emailMatch = text.match(/[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/);
    const email = emailMatch ? emailMatch[0] : "";

    const phoneMatch = text.match(/\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4}/);
    const phone = phoneMatch ? phoneMatch[0] : "";

    const specialties = ["Dermatopathology","OBGYN","OB/GYN","Pathology","Pediatrics","Radiology","Cardiology","Neurology"];
    const program = specialties.find((s) => text.toLowerCase().includes(s.toLowerCase())) || "Physician";

    const states = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];
    const stateMatch = text.match(/\b([A-Z]{2})\b/g);
    const state = stateMatch?.find((s) => states.includes(s)) || "";

    const bioNotes = text.slice(0, 900);

    return {
      id: generateId(),
      name,
      email,
      phone,
      program,
      state,
      bioNotes,
      status: "New Lead",
      followUpDate: twoWeeksFromToday(),
      notes: "Imported from uploaded PDF CV.",
      dateAdded: todayFormatted(),
      lastContactDate: "",
      outreachCount: 0,
      hasResponded: false,
    };
  }

  return (
    <div className="page" style={{ paddingBottom: 0, height: "100vh", display: "flex", flexDirection: "column" }}>
      <div className="candidates-layout" style={{ flex: 1, minHeight: 0 }}>
        {/* LIST PANEL */}
        <div className="candidate-list-panel">
          <div className="panel-header">
            <h2>Candidates</h2>
            <div className="panel-actions">
              <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>
                + Add
              </button>
              <label className="btn btn-sm" style={{ cursor: "pointer" }}>
                Upload CSV
                <input type="file" accept=".csv,.txt" style={{ display: "none" }} onChange={handleCSVUpload} />
              </label>
              <label className="btn btn-sm" style={{ cursor: "pointer" }}>
                Upload PDF
                <input type="file" accept=".pdf" style={{ display: "none" }} onChange={handlePDFUpload} />
              </label>
            </div>
            <input
              className="search-input"
              placeholder="Search candidates…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="candidate-list">
            {filtered.length === 0 && (
              <div style={{ padding: "20px", color: "var(--text-dim)", textAlign: "center" }}>
                No candidates found.
              </div>
            )}
            {filtered.map((c) => (
              <div
                key={c.id}
                className={`candidate-item ${selectedCandidate?.id === c.id ? "selected" : ""}`}
                onClick={() => setSelectedCandidate(c)}
              >
                <div className="candidate-name">{c.name}</div>
                <div className="candidate-program">{c.program} · {c.state}</div>
                <span className={`candidate-status-pill status-${c.status}`}>{c.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* DETAIL PANEL */}
        <div className="detail-panel">
          {selectedCandidate ? (
            <CandidateDetail
              candidate={selectedCandidate}
              candidates={candidates}
              setCandidates={setCandidates}
              setSelectedCandidate={setSelectedCandidate}
              onDelete={handleDelete}
            />
          ) : (
            <div className="empty-detail">
              <div className="empty-detail-icon">◈</div>
              <p>Upload a CV, add a candidate,<br />or select one from the list</p>
            </div>
          )}
        </div>
      </div>

      {showAdd && (
        <AddCandidateModal onSave={handleAdd} onClose={() => setShowAdd(false)} />
      )}
    </div>
  );
}

function CandidateDetail({ candidate, candidates, setCandidates, setSelectedCandidate, onDelete }) {
  const emailBody = `Hi ${candidate.name},

I came across your profile and noticed your experience with ${candidate.program} in ${candidate.state}.

I also saw your interest in:
${candidate.bioNotes}

We are currently recruiting OBGYN physicians and I thought there may be opportunities that align well with your background and interests.

Would you be open to learning more?

Best,
Gina
Recruitment Team`;

  const textMessageBody = `Hi ${candidate.name}, this is Gina with MomDoc. I came across your background in ${candidate.program} and wanted to reach out regarding physician opportunities that may align with your experience. Would you be open to learning more?`;

  function openEmail() {
    const subject = encodeURIComponent("OBGYN Opportunity");
    const body = encodeURIComponent(emailBody);
    window.open(`mailto:${candidate.email}?subject=${subject}&body=${body}`);
  }

  function sendText() {
    const cleanPhone = candidate.phone.replace(/[\s\-().]/g, "");
    const body = encodeURIComponent(textMessageBody);
    window.open(`sms:${cleanPhone}?body=${body}`);
  }

  function copyDraft() {
    navigator.clipboard.writeText(emailBody);
  }

  return (
    <>
      <div className="detail-header">
        <div>
          <div className="detail-name">{candidate.name}</div>
          <span className={`candidate-status-pill status-${candidate.status}`} style={{ marginTop: 8, display: "inline-block" }}>
            {candidate.status}
          </span>
        </div>
        <div>
          <div className="detail-date-label">Date Added</div>
          <div className="detail-date-value">{candidate.dateAdded}</div>
        </div>
      </div>

      <div className="detail-fields">
        {[
          ["Program", candidate.program],
          ["State", candidate.state],
          ["Email", candidate.email],
          ["Phone", candidate.phone],
          ["Follow-Up Date", candidate.followUpDate],
          ["Outreach Count", candidate.outreachCount],
        ].map(([label, val]) => (
          <div className="detail-field" key={label}>
            <div className="detail-field-label">{label}</div>
            <div className="detail-field-value">{val || "—"}</div>
          </div>
        ))}
      </div>

      <div>
        <div className="detail-section-label">Bio Notes</div>
        <div className="detail-section-text">{candidate.bioNotes || "—"}</div>
      </div>

      <div>
        <div className="detail-section-label">Recruiter Notes</div>
        <div className="detail-section-text">{candidate.notes || "—"}</div>
      </div>

      <div className="detail-actions">
        <button className="btn" onClick={openEmail}>Email Candidate</button>
        <button className="btn" onClick={sendText}>Send Text</button>
        <button className="btn" onClick={copyDraft}>Copy Email Draft</button>
        <button className="btn btn-danger" onClick={() => onDelete(candidate.id)}>
          Delete
        </button>
      </div>
    </>
  );
}

function AddCandidateModal({ onSave, onClose }) {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", program: "",
    state: "", bioNotes: "", status: "New Lead", notes: "",
  });

  function set(field, val) {
    setForm((f) => ({ ...f, [field]: val }));
  }

  function save() {
    if (!form.name.trim()) return;
    onSave({
      id: generateId(),
      ...form,
      followUpDate: twoWeeksFromToday(),
      dateAdded: todayFormatted(),
      lastContactDate: "",
      outreachCount: 0,
      hasResponded: false,
    });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Add Candidate</h2>
        <div className="form-grid">
          {[
            ["Name", "name", "text"],
            ["Email", "email", "email"],
            ["Phone", "phone", "text"],
            ["Program", "program", "text"],
            ["State", "state", "text"],
          ].map(([label, field, type]) => (
            <div className="form-field" key={field}>
              <label className="form-label">{label}</label>
              <input
                className="form-input"
                type={type}
                value={form[field]}
                onChange={(e) => set(field, e.target.value)}
              />
            </div>
          ))}

          <div className="form-field">
            <label className="form-label">Status</label>
            <select className="form-select" value={form.status} onChange={(e) => set("status", e.target.value)}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div className="form-field full">
            <label className="form-label">Bio Notes</label>
            <textarea className="form-textarea" value={form.bioNotes} onChange={(e) => set("bioNotes", e.target.value)} />
          </div>

          <div className="form-field full">
            <label className="form-label">Recruiter Notes</label>
            <textarea className="form-textarea" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save}>Save Candidate</button>
        </div>
      </div>
    </div>
  );
}