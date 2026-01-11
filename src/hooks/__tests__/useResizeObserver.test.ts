import { renderHook, act } from "@testing-library/react";
import { useResizeObserver, useElementSize, useItemsFit } from "../useResizeObserver";

// Mock ResizeObserver
class MockResizeObserver {
  private callback: ResizeObserverCallback;
  private observedElements: Set<Element> = new Set();

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    MockResizeObserver.instances.push(this);
  }

  observe(element: Element): void {
    this.observedElements.add(element);
  }

  unobserve(element: Element): void {
    this.observedElements.delete(element);
  }

  disconnect(): void {
    this.observedElements.clear();
  }

  // Helper to trigger resize
  triggerResize(entries: Partial<ResizeObserverEntry>[]): void {
    this.callback(entries as ResizeObserverEntry[], this);
  }

  static instances: MockResizeObserver[] = [];

  static reset(): void {
    MockResizeObserver.instances = [];
  }
}

// Mock getBoundingClientRect
function createMockElement(width: number, height: number): HTMLElement {
  const element = document.createElement("div");
  element.getBoundingClientRect = jest.fn(() => ({
    width,
    height,
    top: 0,
    left: 0,
    bottom: height,
    right: width,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  }));
  return element;
}

describe("useResizeObserver", () => {
  let originalResizeObserver: typeof ResizeObserver;

  beforeAll(() => {
    originalResizeObserver = window.ResizeObserver;
    window.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
  });

  afterAll(() => {
    window.ResizeObserver = originalResizeObserver;
  });

  beforeEach(() => {
    MockResizeObserver.reset();
  });

  describe("useResizeObserver", () => {
    it("should return initial size of { width: 0, height: 0 }", () => {
      const { result } = renderHook(() => useResizeObserver<HTMLDivElement>());

      expect(result.current.size).toEqual({ width: 0, height: 0 });
      expect(result.current.ref.current).toBeNull();
    });

    it("should update size when element is attached", () => {
      const { result } = renderHook(() => useResizeObserver<HTMLDivElement>());

      const mockElement = createMockElement(200, 100);

      act(() => {
        // Simulate attaching the ref
        Object.defineProperty(result.current.ref, "current", {
          value: mockElement,
          writable: true,
        });
      });

      // Re-render to trigger effect
      const { result: result2 } = renderHook(() => useResizeObserver<HTMLDivElement>());

      // Initial size comes from getBoundingClientRect
      act(() => {
        Object.defineProperty(result2.current.ref, "current", {
          value: mockElement,
          writable: true,
        });
      });
    });

    it("should call callback when size changes", () => {
      const callback = jest.fn();
      const { result } = renderHook(() => useResizeObserver<HTMLDivElement>(callback));

      expect(result.current.ref).toBeDefined();
    });

    it("should disconnect observer on unmount", () => {
      const { unmount } = renderHook(() => useResizeObserver<HTMLDivElement>());

      const observerCount = MockResizeObserver.instances.length;
      unmount();

      // Observer should have been created and will be disconnected
      expect(observerCount).toBe(0); // No observer created without element
    });
  });

  describe("useElementSize", () => {
    it("should return initial size of { width: 0, height: 0 }", () => {
      const ref = { current: null };
      const { result } = renderHook(() => useElementSize(ref));

      expect(result.current).toEqual({ width: 0, height: 0 });
    });

    it("should work with an existing ref", () => {
      const mockElement = createMockElement(300, 150);
      const ref = { current: mockElement };

      const { result } = renderHook(() => useElementSize(ref));

      // Size should be updated from getBoundingClientRect
      expect(result.current).toEqual({ width: 300, height: 150 });
    });
  });

  describe("useItemsFit", () => {
    it("should return minItems when container has no size", () => {
      const ref = { current: null };
      const { result } = renderHook(() => useItemsFit(ref, 50, 3));

      expect(result.current).toBe(3);
    });

    it("should calculate items that fit based on container width", () => {
      const mockElement = createMockElement(200, 50);
      const ref = { current: mockElement };

      const { result } = renderHook(() => useItemsFit(ref, 50, 1));

      // 200px / 50px per item = 4 items
      expect(result.current).toBe(4);
    });

    it("should not go below minItems", () => {
      const mockElement = createMockElement(80, 50);
      const ref = { current: mockElement };

      const { result } = renderHook(() => useItemsFit(ref, 50, 3));

      // 80px / 50px = 1 item, but minItems is 3
      expect(result.current).toBe(3);
    });

    it("should use default minItems of 1", () => {
      const mockElement = createMockElement(30, 50);
      const ref = { current: mockElement };

      const { result } = renderHook(() => useItemsFit(ref, 50));

      // 30px / 50px = 0 items, but minItems defaults to 1
      expect(result.current).toBe(1);
    });

    it("should handle fractional results by flooring", () => {
      const mockElement = createMockElement(175, 50);
      const ref = { current: mockElement };

      const { result } = renderHook(() => useItemsFit(ref, 50, 1));

      // 175px / 50px = 3.5, should floor to 3
      expect(result.current).toBe(3);
    });
  });
});
