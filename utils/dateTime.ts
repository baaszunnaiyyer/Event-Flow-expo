/**
 * Re-exports from timeUtils for backward compatibility.
 * All event time display should use timeUtils (Intl-based, no extra packages).
 */
export {
  parseUTCDate,
  formatEventTime,
  formatEventTimeShort,
  formatEventDate,
  formatEventDateRange,
} from "./timeUtils";

/** Alias: full format for date+time (same as formatEventTime) */
export { formatEventTime as formatEventDateTime } from "./timeUtils";
