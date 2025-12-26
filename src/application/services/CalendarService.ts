/**
 * CalendarService - Main application service for calendar functionality
 *
 * This service coordinates between the infrastructure repositories and
 * core engines to provide calendar functionality to the presentation layer.
 */

import type { App, TFile } from 'obsidian';
import { VaultRepository, FileInfo } from '../../infrastructure/repositories/VaultRepository';
import { MetadataRepository } from '../../infrastructure/repositories/MetadataRepository';
import { EntryCache } from '../../infrastructure/cache/EntryCache';
import { DateEngine, DateExtractionConfig } from '../../core/engines/DateEngine';
import { CalendarEngine, CalendarGrid } from '../../core/engines/CalendarEngine';
import { MultiDayEngine, BarPosition } from '../../core/engines/MultiDayEngine';
import { createCalendarEntry, CalendarEntry } from '../../core/domain/models/CalendarEntry';
import type { LocalDate } from '../../core/domain/models/LocalDate';
import { getToday } from '../../core/domain/models/LocalDate';
import type { LinearCalendarSettings } from '../../core/domain/types';

/**
 * Events that can be subscribed to
 */
export interface CalendarServiceEvents {
  /** Called when entries are updated */
  onEntriesUpdated: () => void;
  /** Called when a year changes */
  onYearChanged: (year: number) => void;
}

/**
 * Main service for calendar functionality
 */
export class CalendarService {
  private readonly vaultRepository: VaultRepository;
  private readonly metadataRepository: MetadataRepository;
  private readonly entryCache: EntryCache;
  private readonly dateEngine: DateEngine;
  private readonly calendarEngine: CalendarEngine;
  private readonly multiDayEngine: MultiDayEngine;

  private settings: LinearCalendarSettings;
  private currentYear: number;
  private unregisterMetadataListener: (() => void) | null = null;
  private eventListeners: CalendarServiceEvents | null = null;

  constructor(app: App, settings: LinearCalendarSettings) {
    this.vaultRepository = new VaultRepository(app);
    this.metadataRepository = new MetadataRepository(app);
    this.entryCache = new EntryCache({ debug: false });
    this.dateEngine = new DateEngine();
    this.calendarEngine = new CalendarEngine();
    this.multiDayEngine = new MultiDayEngine();

    this.settings = settings;
    this.currentYear = getToday().year;
  }

  /**
   * Initializes the service and loads initial data
   */
  async initialize(): Promise<void> {
    await this.rebuildCache();
    this.setupMetadataListener();
  }

  /**
   * Cleans up resources when the service is destroyed
   */
  destroy(): void {
    if (this.unregisterMetadataListener) {
      this.unregisterMetadataListener();
      this.unregisterMetadataListener = null;
    }
    this.eventListeners = null;
  }

  /**
   * Sets the event listeners
   * @param listeners - Event listener callbacks
   */
  setEventListeners(listeners: CalendarServiceEvents): void {
    this.eventListeners = listeners;
  }

  /**
   * Updates the settings
   * @param settings - New settings
   */
  async updateSettings(settings: LinearCalendarSettings): Promise<void> {
    const needsRebuild =
      this.settings.dateProperties.join(',') !== settings.dateProperties.join(',') ||
      this.settings.endDateProperties.join(',') !== settings.endDateProperties.join(',') ||
      this.settings.datePriority !== settings.datePriority;

    this.settings = settings;

    if (needsRebuild) {
      await this.rebuildCache();
    }
  }

  /**
   * Gets the current year being displayed
   */
  getCurrentYear(): number {
    return this.currentYear;
  }

  /**
   * Sets the current year to display
   * @param year - The year to display
   */
  setCurrentYear(year: number): void {
    if (this.currentYear !== year) {
      this.currentYear = year;
      this.eventListeners?.onYearChanged(year);
    }
  }

  /**
   * Navigates to the next year
   */
  nextYear(): void {
    this.setCurrentYear(this.currentYear + 1);
  }

  /**
   * Navigates to the previous year
   */
  previousYear(): void {
    this.setCurrentYear(this.currentYear - 1);
  }

  /**
   * Navigates to today's year
   */
  goToToday(): void {
    this.setCurrentYear(getToday().year);
  }

  /**
   * Generates the calendar grid for the current year
   * @returns CalendarGrid for the current year
   */
  generateCalendarGrid(): CalendarGrid {
    return this.calendarEngine.generateGrid(this.currentYear);
  }

  /**
   * Gets all entries for a specific date
   * @param date - The date to get entries for
   * @returns Array of calendar entries
   */
  getEntriesForDate(date: LocalDate): readonly CalendarEntry[] {
    return this.entryCache.getEntriesForDate(date);
  }

