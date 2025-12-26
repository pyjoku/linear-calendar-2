/**
 * VaultRepository - Provides access to Obsidian vault files
 *
 * This repository handles all interactions with Obsidian's vault API,
 * abstracting the file system operations from the business logic.
 */

import type { App, TFile, TFolder } from 'obsidian';

/**
 * Minimal file information extracted from TFile
 */
export interface FileInfo {
  /** Full path to the file */
  readonly path: string;
  /** Filename without extension */
  readonly basename: string;
  /** Filename with extension */
  readonly name: string;
  /** File extension (without dot) */
  readonly extension: string;
  /** Parent folder path or null */
  readonly folderPath: string | null;
}

/**
 * Repository for accessing vault files
 */
export class VaultRepository {
  private readonly app: App;

  constructor(app: App) {
    this.app = app;
  }

  /**
   * Gets all markdown files in the vault
   * @returns Array of FileInfo objects for all markdown files
   */
  getAllMarkdownFiles(): FileInfo[] {
    const files = this.app.vault.getMarkdownFiles();
    return files.map((file) => this.toFileInfo(file));
  }

  /**
   * Gets all markdown files in a specific folder (recursively)
   * @param folderPath - Path to the folder
   * @returns Array of FileInfo objects
   */
  getMarkdownFilesInFolder(folderPath: string): FileInfo[] {
    return this.getAllMarkdownFiles().filter((file) => {
      if (!file.folderPath) return false;
      return file.folderPath === folderPath || file.folderPath.startsWith(folderPath + '/');
    });
  }

  /**
   * Gets a file by its path
   * @param path - Full path to the file
   * @returns TFile or null if not found
   */
  getFileByPath(path: string): TFile | null {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (file instanceof this.getTFileClass()) {
      return file as TFile;
    }
    return null;
  }

  /**
   * Reads the content of a file
   * @param path - Full path to the file
   * @returns File content as string, or null if not found
   */
  async readFile(path: string): Promise<string | null> {
    const file = this.getFileByPath(path);
    if (!file) return null;

    try {
      return await this.app.vault.read(file);
    } catch {
      return null;
    }
  }

  /**
   * Creates or opens a daily note
   * @param path - Full path for the daily note
   * @param template - Optional template content
   * @returns The TFile for the daily note
   */
  async createOrOpenDailyNote(path: string, template = ''): Promise<TFile> {
    let file = this.getFileByPath(path);

    if (!file) {
      // Ensure the folder exists
      const folderPath = path.substring(0, path.lastIndexOf('/'));
      if (folderPath) {
        await this.ensureFolderExists(folderPath);
      }

      // Create the file
      file = await this.app.vault.create(path, template);
    }

    return file;
  }

  /**
   * Ensures a folder exists, creating it if necessary
   * @param folderPath - Path to the folder
   */
  async ensureFolderExists(folderPath: string): Promise<void> {
    const folder = this.app.vault.getAbstractFileByPath(folderPath);
    if (!folder) {
      await this.app.vault.createFolder(folderPath);
    }
  }

  /**
   * Checks if a file exists
   * @param path - Full path to check
   * @returns True if file exists
   */
  fileExists(path: string): boolean {
    return this.getFileByPath(path) !== null;
  }

  /**
   * Gets the root folder of the vault
   * @returns The root TFolder
   */
  getRoot(): TFolder {
    return this.app.vault.getRoot();
  }

  /**
   * Converts a TFile to a FileInfo object
   */
  private toFileInfo(file: TFile): FileInfo {
    return Object.freeze({
      path: file.path,
      basename: file.basename,
      name: file.name,
      extension: file.extension,
      folderPath: file.parent?.path ?? null,
    });
  }

  /**
   * Gets the TFile class for instanceof checks
   * This is needed because TFile might not be directly importable in tests
   */
  private getTFileClass(): new (...args: unknown[]) => TFile {
    // Access TFile through the first markdown file or return a dummy class
    const files = this.app.vault.getMarkdownFiles();
    if (files.length > 0) {
      return files[0].constructor as new (...args: unknown[]) => TFile;
    }
    // Fallback for empty vaults
    return class {} as new (...args: unknown[]) => TFile;
  }
}
