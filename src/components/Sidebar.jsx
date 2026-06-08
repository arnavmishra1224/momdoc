export default function Sidebar({ active, onSelect }) {
  const items = [
    { id: "dashboard", label: "Dashboard", icon: "⬡" },
    { id: "candidates", label: "Candidates", icon: "◈" },
    { id: "outreach", label: "Outreach", icon: "◎" },
    { id: "followups", label: "Follow-Ups", icon: "◷" },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-text">MedRecruit</div>
      </div>
      <div className="sidebar-label">Navigation</div>
      <nav className="sidebar-nav">
        {items.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${active === item.id ? "active" : ""}`}
            onClick={() => onSelect(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
