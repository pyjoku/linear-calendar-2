/**
 * @fileoverview Constants used throughout the Linear Calendar 2 plugin.
 *
 * This module contains all constant values including month names,
 * weekday names, CSS class names, and configuration limits.
 *
 * @module constants
 */

// ============================================================================
// Calendar Constants
// ============================================================================

/**
 * Month names in English (January = index 0).
 * Use with month - 1 since LocalDate months are 1-indexed.
 */
export const MONTH_NAMES: readonly string[] = Object.freeze([
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
  'December'
]);

/**
 * Abbreviated month names (3 letters).
 */
export const MONTH_NAMES_SHORT: readonly string[] = Object.freeze([
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
]);

/**
 * Weekday names starting with Sunday (Sunday = index 0).
 */
export const WEEKDAY_NAMES: readonly string[] = Object.freeze([
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
]);

/**
 * Abbreviated weekday names (3 letters).
 */
export const WEEKDAY_NAMES_SHORT: readonly string[] = Object.freeze([
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat'
]);

/**
 * Single-letter weekday abbreviations.
 */
export const WEEKDAY_NAMES_NARROW: readonly string[] = Object.freeze([
  'S',
  'M',
  'T',
  'W',
  'T',
  'F',
  'S'
]);

/**
 * Maximum number of day cells in a month grid.
 * 6 rows x 7 days = 42, but we use 37 as the typical maximum
 * (5 complete weeks + potential overflow).
 */
export const MAX_DAY_CELLS = 37;

/**
 * Number of days in a week.
 */
export const DAYS_IN_WEEK = 7;

/**
 * Maximum weeks that can appear in a month view.
 */
export const MAX_WEEKS_IN_MONTH = 6;

// ============================================================================
// CSS Class Constants
// ============================================================================

/**
 * CSS class prefix for all Linear Calendar 2 classes.
 */
export const CSS_PREFIX = 'lc2';

/**
 * CSS classes for the calendar container.
 */
export const CSS_CLASSES = Object.freeze({
  // Container classes
  container: `${CSS_PREFIX}-container`,
  calendar: `${CSS_PREFIX}-calendar`,
  header: `${CSS_PREFIX}-header`,
  navigation: `${CSS_PREFIX}-navigation`,
  grid: `${CSS_PREFIX}-grid`,

  // Header elements
  headerTitle: `${CSS_PREFIX}-header-title`,
  headerMonth: `${CSS_PREFIX}-header-month`,
  headerYear: `${CSS_PREFIX}-header-year`,
  navButton: `${CSS_PREFIX}-nav-button`,
  navButtonPrev: `${CSS_PREFIX}-nav-button-prev`,
  navButtonNext: `${CSS_PREFIX}-nav-button-next`,
  navButtonToday: `${CSS_PREFIX}-nav-button-today`,

  // Grid elements
  weekdayHeader: `${CSS_PREFIX}-weekday-header`,
  weekdayCell: `${CSS_PREFIX}-weekday-cell`,
  weekNumber: `${CSS_PREFIX}-week-number`,
  dayCell: `${CSS_PREFIX}-day-cell`,
  dayNumber: `${CSS_PREFIX}-day-number`,
  dayContent: `${CSS_PREFIX}-day-content`,

  // Day cell states
  dayToday: `${CSS_PREFIX}-day-today`,
  daySelected: `${CSS_PREFIX}-day-selected`,
  dayHasEntries: `${CSS_PREFIX}-day-has-entries`,
  dayEmpty: `${CSS_PREFIX}-day-empty`,
  dayAdjacentMonth: `${CSS_PREFIX}-day-adjacent-month`,
  dayWeekend: `${CSS_PREFIX}-day-weekend`,

  // Entry elements
  entry: `${CSS_PREFIX}-entry`,
  entryMultiDay: `${CSS_PREFIX}-entry-multi-day`,
  entryStart: `${CSS_PREFIX}-entry-start`,
  entryEnd: `${CSS_PREFIX}-entry-end`,
  entryMiddle: `${CSS_PREFIX}-entry-middle`,
  entryBar: `${CSS_PREFIX}-entry-bar`,
  entryTitle: `${CSS_PREFIX}-entry-title`,
  entryCount: `${CSS_PREFIX}-entry-count`,
  entryMore: `${CSS_PREFIX}-entry-more`,

  // Interactive states
  clickable: `${CSS_PREFIX}-clickable`,
  hoverable: `${CSS_PREFIX}-hoverable`,
  focused: `${CSS_PREFIX}-focused`,
  disabled: `${CSS_PREFIX}-disabled`,

  // Utility classes
  hidden: `${CSS_PREFIX}-hidden`,
  srOnly: `${CSS_PREFIX}-sr-only`,
  loading: `${CSS_PREFIX}-loading`,
  error: `${CSS_PREFIX}-error`
} as const);

