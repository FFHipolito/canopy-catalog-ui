import '@testing-library/jest-dom';

// Compatibilidade Zod v4 com @hookform/resolvers
if (!('errors' in Error.prototype)) {
  Object.defineProperty(Error.prototype, 'errors', {
    get() {
      return this.issues;
    },
    configurable: true,
  });
}

// Mock de matchMedia caso algum componente de UI consulte media queries
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
