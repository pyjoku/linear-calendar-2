/**
 * @fileoverview LocalDate model for timezone-safe date handling.
 *
 * This module provides a simple, immutable date representation that avoids
 * the timezone pitfalls of JavaScript's native Date object. All dates are
 * represented as plain objects with year, month, and day components.
 *
 * IMPORTANT: This module intentionally avoids using JavaScript Date objects
 * to ensure timezone-safe date handling throughout the application.
 *
 * @module LocalDate
 */

/**
 * Represents a calendar date without time or timezone information.
 *
 * This is a pure data structure that represents a date as it appears
 * on a calendar, independent of any timezone considerations.
 *
 * @example
 * const date: LocalDate = { year: 2024, month: 3, day: 15 };
 */
export interface LocalDate {
  /** The full year (e.g., 2024) */
  readonly year: number;

  /** The month of the year (1-12, where 1 = January) */
  readonly month: number;

  /** The day of the month (1-31) */
  readonly day: number;
}

/**
 * Creates a new LocalDate object.
 *
 * @param year - The full year (e.g., 2024)
 * @param month - The month (1-12, where 1 = January)
 * @param day - The day of the month (1-31)
 * @returns A new frozen LocalDate object
 * @throws {Error} If the date components are invalid
 *
 * @example
 * const date = createLocalDate(2024, 3, 15); // March 15, 2024
 */
export function createLocalDate(year: number, month: number, day: number): LocalDate {
  const date: LocalDate = { year, month, day };

  if (!isValidLocalDate(date)) {
    throw new Error(`Invalid date: ${year}-${month}-${day}`);
  }

  return Object.freeze(date);
}

/**
 * Converts a LocalDate to a string key for use in Maps and Sets.
 *
 * The format is "YYYY-MM-DD" with zero-padded month and day.
 *
 * @param date - The LocalDate to convert
 * @returns A string in the format "YYYY-MM-DD"
 *
 * @example
 * const key = localDateToKey({ year: 2024, month: 3, day: 5 }); // "2024-03-05"
 */
export function localDateToKey(date: LocalDate): string {
  const monthStr = date.month.toString().padStart(2, '0');
  const dayStr = date.day.toString().padStart(2, '0');
  return `${date.year}-${monthStr}-${dayStr}`;
}

/**
 * Parses a date string in "YYYY-MM-DD" format to a LocalDate.
 *
 * @param key - A string in the format "YYYY-MM-DD"
 * @returns A frozen LocalDate object, or null if parsing fails
 *
 * @example
 * const date = keyToLocalDate("2024-03-15"); // { year: 2024, month: 3, day: 15 }
 */
export function keyToLocalDate(key: string): LocalDate | null {
  const match = key.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  const date: LocalDate = { year, month, day };

  if (!isValidLocalDate(date)) {
    return null;
  }

  return Object.freeze(date);
}

/**
 * Compares two LocalDate objects.
 *
 * @param a - The first date
 * @param b - The second date
 * @returns A negative number if a < b, positive if a > b, zero if equal
 *
 * @example
 * const result = compareLocalDates(date1, date2);
 * if (result < 0) console.log("date1 is earlier");
 * if (result > 0) console.log("date1 is later");
 * if (result === 0) console.log("dates are equal");
 */
export function compareLocalDates(a: LocalDate, b: LocalDate): number {
  if (a.year !== b.year) {
    return a.year - b.year;
  }
  if (a.month !== b.month) {
    return a.month - b.month;
  }
  return a.day - b.day;
}

/**
 * Checks if two LocalDate objects represent the same date.
 *
 * @param a - The first date
 * @param b - The second date
 * @returns True if the dates are equal, false otherwise
 */
export function localDatesEqual(a: LocalDate, b: LocalDate): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

/**
 * Validates a LocalDate object.
 *
 * Checks that:
 * - Year is a positive integer
 * - Month is between 1 and 12
 * - Day is valid for the given month and year (accounts for leap years)
 *
 * @param date - The date to validate
 * @returns True if the date is valid, false otherwise
 *
 * @example
 * isValidLocalDate({ year: 2024, month: 2, day: 29 }); // true (leap year)
 * isValidLocalDate({ year: 2023, month: 2, day: 29 }); // false (not leap year)
 */
export function isValidLocalDate(date: LocalDate): boolean {
  const { year, month, day } = date;

  // Check basic constraints
  if (!Number.isInteger(year) || year < 1) {
    return false;
  }

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return false;
  }

  if (!Number.isInteger(day) || day < 1) {
    return false;
  }

  // Check day is valid for the month
  const daysInMonth = getDaysInMonth(year, month);
  return day <= daysInMonth;
}

/**
 * Gets the number of days in a given month.
 *
 * @param year - The year (needed for leap year calculation)
 * @param month - The month (1-12)
 * @returns The number of days in the month
 */
export function getDaysInMonth(year: number, month: number): number {
  const daysPerMonth: readonly number[] = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  if (month === 2 && isLeapYear(year)) {
    return 29;
  }

  return daysPerMonth[month - 1];
}

