/**
 * Standardized Date and Time Formatting Utilities
 * Provides reliable, elegant date and time strings across all client, team, and admin views.
 */

export function isValidDate(date: any): boolean {
  if (!date) return false;
  const d = new Date(date);
  return !isNaN(d.getTime());
}

/**
 * Format: "Aug 18, 2026 • 02:30 PM"
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date || !isValidDate(date)) return "N/A";
  const d = new Date(date);

  const datePart = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const timePart = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return `${datePart} • ${timePart}`;
}

/**
 * Format: "Aug 18, 2026 at 02:30 PM"
 */
export function formatDateTimeAt(date: string | Date | null | undefined): string {
  if (!date || !isValidDate(date)) return "N/A";
  const d = new Date(date);

  const datePart = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const timePart = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return `${datePart} at ${timePart}`;
}

/**
 * Format: "Aug 18, 2026"
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date || !isValidDate(date)) return "N/A";
  const d = new Date(date);

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format: "02:30 PM"
 */
export function formatTime(date: string | Date | null | undefined): string {
  if (!date || !isValidDate(date)) return "N/A";
  const d = new Date(date);

  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Format relative time: "Just now", "5m ago", "2h ago", "3d ago"
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date || !isValidDate(date)) return "N/A";
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();

  if (diffMs < 0) return formatDateTime(date);

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return `Yesterday at ${formatTime(date)}`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return formatDateTime(date);
}
