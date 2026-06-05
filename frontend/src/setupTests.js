import '@testing-library/jest-dom';

// Cross-compatibility for Vitest and Jest
if (typeof globalThis.vi === 'undefined') {
  globalThis.vi = {
    mock: () => {}, // No-op in Jest because jest.mock is statically hoisted
    fn: (...args) => jest.fn(...args),
    spyOn: (...args) => jest.spyOn(...args),
    clearAllMocks: () => jest.clearAllMocks(),
    resetAllMocks: () => jest.resetAllMocks(),
  };
}

// Mock window.matchMedia for responsive components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock window.localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });
