/**
 * Vitest setup file
 * Runs before all tests
 */

import { vi } from 'vitest';

// Mock Obsidian module globally
vi.mock('obsidian', () => ({
  App: vi.fn(),
  Plugin: vi.fn(),
  PluginSettingTab: vi.fn(),
  Setting: vi.fn(),
  ItemView: vi.fn(),
  WorkspaceLeaf: vi.fn(),
  TFile: vi.fn(),
  TFolder: vi.fn(),
  Notice: vi.fn(),
  Modal: vi.fn(),
  Menu: vi.fn(),
  setIcon: vi.fn(),
}));

// Reset all mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});
