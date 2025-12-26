/**
 * Mock implementations for Obsidian API
 * Used in unit and integration tests
 */

import { vi } from 'vitest';

// ==================== Type Definitions ====================

export interface MockTFile {
  path: string;
  name: string;
  basename: string;
  extension: string;
  parent: MockTFolder | null;
}

export interface MockTFolder {
  path: string;
  name: string;
  children: (MockTFile | MockTFolder)[];
  parent: MockTFolder | null;
}

export interface MockFrontmatter {
  [key: string]: unknown;
}

export interface MockFileCache {
  frontmatter?: MockFrontmatter;
  tags?: Array<{ tag: string }>;
}

// ==================== Factory Functions ====================

/**
 * Creates a mock TFile object
 */
export function createMockFile(
  path: string,
  options: {
    frontmatter?: MockFrontmatter;
    parent?: MockTFolder | null;
  } = {}
): MockTFile {
  const parts = path.split('/');
  const name = parts[parts.length - 1] ?? '';
  const basename = name.replace(/\.md$/, '');

  return {
    path,
    name,
    basename,
    extension: 'md',
    parent: options.parent ?? null,
  };
}

/**
 * Creates a mock TFolder object
 */
export function createMockFolder(
  path: string,
  children: (MockTFile | MockTFolder)[] = []
): MockTFolder {
  const parts = path.split('/');
  const name = parts[parts.length - 1] ?? '';

  return {
    path,
    name,
    children,
    parent: null,
  };
}

// ==================== Mock App ====================

export interface MockMetadataCache {
  getFileCache: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
  off: ReturnType<typeof vi.fn>;
}

export interface MockVault {
  getMarkdownFiles: ReturnType<typeof vi.fn>;
  getRoot: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  read: ReturnType<typeof vi.fn>;
  modify: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
}

export interface MockWorkspace {
  getLeaf: ReturnType<typeof vi.fn>;
  getLeavesOfType: ReturnType<typeof vi.fn>;
  revealLeaf: ReturnType<typeof vi.fn>;
  detachLeavesOfType: ReturnType<typeof vi.fn>;
  trigger: ReturnType<typeof vi.fn>;
}

export interface MockApp {
  vault: MockVault;
  metadataCache: MockMetadataCache;
  workspace: MockWorkspace;
}

/**
 * Creates a complete mock App object
 */
export function createMockApp(options: {
  files?: MockTFile[];
  fileCaches?: Map<string, MockFileCache>;
} = {}): MockApp {
  const { files = [], fileCaches = new Map() } = options;

  const metadataCache: MockMetadataCache = {
    getFileCache: vi.fn((file: MockTFile) => fileCaches.get(file.path) ?? null),
    on: vi.fn(() => () => undefined),
    off: vi.fn(),
  };

  const vault: MockVault = {
    getMarkdownFiles: vi.fn(() => files),
    getRoot: vi.fn(() => createMockFolder('')),
    create: vi.fn(),
    read: vi.fn(),
    modify: vi.fn(),
    delete: vi.fn(),
  };

  const mockLeaf = {
    openFile: vi.fn(),
    setViewState: vi.fn(),
  };

  const workspace: MockWorkspace = {
    getLeaf: vi.fn(() => mockLeaf),
    getLeavesOfType: vi.fn(() => []),
    revealLeaf: vi.fn(),
    detachLeavesOfType: vi.fn(),
    trigger: vi.fn(),
  };

  return {
    vault,
    metadataCache,
    workspace,
  };
}

// ==================== Mock Plugin ====================

export interface MockPlugin {
  app: MockApp;
  manifest: {
    id: string;
    name: string;
    version: string;
  };
  loadData: ReturnType<typeof vi.fn>;
  saveData: ReturnType<typeof vi.fn>;
  addRibbonIcon: ReturnType<typeof vi.fn>;
  addCommand: ReturnType<typeof vi.fn>;
  addSettingTab: ReturnType<typeof vi.fn>;
  registerView: ReturnType<typeof vi.fn>;
}

/**
 * Creates a mock Plugin object
 */
export function createMockPlugin(app?: MockApp): MockPlugin {
  return {
    app: app ?? createMockApp(),
    manifest: {
      id: 'linear-calendar-2',
      name: 'Linear Calendar 2',
      version: '1.0.0',
    },
    loadData: vi.fn(() => Promise.resolve({})),
    saveData: vi.fn(() => Promise.resolve()),
    addRibbonIcon: vi.fn(() => ({ remove: vi.fn() })),
    addCommand: vi.fn(),
    addSettingTab: vi.fn(),
    registerView: vi.fn(),
  };
}

// ==================== Test Helpers ====================

/**
 * Creates a set of test files with frontmatter
 */
export function createTestFiles(
  definitions: Array<{
    path: string;
    frontmatter?: MockFrontmatter;
  }>
): { files: MockTFile[]; fileCaches: Map<string, MockFileCache> } {
  const files: MockTFile[] = [];
  const fileCaches = new Map<string, MockFileCache>();

  for (const def of definitions) {
    const file = createMockFile(def.path);
    files.push(file);

    if (def.frontmatter) {
      fileCaches.set(def.path, { frontmatter: def.frontmatter });
    }
  }

  return { files, fileCaches };
}

/**
 * Creates a mock for testing date-based queries
 */
export function createDateTestScenario(): {
  app: MockApp;
  files: MockTFile[];
} {
  const { files, fileCaches } = createTestFiles([
    {
      path: 'notes/2025-01-15 Meeting.md',
      frontmatter: { date: '2025-01-15' },
    },
    {
      path: 'notes/2025-01-20 - 2025-01-25 Trip.md',
      frontmatter: { date: '2025-01-20', date_end: '2025-01-25' },
    },
    {
      path: 'daily/2025-01-15.md',
      frontmatter: {},
    },
    {
      path: 'notes/No Date Note.md',
      frontmatter: { tags: ['test'] },
    },
  ]);

  const app = createMockApp({ files, fileCaches });

  return { app, files };
}
