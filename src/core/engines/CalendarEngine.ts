/**
 * CalendarEngine - Core calendar calculation engine
 * Generates calendar grids with proper day alignment and leap year handling
 */

import {
  type LocalDate,
  createLocalDate,
  getToday,
  localDatesEqual,
  getDaysInMonth as localDateGetDaysInMonth,
  getWeekday,
} from '../domain/models/LocalDate';

/**
 * Represents a single day cell in the calendar grid
 */
export interface DayData {
  /** The date for this cell */
  date: LocalDate;
  /** Whether this day is today */
  isToday: boolean;
  /** Whether this is an empty padding cell at the start of the month */
  isEmpty: boolean;
}

/**
 * Represents a single month in the calendar
 */
export interface MonthData {
  /** Month number (1-12) */
  month: number;
  /** Month name */
  name: string;
  /** Day of week for the 1st of the month (0=Sunday, 6=Saturday) */
  startDayOfWeek: number;
  /** Number of days in this month */
  daysInMonth: number;
  /** Array of day cells including padding cells */
  days: DayData[];
}

/**
 * Represents the complete calendar grid for a year
 */
export interface CalendarGrid {
  /** The year */
  year: number;
  /** Array of all 12 months */
  months: MonthData[];
}

/**
 * Month names in English
 */
const MONTH_NAMES = [
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

/**
 * CalendarEngine provides methods for calendar calculations and grid generation
 */
export class CalendarEngine {
  /**
   * Gets the number of days in a given month, accounting for leap years
   * @param year - The year
   * @param month - The month (1-12)
   * @returns Number of days in the month
   */
  getDaysInMonth(year: number, month: number): number {
    return localDateGetDaysInMonth(year, month);
  }

  /**
   * Gets the day of week for the first day of a month
   * Uses timezone-safe calculation via LocalDate's getWeekday
   * @param year - The year
   * @param month - The month (1-12)
   * @returns Day of week (0=Sunday, 6=Saturday)
   */
  getFirstDayOfWeek(year: number, month: number): number {
    const firstDay = createLocalDate(year, month, 1);
    return getWeekday(firstDay);
  }

  /**
   * Checks if a given date is today
   * @param date - The LocalDate to check
   * @returns true if the date is today
   */
  isToday(date: LocalDate): boolean {
    const today = getToday();
    return localDatesEqual(date, today);
  }

  /**
   * Generates the complete calendar grid for a year
   * @param year - The year to generate
   * @returns CalendarGrid with all 12 months
   */
  generateGrid(year: number): CalendarGrid {
    const months: MonthData[] = [];

    for (let month = 1; month <= 12; month++) {
      months.push(this.generateMonth(year, month));
    }

    return {
      year,
      months,
    };
  }

  /**
   * Generates the data for a single month
   * @param year - The year
   * @param month - The month (1-12)
   * @returns MonthData with all day cells
   */
  private generateMonth(year: number, month: number): MonthData {
    const daysInMonth = this.getDaysInMonth(year, month);
    const startDayOfWeek = this.getFirstDayOfWeek(year, month);
    const days: DayData[] = [];

    // Add empty padding cells for alignment
    // startDayOfWeek tells us how many empty cells we need at the start
    for (let i = 0; i < startDayOfWeek; i++) {
      // Create a placeholder date for empty cells
      // Use the first day of the month as a placeholder
      days.push({
        date: createLocalDate(year, month, 1),
        isToday: false,
        isEmpty: true,
      });
    }

    // Add actual day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const date = createLocalDate(year, month, day);
      days.push({
        date,
        isToday: this.isToday(date),
        isEmpty: false,
      });
    }

    return {
      month,
      name: MONTH_NAMES[month - 1],
      startDayOfWeek,
      daysInMonth,
      days,
    };
  }
}
