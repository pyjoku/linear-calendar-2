/**
 * @fileoverview Core domain types and re-exports.
 *
 * This module serves as the central export point for all domain models
 * and types used throughout the Linear Calendar 2 plugin.
 *
 * @module types
 */

// Re-export LocalDate types and functions
export type { LocalDate } from '../models/LocalDate';
export {
  createLocalDate,
  localDateToKey,
  keyToLocalDate,
  compareLocalDates,
  localDatesEqual,
  isValidLocalDate,
  getDaysInMonth,
  isLeapYear,
  getWeekday,
  addDays,
  subtractDays,
  getToday,
  daysBetween,
  isBefore,
  isAfter,
  isWithinRange,
  getFirstDayOfMonth,
  getLastDayOfMonth
} from '../models/LocalDate';

// Re-export CalendarEntry types and functions
export type { CalendarEntry, EntryMetadata } from '../models/CalendarEntry';
export {
  createCalendarEntry,
  createEmptyMetadata,
  isCalendarEntry
} from '../models/CalendarEntry';

// Re-export DateRange types and functions
export type { DateRange, MonthSegment } from '../models/DateRange';
export {
  createDateRange,
  createSingleDayRange,
  rangesOverlap,
  isDateInRange,
  rangeContains,
  intersectRanges,
  getRangeDays,
  splitRangeByMonth,
  getMonthSegment,
  createMonthRange,
  isSingleDay,
  extendRange
} from '../models/DateRange';

// ============================================================================
// Plugin Settings Types
// ============================================================================

/**
 * Configuration for how dates are extracted from files.
 */
export interface DateExtractionConfig {
  /**
   * Whether to extract dates from filenames.
   * @default true
   */
  readonly fromFilename: boolean;

  /**
   * Whether to extract dates from YAML frontmatter.
   * @default true
   */
  readonly fromFrontmatter: boolean;

  /**
   * The frontmatter field name to look for dates.
   * @default "date"
   */
  readonly frontmatterField: string;

  /**
   * The frontmatter field name for end dates (multi-day events).
   * @default "endDate"
   */
  readonly endDateField: string;

  /**
   * Regex patterns for extracting dates from filenames.
   * Patterns are tried in order until one matches.
   */
  readonly filenamePatterns: readonly string[];

  /**
   * Whether to use file creation date as fallback.
   * @default false
   */
  readonly useCreationDateFallback: boolean;
}

/**
 * Configuration for folder filtering.
 */
export interface FolderFilterConfig {
  /**
   * List of folders to include. Empty means include all.
   * Supports glob patterns.
   */
  readonly includeFolders: readonly string[];

  /**
   * List of folders to exclude.
   * Takes precedence over includeFolders.
   * Supports glob patterns.
   */
  readonly excludeFolders: readonly string[];
}

/**
 * Configuration for visual display.
 */
export interface DisplayConfig {
  /**
   * The first day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday).
   * @default 1 (Monday)
   */
  readonly firstDayOfWeek: number;

  /**
   * Whether to show week numbers.
   * @default false
   */
  readonly showWeekNumbers: boolean;

  /**
   * Whether to highlight today.
   * @default true
   */
  readonly highlightToday: boolean;

  /**
   * Whether to show entries from adjacent months in the calendar view.
   * @default true
   */
  readonly showAdjacentMonths: boolean;

  /**
   * Maximum number of entries to show per day before collapsing.
   * @default 3
   */
  readonly maxEntriesPerDay: number;

  /**
   * Whether to show multi-day event bars.
   * @default true
   */
  readonly showMultiDayBars: boolean;
}

/**
 * Main plugin settings interface.
 *
 * Contains all configurable options for the Linear Calendar 2 plugin.
 */
export interface PluginSettings {
  /**
   * Configuration for date extraction.
   */
  readonly dateExtraction: DateExtractionConfig;

  /**
   * Configuration for folder filtering.
   */
  readonly folderFilter: FolderFilterConfig;

  /**
   * Configuration for visual display.
   */
  readonly display: DisplayConfig;

  /**
   * The locale to use for date formatting.
   * @default "en-US"
   */
  readonly locale: string;

