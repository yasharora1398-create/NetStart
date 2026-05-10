// Lightweight time helpers for chat. Two flavors: a relative "X ago"
// for thread-list previews and a clock-style "10:42 AM" for message
// bubbles. Both fall back to the raw ISO string if the input fails
// to parse.

export const formatRelative = (iso: string | null | undefined): string => {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const min = Math.round(diff / 60_000);
    if (min < 1) return "now";
    if (min < 60) return `${min}m`;
    const h = Math.round(min / 60);
    if (h < 24) return `${h}h`;
    const days = Math.round(h / 24);
    if (days < 7) return `${days}d`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return iso;
  }
};

export const formatTime = (iso: string): string => {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

// Day divider label for message lists. "Today" / "Yesterday" / a
// human-readable date for older messages.
export const formatDayDivider = (iso: string): string => {
  try {
    const d = new Date(iso);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const dDate = new Date(d);
    dDate.setHours(0, 0, 0, 0);
    if (dDate.getTime() === today.getTime()) return "Today";
    if (dDate.getTime() === yesterday.getTime()) return "Yesterday";
    return d.toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
};

export const dayKey = (iso: string): string => {
  try {
    const d = new Date(iso);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  } catch {
    return iso;
  }
};
