/**
 * @fileoverview DateRange model for representing date intervals.
 *
 * This module provides data structures for working with date ranges,
 * including utilities for multi-day events that span across months.
 *
 * @module DateRange
 */

import type { LocalDate } from './LocalDate';
import {
  compareLocalDates,
  getDaysInMonth,
  localDatesEqual,
  addDays,
  isBefore,
  isAfter
} from './LocalDate';

/**
 * Represents a range of dates with a start and end.
 *
 * Both start and end are inclusive. The start date must be
 * before or equal to the end date.
 *
 * @example
 * const range: DateRange = {
 *   start: { year: 2024, month: 3, day: 1 },
 *   end: { year: 2024, month: 3, day: 31 }
 * };
 */
export interface DateRange {
  /** The start date of the range (inclusive) */
  readonly start: LocalDate;

  /** The end date of the range (inclusive) */
  readonly end: LocalDate;
}

/**
 * Represents a segment of a multi-day event within a single month.
 *
 * When a multi-day event spans across month boundaries, it needs to be
 * split into segments for proper display in the calendar. Each segment
 * represents the portion of the event that falls within a specific month.
 *
 * @example
 * // An event from March 28 to April 3 would create two segments:
 * const marchSegment: MonthSegment = {
 *   year: 2024,
 *   month: 3,
 *   startDay: 28,
 *   endDay: 31,
 *   entryId: 'vacation-2024'
 * };
 * const aprilSegment: MonthSegment = {
 *   year: 2024,
 *   month: 4,
 *   startDay: 1,
 *   endDay: 3,
 *   entryId: 'vacation-2024'
 * };
 */
export interface MonthSegment {
  /** The year of the segment */
  readonly year: number;

  /** The month of the segment (1-12) */
  readonly month: number;

  /** The first day of the segment within the month */
  readonly startDay: number;

  /** The last day of the segment within the month */
  readonly endDay: number;

  /** The ID of the calendar entry this segment belongs to */
  readonly entryId: string;
}

/**
 * Creates a new DateRange object.
 *
 * @param start - The start date of the range
 * @param end - The end date of the range
 * @returns A new frozen DateRange object
 * @throws {Error} If start is after end
 *
 * @example
 * const range = createDateRange(
 *   { year: 2024, month: 3, day: 1 },
 *   { year: 2024, month: 3, day: 31 }
 * );
 */
export function createDateRange(start: LocalDate, end: LocalDate): DateRange {
  if (compareLocalDates(start, end) > 0) {
    throw new Error('Start date must be before or equal to end date');
  }

  return Object.freeze({ start, end });
}

/**
 * Creates a DateRange for a single day.
 *
 * @param date - The date for the single-day range
 * @returns A DateRange where start equals end
 */
export function createSingleDayRange(date: LocalDate): DateRange {
  return Object.freeze({ start: date, end: date });
}

/**
 * Checks if two date ranges overlap.
 *
 * Ranges are considered overlapping if they share at least one day.
 *
 * @param a - The first date range
 * @param b - The second date range
 * @returns True if the ranges overlap, false otherwise
 */
export function rangesOverlap(a: DateRange, b: DateRange): boolean {
  return compareLocalDates(a.start, b.end) <= 0 &&
         compareLocalDates(b.start, a.end) <= 0;
}

/**
 * Checks if a date falls within a date range (inclusive).
 *
 * @param date - The date to check
 * @param range - The date range
 * @returns True if the date is within the range, false otherwise
 */
export function isDateInRange(date: LocalDate, range: DateRange): boolean {
  return compareLocalDates(date, range.start) >= 0 &&
         compareLocalDates(date, range.end) <= 0;
}

/**
 * Checks if the first range completely contains the second range.
 *
 * @param outer - The potentially containing range
 * @param inner - The potentially contained range
 * @returns True if outer completely contains inner
 */
export function rangeContains(outer: DateRange, inner: DateRange): boolean {
  return compareLocalDates(outer.start, inner.start) <= 0 &&
         compareLocalDates(outer.end, inner.end) >= 0;
}

/**
 * Calculates the intersection of two date ranges.
 *
 * @param a - The first date range
 * @param b - The second date range
 * @returns The intersection range, or null if ranges don't overlap
 */
export function intersectRanges(a: DateRange, b: DateRange): DateRange | null {
  if (!rangesOverlap(a, b)) {
    return null;
  }

  const start = compareLocalDates(a.start, b.start) >= 0 ? a.start : b.start;
  const end = compareLocalDates(a.end, b.end) <= 0 ? a.end : b.end;

  return Object.freeze({ start, end });
}

