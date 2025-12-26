/**
 * Linear Calendar 2 - Main Entry Point
 *
 * This file will be the plugin entry point once the presentation layer is complete.
 * For now, it exports the core modules for testing.
 */

// Core Domain Models
export {
  createLocalDate,
  localDateToKey,
  localDateFromKey,
  compareLocalDates,
  getDaysInMonth,
  getWeekday,
  addDays,
  getToday,
  isLeapYear,
} from './core/domain/models/LocalDate';

export type { LocalDate } from './core/domain/models/LocalDate';

export {
  createCalendarEntry,
  isMultiDayEntry,
} from './core/domain/models/CalendarEntry';

export type {
  CalendarEntry,
  EntryMetadata,
} from './core/domain/models/CalendarEntry';

export {
  createDateRange,
  rangesOverlap,
  splitRangeByMonth,
} from './core/domain/models/DateRange';

export type { DateRange, MonthSegment } from './core/domain/models/DateRange';

// Core Engines
export { DateEngine } from './core/engines/DateEngine';
export { CalendarEngine } from './core/engines/CalendarEngine';
export { MultiDayEngine } from './core/engines/MultiDayEngine';

// Types
export type {
  LinearCalendarSettings,
  CalendarWidth,
  DatePriority,
} from './core/domain/types';

// Constants
export {
  MONTH_NAMES,
  WEEKDAY_NAMES,
  MAX_DAY_CELLS,
  CSS_CLASSES,
  ARIA_LABELS,
} from './core/utils/constants';

// Placeholder Plugin class - will be implemented in presentation layer
import { Plugin } from 'obsidian';

export default class LinearCalendarPlugin extends Plugin {
  async onload(): Promise<void> {
    console.log('Linear Calendar 2 loading...');
    // TODO: Implement plugin initialization
  }

  async onunload(): Promise<void> {
    console.log('Linear Calendar 2 unloading...');
  }
}
