/**
 * EntryCache - Caches calendar entries for performance
 *
 * This cache stores calendar entries indexed by date for fast lookup.
 * It supports invalidation when files change and provides efficient
 * querying for entries on specific dates or date ranges.
 */

import type { CalendarEntry } from '../../core/domain/models/CalendarEntry';
import type { LocalDate } from '../../core/domain/models/LocalDate';
import { localDateToKey, compareLocalDates } from '../../core/domain/models/LocalDate';

/**
 * Cache statistics for monitoring
 */
export interface CacheStats {
  /** Total number of entries in cache */
  readonly entryCount: number;
  /** Number of unique dates with entries */
  readonly dateCount: number;
  /** Cache hit count */
  readonly hits: number;
  /** Cache miss count */
  readonly misses: number;
  /** Last rebuild timestamp */
  readonly lastRebuild: number;
}

/**
 * Configuration for the entry cache
 */
export interface EntryCacheConfig {
  /** Maximum number of entries before forcing cleanup */
  maxEntries?: number;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Cache for calendar entries with fast date-based lookup
 */
export class EntryCache {
  /** Map of file path to entry */
  private readonly entriesByPath: Map<string, CalendarEntry>;

  /** Map of date key to array of entries on that date */
  private readonly entriesByDate: Map<string, CalendarEntry[]>;

  /** Map of date key to array of multi-day entries that span that date */
  private readonly multiDayEntriesByDate: Map<string, CalendarEntry[]>;

  /** Cache statistics */
  private stats: {
    hits: number;
    misses: number;
    lastRebuild: number;
  };

  /** Configuration */
  private readonly config: Required<EntryCacheConfig>;

  constructor(config: EntryCacheConfig = {}) {
    this.entriesByPath = new Map();
    this.entriesByDate = new Map();
    this.multiDayEntriesByDate = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      lastRebuild: 0,
    };
    this.config = {
      maxEntries: config.maxEntries ?? 10000,
      debug: config.debug ?? false,
    };
  }

  /**
   * Adds or updates an entry in the cache
   * @param entry - The calendar entry to add
   */
  addEntry(entry: CalendarEntry): void {
    // Remove existing entry for this path if present
    this.removeEntry(entry.filePath);

    // Add to path index
    this.entriesByPath.set(entry.filePath, entry);

    // Add to date index
    const startKey = localDateToKey(entry.startDate);
    this.addToDateIndex(startKey, entry, this.entriesByDate);

    // Handle multi-day entries
    if (entry.isMultiDay && entry.endDate) {
      this.indexMultiDayEntry(entry);
    }

    this.log(`Added entry: ${entry.filePath}`);
  }

  /**
   * Removes an entry from the cache by file path
   * @param filePath - Path of the file to remove
   */
  removeEntry(filePath: string): void {
    const existing = this.entriesByPath.get(filePath);
    if (!existing) return;

    // Remove from path index
    this.entriesByPath.delete(filePath);

    // Remove from date index
    const startKey = localDateToKey(existing.startDate);
    this.removeFromDateIndex(startKey, existing.id, this.entriesByDate);

    // Remove from multi-day index
    if (existing.isMultiDay && existing.endDate) {
      this.removeMultiDayEntry(existing);
    }

    this.log(`Removed entry: ${filePath}`);
  }

  /**
   * Gets all entries that appear on a specific date
   * This includes single-day entries and multi-day entries spanning this date
   * @param date - The date to query
   * @returns Array of calendar entries
   */
  getEntriesForDate(date: LocalDate): readonly CalendarEntry[] {
    const key = localDateToKey(date);
    const singleDay = this.entriesByDate.get(key) ?? [];
    const multiDay = this.multiDayEntriesByDate.get(key) ?? [];

    if (singleDay.length > 0 || multiDay.length > 0) {
      this.stats.hits++;
    } else {
      this.stats.misses++;
    }

    // Combine and deduplicate (multi-day entries might appear in both)
    const combined = new Map<string, CalendarEntry>();
    for (const entry of singleDay) {
      combined.set(entry.id, entry);
    }
    for (const entry of multiDay) {
      combined.set(entry.id, entry);
    }

    return Array.from(combined.values());
  }

  /**
   * Gets all entries that overlap with a date range
   * @param start - Start of the range
   * @param end - End of the range
   * @returns Array of calendar entries
   */
  getEntriesInRange(start: LocalDate, end: LocalDate): readonly CalendarEntry[] {
    const entries = new Map<string, CalendarEntry>();

    for (const entry of this.entriesByPath.values()) {
      const entryEnd = entry.endDate ?? entry.startDate;

      // Check if entry overlaps with range
      // Entry overlaps if: entry.start <= range.end AND entry.end >= range.start
      if (
        compareLocalDates(entry.startDate, end) <= 0 &&
        compareLocalDates(entryEnd, start) >= 0
      ) {
        entries.set(entry.id, entry);
      }
    }

    return Array.from(entries.values());
  }

