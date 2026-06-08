const STATUSES = [
  "New Lead",
  "Outreach Sent",
  "Responded",
  "Interested",
  "Follow-Up",
  "Not Interested",
  "Closed",
];

export default function Dashboard({ candidates }) {
  const responded = candidates.filter((c) => c.hasResponded).length;
  const dueToday = candidates.filter((c) => isFollowUpDue(c.followUpDate)).length;

  const statusCounts = STATUSES.map((s) => ({
    status: s,
    count: candidates.filter((c) => c.status === s).length,
  }));

  return (
    <div className="page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Overview of your recruiting pipeline</p>
      </div>

      <div className="stat-grid">
        <StatCard label="Total Candidates" value={candidates.length} />
        <StatCard label="Have Responded" value={responded} />
        <StatCard label="Follow-Ups Due" value={dueToday} />
        <StatCard
          label="Avg Outreach"
          value={
            candidates.length
              ? (
                  candidates.reduce((s, c) => s + (c.outreachCount || 0), 0) /
                  candidates.length
                ).toFixed(1)
              : "—"
          }
        />
      </div>

      <div className="status-breakdown">
        <div className="status-breakdown-header">Pipeline by Status</div>
        {statusCounts.map(({ status, count }) => (
          <div key={status} className="status-row">
            <span className={`candidate-status-pill status-${status}`}>{status}</span>
            <span className="status-row-count">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

function isFollowUpDue(dateString) {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !isNaN(date) && date <= new Date();
}
