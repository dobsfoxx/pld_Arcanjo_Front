import '@testing-library/jest-dom';

// react-router / react-router-dom podem depender de TextEncoder/TextDecoder no ambiente de testes.
// No Node/JSDOM, isso pode não existir dependendo do runner.
import { TextDecoder, TextEncoder } from 'util';

// @ts-expect-error - disponível no browser
global.TextEncoder = global.TextEncoder ?? TextEncoder;
// @ts-expect-error - disponível no browser
global.TextDecoder = global.TextDecoder ?? TextDecoder;

// Alguns componentes/libs consultam APIs do browser que não existem no JSDOM.
// Mantemos mocks leves aqui para evitar falhas artificiais.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }),
});

class NoopObserver {
  observe() {
    return undefined;
  }
  unobserve() {
    return undefined;
  }
  disconnect() {
    return undefined;
  }
}

// @ts-expect-error - disponível apenas no browser
global.ResizeObserver = global.ResizeObserver ?? NoopObserver;
// @ts-expect-error - disponível apenas no browser
global.IntersectionObserver = global.IntersectionObserver ?? NoopObserver;

window.scrollTo = window.scrollTo ?? (() => undefined);