/**
 * Type for CSS class keys.
 */
export type CSSClassKey = keyof typeof CSS_CLASSES;

// ============================================================================
// Data Attributes
// ============================================================================

/**
 * Data attribute prefix.
 */
export const DATA_ATTR_PREFIX = 'data-lc2';

/**
 * Data attributes used for DOM elements.
 */
export const DATA_ATTRIBUTES = Object.freeze({
  date: `${DATA_ATTR_PREFIX}-date`,
  entryId: `${DATA_ATTR_PREFIX}-entry-id`,
  filePath: `${DATA_ATTR_PREFIX}-file-path`,
  month: `${DATA_ATTR_PREFIX}-month`,
  year: `${DATA_ATTR_PREFIX}-year`,
  day: `${DATA_ATTR_PREFIX}-day`,
  weekNumber: `${DATA_ATTR_PREFIX}-week-number`,
  segmentPosition: `${DATA_ATTR_PREFIX}-segment-position`
} as const);

// ============================================================================
// Plugin Constants
// ============================================================================

/**
 * Plugin identifier.
 */
export const PLUGIN_ID = 'linear-calendar-2';

/**
 * Plugin display name.
 */
export const PLUGIN_NAME = 'Linear Calendar 2';

/**
 * View type identifier for the calendar view.
 */
export const VIEW_TYPE_CALENDAR = 'linear-calendar-2-view';

/**
 * Settings file name.
 */
export const SETTINGS_FILE = 'data.json';

// ============================================================================
// Date Format Patterns
// ============================================================================

/**
 * Common date format patterns.
 */
export const DATE_PATTERNS = Object.freeze({
  iso: 'YYYY-MM-DD',
  isoShort: 'YYYY-M-D',
  european: 'DD.MM.YYYY',
  american: 'MM/DD/YYYY',
  filename: 'YYYY-MM-DD'
} as const);

/**
 * Regex pattern for ISO date format (YYYY-MM-DD).
 */
export const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Regex pattern for extracting date from filename.
 */
export const FILENAME_DATE_REGEX = /(\d{4})-(\d{2})-(\d{2})/;

// ============================================================================
// Accessibility Constants
// ============================================================================

/**
 * ARIA labels for accessibility.
 */
export const ARIA_LABELS = Object.freeze({
  calendar: 'Calendar',
  previousMonth: 'Previous month',
  nextMonth: 'Next month',
  today: 'Go to today',
  dayCell: (date: string) => `Day ${date}`,
  entriesCount: (count: number) => `${count} ${count === 1 ? 'entry' : 'entries'}`,
  weekNumber: (week: number) => `Week ${week}`
} as const);

/**
 * Keyboard codes for navigation.
 */
export const KEYBOARD_CODES = Object.freeze({
  enter: 'Enter',
  space: ' ',
  escape: 'Escape',
  arrowUp: 'ArrowUp',
  arrowDown: 'ArrowDown',
  arrowLeft: 'ArrowLeft',
  arrowRight: 'ArrowRight',
  home: 'Home',
  end: 'End',
  pageUp: 'PageUp',
  pageDown: 'PageDown'
} as const);