/**
 * Calculates the number of days in a date range (inclusive).
 *
 * @param range - The date range
 * @returns The number of days in the range
 */
export function getRangeDays(range: DateRange): number {
  // Simple calculation for same month
  if (range.start.year === range.end.year && range.start.month === range.end.month) {
    return range.end.day - range.start.day + 1;
  }

  // For cross-month ranges, count days iteratively
  let days = 0;
  let current = range.start;

  while (compareLocalDates(current, range.end) <= 0) {
    days++;
    current = addDays(current, 1);
  }

  return days;
}

/**
 * Splits a date range into month segments.
 *
 * This is useful for displaying multi-day events in a calendar view,
 * where each month may need to render its portion of the event separately.
 *
 * @param range - The date range to split
 * @param entryId - The ID of the entry for the segments
 * @returns An array of MonthSegment objects
 *
 * @example
 * // Range from March 28 to April 3
 * const segments = splitRangeByMonth(
 *   { start: { year: 2024, month: 3, day: 28 }, end: { year: 2024, month: 4, day: 3 } },
 *   'event-1'
 * );
 * // Returns: [
 * //   { year: 2024, month: 3, startDay: 28, endDay: 31, entryId: 'event-1' },
 * //   { year: 2024, month: 4, startDay: 1, endDay: 3, entryId: 'event-1' }
 * // ]
 */
export function splitRangeByMonth(range: DateRange, entryId: string): readonly MonthSegment[] {
  const segments: MonthSegment[] = [];

  let currentYear = range.start.year;
  let currentMonth = range.start.month;
  let currentStartDay = range.start.day;

  while (
    currentYear < range.end.year ||
    (currentYear === range.end.year && currentMonth <= range.end.month)
  ) {
    const daysInCurrentMonth = getDaysInMonth(currentYear, currentMonth);

    // Determine end day for this segment
    let segmentEndDay: number;
    if (currentYear === range.end.year && currentMonth === range.end.month) {
      // This is the final month
      segmentEndDay = range.end.day;
    } else {
      // Not the final month, so segment ends at month end
      segmentEndDay = daysInCurrentMonth;
    }

    segments.push(Object.freeze({
      year: currentYear,
      month: currentMonth,
      startDay: currentStartDay,
      endDay: segmentEndDay,
      entryId
    }));

    // Move to next month
    currentMonth++;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear++;
    }
    currentStartDay = 1; // Next month always starts on day 1
  }

  return Object.freeze(segments);
}

/**
 * Gets the segments for a specific month from a date range.
 *
 * @param range - The date range
 * @param year - The year to get segments for
 * @param month - The month to get segments for (1-12)
 * @param entryId - The ID of the entry
 * @returns The segment for the month, or null if range doesn't include the month
 */
export function getMonthSegment(
  range: DateRange,
  year: number,
  month: number,
  entryId: string
): MonthSegment | null {
  const monthStart: LocalDate = { year, month, day: 1 };
  const monthEnd: LocalDate = { year, month, day: getDaysInMonth(year, month) };

  // Check if range overlaps with this month
  if (isAfter(range.start, monthEnd) || isBefore(range.end, monthStart)) {
    return null;
  }

  // Calculate segment bounds
  const startDay = (range.start.year === year && range.start.month === month)
    ? range.start.day
    : 1;

  const endDay = (range.end.year === year && range.end.month === month)
    ? range.end.day
    : getDaysInMonth(year, month);

  return Object.freeze({
    year,
    month,
    startDay,
    endDay,
    entryId
  });
}

/**
 * Creates a DateRange for an entire month.
 *
 * @param year - The year
 * @param month - The month (1-12)
 * @returns A DateRange covering the entire month
 */
export function createMonthRange(year: number, month: number): DateRange {
  return Object.freeze({
    start: { year, month, day: 1 },
    end: { year, month, day: getDaysInMonth(year, month) }
  });
}

/**
 * Checks if a date range represents a single day.
 *
 * @param range - The date range to check
 * @returns True if start equals end
 */
export function isSingleDay(range: DateRange): boolean {
  return localDatesEqual(range.start, range.end);
}

/**
 * Extends a date range by adding days to the start and/or end.
 *
 * @param range - The original date range
 * @param daysBefore - Days to add before the start (positive number)
 * @param daysAfter - Days to add after the end (positive number)
 * @returns A new extended DateRange
 */
export function extendRange(
  range: DateRange,
  daysBefore: number,
  daysAfter: number
): DateRange {
  return Object.freeze({
    start: addDays(range.start, -daysBefore),
    end: addDays(range.end, daysAfter)
  });
}
