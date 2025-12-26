/**
 * @fileoverview CalendarEntry model representing a file with date information.
 *
 * This module defines the core data structures for calendar entries,
 * which represent Obsidian files that have been associated with dates.
 *
 * @module CalendarEntry
 */

import type { LocalDate } from './LocalDate';

/**
 * Metadata associated with a calendar entry.
 *
 * Contains additional information about the file that may be used
 * for filtering, grouping, or display purposes.
 */
export interface EntryMetadata {
  /**
   * Tags extracted from the file.
   * Includes both YAML frontmatter tags and inline tags.
   */
  readonly tags: readonly string[];

  /**
   * The folder path containing the file (without the filename).
   * Empty string for files in the vault root.
   *
   * @example "Daily Notes/2024"
   */
  readonly folder: string;

  /**
   * Custom properties extracted from YAML frontmatter.
   * Stored as key-value pairs where values can be strings, numbers, or booleans.
   */
  readonly properties: Readonly<Record<string, string | number | boolean>>;
}

/**
 * Represents a calendar entry - a file associated with one or more dates.
 *
 * A CalendarEntry is created when a file's date information is extracted
 * and parsed. It contains all the information needed to display the entry
 * in the calendar view.
 *
 * @example
 * const entry: CalendarEntry = {
 *   id: 'daily/2024-03-15.md',
 *   filePath: 'daily/2024-03-15.md',
 *   fileName: '2024-03-15.md',
 *   displayName: '2024-03-15',
 *   startDate: { year: 2024, month: 3, day: 15 },
 *   endDate: null,
 *   isMultiDay: false,
 *   metadata: { tags: ['daily'], folder: 'daily', properties: {} }
 * };
 */
export interface CalendarEntry {
  /**
   * Unique identifier for the entry.
   * Typically the file path, but can be any unique string.
   */
  readonly id: string;

  /**
   * Full path to the file within the vault.
   *
   * @example "Daily Notes/2024/2024-03-15.md"
   */
  readonly filePath: string;

  /**
   * The file name including extension.
   *
   * @example "2024-03-15.md"
   */
  readonly fileName: string;

  /**
   * The name to display in the calendar view.
   * May differ from fileName (e.g., without extension or with custom formatting).
   *
   * @example "Meeting Notes" or "2024-03-15"
   */
  readonly displayName: string;

  /**
   * The start date of the entry.
   * For single-day entries, this is the only date.
   */
  readonly startDate: LocalDate;

  /**
   * The end date of the entry (for multi-day events).
   * Null for single-day entries.
   */
  readonly endDate: LocalDate | null;

  /**
   * Indicates whether this entry spans multiple days.
   * True if endDate is not null and differs from startDate.
   */
  readonly isMultiDay: boolean;

  /**
   * Additional metadata about the entry.
   */
  readonly metadata: EntryMetadata;
}

/**
 * Creates a new CalendarEntry object.
 *
 * @param params - The parameters for creating the entry
 * @returns A new frozen CalendarEntry object
 *
 * @example
 * const entry = createCalendarEntry({
 *   id: 'note.md',
 *   filePath: 'notes/note.md',
 *   fileName: 'note.md',
 *   displayName: 'My Note',
 *   startDate: { year: 2024, month: 3, day: 15 },
 *   endDate: null,
 *   metadata: { tags: [], folder: 'notes', properties: {} }
 * });
 */
export function createCalendarEntry(params: {
  readonly id: string;
  readonly filePath: string;
  readonly fileName: string;
  readonly displayName: string;
  readonly startDate: LocalDate;
  readonly endDate: LocalDate | null;
  readonly metadata: EntryMetadata;
}): CalendarEntry {
  const isMultiDay = params.endDate !== null &&
    (params.startDate.year !== params.endDate.year ||
     params.startDate.month !== params.endDate.month ||
     params.startDate.day !== params.endDate.day);

  return Object.freeze({
    id: params.id,
    filePath: params.filePath,
    fileName: params.fileName,
    displayName: params.displayName,
    startDate: params.startDate,
    endDate: params.endDate,
    isMultiDay,
    metadata: Object.freeze({
      tags: Object.freeze([...params.metadata.tags]),
      folder: params.metadata.folder,
      properties: Object.freeze({ ...params.metadata.properties })
    })
  });
}

/**
 * Creates an empty EntryMetadata object.
 *
 * @returns A new frozen EntryMetadata with default values
 */
export function createEmptyMetadata(): EntryMetadata {
  return Object.freeze({
    tags: Object.freeze([]),
    folder: '',
    properties: Object.freeze({})
  });
}

/**
 * Type guard to check if a value is a valid CalendarEntry.
 *
 * @param value - The value to check
 * @returns True if the value is a valid CalendarEntry
 */
export function isCalendarEntry(value: unknown): value is CalendarEntry {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const entry = value as Record<string, unknown>;

  return (
    typeof entry['id'] === 'string' &&
    typeof entry['filePath'] === 'string' &&
    typeof entry['fileName'] === 'string' &&
    typeof entry['displayName'] === 'string' &&
    isLocalDateLike(entry['startDate']) &&
    (entry['endDate'] === null || isLocalDateLike(entry['endDate'])) &&
    typeof entry['isMultiDay'] === 'boolean' &&
    isEntryMetadataLike(entry['metadata'])
  );
}

/**
 * Checks if a value looks like a LocalDate (duck typing).
 *
 * @param value - The value to check
 * @returns True if the value has LocalDate-like properties
 */
function isLocalDateLike(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const date = value as Record<string, unknown>;

  return (
    typeof date['year'] === 'number' &&
    typeof date['month'] === 'number' &&
    typeof date['day'] === 'number'
  );
}

/**
 * Checks if a value looks like EntryMetadata (duck typing).
 *
 * @param value - The value to check
 * @returns True if the value has EntryMetadata-like properties
 */
function isEntryMetadataLike(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const metadata = value as Record<string, unknown>;

  return (
    Array.isArray(metadata['tags']) &&
    typeof metadata['folder'] === 'string' &&
    typeof metadata['properties'] === 'object' &&
    metadata['properties'] !== null
  );
}
