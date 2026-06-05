/**
 * Shared DateTime Utilities
 *
 * Provides consistent datetime handling across workers, queues, and jobs.
 * Fully leverages the Temporal API when available with graceful fallback to Date API.
 *
 * Features:
 * - Full Temporal API integration for precise timezone handling
 * - Temporal.ZonedDateTime for timezone-aware operations
 * - Temporal.Duration for duration arithmetic
 * - Temporal.Instant for UTC timestamps
 * - ISO 8601 formatting with timezone support
 * - Duration formatting and parsing
 * - Cron expression parsing to human-readable format
 * - Relative time formatting
 *
 * Note: Temporal API is now stable in Deno 2.x, so we use the built-in types.
 *
 * @module
 */

// ============================================================================
// TYPES
// ============================================================================

export interface DateTimeFormatOptions {
  /** Timezone to use (default: UTC) */
  timezone?: string;
  /** Include date in output */
  includeDate?: boolean;
  /** Include time in output */
  includeTime?: boolean;
  /** Include seconds */
  includeSeconds?: boolean;
  /** Include milliseconds */
  includeMilliseconds?: boolean;
  /** Use 24-hour format */
  use24Hour?: boolean;
}

export interface DurationFormatOptions {
  /** Show milliseconds for durations under 1 second */
  showMilliseconds?: boolean;
  /** Compact format (e.g., "1h 2m" instead of "1 hour 2 minutes") */
  compact?: boolean;
  /** Maximum units to show (e.g., 2 = "1h 2m", not "1h 2m 30s") */
  maxUnits?: number;
}

export interface ParsedDuration {
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
  totalMilliseconds: number;
}

