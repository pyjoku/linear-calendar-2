import { describe, it, expect } from 'vitest';
import { MultiDayEngine } from '../MultiDayEngine';
import type { MonthSegment } from '../MultiDayEngine';
import { createLocalDate } from '../../domain/models/LocalDate';

describe('MultiDayEngine', () => {
  const engine = new MultiDayEngine();

  describe('calculateMonthSegments', () => {
    describe('event within same month', () => {
      it('should return a single segment for an event within one month', () => {
        const startDate = createLocalDate(2025, 3, 10);
        const endDate = createLocalDate(2025, 3, 15);

        const segments = engine.calculateMonthSegments(startDate, endDate, 'entry-1');

        expect(segments).toHaveLength(1);
        expect(segments[0]).toEqual({
          year: 2025,
          month: 3,
          startDay: 10,
          endDay: 15,
          entryId: 'entry-1',
        });
      });

      it('should handle single-day events', () => {
        const date = createLocalDate(2025, 6, 20);

        const segments = engine.calculateMonthSegments(date, date, 'single-day');

        expect(segments).toHaveLength(1);
        expect(segments[0]).toEqual({
          year: 2025,
          month: 6,
          startDay: 20,
          endDay: 20,
          entryId: 'single-day',
        });
      });
    });

    describe('event spanning month boundaries', () => {
      it('should split an event spanning two months', () => {
        const startDate = createLocalDate(2025, 1, 28);
        const endDate = createLocalDate(2025, 2, 5);

        const segments = engine.calculateMonthSegments(startDate, endDate, 'entry-2');

        expect(segments).toHaveLength(2);
        expect(segments[0]).toEqual({
          year: 2025,
          month: 1,
          startDay: 28,
          endDay: 31,
          entryId: 'entry-2',
        });
        expect(segments[1]).toEqual({
          year: 2025,
          month: 2,
          startDay: 1,
          endDay: 5,
          entryId: 'entry-2',
        });
      });

      it('should split an event spanning three months', () => {
        const startDate = createLocalDate(2025, 3, 25);
        const endDate = createLocalDate(2025, 5, 10);

        const segments = engine.calculateMonthSegments(startDate, endDate, 'entry-3');

        expect(segments).toHaveLength(3);
        expect(segments[0]).toEqual({
          year: 2025,
          month: 3,
          startDay: 25,
          endDay: 31,
          entryId: 'entry-3',
        });
        expect(segments[1]).toEqual({
          year: 2025,
          month: 4,
          startDay: 1,
          endDay: 30,
          entryId: 'entry-3',
        });
        expect(segments[2]).toEqual({
          year: 2025,
          month: 5,
          startDay: 1,
          endDay: 10,
          entryId: 'entry-3',
        });
      });
    });

    describe('event spanning year boundaries', () => {
      it('should handle events spanning December to January', () => {
        const startDate = createLocalDate(2024, 12, 28);
        const endDate = createLocalDate(2025, 1, 3);

        const segments = engine.calculateMonthSegments(startDate, endDate, 'new-year');

        expect(segments).toHaveLength(2);
        expect(segments[0]).toEqual({
          year: 2024,
          month: 12,
          startDay: 28,
          endDay: 31,
          entryId: 'new-year',
        });
        expect(segments[1]).toEqual({
          year: 2025,
          month: 1,
          startDay: 1,
          endDay: 3,
          entryId: 'new-year',
        });
      });

      it('should handle events spanning multiple years', () => {
        const startDate = createLocalDate(2024, 11, 15);
        const endDate = createLocalDate(2025, 2, 10);

        const segments = engine.calculateMonthSegments(startDate, endDate, 'multi-year');

        expect(segments).toHaveLength(4);
        expect(segments[0]).toEqual({
          year: 2024,
          month: 11,
          startDay: 15,
          endDay: 30,
          entryId: 'multi-year',
        });
        expect(segments[1]).toEqual({
          year: 2024,
          month: 12,
          startDay: 1,
          endDay: 31,
          entryId: 'multi-year',
        });
        expect(segments[2]).toEqual({
          year: 2025,
          month: 1,
          startDay: 1,
          endDay: 31,
          entryId: 'multi-year',
        });
        expect(segments[3]).toEqual({
          year: 2025,
          month: 2,
          startDay: 1,
          endDay: 10,
          entryId: 'multi-year',
        });
      });
    });

    describe('edge cases', () => {
      it('should handle leap year February 29', () => {
        const startDate = createLocalDate(2024, 2, 25);
        const endDate = createLocalDate(2024, 3, 5);

        const segments = engine.calculateMonthSegments(startDate, endDate, 'leap-year');

        expect(segments).toHaveLength(2);
        expect(segments[0]).toEqual({
          year: 2024,
          month: 2,
          startDay: 25,
          endDay: 29, // Leap year has 29 days
          entryId: 'leap-year',
        });
        expect(segments[1]).toEqual({
          year: 2024,
          month: 3,
          startDay: 1,
          endDay: 5,
          entryId: 'leap-year',
        });
      });

      it('should handle non-leap year February', () => {
        const startDate = createLocalDate(2025, 2, 25);
        const endDate = createLocalDate(2025, 3, 5);

        const segments = engine.calculateMonthSegments(startDate, endDate, 'non-leap');

        expect(segments).toHaveLength(2);
        expect(segments[0]).toEqual({
          year: 2025,
          month: 2,
          startDay: 25,
          endDay: 28, // Non-leap year has 28 days
          entryId: 'non-leap',
        });
        expect(segments[1]).toEqual({
          year: 2025,
          month: 3,
          startDay: 1,
          endDay: 5,
          entryId: 'non-leap',
        });
      });

      it('should handle December 31 to January 1', () => {
        const startDate = createLocalDate(2024, 12, 31);
        const endDate = createLocalDate(2025, 1, 1);

        const segments = engine.calculateMonthSegments(startDate, endDate, 'new-years-eve');

        expect(segments).toHaveLength(2);
        expect(segments[0]).toEqual({
          year: 2024,
          month: 12,
          startDay: 31,
          endDay: 31,
          entryId: 'new-years-eve',
        });
        expect(segments[1]).toEqual({
          year: 2025,
          month: 1,
          startDay: 1,
          endDay: 1,
          entryId: 'new-years-eve',
        });
      });

      it('should return empty array when start date is after end date', () => {
        const startDate = createLocalDate(2025, 3, 15);
        const endDate = createLocalDate(2025, 3, 10);

        const segments = engine.calculateMonthSegments(startDate, endDate, 'invalid');

        expect(segments).toHaveLength(0);
      });

      it('should limit to 24 months maximum', () => {
        const startDate = createLocalDate(2020, 1, 1);
        const endDate = createLocalDate(2025, 12, 31);

        const segments = engine.calculateMonthSegments(startDate, endDate, 'very-long');

        expect(segments.length).toBeLessThanOrEqual(24);
      });
    });
  });

  describe('calculateBarPositions', () => {
    describe('no overlapping bars', () => {
      it('should place non-overlapping bars in row 0', () => {
        const segments: MonthSegment[] = [
          { year: 2025, month: 3, startDay: 1, endDay: 5, entryId: 'a' },
          { year: 2025, month: 3, startDay: 10, endDay: 15, entryId: 'b' },
          { year: 2025, month: 3, startDay: 20, endDay: 25, entryId: 'c' },
        ];

        const positions = engine.calculateBarPositions(segments, { startDayOfWeek: 0 });

        expect(positions.get('a')?.rowIndex).toBe(0);
        expect(positions.get('b')?.rowIndex).toBe(0);
        expect(positions.get('c')?.rowIndex).toBe(0);
      });

      it('should calculate correct span for each bar', () => {
        const segments: MonthSegment[] = [
          { year: 2025, month: 3, startDay: 1, endDay: 5, entryId: 'a' },
          { year: 2025, month: 3, startDay: 10, endDay: 10, entryId: 'b' },
        ];

        const positions = engine.calculateBarPositions(segments, { startDayOfWeek: 0 });

        expect(positions.get('a')?.span).toBe(5); // 1, 2, 3, 4, 5
        expect(positions.get('b')?.span).toBe(1); // single day
      });
    });

    describe('overlapping bars', () => {
      it('should stack overlapping bars in different rows', () => {
        const segments: MonthSegment[] = [
          { year: 2025, month: 3, startDay: 1, endDay: 10, entryId: 'a' },
          { year: 2025, month: 3, startDay: 5, endDay: 15, entryId: 'b' },
        ];

        const positions = engine.calculateBarPositions(segments, { startDayOfWeek: 0 });

        expect(positions.get('a')?.rowIndex).toBe(0);
        expect(positions.get('b')?.rowIndex).toBe(1);
      });

      it('should handle multiple overlapping bars', () => {
        const segments: MonthSegment[] = [
          { year: 2025, month: 3, startDay: 1, endDay: 20, entryId: 'a' },
          { year: 2025, month: 3, startDay: 5, endDay: 15, entryId: 'b' },
          { year: 2025, month: 3, startDay: 10, endDay: 25, entryId: 'c' },
        ];

        const positions = engine.calculateBarPositions(segments, { startDayOfWeek: 0 });

        expect(positions.get('a')?.rowIndex).toBe(0);
        expect(positions.get('b')?.rowIndex).toBe(1);
        expect(positions.get('c')?.rowIndex).toBe(2);
      });

      it('should reuse row when previous event ends', () => {
        const segments: MonthSegment[] = [
          { year: 2025, month: 3, startDay: 1, endDay: 5, entryId: 'a' },
          { year: 2025, month: 3, startDay: 3, endDay: 8, entryId: 'b' },
          { year: 2025, month: 3, startDay: 6, endDay: 10, entryId: 'c' },
        ];

        const positions = engine.calculateBarPositions(segments, { startDayOfWeek: 0 });

        expect(positions.get('a')?.rowIndex).toBe(0);
        expect(positions.get('b')?.rowIndex).toBe(1);
        // 'c' starts on day 6, 'a' ends on day 5, so 'c' can use row 0
        expect(positions.get('c')?.rowIndex).toBe(0);
      });

      it('should handle bars starting on same day', () => {
        const segments: MonthSegment[] = [
          { year: 2025, month: 3, startDay: 5, endDay: 10, entryId: 'a' },
          { year: 2025, month: 3, startDay: 5, endDay: 7, entryId: 'b' },
          { year: 2025, month: 3, startDay: 5, endDay: 5, entryId: 'c' },
        ];

        const positions = engine.calculateBarPositions(segments, { startDayOfWeek: 0 });

        // Longer bars get priority (come first after sort)
        expect(positions.get('a')?.rowIndex).toBe(0);
        expect(positions.get('b')?.rowIndex).toBe(1);
        expect(positions.get('c')?.rowIndex).toBe(2);
      });
    });

    describe('column calculations', () => {
      it('should calculate startColumn based on startDayOfWeek', () => {
        // March 2025 starts on Saturday (day 6)
        const segments: MonthSegment[] = [
          { year: 2025, month: 3, startDay: 1, endDay: 1, entryId: 'a' },
        ];

        const positions = engine.calculateBarPositions(segments, { startDayOfWeek: 6 });

        // Day 1 with startDayOfWeek=6 should be in column 6 (Saturday)
        expect(positions.get('a')?.startColumn).toBe(6);
        expect(positions.get('a')?.endColumn).toBe(6);
      });

      it('should wrap columns correctly for days later in month', () => {
        // If month starts on Wednesday (3), day 5 would be on Sunday (0)
        const segments: MonthSegment[] = [
          { year: 2025, month: 1, startDay: 5, endDay: 5, entryId: 'a' },
        ];

        const positions = engine.calculateBarPositions(segments, { startDayOfWeek: 3 });

        // Day 5 with startDayOfWeek=3: (3 + 5 - 1) % 7 = 0 (Sunday)
        expect(positions.get('a')?.startColumn).toBe(0);
      });
    });

    describe('empty input', () => {
      it('should return empty map for empty segments array', () => {
        const positions = engine.calculateBarPositions([], { startDayOfWeek: 0 });

        expect(positions.size).toBe(0);
      });
    });

    describe('edge cases', () => {
      it('should handle bar spanning entire month', () => {
        const segments: MonthSegment[] = [
          { year: 2025, month: 3, startDay: 1, endDay: 31, entryId: 'full-month' },
        ];

        const positions = engine.calculateBarPositions(segments, { startDayOfWeek: 6 });

        expect(positions.get('full-month')?.span).toBe(31);
        expect(positions.get('full-month')?.rowIndex).toBe(0);
      });

      it('should handle adjacent bars (no gap)', () => {
        const segments: MonthSegment[] = [
          { year: 2025, month: 3, startDay: 1, endDay: 5, entryId: 'a' },
          { year: 2025, month: 3, startDay: 6, endDay: 10, entryId: 'b' },
        ];

        const positions = engine.calculateBarPositions(segments, { startDayOfWeek: 0 });

        // Adjacent bars don't overlap, so both should be in row 0
        expect(positions.get('a')?.rowIndex).toBe(0);
        expect(positions.get('b')?.rowIndex).toBe(0);
      });
    });
  });
});
