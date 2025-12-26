/**
 * MetadataRepository - Provides access to file metadata (frontmatter)
 *
 * This repository handles all interactions with Obsidian's metadata cache,
 * providing a clean interface for reading frontmatter properties.
 */

import type { App, TFile, CachedMetadata } from 'obsidian';

/**
 * Represents frontmatter properties extracted from a file
 */
export interface Frontmatter {
  [key: string]: unknown;
}

/**
 * Represents tags extracted from a file
 */
export interface FileTag {
  /** The tag including # prefix */
  readonly tag: string;
  /** Tag without # prefix */
  readonly name: string;
}

/**
 * Complete metadata for a file
 */
export interface FileMetadata {
  /** Frontmatter properties */
  readonly frontmatter: Frontmatter | null;
  /** Tags found in the file */
  readonly tags: readonly FileTag[];
}

/**
 * Repository for accessing file metadata through Obsidian's cache
 */
export class MetadataRepository {
  private readonly app: App;

  constructor(app: App) {
    this.app = app;
  }

  /**
   * Gets the metadata for a file
   * @param file - The TFile to get metadata for
   * @returns FileMetadata object
   */
  getMetadata(file: TFile): FileMetadata {
    const cache = this.app.metadataCache.getFileCache(file);
    return this.extractMetadata(cache);
  }

  /**
   * Gets the metadata for a file by path
   * @param path - Full path to the file
   * @returns FileMetadata object or null if file not found
   */
  getMetadataByPath(path: string): FileMetadata | null {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!file || !this.isMarkdownFile(file)) {
      return null;
    }
    return this.getMetadata(file as TFile);
  }

  /**
   * Gets a specific frontmatter property
   * @param file - The TFile to get property from
   * @param propertyName - Name of the property to get
   * @returns The property value or undefined if not found
   */
  getProperty(file: TFile, propertyName: string): unknown {
    const metadata = this.getMetadata(file);
    return metadata.frontmatter?.[propertyName];
  }

  /**
   * Gets a specific frontmatter property as a string
   * @param file - The TFile to get property from
   * @param propertyName - Name of the property to get
   * @returns The property value as string or null if not found/not string
   */
  getStringProperty(file: TFile, propertyName: string): string | null {
    const value = this.getProperty(file, propertyName);
    if (typeof value === 'string') {
      return value;
    }
    if (value instanceof Date) {
      return this.formatDate(value);
    }
    if (typeof value === 'number') {
      return String(value);
    }
    return null;
  }

  /**
   * Gets a date property, handling various formats
   * @param file - The TFile to get property from
   * @param propertyName - Name of the property to get
   * @returns Date string in YYYY-MM-DD format or null
   */
  getDateProperty(file: TFile, propertyName: string): string | null {
    const value = this.getProperty(file, propertyName);

    if (!value) return null;

    if (typeof value === 'string') {
      // Check if it matches YYYY-MM-DD format
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return value;
      }
      // Try to extract date from datetime string
      const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
      if (match) {
        return match[1];
      }
      return null;
    }

    if (value instanceof Date && !isNaN(value.getTime())) {
      return this.formatDate(value);
    }

    // Handle LocalDate-like objects
    if (this.isLocalDateLike(value)) {
      return this.formatLocalDate(value);
    }

    return null;
  }

  /**
   * Gets all tags from a file
   * @param file - The TFile to get tags from
   * @returns Array of FileTag objects
   */
  getTags(file: TFile): readonly FileTag[] {
    return this.getMetadata(file).tags;
  }

  /**
   * Checks if a file has a specific tag
   * @param file - The TFile to check
   * @param tagName - Tag name (with or without #)
   * @returns True if file has the tag
   */
  hasTag(file: TFile, tagName: string): boolean {
    const normalizedTag = tagName.startsWith('#') ? tagName : `#${tagName}`;
    const tags = this.getTags(file);
    return tags.some((t) => t.tag.toLowerCase() === normalizedTag.toLowerCase());
  }

  /**
   * Registers a callback for metadata changes
   * @param callback - Function to call when metadata changes
   * @returns Unregister function
   */
  onMetadataChange(callback: (file: TFile) => void): () => void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = (file: TFile) => callback(file);
    this.app.metadataCache.on('changed', handler as any);
    return () => this.app.metadataCache.off('changed', handler as any);
  }

  /**
   * Extracts metadata from Obsidian's cache format
   */
  private extractMetadata(cache: CachedMetadata | null): FileMetadata {
    const frontmatter = cache?.frontmatter ?? null;
    const tags: FileTag[] = [];

    // Extract tags from frontmatter
    if (frontmatter?.tags) {
      const fmTags = Array.isArray(frontmatter.tags)
        ? frontmatter.tags
        : [frontmatter.tags];
      for (const tag of fmTags) {
        if (typeof tag === 'string') {
          const normalizedTag = tag.startsWith('#') ? tag : `#${tag}`;
          tags.push({
            tag: normalizedTag,
            name: normalizedTag.substring(1),
          });
        }
      }
    }

    // Extract inline tags
    if (cache?.tags) {
      for (const tagCache of cache.tags) {
        const existingTag = tags.find(
          (t) => t.tag.toLowerCase() === tagCache.tag.toLowerCase()
        );
        if (!existingTag) {
          tags.push({
            tag: tagCache.tag,
            name: tagCache.tag.substring(1),
          });
        }
      }
    }

    return Object.freeze({
      frontmatter,
      tags: Object.freeze(tags),
    });
  }

  /**
   * Formats a Date object as YYYY-MM-DD using local time
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Formats a LocalDate-like object as YYYY-MM-DD
   */
  private formatLocalDate(value: { year: number; month: number; day: number }): string {
    const year = value.year;
    const month = String(value.month).padStart(2, '0');
    const day = String(value.day).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Type guard for LocalDate-like objects
   */
  private isLocalDateLike(value: unknown): value is { year: number; month: number; day: number } {
    return (
      typeof value === 'object' &&
      value !== null &&
      'year' in value &&
      'month' in value &&
      'day' in value &&
      typeof (value as { year: unknown }).year === 'number' &&
      typeof (value as { month: unknown }).month === 'number' &&
      typeof (value as { day: unknown }).day === 'number'
    );
  }

  /**
   * Checks if a file is a markdown file
   */
  private isMarkdownFile(file: unknown): boolean {
    return (
      typeof file === 'object' &&
      file !== null &&
      'extension' in file &&
      (file as { extension: string }).extension === 'md'
    );
  }
}