  /**
   * Whether debug mode is enabled.
   * @default false
   */
  readonly debugMode: boolean;
}

/**
 * Default date extraction configuration.
 */
export const DEFAULT_DATE_EXTRACTION_CONFIG: DateExtractionConfig = Object.freeze({
  fromFilename: true,
  fromFrontmatter: true,
  frontmatterField: 'date',
  endDateField: 'endDate',
  filenamePatterns: Object.freeze([
    '^(\\d{4}-\\d{2}-\\d{2})',           // 2024-03-15 at start
    '(\\d{4}-\\d{2}-\\d{2})$',           // 2024-03-15 at end
    '^(\\d{4}-\\d{2}-\\d{2})[-_\\s]',    // 2024-03-15- or 2024-03-15_ prefix
    '[-_\\s](\\d{4}-\\d{2}-\\d{2})\\.md$' // -2024-03-15.md suffix
  ]),
  useCreationDateFallback: false
});

/**
 * Default folder filter configuration.
 */
export const DEFAULT_FOLDER_FILTER_CONFIG: FolderFilterConfig = Object.freeze({
  includeFolders: Object.freeze([]),
  excludeFolders: Object.freeze([])
});

/**
 * Default display configuration.
 */
export const DEFAULT_DISPLAY_CONFIG: DisplayConfig = Object.freeze({
  firstDayOfWeek: 1,
  showWeekNumbers: false,
  highlightToday: true,
  showAdjacentMonths: true,
  maxEntriesPerDay: 3,
  showMultiDayBars: true
});

/**
 * Default plugin settings.
 */
export const DEFAULT_PLUGIN_SETTINGS: PluginSettings = Object.freeze({
  dateExtraction: DEFAULT_DATE_EXTRACTION_CONFIG,
  folderFilter: DEFAULT_FOLDER_FILTER_CONFIG,
  display: DEFAULT_DISPLAY_CONFIG,
  locale: 'en-US',
  debugMode: false
});

/**
 * Creates plugin settings by merging provided options with defaults.
 *
 * @param partial - Partial settings to merge with defaults
 * @returns Complete plugin settings
 */
export function createPluginSettings(partial: Partial<PluginSettings>): PluginSettings {
  return Object.freeze({
    dateExtraction: partial.dateExtraction
      ? Object.freeze({ ...DEFAULT_DATE_EXTRACTION_CONFIG, ...partial.dateExtraction })
      : DEFAULT_DATE_EXTRACTION_CONFIG,
    folderFilter: partial.folderFilter
      ? Object.freeze({ ...DEFAULT_FOLDER_FILTER_CONFIG, ...partial.folderFilter })
      : DEFAULT_FOLDER_FILTER_CONFIG,
    display: partial.display
      ? Object.freeze({ ...DEFAULT_DISPLAY_CONFIG, ...partial.display })
      : DEFAULT_DISPLAY_CONFIG,
    locale: partial.locale ?? DEFAULT_PLUGIN_SETTINGS.locale,
    debugMode: partial.debugMode ?? DEFAULT_PLUGIN_SETTINGS.debugMode
  });
}

// ============================================================================
// View State Types
// ============================================================================

/**
 * Represents the currently displayed month in the calendar view.
 */
export interface ViewState {
  /** The year being displayed */
  readonly year: number;

  /** The month being displayed (1-12) */
  readonly month: number;

  /** The currently selected date (if any) */
  readonly selectedDate: LocalDate | null;

  /** The currently focused entry ID (if any) */
  readonly focusedEntryId: string | null;
}

/**
 * Creates a new ViewState for the current month.
 *
 * @returns A ViewState set to the current month
 */
export function createCurrentViewState(): ViewState {
  const today = new Date();
  return Object.freeze({
    year: today.getFullYear(),
    month: today.getMonth() + 1,
    selectedDate: null,
    focusedEntryId: null
  });
}

/**
 * Creates a ViewState for a specific month.
 *
 * @param year - The year
 * @param month - The month (1-12)
 * @returns A ViewState for the specified month
 */
export function createViewState(year: number, month: number): ViewState {
  return Object.freeze({
    year,
    month,
    selectedDate: null,
    focusedEntryId: null
  });
}