  /**
   * Gets all multi-day entries for the current year
   * @returns Array of multi-day entries
   */
  getMultiDayEntries(): readonly CalendarEntry[] {
    return this.entryCache.getMultiDayEntries().filter((entry) => {
      // Filter to entries that overlap with current year
      const yearStart: LocalDate = { year: this.currentYear, month: 1, day: 1 };
      const yearEnd: LocalDate = { year: this.currentYear, month: 12, day: 31 };

      const entryEnd = entry.endDate ?? entry.startDate;
      return (
        (entry.startDate.year === this.currentYear ||
          (entry.startDate.year < this.currentYear &&
            entryEnd.year >= this.currentYear))
      );
    });
  }

  /**
   * Calculates bar positions for multi-day entries
   * TODO: Implement proper multi-day bar positioning
   */
  calculateBarPositions(
    _entries: readonly CalendarEntry[],
    _year: number
  ): Map<string, BarPosition[]> {
    // Stub for MVP - full implementation coming in next phase
    return new Map();
  }

  /**
   * Opens or creates a daily note for a specific date
   * @param date - The date to open
   */
  async openDailyNote(date: LocalDate): Promise<void> {
    const format = this.settings.dailyNoteFormat;
    const folder = this.settings.dailyNoteFolder;

    const filename = this.formatDailyNoteFilename(date, format);
    const path = folder ? `${folder}/${filename}.md` : `${filename}.md`;

    const file = await this.vaultRepository.createOrOpenDailyNote(path);

    // Open the file in the workspace
    // This requires access to the workspace which we'll handle in the plugin
    // For now, return the file path
    console.log(`Opening daily note: ${file.path}`);
  }

  /**
   * Gets cache statistics
   */
  getCacheStats(): { entryCount: number; dateCount: number } {
    const stats = this.entryCache.getStats();
    return {
      entryCount: stats.entryCount,
      dateCount: stats.dateCount,
    };
  }

  /**
   * Rebuilds the entry cache from all vault files
   */
  private async rebuildCache(): Promise<void> {
    const files = this.vaultRepository.getAllMarkdownFiles();
    const entries: CalendarEntry[] = [];

    const config = this.getDateExtractionConfig();

    for (const fileInfo of files) {
      const entry = this.createEntryFromFile(fileInfo, config);
      if (entry) {
        entries.push(entry);
      }
    }

    this.entryCache.rebuild(entries);
    this.eventListeners?.onEntriesUpdated();
  }

  /**
   * Creates a calendar entry from a file
   */
  private createEntryFromFile(
    fileInfo: FileInfo,
    config: DateExtractionConfig
  ): CalendarEntry | null {
    const metadata = this.metadataRepository.getMetadataByPath(fileInfo.path);
    const frontmatter = metadata?.frontmatter ?? null;

    const { start, end } = this.dateEngine.extractDates(
      fileInfo.name,
      frontmatter,
      config
    );

    if (!start) {
      return null;
    }

    // Convert frontmatter to the expected properties format
    const properties: Record<string, string | number | boolean> = {};
    if (frontmatter) {
      for (const [key, value] of Object.entries(frontmatter)) {
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          properties[key] = value;
        }
      }
    }

    return createCalendarEntry({
      id: fileInfo.path,
      filePath: fileInfo.path,
      fileName: fileInfo.name,
      displayName: fileInfo.basename,
      startDate: start,
      endDate: end,
      metadata: {
        tags: metadata?.tags.map((t) => t.name) ?? [],
        folder: fileInfo.folderPath ?? '',
        properties,
      },
    });
  }

  /**
   * Gets the date extraction config from settings
   */
  private getDateExtractionConfig(): DateExtractionConfig {
    return {
      startSources: this.settings.dateProperties,
      endSources: this.settings.endDateProperties,
      priorities:
        this.settings.datePriority === 'property'
          ? ['properties', 'filename']
          : ['filename', 'properties'],
    };
  }

  /**
   * Formats a daily note filename
   */
  private formatDailyNoteFilename(date: LocalDate, format: string): string {
    return format
      .replace('YYYY', String(date.year))
      .replace('MM', String(date.month).padStart(2, '0'))
      .replace('DD', String(date.day).padStart(2, '0'));
  }

  /**
   * Sets up the metadata change listener
   */
  private setupMetadataListener(): void {
    this.unregisterMetadataListener = this.metadataRepository.onMetadataChange(
      (file: TFile) => {
        this.handleFileChange(file.path);
      }
    );
  }

  /**
   * Handles a file change
   */
  private handleFileChange(filePath: string): void {
    const fileInfo = this.vaultRepository.getAllMarkdownFiles().find(
      (f) => f.path === filePath
    );

    if (!fileInfo) {
      // File was deleted
      this.entryCache.removeEntry(filePath);
    } else {
      // File was added or modified
      const config = this.getDateExtractionConfig();
      const entry = this.createEntryFromFile(fileInfo, config);

      if (entry) {
        this.entryCache.addEntry(entry);
      } else {
        this.entryCache.removeEntry(filePath);
      }
    }

    this.eventListeners?.onEntriesUpdated();
  }
}
