import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CalendarEngine, CalendarGrid, MonthData } from '../CalendarEngine';
import { createLocalDate } from '../../domain/models/LocalDate';

describe('CalendarEngine', () => {
  let engine: CalendarEngine;

  beforeEach(() => {
    engine = new CalendarEngine();
  });

  describe('getDaysInMonth', () => {
    it('returns 28 days for February in a non-leap year', () => {
      expect(engine.getDaysInMonth(2023, 2)).toBe(28);
      expect(engine.getDaysInMonth(2025, 2)).toBe(28);
    });

    it('returns 29 days for February in a leap year', () => {
      expect(engine.getDaysInMonth(2024, 2)).toBe(29);
      expect(engine.getDaysInMonth(2020, 2)).toBe(29);
    });

    it('returns 29 days for February in century leap years', () => {
      // Years divisible by 400 are leap years
      expect(engine.getDaysInMonth(2000, 2)).toBe(29);
    });

    it('returns 28 days for February in century non-leap years', () => {
      // Years divisible by 100 but not 400 are not leap years
      expect(engine.getDaysInMonth(1900, 2)).toBe(28);
      expect(engine.getDaysInMonth(2100, 2)).toBe(28);
    });

    it('returns 31 days for months with 31 days', () => {
      expect(engine.getDaysInMonth(2025, 1)).toBe(31); // January
      expect(engine.getDaysInMonth(2025, 3)).toBe(31); // March
      expect(engine.getDaysInMonth(2025, 5)).toBe(31); // May
      expect(engine.getDaysInMonth(2025, 7)).toBe(31); // July
      expect(engine.getDaysInMonth(2025, 8)).toBe(31); // August
      expect(engine.getDaysInMonth(2025, 10)).toBe(31); // October
      expect(engine.getDaysInMonth(2025, 12)).toBe(31); // December
    });

    it('returns 30 days for months with 30 days', () => {
      expect(engine.getDaysInMonth(2025, 4)).toBe(30); // April
      expect(engine.getDaysInMonth(2025, 6)).toBe(30); // June
      expect(engine.getDaysInMonth(2025, 9)).toBe(30); // September
      expect(engine.getDaysInMonth(2025, 11)).toBe(30); // November
    });
  });

  describe('getFirstDayOfWeek', () => {
    it('returns correct day of week for known dates', () => {
      // January 1, 2025 is a Wednesday (3)
      expect(engine.getFirstDayOfWeek(2025, 1)).toBe(3);

      // February 1, 2025 is a Saturday (6)
      expect(engine.getFirstDayOfWeek(2025, 2)).toBe(6);

      // March 1, 2025 is a Saturday (6)
      expect(engine.getFirstDayOfWeek(2025, 3)).toBe(6);

      // April 1, 2025 is a Tuesday (2)
      expect(engine.getFirstDayOfWeek(2025, 4)).toBe(2);

      // January 1, 2024 is a Monday (1)
      expect(engine.getFirstDayOfWeek(2024, 1)).toBe(1);

      // January 1, 2023 is a Sunday (0)
      expect(engine.getFirstDayOfWeek(2023, 1)).toBe(0);
    });

    it('returns values in range 0-6', () => {
      for (let month = 1; month <= 12; month++) {
        const day = engine.getFirstDayOfWeek(2025, month);
        expect(day).toBeGreaterThanOrEqual(0);
        expect(day).toBeLessThanOrEqual(6);
      }
    });
  });

  describe('isToday', () => {
    beforeEach(() => {
      // Mock Date.now() to return a fixed date: 2025-06-15
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 5, 15)); // June 15, 2025
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns true for today', () => {
      const today = createLocalDate(2025, 6, 15);
      expect(engine.isToday(today)).toBe(true);
    });

    it('returns false for yesterday', () => {
      const yesterday = createLocalDate(2025, 6, 14);
      expect(engine.isToday(yesterday)).toBe(false);
    });

    it('returns false for tomorrow', () => {
      const tomorrow = createLocalDate(2025, 6, 16);
      expect(engine.isToday(tomorrow)).toBe(false);
    });

    it('returns false for same day different month', () => {
      const differentMonth = createLocalDate(2025, 7, 15);
      expect(engine.isToday(differentMonth)).toBe(false);
    });

    it('returns false for same day different year', () => {
      const differentYear = createLocalDate(2024, 6, 15);
      expect(engine.isToday(differentYear)).toBe(false);
    });
  });

  describe('generateGrid', () => {
    let grid: CalendarGrid;

    beforeEach(() => {
      // Mock date for consistent isToday checks
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 5, 15)); // June 15, 2025
      grid = engine.generateGrid(2025);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('generates a grid with the correct year', () => {
      expect(grid.year).toBe(2025);
    });

    it('generates exactly 12 months', () => {
      expect(grid.months).toHaveLength(12);
    });

    it('has correct month numbers from 1 to 12', () => {
      grid.months.forEach((month, index) => {
        expect(month.month).toBe(index + 1);
      });
    });

    it('has correct month names', () => {
      const expectedNames = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];
      grid.months.forEach((month, index) => {
        expect(month.name).toBe(expectedNames[index]);
      });
    });

    it('has correct number of days in each month', () => {
      const expectedDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      grid.months.forEach((month, index) => {
        expect(month.daysInMonth).toBe(expectedDays[index]);
      });
    });

    it('has correct number of empty padding cells at the start of each month', () => {
      grid.months.forEach((month) => {
        const emptyCells = month.days.filter((day) => day.isEmpty);
        expect(emptyCells.length).toBe(month.startDayOfWeek);
      });
    });

    it('has total cells equal to padding plus days in month', () => {
      grid.months.forEach((month) => {
        expect(month.days.length).toBe(
          month.startDayOfWeek + month.daysInMonth
        );
      });
    });

    it('marks today correctly in the grid', () => {
      // June 15, 2025 should be marked as today
      const june = grid.months[5]; // June is index 5
      const todayCells = june.days.filter((day) => day.isToday);
      expect(todayCells).toHaveLength(1);
      expect(todayCells[0].date.day).toBe(15);
      expect(todayCells[0].date.month).toBe(6);
      expect(todayCells[0].date.year).toBe(2025);
    });

    it('has no cells marked as today in other months', () => {
      grid.months.forEach((month, index) => {
        if (index !== 5) {
          // Skip June
          const todayCells = month.days.filter((day) => day.isToday);
          expect(todayCells).toHaveLength(0);
        }
      });
    });

    it('each month has at most 37 cells (31 days + 6 padding max)', () => {
      grid.months.forEach((month) => {
        expect(month.days.length).toBeLessThanOrEqual(37);
      });
    });

    describe('specific month tests for 2025', () => {
      it('January 2025 starts on Wednesday (3)', () => {
        const january = grid.months[0];
        expect(january.startDayOfWeek).toBe(3);
        expect(january.days.filter((d) => d.isEmpty)).toHaveLength(3);
      });

      it('February 2025 starts on Saturday (6)', () => {
        const february = grid.months[1];
        expect(february.startDayOfWeek).toBe(6);
        expect(february.days.filter((d) => d.isEmpty)).toHaveLength(6);
      });

      it('February 2025 has 28 days (not a leap year)', () => {
        const february = grid.months[1];
        expect(february.daysInMonth).toBe(28);
        // Total cells: 6 padding + 28 days = 34
        expect(february.days.length).toBe(34);
      });
    });

    describe('leap year handling', () => {
      it('February 2024 has 29 days', () => {
        vi.setSystemTime(new Date(2024, 5, 15));
        const grid2024 = engine.generateGrid(2024);
        const february = grid2024.months[1];
        expect(february.daysInMonth).toBe(29);
      });
    });
  });

  describe('month day alignment', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 0, 1));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('empty cells have isEmpty true', () => {
      const grid = engine.generateGrid(2025);
      grid.months.forEach((month) => {
        const emptyCells = month.days.slice(0, month.startDayOfWeek);
        emptyCells.forEach((cell) => {
          expect(cell.isEmpty).toBe(true);
        });
      });
    });

    it('actual day cells have isEmpty false', () => {
      const grid = engine.generateGrid(2025);
      grid.months.forEach((month) => {
        const dayCells = month.days.slice(month.startDayOfWeek);
        dayCells.forEach((cell) => {
          expect(cell.isEmpty).toBe(false);
        });
      });
    });

    it('actual day cells have correct sequential dates', () => {
      const grid = engine.generateGrid(2025);
      grid.months.forEach((month) => {
        const dayCells = month.days.slice(month.startDayOfWeek);
        dayCells.forEach((cell, index) => {
          expect(cell.date.day).toBe(index + 1);
          expect(cell.date.month).toBe(month.month);
          expect(cell.date.year).toBe(2025);
        });
      });
    });
  });
});