  /**
   * Gets all multi-day entries
   * @returns Array of multi-day calendar entries
   */
  getMultiDayEntries(): readonly CalendarEntry[] {
    return Array.from(this.entriesByPath.values()).filter((e) => e.isMultiDay);
  }

  /**
   * Gets an entry by file path
   * @param filePath - Path to look up
   * @returns The entry or undefined
   */
  getEntryByPath(filePath: string): CalendarEntry | undefined {
    return this.entriesByPath.get(filePath);
  }

  /**
   * Checks if a file is in the cache
   * @param filePath - Path to check
   * @returns True if file is cached
   */
  hasEntry(filePath: string): boolean {
    return this.entriesByPath.has(filePath);
  }

  /**
   * Gets all cached entries
   * @returns Array of all entries
   */
  getAllEntries(): readonly CalendarEntry[] {
    return Array.from(this.entriesByPath.values());
  }

  /**
   * Clears all entries from the cache
   */
  clear(): void {
    this.entriesByPath.clear();
    this.entriesByDate.clear();
    this.multiDayEntriesByDate.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      lastRebuild: Date.now(),
    };
    this.log('Cache cleared');
  }

  /**
   * Rebuilds the cache from a list of entries
   * @param entries - Entries to populate the cache with
   */
  rebuild(entries: readonly CalendarEntry[]): void {
    this.clear();
    this.stats.lastRebuild = Date.now();

    for (const entry of entries) {
      this.addEntry(entry);
    }

    this.log(`Cache rebuilt with ${entries.length} entries`);
  }

  /**
   * Gets cache statistics
   * @returns Current cache stats
   */
  getStats(): CacheStats {
    return Object.freeze({
      entryCount: this.entriesByPath.size,
      dateCount: this.entriesByDate.size + this.multiDayEntriesByDate.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      lastRebuild: this.stats.lastRebuild,
    });
  }

  /**
   * Indexes a multi-day entry for all dates it spans
   */
  private indexMultiDayEntry(entry: CalendarEntry): void {
    if (!entry.endDate) return;

    // We already indexed the start date in the main date index
    // Now index all dates from start+1 to end in the multi-day index
    let current = entry.startDate;
    const end = entry.endDate;

    while (compareLocalDates(current, end) < 0) {
      // Move to next day
      current = this.addOneDay(current);

      if (compareLocalDates(current, end) <= 0) {
        const key = localDateToKey(current);
        this.addToDateIndex(key, entry, this.multiDayEntriesByDate);
      }
    }
  }

  /**
   * Removes a multi-day entry from the date index
   */
  private removeMultiDayEntry(entry: CalendarEntry): void {
    if (!entry.endDate) return;

    let current = entry.startDate;
    const end = entry.endDate;

    while (compareLocalDates(current, end) < 0) {
      current = this.addOneDay(current);

      if (compareLocalDates(current, end) <= 0) {
        const key = localDateToKey(current);
        this.removeFromDateIndex(key, entry.id, this.multiDayEntriesByDate);
      }
    }
  }

  /**
   * Adds an entry to a date index map
   */
  private addToDateIndex(
    key: string,
    entry: CalendarEntry,
    index: Map<string, CalendarEntry[]>
  ): void {
    const existing = index.get(key);
    if (existing) {
      existing.push(entry);
    } else {
      index.set(key, [entry]);
    }
  }

  /**
   * Removes an entry from a date index map
   */
  private removeFromDateIndex(
    key: string,
    entryId: string,
    index: Map<string, CalendarEntry[]>
  ): void {
    const existing = index.get(key);
    if (!existing) return;

    const filtered = existing.filter((e) => e.id !== entryId);
    if (filtered.length === 0) {
      index.delete(key);
    } else {
      index.set(key, filtered);
    }
  }

  /**
   * Adds one day to a date (simple version for indexing)
   * Uses the full LocalDate.addDays for proper month/year handling
   */
  private addOneDay(date: LocalDate): LocalDate {
    let day = date.day + 1;
    let month = date.month;
    let year = date.year;

    const daysInMonth = this.getDaysInMonth(year, month);

    if (day > daysInMonth) {
      day = 1;
      month += 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
    }

    return { year, month, day };
  }

  /**
   * Gets the number of days in a month
   */
  private getDaysInMonth(year: number, month: number): number {
    const daysPerMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (month === 2) {
      const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
      return isLeap ? 29 : 28;
    }
    return daysPerMonth[month - 1];
  }

  /**
   * Logs a message if debug is enabled
   */
  private log(message: string): void {
    if (this.config.debug) {
      console.log(`[EntryCache] ${message}`);
    }
  }
}