export interface TemporalDateTime {
  /** The underlying Temporal.ZonedDateTime if available */
  zdt?: Temporal.ZonedDateTime;
  /** Fallback Date object */
  date: Date;
  /** The timezone used */
  timezone: string;
  /** Whether Temporal API is being used */
  usingTemporal: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Get the system timezone - uses Temporal API if available, falls back to Intl
const getDefaultTimezone = (): string => {
  try {
    // Try Temporal API first (most accurate)
    if (typeof globalThis !== 'undefined' && globalThis.Temporal?.Now?.timeZoneId) {
      return globalThis.Temporal.Now.timeZoneId();
    }
  } catch {
    // Fall through
  }

  try {
    // Fall back to Intl API
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    // Ultimate fallback
    return 'UTC';
  }
};

export const DEFAULT_TIMEZONE = getDefaultTimezone();

// Check for Temporal API support
// Note: We need to check more carefully since Deno exposes Temporal but the check may fail
export const hasTemporalSupport: boolean = (() => {
  try {
    // First check if Temporal exists on globalThis
    if (typeof globalThis === 'undefined') return false;

    const temporal = globalThis.Temporal;
    if (!temporal) return false;

    // Check if Now exists and has the required methods
    if (!temporal.Now) return false;

    // Try to actually call the API to verify it works
    // This is more reliable than typeof checks which can fail in some environments
    const instant = temporal.Now.instant();
    if (!instant || typeof instant.epochMilliseconds !== 'number') return false;

    // Verify zonedDateTimeISO works
    const zdt = temporal.Now.zonedDateTimeISO('UTC');
    if (!zdt || typeof zdt.epochMilliseconds !== 'number') return false;

    return true;
  } catch {
    return false;
  }
})();

// ============================================================================
// TEMPORAL API WRAPPERS
// ============================================================================

/**
 * Get a Temporal.Instant from various inputs
 */
export function toInstant(input: Date | string | number): Temporal.Instant | null {
  if (!hasTemporalSupport) return null;

  try {
    const temporal = globalThis.Temporal;
    if (typeof input === 'number') {
      return temporal.Instant.fromEpochMilliseconds(input);
    }
    if (input instanceof Date) {
      return temporal.Instant.fromEpochMilliseconds(input.getTime());
    }
    if (typeof input === 'string') {
      return temporal.Instant.from(input);
    }
  } catch {
    // Fall through
  }
  return null;
}

/**
 * Get a Temporal.ZonedDateTime from various inputs
 */
export function toZonedDateTime(
  input: Date | string | number,
  timezone: string = DEFAULT_TIMEZONE,
): Temporal.ZonedDateTime | null {
  if (!hasTemporalSupport) return null;

  const instant = toInstant(input);
  if (!instant) return null;

  try {
    return instant.toZonedDateTimeISO(timezone);
  } catch {
    return null;
  }
}

/**
 * Create a Temporal.Duration from milliseconds
 */
export function toDuration(milliseconds: number): Temporal.Duration | null {
  if (!hasTemporalSupport) return null;

  try {
    const hours = Math.floor(milliseconds / 3600000);
    const minutes = Math.floor((milliseconds % 3600000) / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    const ms = milliseconds % 1000;

    const temporal = globalThis.Temporal;
    return temporal.Duration.from({
      hours,
      minutes,
      seconds,
      milliseconds: ms,
    });
  } catch {
    return null;
  }
}

// ============================================================================
// CORE DATETIME FUNCTIONS
// ============================================================================

/**
 * Get the current datetime with full Temporal support
 *
 * @param timezone - Timezone to use (default: UTC)
 * @returns TemporalDateTime object with both Temporal and Date representations
 */
export function nowTemporal(timezone: string = DEFAULT_TIMEZONE): TemporalDateTime {
  if (hasTemporalSupport) {
    try {
      const temporal = globalThis.Temporal;
      const zdt = temporal.Now.zonedDateTimeISO(timezone);
      return {
        zdt,
        date: new Date(zdt.epochMilliseconds),
        timezone,
        usingTemporal: true,
      };
    } catch (e) {
      // Log error for debugging, then fall back to Date
      console.warn('[datetime] Temporal API call failed, falling back to Date:', e);
    }
  }

  return {
    date: new Date(),
    timezone,
    usingTemporal: false,
  };
}

/**
 * Get the current datetime as a Date object
 *
 * @param timezone - Timezone to use (default: UTC)
 * @returns Current Date object
 */
export function now(timezone: string = DEFAULT_TIMEZONE): Date {
  return nowTemporal(timezone).date;
}

/**
 * Get the current timestamp as ISO string
 *
 * @param timezone - Timezone for formatting (default: UTC)
 * @returns ISO 8601 datetime string
 */
export function nowISO(timezone: string = DEFAULT_TIMEZONE): string {
  if (hasTemporalSupport) {
    try {
      const temporal = globalThis.Temporal;
      const zdt = temporal.Now.zonedDateTimeISO(timezone);
      return zdt.toString();
    } catch {
      // Fall back
    }
  }
  return new Date().toISOString();
}

/**
 * Get the current instant (UTC timestamp)
 */
export function nowInstant(): Temporal.Instant | Date {
  if (hasTemporalSupport) {
    try {
      const temporal = globalThis.Temporal;
      return temporal.Now.instant();
    } catch {
      // Fall back
    }
  }
  return new Date();
}

/**
 * Parse an ISO string or date-like value to a Date object
 *
 * @param input - ISO string, Date, or timestamp
 * @returns Date object or null if invalid
 */
export function parseDate(input: string | Date | number | null | undefined): Date | null {
  if (input === null || input === undefined) return null;

  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : input;
  }

  if (typeof input === 'number') {
    const date = new Date(input);
    return isNaN(date.getTime()) ? null : date;
  }

  if (typeof input === 'string') {
    // Try Temporal first for better parsing
    if (hasTemporalSupport) {
      try {
        const temporal = globalThis.Temporal;
        const instant = temporal.Instant.from(input);
        return new Date(instant.epochMilliseconds);
      } catch {
        // Try ZonedDateTime
        try {
          const temporal = globalThis.Temporal;
          const zdt = temporal.ZonedDateTime.from(input);
          return new Date(zdt.epochMilliseconds);
        } catch {
          // Fall through to Date parsing
        }
      }
    }

    // Fallback to Date parsing
    const date = new Date(input);
    if (!isNaN(date.getTime())) return date;
  }

  return null;
}

/**
 * Convert a date to ISO 8601 string with optional timezone
 *
 * @param date - Date to convert
 * @param timezone - Timezone for formatting (default: UTC)
 * @returns ISO 8601 datetime string
 */
export function toISO(date: Date | string | number, timezone: string = DEFAULT_TIMEZONE): string {
  const d = parseDate(date);
  if (!d) return '';

  if (hasTemporalSupport) {
    try {
      const temporal = globalThis.Temporal;
      const instant = temporal.Instant.fromEpochMilliseconds(d.getTime());
      if (timezone === 'UTC') {
        return instant.toString();
      }
      const zdt = instant.toZonedDateTimeISO(timezone);
      return zdt.toString();
    } catch {
      // Fall through
    }
  }

  return d.toISOString();
}

/**
 * Format a datetime for display
 *
 * @param input - Date, ISO string, or timestamp
 * @param options - Formatting options
 * @returns Formatted datetime string
 */
export function formatDateTime(
  input: string | Date | number | null | undefined,
  options: DateTimeFormatOptions = {},
): string {
  const date = parseDate(input);
  if (!date) return '-';

  const {
    timezone = DEFAULT_TIMEZONE,
    includeDate = true,
    includeTime = true,
    includeSeconds = false,
    includeMilliseconds = false,
    use24Hour = true,
  } = options;

  // Use Temporal for more accurate timezone handling
  if (hasTemporalSupport) {
    try {
      const zdt = toZonedDateTime(date, timezone);
      if (zdt) {
        const parts: string[] = [];

        if (includeDate) {
          const monthNames = [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'May',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Oct',
            'Nov',
            'Dec',
          ];
          parts.push(`${monthNames[zdt.month - 1]} ${zdt.day}, ${zdt.year}`);
        }

        if (includeTime) {
          let hour = zdt.hour;
          let period = '';

          if (!use24Hour) {
            period = hour >= 12 ? ' PM' : ' AM';
            hour = hour % 12 || 12;
          }

          let timeStr = `${hour.toString().padStart(2, '0')}:${
            zdt.minute.toString().padStart(2, '0')
          }`;

          if (includeSeconds) {
            timeStr += `:${zdt.second.toString().padStart(2, '0')}`;
          }

          if (includeMilliseconds) {
            timeStr += `.${zdt.millisecond.toString().padStart(3, '0')}`;
          }

          parts.push(timeStr + period);
        }

        return parts.join(', ');
      }
    } catch {
      // Fall through to Intl
    }
  }

  // Fallback to Intl.DateTimeFormat
  try {
    const formatOptions: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
    };

    if (includeDate) {
      formatOptions.year = 'numeric';
      formatOptions.month = 'short';
      formatOptions.day = 'numeric';
    }

    if (includeTime) {
      formatOptions.hour = '2-digit';
      formatOptions.minute = '2-digit';
      formatOptions.hour12 = !use24Hour;

      if (includeSeconds) {
        formatOptions.second = '2-digit';
      }

      if (includeMilliseconds) {
        formatOptions.fractionalSecondDigits = 3;
      }
    }

    return new Intl.DateTimeFormat('en-US', formatOptions).format(date);
  } catch {
    // Last resort fallback
    return date.toISOString();
  }
}

