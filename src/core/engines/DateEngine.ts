/**
 * DateEngine - Timezone-safe date extraction for Linear Calendar 2
 *
 * CRITICAL: Never use new Date(string) for parsing!
 * This causes UTC timezone shifts that can change the day.
 * Always parse date strings manually by splitting and using parseInt.
 */

import type { LocalDate } from '../domain/models/LocalDate';

/**
 * Configuration for date extraction sources and priorities
 */
export interface DateExtractionConfig {
  /** Property names to check for start date (in priority order) */
  startSources: string[];
  /** Property names to check for end date (in priority order) */
  endSources: string[];
  /** Priority order for extraction: 'properties' first or 'filename' first */
  priorities: ('properties' | 'filename')[];
}

/**
 * Result of date extraction
 */
export interface DateExtractionResult {
  start: LocalDate | null;
  end: LocalDate | null;
}

/**
 * Result of filename extraction
 */
export interface FilenameExtractionResult {
  start: LocalDate | null;
  end: LocalDate | null;
}

/**
 * DateEngine provides timezone-safe date parsing and extraction
 * from filenames and frontmatter properties.
 */
export class DateEngine {
  /**
   * Regex pattern for ISO date format (YYYY-MM-DD)
   */
  private static readonly DATE_PATTERN = /(\d{4}-\d{2}-\d{2})/g;

  /**
   * Parse a date value to LocalDate in a TIMEZONE-SAFE manner.
   *
   * IMPORTANT: This method NEVER uses new Date(string) because that
   * interprets the string as UTC, causing day shifts in local timezone.
   *
   * @param value - The value to parse (string, Date, or unknown)
   * @returns LocalDate object or null if parsing fails
   */
  parseDate(value: unknown): LocalDate | null {
    if (value === null || value === undefined) {
      return null;
    }

    // Handle string dates - the most common case
    if (typeof value === 'string') {
      return this.parseDateString(value);
    }

    // Handle Date objects - extract local components
    if (value instanceof Date) {
      if (isNaN(value.getTime())) {
        return null;
      }
      return {
        year: value.getFullYear(),
        month: value.getMonth() + 1, // getMonth() is 0-indexed
        day: value.getDate(),
      };
    }

    // Handle objects that might have year/month/day properties
    if (typeof value === 'object' && value !== null) {
      const obj = value as Record<string, unknown>;
      if (
        typeof obj.year === 'number' &&
        typeof obj.month === 'number' &&
        typeof obj.day === 'number'
      ) {
        if (this.isValidDate(obj.year, obj.month, obj.day)) {
          return {
            year: obj.year,
            month: obj.month,
            day: obj.day,
          };
        }
      }
    }

    return null;
  }

  /**
   * Parse a date string in YYYY-MM-DD format.
   * TIMEZONE-SAFE: Uses string splitting, not Date parsing.
   *
   * @param dateStr - Date string to parse
   * @returns LocalDate or null if invalid
   */
  private parseDateString(dateStr: string): LocalDate | null {
    // Trim whitespace
    const trimmed = dateStr.trim();

    // Check for ISO date format YYYY-MM-DD
    const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
      return null;
    }

    // Parse components using parseInt - NO Date constructor!
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const day = parseInt(match[3], 10);

    // Validate the date components
    if (!this.isValidDate(year, month, day)) {
      return null;
    }

    return { year, month, day };
  }

  /**
   * Validate date components
   *
   * @param year - Year (must be reasonable, e.g., 1900-2100)
   * @param month - Month (1-12)
   * @param day - Day (1-31 depending on month)
   * @returns true if valid date
   */
  private isValidDate(year: number, month: number, day: number): boolean {
    // Basic range checks
    if (year < 1900 || year > 2100) {
      return false;
    }
    if (month < 1 || month > 12) {
      return false;
    }
    if (day < 1 || day > 31) {
      return false;
    }

    // Check days in month
    const daysInMonth = this.getDaysInMonth(year, month);
    if (day > daysInMonth) {
      return false;
    }

    return true;
  }

  /**
   * Get the number of days in a month, accounting for leap years
   *
   * @param year - Year
   * @param month - Month (1-12)
   * @returns Number of days in the month
   */
  private getDaysInMonth(year: number, month: number): number {
    const daysPerMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    if (month === 2 && this.isLeapYear(year)) {
      return 29;
    }

    return daysPerMonth[month - 1];
  }

  /**
   * Check if a year is a leap year
   *
   * @param year - Year to check
   * @returns true if leap year
   */
  private isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }

  /**
   * Extract dates from a filename.
   * Looks for YYYY-MM-DD patterns in the filename.
   * First match = start date, second match = end date (for ranges)
   *
   * @param fileName - The filename to extract dates from
   * @returns Object with start and end LocalDate (or null)
   */
  extractFromFilename(fileName: string): FilenameExtractionResult {
    const result: FilenameExtractionResult = {
      start: null,
      end: null,
    };

    if (!fileName || typeof fileName !== 'string') {
      return result;
    }

    // Find all date matches in the filename
    const matches = fileName.match(DateEngine.DATE_PATTERN);

    if (!matches || matches.length === 0) {
      return result;
    }

    // First match is the start date
    result.start = this.parseDate(matches[0]);

    // Second match (if exists) is the end date
    if (matches.length >= 2) {
      result.end = this.parseDate(matches[1]);
    }

    return result;
  }

  /**
   * Extract a date from frontmatter properties.
   * Iterates through property names and returns the first valid date found.
   *
   * @param frontmatter - The frontmatter object
   * @param propertyNames - Array of property names to check (in priority order)
   * @returns LocalDate or null if no valid date found
   */
  extractFromProperties(
    frontmatter: Record<string, unknown> | null | undefined,
    propertyNames: string[]
  ): LocalDate | null {
    if (!frontmatter || typeof frontmatter !== 'object') {
      return null;
    }

    if (!Array.isArray(propertyNames)) {
      return null;
    }

    for (const propName of propertyNames) {
      if (typeof propName !== 'string' || !propName) {
        continue;
      }

      const value = frontmatter[propName];
      if (value === undefined || value === null) {
        continue;
      }

      const date = this.parseDate(value);
      if (date !== null) {
        return date;
      }
    }

    return null;
  }

  /**
   * Extract start and end dates using the configured sources and priorities.
   * Combines filename and property extraction based on priority order.
   *
   * @param fileName - The filename to extract from
   * @param frontmatter - The frontmatter properties
   * @param config - Configuration for extraction sources and priorities
   * @returns Object with start and end LocalDate (or null)
   */
  extractDates(
    fileName: string,
    frontmatter: Record<string, unknown> | null | undefined,
    config: DateExtractionConfig
  ): DateExtractionResult {
    const result: DateExtractionResult = {
      start: null,
      end: null,
    };

    // Extract from filename (we'll use it based on priority)
    const filenameResult = this.extractFromFilename(fileName);

    // Process each priority source
    for (const priority of config.priorities) {
      if (priority === 'filename') {
        // Use filename extraction if we don't have dates yet
        if (result.start === null && filenameResult.start !== null) {
          result.start = filenameResult.start;
        }
        if (result.end === null && filenameResult.end !== null) {
          result.end = filenameResult.end;
        }
      } else if (priority === 'properties') {
        // Use property extraction if we don't have dates yet
        if (result.start === null) {
          result.start = this.extractFromProperties(frontmatter, config.startSources);
        }
        if (result.end === null) {
          result.end = this.extractFromProperties(frontmatter, config.endSources);
        }
      }
    }

    return result;
  }
}

/**
 * Default DateEngine instance for convenience
 */
export const dateEngine = new DateEngine();