/**
 * Checks if a year is a leap year.
 *
 * @param year - The year to check
 * @returns True if the year is a leap year, false otherwise
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

/**
 * Gets the day of the week for a LocalDate.
 *
 * Uses Zeller's congruence algorithm to calculate the weekday
 * without using JavaScript Date objects.
 *
 * @param date - The date to get the weekday for
 * @returns The day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 */
export function getWeekday(date: LocalDate): number {
  let year = date.year;
  let month = date.month;
  const day = date.day;

  // Adjust for Zeller's congruence (January and February are months 13 and 14 of previous year)
  if (month < 3) {
    month += 12;
    year -= 1;
  }

  const q = day;
  const m = month;
  const k = year % 100;
  const j = Math.floor(year / 100);

  // Zeller's congruence
  let h = (q + Math.floor((13 * (m + 1)) / 5) + k + Math.floor(k / 4) + Math.floor(j / 4) - 2 * j) % 7;

  // Handle negative modulo result
  h = ((h % 7) + 7) % 7;

  // Convert from Zeller's result (0 = Saturday) to standard (0 = Sunday)
  return (h + 6) % 7;
}

/**
 * Adds a specified number of days to a LocalDate.
 *
 * @param date - The starting date
 * @param days - The number of days to add (can be negative)
 * @returns A new frozen LocalDate with the days added
 */
export function addDays(date: LocalDate, days: number): LocalDate {
  let year = date.year;
  let month = date.month;
  let day = date.day + days;

  // Handle positive overflow
  while (day > getDaysInMonth(year, month)) {
    day -= getDaysInMonth(year, month);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  // Handle negative overflow
  while (day < 1) {
    month -= 1;
    if (month < 1) {
      month = 12;
      year -= 1;
    }
    day += getDaysInMonth(year, month);
  }

  return Object.freeze({ year, month, day });
}

/**
 * Subtracts a specified number of days from a LocalDate.
 *
 * @param date - The starting date
 * @param days - The number of days to subtract
 * @returns A new frozen LocalDate with the days subtracted
 */
export function subtractDays(date: LocalDate, days: number): LocalDate {
  return addDays(date, -days);
}

/**
 * Gets today's date as a LocalDate.
 *
 * Note: This is the only function that uses JavaScript Date,
 * and it only extracts the local date components.
 *
 * @returns Today's date as a frozen LocalDate
 */
export function getToday(): LocalDate {
  const now = new Date();
  return Object.freeze({
    year: now.getFullYear(),
    month: now.getMonth() + 1, // JavaScript months are 0-indexed
    day: now.getDate()
  });
}

/**
 * Calculates the difference in days between two dates.
 *
 * @param a - The first date
 * @param b - The second date
 * @returns The number of days from a to b (positive if b is later)
 */
export function daysBetween(a: LocalDate, b: LocalDate): number {
  const daysA = toDayCount(a);
  const daysB = toDayCount(b);
  return daysB - daysA;
}

/**
 * Checks if date a is before date b.
 *
 * @param a - The first date
 * @param b - The second date
 * @returns True if a is before b, false otherwise
 */
export function isBefore(a: LocalDate, b: LocalDate): boolean {
  return compareLocalDates(a, b) < 0;
}

/**
 * Checks if date a is after date b.
 *
 * @param a - The first date
 * @param b - The second date
 * @returns True if a is after b, false otherwise
 */
export function isAfter(a: LocalDate, b: LocalDate): boolean {
  return compareLocalDates(a, b) > 0;
}

/**
 * Checks if a date falls within a range (inclusive).
 *
 * @param date - The date to check
 * @param start - The start of the range
 * @param end - The end of the range
 * @returns True if date is within the range (inclusive), false otherwise
 */
export function isWithinRange(date: LocalDate, start: LocalDate, end: LocalDate): boolean {
  return compareLocalDates(date, start) >= 0 && compareLocalDates(date, end) <= 0;
}

/**
 * Gets the first day of the month for a given date.
 *
 * @param date - The date to get the first day of the month for
 * @returns A new frozen LocalDate representing the first day of the month
 */
export function getFirstDayOfMonth(date: LocalDate): LocalDate {
  return Object.freeze({ year: date.year, month: date.month, day: 1 });
}

/**
 * Gets the last day of the month for a given date.
 *
 * @param date - The date to get the last day of the month for
 * @returns A new frozen LocalDate representing the last day of the month
 */
export function getLastDayOfMonth(date: LocalDate): LocalDate {
  const lastDay = getDaysInMonth(date.year, date.month);
  return Object.freeze({ year: date.year, month: date.month, day: lastDay });
}

/**
 * Converts a LocalDate to a day count from a reference point.
 * Used internally for date arithmetic.
 *
 * @param date - The date to convert
 * @returns The number of days since the reference point
 */
function toDayCount(date: LocalDate): number {
  const { year, month, day } = date;

  // Days from complete years
  let days = year * 365 + Math.floor(year / 4) - Math.floor(year / 100) + Math.floor(year / 400);

  // Days from complete months in current year
  const daysBeforeMonth: readonly number[] = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  days += daysBeforeMonth[month - 1];

  // Add leap day if applicable
  if (month > 2 && isLeapYear(year)) {
    days += 1;
  }

  // Add days in current month
  days += day;

  return days;
}
