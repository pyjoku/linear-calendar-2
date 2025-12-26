/**
 * MultiDayEngine - Handles multi-day events spanning across months
 *
 * This engine provides functionality for:
 * - Splitting multi-day events into month segments
 * - Calculating bar positions for overlapping events in the calendar view
 */

import type { LocalDate } from '../domain/models/LocalDate';
import { getDaysInMonth, compareLocalDates, addDays } from '../domain/models/LocalDate';

/**
 * Represents a segment of a multi-day event within a single month
 */
export interface MonthSegment {
  /** The year of this segment */
  year: number;
  /** The month of this segment (1-12) */
  month: number;
  /** The first day of the event in this month (1-31) */
  startDay: number;
  /** The last day of the event in this month (1-31) */
  endDay: number;
  /** The unique identifier of the entry this segment belongs to */
  entryId: string;
}

/**
 * Represents the visual position of an event bar in the calendar grid
 */
export interface BarPosition {
  /** The vertical row index for stacking overlapping bars (0-based) */
  rowIndex: number;
  /** The starting column in the grid (0-based, corresponds to day of week) */
  startColumn: number;
  /** The ending column in the grid (0-based) */
  endColumn: number;
  /** The number of columns this bar spans */
  span: number;
}

/** Maximum number of months an event can span (2 years) */
const MAX_MONTHS = 24;

/**
 * MultiDayEngine provides methods for handling multi-day events
 * that span across month boundaries.
 */
export class MultiDayEngine {
  /**
   * Splits a multi-day event into segments, one per month.
   *
   * For example, an event from 2025-01-28 to 2025-02-05 would be split into:
   * - Segment 1: { year: 2025, month: 1, startDay: 28, endDay: 31 }
   * - Segment 2: { year: 2025, month: 2, startDay: 1, endDay: 5 }
   *
   * @param startDate - The start date of the event
   * @param endDate - The end date of the event
   * @param entryId - The unique identifier for this entry
   * @returns Array of MonthSegment objects, one per month the event spans
   */
  calculateMonthSegments(
    startDate: LocalDate,
    endDate: LocalDate,
    entryId: string
  ): MonthSegment[] {
    const segments: MonthSegment[] = [];

    // Validate input: start must be before or equal to end
    if (compareLocalDates(startDate, endDate) > 0) {
      return segments;
    }

    let currentYear = startDate.year;
    let currentMonth = startDate.month;
    let monthCount = 0;

    // Iterate through each month in the range
    while (monthCount < MAX_MONTHS) {
      // Determine if this month contains the start date
      const isStartMonth = currentYear === startDate.year && currentMonth === startDate.month;
      // Determine if this month contains the end date
      const isEndMonth = currentYear === endDate.year && currentMonth === endDate.month;

      // Calculate the segment boundaries for this month
      const segmentStartDay = isStartMonth ? startDate.day : 1;
      const segmentEndDay = isEndMonth ? endDate.day : getDaysInMonth(currentYear, currentMonth);

      segments.push({
        year: currentYear,
        month: currentMonth,
        startDay: segmentStartDay,
        endDay: segmentEndDay,
        entryId,
      });

      // If this is the end month, we're done
      if (isEndMonth) {
        break;
      }

      // Move to next month
      currentMonth++;
      if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
      }

      monthCount++;
    }

    return segments;
  }

  /**
   * Calculates the visual bar positions for segments within a month.
   *
   * Uses a greedy algorithm to place bars in rows from top to bottom,
   * ensuring no overlapping bars share the same row.
   *
   * @param segments - Array of MonthSegment objects to position
   * @param monthData - Data about the month, including the day of week the month starts on
   * @returns Map from entryId to BarPosition
   */
  calculateBarPositions(
    segments: MonthSegment[],
    monthData: { startDayOfWeek: number }
  ): Map<string, BarPosition> {
    const positions = new Map<string, BarPosition>();

    if (segments.length === 0) {
      return positions;
    }

    // Sort segments by start day, then by end day (longer events first for tie-breaking)
    const sortedSegments = [...segments].sort((a, b) => {
      if (a.startDay !== b.startDay) {
        return a.startDay - b.startDay;
      }
      // For same start day, longer events come first
      return (b.endDay - b.startDay) - (a.endDay - a.startDay);
    });

    // Track which rows are occupied at each column
    // Each element represents a day (1-indexed), containing the set of occupied row indices
    const occupiedRows: Set<number>[] = [];
    for (let i = 0; i <= 31; i++) {
      occupiedRows.push(new Set());
    }

    // Place each segment
    for (const segment of sortedSegments) {
      // Calculate column positions based on day of month and start day of week
      // Column 0-6 represents days of week (Sunday-Saturday)
      const startColumn = (monthData.startDayOfWeek + segment.startDay - 1) % 7;
      const endColumn = (monthData.startDayOfWeek + segment.endDay - 1) % 7;
      const span = segment.endDay - segment.startDay + 1;

      // Find the first available row using greedy algorithm
      let rowIndex = 0;
      let foundRow = false;

      while (!foundRow) {
        // Check if this row is available for all days in the segment
        let rowAvailable = true;
        for (let day = segment.startDay; day <= segment.endDay; day++) {
          if (occupiedRows[day].has(rowIndex)) {
            rowAvailable = false;
            break;
          }
        }

        if (rowAvailable) {
          foundRow = true;
          // Mark this row as occupied for all days in the segment
          for (let day = segment.startDay; day <= segment.endDay; day++) {
            occupiedRows[day].add(rowIndex);
          }
        } else {
          rowIndex++;
        }

        // Safety limit to prevent infinite loops
        if (rowIndex > 100) {
          break;
        }
      }

      positions.set(segment.entryId, {
        rowIndex,
        startColumn,
        endColumn,
        span,
      });
    }

    return positions;
  }
}

/**
 * Default MultiDayEngine instance for convenience
 */
export const multiDayEngine = new MultiDayEngine();
