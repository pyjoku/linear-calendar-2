/**
 * Linear Calendar 2 - Main Entry Point
 *
 * A professional linear calendar view for Obsidian that displays
 * all 365 days of the year with your notes.
 */

// Re-export the main plugin
export { LinearCalendarPlugin } from './plugin/LinearCalendarPlugin';
export { LinearCalendarPlugin as default } from './plugin/LinearCalendarPlugin';

// Export view types for external use
export { CalendarView, VIEW_TYPE_LINEAR_CALENDAR } from './presentation/views/CalendarView';

// Core Domain Models
export {
  createLocalDate,
  localDateToKey,
  keyToLocalDate as localDateFromKey,
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

export { DEFAULT_SETTINGS } from './core/domain/types';

// Constants
export {
  MONTH_NAMES,
  WEEKDAY_NAMES,
  MAX_DAY_CELLS,
  CSS_CLASSES,
  ARIA_LABELS,
} from './core/utils/constants';