/**
 * Format just the time portion
 */
export function formatTime(
  input: string | Date | number | null | undefined,
  options: Omit<DateTimeFormatOptions, 'includeDate'> = {},
): string {
  return formatDateTime(input, { ...options, includeDate: false, includeTime: true });
}

/**
 * Format just the date portion
 */
export function formatDate(
  input: string | Date | number | null | undefined,
  options: Omit<DateTimeFormatOptions, 'includeTime'> = {},
): string {
  return formatDateTime(input, { ...options, includeDate: true, includeTime: false });
}

// ============================================================================
// RELATIVE TIME
// ============================================================================

/**
 * Format a time difference as relative time (e.g., "2 minutes ago")
 *
 * @param diffMs - Difference in milliseconds (positive = past, negative = future)
 * @returns Human-readable relative time string
 */
export function formatRelativeTime(diffMs: number): string {
  const absDiff = Math.abs(diffMs);
  const isPast = diffMs >= 0;

  // Use Temporal.Duration for more precise calculations if available
  if (hasTemporalSupport && absDiff > 0) {
    try {
      const duration = toDuration(absDiff);
      if (duration) {
        const totalHours = duration.total({ unit: 'hours' });
        const totalMinutes = duration.total({ unit: 'minutes' });
        const totalSeconds = duration.total({ unit: 'seconds' });

        if (totalSeconds < 1) {
          return 'just now';
        }

        if (totalSeconds < 60) {
          const seconds = Math.floor(totalSeconds);
          const unit = seconds === 1 ? 'second' : 'seconds';
          return isPast ? `${seconds} ${unit} ago` : `in ${seconds} ${unit}`;
        }

        if (totalMinutes < 60) {
          const minutes = Math.floor(totalMinutes);
          const unit = minutes === 1 ? 'minute' : 'minutes';
          return isPast ? `${minutes} ${unit} ago` : `in ${minutes} ${unit}`;
        }

        if (totalHours < 24) {
          const hours = Math.floor(totalHours);
          const unit = hours === 1 ? 'hour' : 'hours';
          return isPast ? `${hours} ${unit} ago` : `in ${hours} ${unit}`;
        }

        const days = Math.floor(totalHours / 24);
        const unit = days === 1 ? 'day' : 'days';
        return isPast ? `${days} ${unit} ago` : `in ${days} ${unit}`;
      }
    } catch {
      // Fall through
    }
  }

  // Fallback implementation
  if (absDiff < 1000) {
    return 'just now';
  }

  if (absDiff < 60000) {
    const seconds = Math.floor(absDiff / 1000);
    const unit = seconds === 1 ? 'second' : 'seconds';
    return isPast ? `${seconds} ${unit} ago` : `in ${seconds} ${unit}`;
  }

  if (absDiff < 3600000) {
    const minutes = Math.floor(absDiff / 60000);
    const unit = minutes === 1 ? 'minute' : 'minutes';
    return isPast ? `${minutes} ${unit} ago` : `in ${minutes} ${unit}`;
  }

  if (absDiff < 86400000) {
    const hours = Math.floor(absDiff / 3600000);
    const unit = hours === 1 ? 'hour' : 'hours';
    return isPast ? `${hours} ${unit} ago` : `in ${hours} ${unit}`;
  }

  const days = Math.floor(absDiff / 86400000);
  const unit = days === 1 ? 'day' : 'days';
  return isPast ? `${days} ${unit} ago` : `in ${days} ${unit}`;
}

