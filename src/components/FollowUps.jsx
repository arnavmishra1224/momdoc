import { isFollowUpDue } from "../utils";

export default function FollowUps({ candidates, setSelectedCandidate, setSection }) {
  const due = candidates.filter((c) => isFollowUpDue(c.followUpDate));

  function viewCandidate(c) {
    setSelectedCandidate(c);
    setSection("candidates");
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Follow-Ups Due</h1>
        <p>{due.length} candidate{due.length !== 1 ? "s" : ""} need attention</p>
      </div>

      {due.length === 0 ? (
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            padding: "40px",
            textAlign: "center",
            color: "var(--text-muted)",
          }}
        >
          ✓ No follow-ups due right now. You're all caught up.
        </div>
      ) : (
        <div className="followup-list">
          {due.map((c) => (
            <div key={c.id} className="followup-card">
              <div>
                <div className="followup-card-name">{c.name}</div>
                <div className="followup-card-due">Due: {c.followUpDate}</div>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span className={`candidate-status-pill status-${c.status}`}>{c.status}</span>
                <button className="btn btn-sm" onClick={() => viewCandidate(c)}>
                  View Candidate →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
