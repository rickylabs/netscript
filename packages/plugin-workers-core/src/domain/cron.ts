/** Cron expression type used by worker schedules. */
export type CronExpression = string;

/** Day of week values for readable scheduling. */
export const DAY_OF_WEEK = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
} as const;

/** Day of week value. */
export type DayOfWeek = (typeof DAY_OF_WEEK)[keyof typeof DAY_OF_WEEK];

function validateRange(value: number, min: number, max: number, fieldName: string): void {
  if (value < min || value > max) {
    throw new Error(`Invalid ${fieldName}: ${value}. Must be between ${min} and ${max}.`);
  }
}

/** Cron schedule factories for common worker schedules. */
export type CronPresets = Readonly<{
  everyMinute(): CronExpression;
  everyNMinutes(minutes: number): CronExpression;
  every5Minutes(): CronExpression;
  every10Minutes(): CronExpression;
  every15Minutes(): CronExpression;
  every30Minutes(): CronExpression;
  hourly(minute?: number): CronExpression;
  daily(hour?: number, minute?: number): CronExpression;
  weekly(dayOfWeek?: DayOfWeek, hour?: number, minute?: number): CronExpression;
  custom(
    minute: string | number,
    hour: string | number,
    dayOfMonth: string | number,
    month: string | number,
    dayOfWeek: string | number,
  ): CronExpression;
  validate(expression: string): boolean;
}>;

/** Cron schedule factories for common worker schedules. */
export const cron = {
  everyMinute(): CronExpression {
    return '* * * * *';
  },
  everyNMinutes(minutes: number): CronExpression {
    validateRange(minutes, 1, 59, 'minutes');
    return `*/${minutes} * * * *`;
  },
  every5Minutes(): CronExpression {
    return '*/5 * * * *';
  },
  every10Minutes(): CronExpression {
    return '*/10 * * * *';
  },
  every15Minutes(): CronExpression {
    return '*/15 * * * *';
  },
  every30Minutes(): CronExpression {
    return '*/30 * * * *';
  },
  hourly(minute: number = 0): CronExpression {
    validateRange(minute, 0, 59, 'minute');
    return `${minute} * * * *`;
  },
  daily(hour: number = 0, minute: number = 0): CronExpression {
    validateRange(hour, 0, 23, 'hour');
    validateRange(minute, 0, 59, 'minute');
    return `${minute} ${hour} * * *`;
  },
  weekly(dayOfWeek: DayOfWeek = 0, hour: number = 0, minute: number = 0): CronExpression {
    validateRange(dayOfWeek, 0, 6, 'dayOfWeek');
    validateRange(hour, 0, 23, 'hour');
    validateRange(minute, 0, 59, 'minute');
    return `${minute} ${hour} * * ${dayOfWeek}`;
  },
  custom(
    minute: string | number,
    hour: string | number,
    dayOfMonth: string | number,
    month: string | number,
    dayOfWeek: string | number,
  ): CronExpression {
    return `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;
  },
  validate(expression: string): boolean {
    const parts = expression.trim().split(/\s+/);
    if (parts.length !== 5) {
      throw new Error(`Invalid cron expression: "${expression}". Expected 5 fields.`);
    }
    return true;
  },
} as const;

/** Type guard for cron expressions. */
export function isCronExpression(value: unknown): value is CronExpression {
  if (typeof value !== 'string') return false;
  try {
    cron.validate(value);
    return true;
  } catch {
    return false;
  }
}
