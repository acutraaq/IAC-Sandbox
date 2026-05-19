import { vi } from "vitest";
import "@testing-library/jest-dom/vitest";

/* ── Framer Motion viewport mocking ── */
class IntersectionObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  constructor(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _callback: IntersectionObserverCallback,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _options?: IntersectionObserverInit
  ) {}
}

Object.defineProperty(globalThis, "IntersectionObserver", {
  writable: true,
  configurable: true,
  value: IntersectionObserverMock,
});
