/**
 * Time utilities for UTC → local timezone conversion.
 * Uses only built-in JavaScript APIs (Intl, Date) - no extra packages.
 * Backend stores/sends UTC; this layer handles display and notification only.
 */

/** Ensure string is parsed as UTC (append Z if no timezone suffix) */
function ensureUTC(isoString: string): string {
  if (!isoString || typeof isoString !== "string") return isoString;
  const trimmed = isoString.trim();
  // If it already has Z or offset (+/-HH:MM), use as-is
  if (/[Zz]$/.test(trimmed)) return trimmed;
  if (/[+-]\d{1,2}(:?\d{2})?$/.test(trimmed)) return trimmed;
  // Otherwise treat as UTC by appending Z
  return trimmed + "Z";
}

/** Parse UTC string to Date. Must use ensureUTC so new Date() interprets as UTC. */
export function parseUTCDate(utcString: string): Date {
  if (!utcString) return new Date(NaN);
  return new Date(ensureUTC(utcString));
}

/**
 * Get timezone abbreviation (PKT, GMT, EST, etc.).
 * Replaces "GMT+5" style with proper abbreviations where known.
 */
function getTimezoneAbbrev(date: Date): string {
  try {
    // Use default (no timeZone) - format in device's local timezone
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZoneName: "short",
    }).formatToParts(date);
    const tzPart = parts.find((p) => p.type === "timeZoneName");
    let abbrev = tzPart?.value || "UTC";

    // Replace GMT+5 style with proper abbreviations
    const gmtMatch = abbrev.match(/^GMT([+-])(\d{1,2})(?::(\d{2}))?$/);
    if (gmtMatch) {
      const sign = gmtMatch[1];
      const hours = parseInt(gmtMatch[2], 10);
      const mins = parseInt(gmtMatch[3] || "0", 10);
      const offsetMins = (hours * 60 + mins) * (sign === "+" ? 1 : -1);
      // Map common offsets to abbreviations
      const offsetMap: Record<number, string> = {
        0: "GMT",
        60: "CET",
        120: "EET",
        180: "MSK",
        330: "IST", // India
        300: "PKT", // Pakistan
        480: "CST", // China
        [-300]: "EST",
        [-360]: "CST", // US Central
        [-420]: "MST",
        [-480]: "PST",
      };
      abbrev = offsetMap[offsetMins] || abbrev;
    }

    return abbrev;
  } catch {
    return "UTC";
  }
}

/**
 * Format: "Sun, 15 Jun 2025 — 5:55 PM PKT"
 * Full event time - omit timeZone so Intl uses device default, correctly converting UTC→local.
 */
export function formatEventTime(utcString: string): string {
  const date = parseUTCDate(utcString);
  if (isNaN(date.getTime())) return "";

  // No timeZone option = Intl uses device local timezone (correct conversion)
  const datePart = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
  const timePart = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
  const abbrev = getTimezoneAbbrev(date);

  return `${datePart} — ${timePart} ${abbrev}`;
}

/**
 * Format: "5:55 PM PKT" — time only with abbreviation (for notifications, compact display)
 */
export function formatEventTimeShort(utcString: string): string {
  const date = parseUTCDate(utcString);
  if (isNaN(date.getTime())) return "";

  const timePart = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);

  return `${timePart} ${getTimezoneAbbrev(date)}`;
}

/**
 * Format date only: "Sun, 15 Jun 2025"
 */
export function formatEventDate(utcString: string): string {
  const date = parseUTCDate(utcString);
  if (isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

/** Alias for formatEventTime — full date+time display (backward compatibility) */
export const formatEventDateTime = formatEventTime;

/**
 * Format start–end range: "Sun, 15 Jun 2025 — 7:30 PM - 9:00 PM PKT" (same day)
 * or full dates for multi-day events.
 */
export function formatEventDateRange(startUtc: string, endUtc: string): string {
  const start = parseUTCDate(startUtc);
  const end = parseUTCDate(endUtc);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return "";

  const abbrev = getTimezoneAbbrev(start);
  const dateOpts: Intl.DateTimeFormatOptions = {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  };
  const timeOpts: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };

  const sameDay =
    start.getDate() === end.getDate() &&
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear();

  const startDateStr = new Intl.DateTimeFormat("en-US", dateOpts).format(start);
  const startTimeStr = new Intl.DateTimeFormat("en-US", timeOpts).format(start);
  const endTimeStr = new Intl.DateTimeFormat("en-US", timeOpts).format(end);
  const endDateStr = new Intl.DateTimeFormat("en-US", dateOpts).format(end);

  return sameDay
    ? `${startDateStr} — ${startTimeStr} - ${endTimeStr} ${abbrev}`
    : `${startDateStr} ${startTimeStr} - ${endDateStr} ${endTimeStr} ${abbrev}`;
}
