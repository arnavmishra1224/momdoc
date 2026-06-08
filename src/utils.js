export function twoWeeksFromToday() {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function todayFormatted() {
  return new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function isFollowUpDue(dateString) {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !isNaN(date) && date <= new Date();
}

export function generateId() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
}

export const STATUSES = [
  "New Lead",
  "Outreach Sent",
  "Responded",
  "Interested",
  "Follow-Up",
  "Not Interested",
  "Closed",
];
