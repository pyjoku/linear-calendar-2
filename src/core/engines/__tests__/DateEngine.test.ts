/**
 * Unit Tests for DateEngine
 *
 * Tests timezone-safe date parsing and extraction functionality.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DateEngine, DateExtractionConfig } from '../DateEngine';
import type { LocalDate } from '../../domain/models/LocalDate';

describe('DateEngine', () => {
  let engine: DateEngine;

  beforeEach(() => {
    engine = new DateEngine();
  });

  describe('parseDate', () => {
    describe('valid dates', () => {
      it('should parse a valid ISO date string', () => {
        const result = engine.parseDate('2025-01-15');

        expect(result).toEqual({
          year: 2025,
          month: 1,
          day: 15,
        });
      });

      it('should parse date at start of year', () => {
        const result = engine.parseDate('2025-01-01');

        expect(result).toEqual({
          year: 2025,
          month: 1,
          day: 1,
        });
      });

      it('should parse date at end of year (December 31)', () => {
        const result = engine.parseDate('2025-12-31');

        expect(result).toEqual({
          year: 2025,
          month: 12,
          day: 31,
        });
      });

      it('should parse leap year date (February 29)', () => {
        const result = engine.parseDate('2024-02-29');

        expect(result).toEqual({
          year: 2024,
          month: 2,
          day: 29,
        });
      });

      it('should parse date with leading zeros', () => {
        const result = engine.parseDate('2025-03-05');

        expect(result).toEqual({
          year: 2025,
          month: 3,
          day: 5,
        });
      });

      it('should trim whitespace from date string', () => {
        const result = engine.parseDate('  2025-06-15  ');

        expect(result).toEqual({
          year: 2025,
          month: 6,
          day: 15,
        });
      });

      it('should parse a Date object', () => {
        // Create a Date object with local time
        const date = new Date(2025, 0, 15); // January 15, 2025
        const result = engine.parseDate(date);

        expect(result).toEqual({
          year: 2025,
          month: 1,
          day: 15,
        });
      });

      it('should parse a LocalDate-like object', () => {
        const localDate = { year: 2025, month: 7, day: 20 };
        const result = engine.parseDate(localDate);

        expect(result).toEqual({
          year: 2025,
          month: 7,
          day: 20,
        });
      });
    });

    describe('invalid dates', () => {
      it('should return null for null input', () => {
        expect(engine.parseDate(null)).toBeNull();
      });

      it('should return null for undefined input', () => {
        expect(engine.parseDate(undefined)).toBeNull();
      });

      it('should return null for empty string', () => {
        expect(engine.parseDate('')).toBeNull();
      });

      it('should return null for non-date string', () => {
        expect(engine.parseDate('not a date')).toBeNull();
      });

      it('should return null for partial date', () => {
        expect(engine.parseDate('2025-01')).toBeNull();
      });

      it('should return null for wrong format (DD-MM-YYYY)', () => {
        expect(engine.parseDate('15-01-2025')).toBeNull();
      });

      it('should return null for invalid month (13)', () => {
        expect(engine.parseDate('2025-13-01')).toBeNull();
      });

      it('should return null for invalid month (0)', () => {
        expect(engine.parseDate('2025-00-15')).toBeNull();
      });

      it('should return null for invalid day (32)', () => {
        expect(engine.parseDate('2025-01-32')).toBeNull();
      });

      it('should return null for invalid day (0)', () => {
        expect(engine.parseDate('2025-01-00')).toBeNull();
      });

      it('should return null for February 29 in non-leap year', () => {
        expect(engine.parseDate('2025-02-29')).toBeNull();
      });

      it('should return null for February 30', () => {
        expect(engine.parseDate('2024-02-30')).toBeNull();
      });

      it('should return null for April 31', () => {
        expect(engine.parseDate('2025-04-31')).toBeNull();
      });

      it('should return null for invalid Date object', () => {
        const invalidDate = new Date('invalid');
        expect(engine.parseDate(invalidDate)).toBeNull();
      });

      it('should return null for number input', () => {
        expect(engine.parseDate(12345)).toBeNull();
      });

      it('should return null for object without required properties', () => {
        expect(engine.parseDate({ year: 2025 })).toBeNull();
      });
    });

    describe('TIMEZONE SAFETY - CRITICAL TESTS', () => {
      /**
       * CRITICAL: These tests verify that date parsing is timezone-safe.
       * The bug we're preventing: new Date("2025-01-15") interprets the string
       * as UTC midnight, which can shift to the previous day in local timezones.
       *
       * Example: "2025-01-15" parsed as UTC is 2025-01-15T00:00:00Z
       * In UTC-5 timezone, this becomes 2025-01-14T19:00:00 local time
       * If we extract the day from local time, we get 14 instead of 15!
       */

      it('should parse "2025-01-15" as day 15, NOT day 14 (timezone safety)', () => {
        const result = engine.parseDate('2025-01-15');

        expect(result).not.toBeNull();
        expect(result!.day).toBe(15);
        expect(result!.month).toBe(1);
        expect(result!.year).toBe(2025);
      });

      it('should parse "2025-12-31" correctly at year boundary', () => {
        const result = engine.parseDate('2025-12-31');

        expect(result).not.toBeNull();
        expect(result!.day).toBe(31);
        expect(result!.month).toBe(12);
        expect(result!.year).toBe(2025);
      });

      it('should parse "2025-01-01" correctly at year start', () => {
        const result = engine.parseDate('2025-01-01');

        expect(result).not.toBeNull();
        expect(result!.day).toBe(1);
        expect(result!.month).toBe(1);
        expect(result!.year).toBe(2025);
      });

      it('should handle dates that would shift across month boundary in UTC', () => {
        // March 1st is particularly tricky because of February length
        const result = engine.parseDate('2025-03-01');

        expect(result).not.toBeNull();
        expect(result!.day).toBe(1);
        expect(result!.month).toBe(3);
        expect(result!.year).toBe(2025);
      });

      it('should preserve exact date components without any timezone conversion', () => {
        const testCases = [
          '2025-01-15',
          '2025-06-30',
          '2025-08-01',
          '2025-11-15',
          '2024-02-29', // Leap year
        ];

        for (const dateStr of testCases) {
          const [year, month, day] = dateStr.split('-').map(Number);
          const result = engine.parseDate(dateStr);

          expect(result).not.toBeNull();
          expect(result!.year).toBe(year);
          expect(result!.month).toBe(month);
          expect(result!.day).toBe(day);
        }
      });
    });

    describe('edge cases', () => {
      it('should handle leap year correctly (2024)', () => {
        expect(engine.parseDate('2024-02-29')).toEqual({
          year: 2024,
          month: 2,
          day: 29,
        });
      });

      it('should handle century leap year correctly (2000)', () => {
        expect(engine.parseDate('2000-02-29')).toEqual({
          year: 2000,
          month: 2,
          day: 29,
        });
      });

      it('should reject Feb 29 in century non-leap year (1900)', () => {
        // 1900 is not a leap year (divisible by 100 but not 400)
        expect(engine.parseDate('1900-02-29')).toBeNull();
      });

      it('should handle dates with extra text (not valid ISO format)', () => {
        expect(engine.parseDate('2025-01-15T10:30:00')).toBeNull();
      });

      it('should handle dates within each month boundary', () => {
        const monthDays: Record<number, number> = {
          1: 31,
          2: 28,
          3: 31,
          4: 30,
          5: 31,
          6: 30,
          7: 31,
          8: 31,
          9: 30,
          10: 31,
          11: 30,
          12: 31,
        };

        for (const [month, maxDay] of Object.entries(monthDays)) {
          const monthStr = month.padStart(2, '0');
          const dayStr = maxDay.toString().padStart(2, '0');

          // Valid last day of month
          const result = engine.parseDate(`2025-${monthStr}-${dayStr}`);
          expect(result).not.toBeNull();
          expect(result!.day).toBe(maxDay);

          // Invalid day after month end
          const invalidDay = (maxDay + 1).toString().padStart(2, '0');
          expect(engine.parseDate(`2025-${monthStr}-${invalidDay}`)).toBeNull();
        }
      });
    });
  });

  describe('extractFromFilename', () => {
    describe('single date extraction', () => {
      it('should extract date from "2025-01-15 Meeting.md"', () => {
        const result = engine.extractFromFilename('2025-01-15 Meeting.md');

        expect(result.start).toEqual({
          year: 2025,
          month: 1,
          day: 15,
        });
        expect(result.end).toBeNull();
      });

      it('should extract date from "Meeting 2025-01-15.md"', () => {
        const result = engine.extractFromFilename('Meeting 2025-01-15.md');

        expect(result.start).toEqual({
          year: 2025,
          month: 1,
          day: 15,
        });
        expect(result.end).toBeNull();
      });

      it('should extract date from filename with multiple words', () => {
        const result = engine.extractFromFilename('2025-03-20 Project Planning Session.md');

        expect(result.start).toEqual({
          year: 2025,
          month: 3,
          day: 20,
        });
        expect(result.end).toBeNull();
      });
    });

    describe('date range extraction', () => {
      it('should extract range from "2025-01-15 - 2025-01-20 Trip.md"', () => {
        const result = engine.extractFromFilename('2025-01-15 - 2025-01-20 Trip.md');

        expect(result.start).toEqual({
          year: 2025,
          month: 1,
          day: 15,
        });
        expect(result.end).toEqual({
          year: 2025,
          month: 1,
          day: 20,
        });
      });

      it('should extract range from "Trip 2025-01-15 to 2025-01-20.md"', () => {
        const result = engine.extractFromFilename('Trip 2025-01-15 to 2025-01-20.md');

        expect(result.start).toEqual({
          year: 2025,
          month: 1,
          day: 15,
        });
        expect(result.end).toEqual({
          year: 2025,
          month: 1,
          day: 20,
        });
      });

      it('should extract cross-month range', () => {
        const result = engine.extractFromFilename('2025-01-28 - 2025-02-05 Conference.md');

        expect(result.start).toEqual({
          year: 2025,
          month: 1,
          day: 28,
        });
        expect(result.end).toEqual({
          year: 2025,
          month: 2,
          day: 5,
        });
      });

      it('should extract cross-year range', () => {
        const result = engine.extractFromFilename('2024-12-28 - 2025-01-05 Holiday.md');

        expect(result.start).toEqual({
          year: 2024,
          month: 12,
          day: 28,
        });
        expect(result.end).toEqual({
          year: 2025,
          month: 1,
          day: 5,
        });
      });
    });

    describe('no date extraction', () => {
      it('should return nulls for filename without date', () => {
        const result = engine.extractFromFilename('Meeting Notes.md');

        expect(result.start).toBeNull();
        expect(result.end).toBeNull();
      });

      it('should return nulls for empty filename', () => {
        const result = engine.extractFromFilename('');

        expect(result.start).toBeNull();
        expect(result.end).toBeNull();
      });

      it('should return nulls for null-like input', () => {
        // @ts-expect-error Testing invalid input
        expect(engine.extractFromFilename(null).start).toBeNull();
        // @ts-expect-error Testing invalid input
        expect(engine.extractFromFilename(undefined).start).toBeNull();
      });
    });

    describe('edge cases', () => {
      it('should only use first two dates even if more exist', () => {
        const result = engine.extractFromFilename('2025-01-15 2025-01-20 2025-01-25.md');

        expect(result.start).toEqual({
          year: 2025,
          month: 1,
          day: 15,
        });
        expect(result.end).toEqual({
          year: 2025,
          month: 1,
          day: 20,
        });
      });

      it('should handle date-like but invalid patterns', () => {
        const result = engine.extractFromFilename('2025-13-45 Invalid.md');

        // The regex will match, but parseDate should return null
        expect(result.start).toBeNull();
      });

      it('should extract valid date even with partial date-like patterns nearby', () => {
        const result = engine.extractFromFilename('2025-01-15 version 2.0.md');

        expect(result.start).toEqual({
          year: 2025,
          month: 1,
          day: 15,
        });
        expect(result.end).toBeNull();
      });
    });
  });

  describe('extractFromProperties', () => {
    describe('single property extraction', () => {
      it('should extract date from first matching property', () => {
        const frontmatter = {
          date: '2025-01-15',
          created: '2025-01-10',
        };

        const result = engine.extractFromProperties(frontmatter, ['date']);

        expect(result).toEqual({
          year: 2025,
          month: 1,
          day: 15,
        });
      });

      it('should try properties in order and use first valid one', () => {
        const frontmatter = {
          startDate: '2025-01-15',
          date: '2025-01-10',
        };

        const result = engine.extractFromProperties(frontmatter, ['date', 'startDate']);

        expect(result).toEqual({
          year: 2025,
          month: 1,
          day: 10,
        });
      });

      it('should skip missing properties and use next available', () => {
        const frontmatter = {
          created: '2025-01-15',
        };

        const result = engine.extractFromProperties(frontmatter, ['date', 'startDate', 'created']);

        expect(result).toEqual({
          year: 2025,
          month: 1,
          day: 15,
        });
      });

      it('should skip invalid dates and use next valid one', () => {
        const frontmatter = {
          date: 'not a date',
          startDate: '2025-01-15',
        };

        const result = engine.extractFromProperties(frontmatter, ['date', 'startDate']);

        expect(result).toEqual({
          year: 2025,
          month: 1,
          day: 15,
        });
      });
    });

    describe('null returns', () => {
      it('should return null for null frontmatter', () => {
        expect(engine.extractFromProperties(null, ['date'])).toBeNull();
      });

      it('should return null for undefined frontmatter', () => {
        expect(engine.extractFromProperties(undefined, ['date'])).toBeNull();
      });

      it('should return null for empty frontmatter', () => {
        expect(engine.extractFromProperties({}, ['date'])).toBeNull();
      });

      it('should return null when no properties match', () => {
        const frontmatter = {
          title: 'My Note',
        };

        expect(engine.extractFromProperties(frontmatter, ['date', 'created'])).toBeNull();
      });

      it('should return null when all dates are invalid', () => {
        const frontmatter = {
          date: 'invalid',
          created: 'also invalid',
        };

        expect(engine.extractFromProperties(frontmatter, ['date', 'created'])).toBeNull();
      });

      it('should return null for empty property names array', () => {
        const frontmatter = {
          date: '2025-01-15',
        };

        expect(engine.extractFromProperties(frontmatter, [])).toBeNull();
      });
    });

    describe('different value types', () => {
      it('should handle Date objects in frontmatter', () => {
        const frontmatter = {
          date: new Date(2025, 0, 15), // January 15, 2025
        };

        const result = engine.extractFromProperties(frontmatter, ['date']);

        expect(result).toEqual({
          year: 2025,
          month: 1,
          day: 15,
        });
      });

      it('should handle LocalDate-like objects in frontmatter', () => {
        const frontmatter = {
          date: { year: 2025, month: 1, day: 15 },
        };

        const result = engine.extractFromProperties(frontmatter, ['date']);

        expect(result).toEqual({
          year: 2025,
          month: 1,
          day: 15,
        });
      });
    });
  });

  describe('extractDates', () => {
    describe('properties priority', () => {
      it('should use properties first when configured', () => {
        const config: DateExtractionConfig = {
          startSources: ['startDate', 'date'],
          endSources: ['endDate', 'due'],
          priorities: ['properties', 'filename'],
        };

        const result = engine.extractDates(
          '2025-01-01 - 2025-01-05 Note.md',
          { startDate: '2025-02-15', endDate: '2025-02-20' },
          config
        );

        expect(result.start).toEqual({
          year: 2025,
          month: 2,
          day: 15,
        });
        expect(result.end).toEqual({
          year: 2025,
          month: 2,
          day: 20,
        });
      });

      it('should fall back to filename when properties are missing', () => {
        const config: DateExtractionConfig = {
          startSources: ['startDate'],
          endSources: ['endDate'],
          priorities: ['properties', 'filename'],
        };

        const result = engine.extractDates('2025-01-15 - 2025-01-20 Note.md', {}, config);

        expect(result.start).toEqual({
          year: 2025,
          month: 1,
          day: 15,
        });
        expect(result.end).toEqual({
          year: 2025,
          month: 1,
          day: 20,
        });
      });
    });

    describe('filename priority', () => {
      it('should use filename first when configured', () => {
        const config: DateExtractionConfig = {
          startSources: ['startDate'],
          endSources: ['endDate'],
          priorities: ['filename', 'properties'],
        };

        const result = engine.extractDates(
          '2025-01-15 - 2025-01-20 Note.md',
          { startDate: '2025-02-15', endDate: '2025-02-20' },
          config
        );

        expect(result.start).toEqual({
          year: 2025,
          month: 1,
          day: 15,
        });
        expect(result.end).toEqual({
          year: 2025,
          month: 1,
          day: 20,
        });
      });

      it('should fall back to properties when filename has no dates', () => {
        const config: DateExtractionConfig = {
          startSources: ['startDate'],
          endSources: ['endDate'],
          priorities: ['filename', 'properties'],
        };

        const result = engine.extractDates(
          'My Note.md',
          { startDate: '2025-02-15', endDate: '2025-02-20' },
          config
        );

        expect(result.start).toEqual({
          year: 2025,
          month: 2,
          day: 15,
        });
        expect(result.end).toEqual({
          year: 2025,
          month: 2,
          day: 20,
        });
      });
    });

    describe('mixed sources', () => {
      it('should get start from filename and end from properties', () => {
        const config: DateExtractionConfig = {
          startSources: ['startDate'],
          endSources: ['endDate'],
          priorities: ['filename', 'properties'],
        };

        const result = engine.extractDates(
          '2025-01-15 Meeting.md', // Only start in filename
          { endDate: '2025-01-20' },
          config
        );

        expect(result.start).toEqual({
          year: 2025,
          month: 1,
          day: 15,
        });
        expect(result.end).toEqual({
          year: 2025,
          month: 1,
          day: 20,
        });
      });

      it('should get start from properties and end from filename (when configured)', () => {
        const config: DateExtractionConfig = {
          startSources: ['startDate'],
          endSources: ['endDate'],
          priorities: ['properties', 'filename'],
        };

        const result = engine.extractDates(
          '2025-01-10 - 2025-01-20 Trip.md',
          { startDate: '2025-01-15' }, // Only start in properties
          config
        );

        expect(result.start).toEqual({
          year: 2025,
          month: 1,
          day: 15,
        });
        expect(result.end).toEqual({
          year: 2025,
          month: 1,
          day: 20,
        });
      });
    });

    describe('no dates found', () => {
      it('should return nulls when no dates anywhere', () => {
        const config: DateExtractionConfig = {
          startSources: ['startDate'],
          endSources: ['endDate'],
          priorities: ['properties', 'filename'],
        };

        const result = engine.extractDates('My Note.md', { title: 'Hello' }, config);

        expect(result.start).toBeNull();
        expect(result.end).toBeNull();
      });

      it('should return nulls when frontmatter is null', () => {
        const config: DateExtractionConfig = {
          startSources: ['startDate'],
          endSources: ['endDate'],
          priorities: ['properties', 'filename'],
        };

        const result = engine.extractDates('My Note.md', null, config);

        expect(result.start).toBeNull();
        expect(result.end).toBeNull();
      });
    });

    describe('realistic scenarios', () => {
      it('should handle a daily note', () => {
        const config: DateExtractionConfig = {
          startSources: ['date'],
          endSources: ['endDate'],
          priorities: ['filename', 'properties'],
        };

        const result = engine.extractDates('2025-01-15.md', null, config);

        expect(result.start).toEqual({
          year: 2025,
          month: 1,
          day: 15,
        });
        expect(result.end).toBeNull();
      });

      it('should handle a meeting note with due date', () => {
        const config: DateExtractionConfig = {
          startSources: ['date', 'created'],
          endSources: ['due', 'deadline', 'endDate'],
          priorities: ['properties', 'filename'],
        };

        const result = engine.extractDates(
          'Weekly Team Sync.md',
          {
            date: '2025-01-15',
            due: '2025-01-22',
          },
          config
        );

        expect(result.start).toEqual({
          year: 2025,
          month: 1,
          day: 15,
        });
        expect(result.end).toEqual({
          year: 2025,
          month: 1,
          day: 22,
        });
      });

      it('should handle a vacation note with date range in filename', () => {
        const config: DateExtractionConfig = {
          startSources: ['startDate'],
          endSources: ['endDate'],
          priorities: ['filename', 'properties'],
        };

        const result = engine.extractDates('2025-07-01 - 2025-07-15 Summer Vacation.md', {}, config);

        expect(result.start).toEqual({
          year: 2025,
          month: 7,
          day: 1,
        });
        expect(result.end).toEqual({
          year: 2025,
          month: 7,
          day: 15,
        });
      });
    });
  });
});