/**
 * Get relative time from a date to now
 */
export function timeAgo(input: string | Date | number | null | undefined): string {
  const date = parseDate(input);
  if (!date) return '-';

  // Use Temporal for precise difference if available
  if (hasTemporalSupport) {
    try {
      const temporal = globalThis.Temporal;
      const nowInstant = temporal.Now.instant();
      const thenInstant = temporal.Instant.fromEpochMilliseconds(date.getTime());
      // Calculate difference in milliseconds directly using epochMilliseconds
      const diffMs = nowInstant.epochMilliseconds - thenInstant.epochMilliseconds;
      return formatRelativeTime(diffMs);
    } catch {
      // Fall through
    }
  }

  return formatRelativeTime(Date.now() - date.getTime());
}

// ============================================================================
// DURATION FORMATTING
// ============================================================================

/**
 * Parse milliseconds into duration components
 */
export function parseDuration(durationMs: number): ParsedDuration {
  const totalMilliseconds = Math.max(0, durationMs);

  // Use Temporal.Duration if available
  if (hasTemporalSupport) {
    try {
      const duration = toDuration(totalMilliseconds);
      if (duration) {
        return {
          hours: duration.hours,
          minutes: duration.minutes,
          seconds: duration.seconds,
          milliseconds: duration.milliseconds,
          totalMilliseconds,
        };
      }
    } catch {
      // Fall through
    }
  }

  // Fallback calculation
  const hours = Math.floor(totalMilliseconds / 3600000);
  const minutes = Math.floor((totalMilliseconds % 3600000) / 60000);
  const seconds = Math.floor((totalMilliseconds % 60000) / 1000);
  const milliseconds = totalMilliseconds % 1000;

  return {
    hours,
    minutes,
    seconds,
    milliseconds,
    totalMilliseconds,
  };
}

