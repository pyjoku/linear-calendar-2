/**
 * Vitest setup file
 * Runs before all tests
 *
 * Note: Obsidian module is aliased to tests/mocks/obsidian-stub.ts
 * via vitest.config.ts, so no vi.mock needed.
 */

import { vi } from 'vitest';

// Reset all mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});
