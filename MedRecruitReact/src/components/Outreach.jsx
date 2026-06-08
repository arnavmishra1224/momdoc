export default function Outreach() {
  return (
    <div className="page">
      <div className="page-header">
        <h1>Outreach</h1>
        <p>Generate personalized emails from the Candidates section.</p>
      </div>
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "32px",
          color: "var(--text-muted)",
          lineHeight: 1.7,
          maxWidth: 560,
        }}
      >
        <p style={{ marginBottom: 12 }}>
          To send outreach to a candidate:
        </p>
        <ol style={{ paddingLeft: 18, display: "flex", flexDirection: "column", gap: 8 }}>
          <li>Go to <strong style={{ color: "var(--text-primary)" }}>Candidates</strong></li>
          <li>Select a candidate from the list</li>
          <li>Click <strong style={{ color: "var(--text-primary)" }}>Email Candidate</strong> to open your mail client, or <strong style={{ color: "var(--text-primary)" }}>Copy Email Draft</strong> to copy a pre-written message.</li>
        </ol>
      </div>
    </div>
  );
}