/**
 * Format a duration in milliseconds to human-readable format
 *
 * @param durationMs - Duration in milliseconds
 * @param options - Formatting options
 * @returns Human-readable duration string
 */
export function formatDuration(
  durationMs: number | null | undefined,
  options: DurationFormatOptions = {},
): string {
  if (durationMs === null || durationMs === undefined || durationMs < 0) {
    return '-';
  }

  const { showMilliseconds = true, compact = false, maxUnits = 3 } = options;
  const { hours, minutes, seconds, milliseconds } = parseDuration(durationMs);

  // Less than 1 second
  if (durationMs < 1000) {
    if (showMilliseconds) {
      return compact ? `${durationMs}ms` : `${durationMs} milliseconds`;
    }
    return compact ? '<1s' : 'less than 1 second';
  }

  const parts: string[] = [];

  if (hours > 0 && parts.length < maxUnits) {
    parts.push(compact ? `${hours}h` : `${hours} ${hours === 1 ? 'hour' : 'hours'}`);
  }

  if (minutes > 0 && parts.length < maxUnits) {
    parts.push(compact ? `${minutes}m` : `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
  }

  if (seconds > 0 && parts.length < maxUnits) {
    if (durationMs < 60000) {
      // For durations under 1 minute, show decimal seconds
      const decimalSeconds = (seconds + milliseconds / 1000).toFixed(2);
      parts.push(compact ? `${decimalSeconds}s` : `${decimalSeconds} seconds`);
    } else {
      parts.push(compact ? `${seconds}s` : `${seconds} ${seconds === 1 ? 'second' : 'seconds'}`);
    }
  }

  if (parts.length === 0) {
    return compact ? '<1s' : 'less than 1 second';
  }

  return compact ? parts.join(' ') : parts.join(', ');
}

// ============================================================================
// CRON UTILITIES
// ============================================================================

/**
 * Parse a cron expression to human-readable format
 *
 * @param cronExpression - Standard 5-field cron expression
 * @returns Human-readable description
 */
export function parseCronToHuman(cronExpression: string): string {
  if (!cronExpression) return '-';

  const parts = cronExpression.trim().split(/\s+/);
  if (parts.length !== 5) return cronExpression;

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  // Every minute: * * * * *
  if (minute === '*' && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return 'Every minute';
  }

  // Every N minutes: */N * * * *
  if (
    minute.startsWith('*/') && hour === '*' && dayOfMonth === '*' && month === '*' &&
    dayOfWeek === '*'
  ) {
    const interval = minute.slice(2);
    return interval === '1' ? 'Every minute' : `Every ${interval} minutes`;
  }

  // Every hour at minute X: X * * * *
  if (
    /^\d+$/.test(minute) && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*'
  ) {
    const m = parseInt(minute, 10);
    if (m === 0) return 'Every hour';
    return `Every hour at :${m.toString().padStart(2, '0')}`;
  }

  // Every N hours: 0 */N * * *
  if (
    minute === '0' && hour.startsWith('*/') && dayOfMonth === '*' && month === '*' &&
    dayOfWeek === '*'
  ) {
    const interval = hour.slice(2);
    return interval === '1' ? 'Every hour' : `Every ${interval} hours`;
  }

  // Daily at specific time: M H * * *
  if (
    /^\d+$/.test(minute) && /^\d+$/.test(hour) && dayOfMonth === '*' && month === '*' &&
    dayOfWeek === '*'
  ) {
    const h = parseInt(hour, 10);
    const m = parseInt(minute, 10);
    const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

    if (h === 0 && m === 0) return 'Daily at midnight';
    if (h === 12 && m === 0) return 'Daily at noon';
    return `Daily at ${timeStr}`;
  }

  // Weekly on specific days: M H * * D
  if (
    /^\d+$/.test(minute) && /^\d+$/.test(hour) && dayOfMonth === '*' && month === '*' &&
    dayOfWeek !== '*'
  ) {
    const h = parseInt(hour, 10);
    const m = parseInt(minute, 10);
    const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    const days = parseDayOfWeek(dayOfWeek);
    return `${days} at ${timeStr}`;
  }

  // Monthly on specific day: M H D * *
  if (
    /^\d+$/.test(minute) && /^\d+$/.test(hour) && /^\d+$/.test(dayOfMonth) && month === '*' &&
    dayOfWeek === '*'
  ) {
    const h = parseInt(hour, 10);
    const m = parseInt(minute, 10);
    const d = parseInt(dayOfMonth, 10);
    const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    const ordinal = getOrdinalSuffix(d);
    return `Monthly on the ${d}${ordinal} at ${timeStr}`;
  }

  // Return original if we can't parse it
  return cronExpression;
}

/**
 * Parse day of week from cron to human readable
 */
function parseDayOfWeek(dow: string): string {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const shortDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Single day: 0-6
  if (/^[0-6]$/.test(dow)) {
    return `Every ${dayNames[parseInt(dow, 10)]}`;
  }

  // Range: 1-5 (Mon-Fri)
  if (dow === '1-5') {
    return 'Weekdays';
  }

  // Weekend: 0,6 or 6,0
  if (dow === '0,6' || dow === '6,0') {
    return 'Weekends';
  }

  // Comma-separated list
  if (dow.includes(',')) {
    const days = dow.split(',').map((d) => {
      const num = parseInt(d.trim(), 10);
      return isNaN(num) ? d : shortDayNames[num] || d;
    });
    return `Every ${days.join(', ')}`;
  }

  // Range: X-Y
  if (dow.includes('-')) {
    const [start, end] = dow.split('-').map((d) => parseInt(d.trim(), 10));
    if (!isNaN(start) && !isNaN(end)) {
      return `${shortDayNames[start]}-${shortDayNames[end]}`;
    }
  }

  return dow;
}

/**
 * Get ordinal suffix for a number (1st, 2nd, 3rd, etc.)
 */
function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

// ============================================================================
// TIMEZONE UTILITIES
// ============================================================================

/**
 * Get the system's current timezone ID
 * Uses Temporal API when available for accuracy
 */
export function getSystemTimezone(): string {
  if (hasTemporalSupport) {
    try {
      return Temporal.Now.timeZoneId();
    } catch {
      // Fall through
    }
  }

  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

/**
 * Get common timezone identifiers
 */
export function getCommonTimezones(): string[] {
  return [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Sao_Paulo',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Moscow',
    'Asia/Dubai',
    'Asia/Kolkata',
    'Asia/Singapore',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney',
    'Pacific/Auckland',
  ];
}

/**
 * Check if a timezone identifier is valid
 */
export function isValidTimezone(timezone: string): boolean {
  if (hasTemporalSupport) {
    try {
      Temporal.Now.zonedDateTimeISO(timezone);
      return true;
    } catch {
      return false;
    }
  }

  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Convert a date from one timezone to another
 * Full Temporal support for accurate conversions
 */
export function convertTimezone(
  input: Date | string | number,
  _fromTimezone: string,
  toTimezone: string,
): Date | null {
  const date = parseDate(input);
  if (!date) return null;

  if (hasTemporalSupport) {
    try {
      const instant = Temporal.Instant.fromEpochMilliseconds(date.getTime());
      const zdt = instant.toZonedDateTimeISO(toTimezone);
      return new Date(zdt.epochMilliseconds);
    } catch {
      // Fall through
    }
  }

  // Fallback: Return original date
  // Note: Proper timezone conversion requires Temporal or a library
  return date;
}

/**
 * Get the offset for a timezone at a specific instant
 */
export function getTimezoneOffset(timezone: string, at?: Date): string {
  const date = at || new Date();

  if (hasTemporalSupport) {
    try {
      const instant = Temporal.Instant.fromEpochMilliseconds(date.getTime());
      const zdt = instant.toZonedDateTimeISO(timezone);
      // Format offset from the ZonedDateTime string representation
      const str = zdt.toString();
      const match = str.match(/([+-]\d{2}:\d{2})/);
      return match ? match[1] : '+00:00';
    } catch {
      // Fall through
    }
  }

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'shortOffset',
    });
    const parts = formatter.formatToParts(date);
    const offsetPart = parts.find((p) => p.type === 'timeZoneName');
    return offsetPart?.value || '+00:00';
  } catch {
    return '+00:00';
  }
}

// ============================================================================
// COMPARISON UTILITIES
// ============================================================================

/**
 * Check if a date is before another date
 */
export function isBefore(date: Date | string, compare: Date | string): boolean {
  const d1 = parseDate(date);
  const d2 = parseDate(compare);
  if (!d1 || !d2) return false;
  return d1.getTime() < d2.getTime();
}

/**
 * Check if a date is after another date
 */
export function isAfter(date: Date | string, compare: Date | string): boolean {
  const d1 = parseDate(date);
  const d2 = parseDate(compare);
  if (!d1 || !d2) return false;
  return d1.getTime() > d2.getTime();
}

/**
 * Check if a date is between two dates
 */
export function isBetween(date: Date | string, start: Date | string, end: Date | string): boolean {
  return isAfter(date, start) && isBefore(date, end);
}

/**
 * Get the difference between two dates in milliseconds
 * Uses Temporal for precision when available
 */
export function diffMs(date1: Date | string, date2: Date | string): number {
  const d1 = parseDate(date1);
  const d2 = parseDate(date2);
  if (!d1 || !d2) return 0;

  if (hasTemporalSupport) {
    try {
      const i1 = Temporal.Instant.fromEpochMilliseconds(d1.getTime());
      const i2 = Temporal.Instant.fromEpochMilliseconds(d2.getTime());
      const duration = i2.until(i1);
      return duration.total('milliseconds');
    } catch {
      // Fall through
    }
  }

  return d1.getTime() - d2.getTime();
}

// ============================================================================
// DATE ARITHMETIC (Using Temporal when available)
// ============================================================================

/**
 * Add milliseconds to a date
 */
export function addMs(date: Date | string, ms: number): Date | null {
  const d = parseDate(date);
  if (!d) return null;

  if (hasTemporalSupport) {
    try {
      const instant = Temporal.Instant.fromEpochMilliseconds(d.getTime());
      const newInstant = instant.add({ milliseconds: ms });
      return new Date(newInstant.epochMilliseconds);
    } catch {
      // Fall through
    }
  }

  return new Date(d.getTime() + ms);
}

/**
 * Add seconds to a date
 */
export function addSeconds(date: Date | string, seconds: number): Date | null {
  return addMs(date, seconds * 1000);
}

/**
 * Add minutes to a date
 */
export function addMinutes(date: Date | string, minutes: number): Date | null {
  return addMs(date, minutes * 60000);
}

/**
 * Add hours to a date
 */
export function addHours(date: Date | string, hours: number): Date | null {
  return addMs(date, hours * 3600000);
}

/**
 * Add days to a date
 */
export function addDays(date: Date | string, days: number): Date | null {
  return addMs(date, days * 86400000);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Temporal wrappers
  toInstant,
  toZonedDateTime,
  toDuration,
  hasTemporalSupport,

  // Core
  now,
  nowTemporal,
  nowISO,
  nowInstant,
  parseDate,
  toISO,
  formatDateTime,
  formatTime,
  formatDate,

  // Relative
  formatRelativeTime,
  timeAgo,

  // Duration
  parseDuration,
  formatDuration,

  // Cron
  parseCronToHuman,

  // Timezone
  getSystemTimezone,
  getCommonTimezones,
  isValidTimezone,
  convertTimezone,
  getTimezoneOffset,

  // Comparison
  isBefore,
  isAfter,
  isBetween,
  diffMs,

  // Arithmetic
  addMs,
  addSeconds,
  addMinutes,
  addHours,
  addDays,

  // Constants
  DEFAULT_TIMEZONE,
};
