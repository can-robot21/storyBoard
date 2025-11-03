import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock browser APIs
Object.defineProperty(window, 'indexedDB', {
  value: {
    open: vi.fn(() => ({
      onerror: null,
      onsuccess: null,
      onupgradeneeded: null,
      result: {
        createObjectStore: vi.fn(),
        transaction: vi.fn(() => ({
          objectStore: vi.fn(() => ({
            add: vi.fn(),
            get: vi.fn(),
            put: vi.fn(),
            delete: vi.fn(),
            clear: vi.fn(),
            count: vi.fn(),
            openCursor: vi.fn(),
            openKeyCursor: vi.fn(),
            getAll: vi.fn(),
            getAllKeys: vi.fn(),
            getKey: vi.fn(),
            index: vi.fn(() => ({
              get: vi.fn(),
              getAll: vi.fn(),
              getAllKeys: vi.fn(),
              getKey: vi.fn(),
              count: vi.fn(),
              openCursor: vi.fn(),
              openKeyCursor: vi.fn(),
            })),
          })),
        })),
      },
    })),
  },
  writable: true,
});

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});