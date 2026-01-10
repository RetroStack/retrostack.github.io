import { renderHook, act } from "@testing-library/react";
import {
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useIsWideDesktop,
  usePrefersTouch,
  usePrefersReducedMotion,
} from "@/hooks/useMediaQuery";

// Type for the MediaQueryList mock
interface MockMediaQueryList {
  matches: boolean;
  media: string;
  onchange: ((event: MediaQueryListEvent) => void) | null;
  addListener: jest.Mock;
  removeListener: jest.Mock;
  addEventListener: jest.Mock;
  removeEventListener: jest.Mock;
  dispatchEvent: jest.Mock;
}

// Factory to create a configurable matchMedia mock
const createMatchMedia = (matches: boolean) => {
  return (query: string): MockMediaQueryList => ({
    matches,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  });
};

// Create a mock that can change its matches value and notify listeners
const createDynamicMatchMedia = () => {
  const listeners: Map<string, ((event: MediaQueryListEvent) => void)[]> =
    new Map();
  let matchesValue = false;

  const mockMatchMedia = (query: string): MockMediaQueryList => {
    if (!listeners.has(query)) {
      listeners.set(query, []);
    }

    return {
      matches: matchesValue,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn((event: string, handler: () => void) => {
        if (event === "change") {
          listeners.get(query)?.push(handler);
        }
      }),
      removeEventListener: jest.fn((event: string, handler: () => void) => {
        if (event === "change") {
          const queryListeners = listeners.get(query);
          if (queryListeners) {
            const index = queryListeners.indexOf(handler);
            if (index > -1) {
              queryListeners.splice(index, 1);
            }
          }
        }
      }),
      dispatchEvent: jest.fn(),
    };
  };

  return {
    matchMedia: mockMatchMedia,
    setMatches: (value: boolean) => {
      matchesValue = value;
    },
    triggerChange: (query: string, matches: boolean) => {
      matchesValue = matches;
      const queryListeners = listeners.get(query);
      if (queryListeners) {
        const event = { matches, media: query } as MediaQueryListEvent;
        queryListeners.forEach((listener) => listener(event));
      }
    },
    getListenerCount: (query: string) => listeners.get(query)?.length ?? 0,
  };
};

describe("useMediaQuery", () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  describe("initial state", () => {
    it("returns false when media query does not match", () => {
      window.matchMedia = createMatchMedia(false);

      const { result } = renderHook(() =>
        useMediaQuery("(min-width: 1024px)")
      );

      expect(result.current).toBe(false);
    });

    it("returns true when media query matches", () => {
      window.matchMedia = createMatchMedia(true);

      const { result } = renderHook(() =>
        useMediaQuery("(min-width: 1024px)")
      );

      expect(result.current).toBe(true);
    });

    it("uses the correct query string passed to matchMedia", () => {
      const mockMatchMedia = jest.fn(createMatchMedia(false));
      window.matchMedia = mockMatchMedia;

      renderHook(() => useMediaQuery("(max-width: 639px)"));

      expect(mockMatchMedia).toHaveBeenCalledWith("(max-width: 639px)");
    });
  });

  describe("media query changes", () => {
    it("updates state when media query changes to match", () => {
      const dynamic = createDynamicMatchMedia();
      dynamic.setMatches(false);
      window.matchMedia = dynamic.matchMedia;

      const { result } = renderHook(() =>
        useMediaQuery("(min-width: 1024px)")
      );

      expect(result.current).toBe(false);

      act(() => {
        dynamic.triggerChange("(min-width: 1024px)", true);
      });

      expect(result.current).toBe(true);
    });

    it("updates state when media query changes to not match", () => {
      const dynamic = createDynamicMatchMedia();
      dynamic.setMatches(true);
      window.matchMedia = dynamic.matchMedia;

      const { result } = renderHook(() =>
        useMediaQuery("(min-width: 1024px)")
      );

      expect(result.current).toBe(true);

      act(() => {
        dynamic.triggerChange("(min-width: 1024px)", false);
      });

      expect(result.current).toBe(false);
    });

    it("responds to multiple consecutive changes", () => {
      const dynamic = createDynamicMatchMedia();
      dynamic.setMatches(false);
      window.matchMedia = dynamic.matchMedia;

      const { result } = renderHook(() =>
        useMediaQuery("(min-width: 768px)")
      );

      expect(result.current).toBe(false);

      act(() => {
        dynamic.triggerChange("(min-width: 768px)", true);
      });
      expect(result.current).toBe(true);

      act(() => {
        dynamic.triggerChange("(min-width: 768px)", false);
      });
      expect(result.current).toBe(false);

      act(() => {
        dynamic.triggerChange("(min-width: 768px)", true);
      });
      expect(result.current).toBe(true);
    });
  });

  describe("event listener management", () => {
    it("adds event listener on mount", () => {
      const addEventListener = jest.fn();
      window.matchMedia = (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener,
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      });

      renderHook(() => useMediaQuery("(min-width: 1024px)"));

      expect(addEventListener).toHaveBeenCalledWith(
        "change",
        expect.any(Function)
      );
    });

    it("removes event listener on unmount", () => {
      const removeEventListener = jest.fn();
      window.matchMedia = (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener,
        dispatchEvent: jest.fn(),
      });

      const { unmount } = renderHook(() =>
        useMediaQuery("(min-width: 1024px)")
      );

      unmount();

      expect(removeEventListener).toHaveBeenCalledWith(
        "change",
        expect.any(Function)
      );
    });

    it("cleans up and re-attaches listener when query changes", () => {
      const addEventListener = jest.fn();
      const removeEventListener = jest.fn();
      window.matchMedia = (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener,
        removeEventListener,
        dispatchEvent: jest.fn(),
      });

      const { rerender } = renderHook(
        ({ query }) => useMediaQuery(query),
        { initialProps: { query: "(min-width: 640px)" } }
      );

      expect(addEventListener).toHaveBeenCalledTimes(1);

      rerender({ query: "(min-width: 1024px)" });

      // Should have removed old listener and added new one
      expect(removeEventListener).toHaveBeenCalled();
      expect(addEventListener).toHaveBeenCalledTimes(2);
    });
  });

  describe("SSR safety", () => {
    it("does not throw when matchMedia is available", () => {
      // In a browser environment with matchMedia available
      window.matchMedia = createMatchMedia(false);

      // The hook should work without throwing
      expect(() => {
        renderHook(() => useMediaQuery("(min-width: 1024px)"));
      }).not.toThrow();
    });

    it("handles hydration mismatch by syncing state in effect", () => {
      // Simulate a scenario where SSR returned false but client has true
      const dynamic = createDynamicMatchMedia();
      dynamic.setMatches(true);
      window.matchMedia = dynamic.matchMedia;

      const { result } = renderHook(() =>
        useMediaQuery("(min-width: 1024px)")
      );

      // After hydration sync, should reflect actual media query state
      expect(result.current).toBe(true);
    });

    it("initializes with correct value from matchMedia", () => {
      // Test that the initial state comes from matchMedia.matches
      window.matchMedia = createMatchMedia(true);

      const { result } = renderHook(() =>
        useMediaQuery("(min-width: 1024px)")
      );

      // Should immediately have the correct value
      expect(result.current).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("handles empty query string", () => {
      window.matchMedia = createMatchMedia(false);

      expect(() => {
        renderHook(() => useMediaQuery(""));
      }).not.toThrow();
    });

    it("handles complex media query strings", () => {
      window.matchMedia = createMatchMedia(true);

      const { result } = renderHook(() =>
        useMediaQuery(
          "(min-width: 640px) and (max-width: 1023px) and (orientation: landscape)"
        )
      );

      expect(result.current).toBe(true);
    });

    it("handles preference media queries", () => {
      window.matchMedia = createMatchMedia(true);

      const { result } = renderHook(() =>
        useMediaQuery("(prefers-color-scheme: dark)")
      );

      expect(result.current).toBe(true);
    });

    it("handles multiple hooks with different queries simultaneously", () => {
      const queryResults: Record<string, boolean> = {
        "(min-width: 640px)": true,
        "(min-width: 1024px)": false,
      };

      window.matchMedia = (query: string) => ({
        matches: queryResults[query] ?? false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      });

      const { result: result1 } = renderHook(() =>
        useMediaQuery("(min-width: 640px)")
      );
      const { result: result2 } = renderHook(() =>
        useMediaQuery("(min-width: 1024px)")
      );

      expect(result1.current).toBe(true);
      expect(result2.current).toBe(false);
    });
  });
});

describe("useIsMobile", () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it("uses the correct media query for mobile detection", () => {
    const mockMatchMedia = jest.fn(createMatchMedia(false));
    window.matchMedia = mockMatchMedia;

    renderHook(() => useIsMobile());

    expect(mockMatchMedia).toHaveBeenCalledWith("(max-width: 639px)");
  });

  it("returns true when viewport is mobile-sized", () => {
    window.matchMedia = createMatchMedia(true);

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(true);
  });

  it("returns false when viewport is larger than mobile", () => {
    window.matchMedia = createMatchMedia(false);

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);
  });
});

describe("useIsTablet", () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it("uses the correct media query for tablet detection", () => {
    const mockMatchMedia = jest.fn(createMatchMedia(false));
    window.matchMedia = mockMatchMedia;

    renderHook(() => useIsTablet());

    expect(mockMatchMedia).toHaveBeenCalledWith(
      "(min-width: 640px) and (max-width: 1023px)"
    );
  });

  it("returns true when viewport is tablet-sized", () => {
    window.matchMedia = createMatchMedia(true);

    const { result } = renderHook(() => useIsTablet());

    expect(result.current).toBe(true);
  });

  it("returns false when viewport is not tablet-sized", () => {
    window.matchMedia = createMatchMedia(false);

    const { result } = renderHook(() => useIsTablet());

    expect(result.current).toBe(false);
  });
});

describe("useIsDesktop", () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it("uses the correct media query for desktop detection", () => {
    const mockMatchMedia = jest.fn(createMatchMedia(false));
    window.matchMedia = mockMatchMedia;

    renderHook(() => useIsDesktop());

    expect(mockMatchMedia).toHaveBeenCalledWith("(min-width: 1024px)");
  });

  it("returns true when viewport is desktop-sized", () => {
    window.matchMedia = createMatchMedia(true);

    const { result } = renderHook(() => useIsDesktop());

    expect(result.current).toBe(true);
  });

  it("returns false when viewport is smaller than desktop", () => {
    window.matchMedia = createMatchMedia(false);

    const { result } = renderHook(() => useIsDesktop());

    expect(result.current).toBe(false);
  });
});

describe("useIsWideDesktop", () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it("uses the correct media query for wide desktop detection", () => {
    const mockMatchMedia = jest.fn(createMatchMedia(false));
    window.matchMedia = mockMatchMedia;

    renderHook(() => useIsWideDesktop());

    expect(mockMatchMedia).toHaveBeenCalledWith("(min-width: 1280px)");
  });

  it("returns true when viewport is wide desktop-sized", () => {
    window.matchMedia = createMatchMedia(true);

    const { result } = renderHook(() => useIsWideDesktop());

    expect(result.current).toBe(true);
  });

  it("returns false when viewport is smaller than wide desktop", () => {
    window.matchMedia = createMatchMedia(false);

    const { result } = renderHook(() => useIsWideDesktop());

    expect(result.current).toBe(false);
  });
});

describe("usePrefersTouch", () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it("uses the correct media query for touch detection", () => {
    const mockMatchMedia = jest.fn(createMatchMedia(false));
    window.matchMedia = mockMatchMedia;

    renderHook(() => usePrefersTouch());

    expect(mockMatchMedia).toHaveBeenCalledWith("(pointer: coarse)");
  });

  it("returns true when device has coarse pointer (touch)", () => {
    window.matchMedia = createMatchMedia(true);

    const { result } = renderHook(() => usePrefersTouch());

    expect(result.current).toBe(true);
  });

  it("returns false when device has fine pointer (mouse)", () => {
    window.matchMedia = createMatchMedia(false);

    const { result } = renderHook(() => usePrefersTouch());

    expect(result.current).toBe(false);
  });
});

describe("usePrefersReducedMotion", () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it("uses the correct media query for reduced motion detection", () => {
    const mockMatchMedia = jest.fn(createMatchMedia(false));
    window.matchMedia = mockMatchMedia;

    renderHook(() => usePrefersReducedMotion());

    expect(mockMatchMedia).toHaveBeenCalledWith(
      "(prefers-reduced-motion: reduce)"
    );
  });

  it("returns true when user prefers reduced motion", () => {
    window.matchMedia = createMatchMedia(true);

    const { result } = renderHook(() => usePrefersReducedMotion());

    expect(result.current).toBe(true);
  });

  it("returns false when user has no motion preference", () => {
    window.matchMedia = createMatchMedia(false);

    const { result } = renderHook(() => usePrefersReducedMotion());

    expect(result.current).toBe(false);
  });
});

describe("breakpoint hooks integration", () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it("mobile and desktop are mutually exclusive at boundary", () => {
    // At 640px, should be tablet, not mobile
    const queryResults: Record<string, boolean> = {
      "(max-width: 639px)": false,
      "(min-width: 640px) and (max-width: 1023px)": true,
      "(min-width: 1024px)": false,
    };

    window.matchMedia = (query: string) => ({
      matches: queryResults[query] ?? false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    });

    const { result: mobileResult } = renderHook(() => useIsMobile());
    const { result: tabletResult } = renderHook(() => useIsTablet());
    const { result: desktopResult } = renderHook(() => useIsDesktop());

    expect(mobileResult.current).toBe(false);
    expect(tabletResult.current).toBe(true);
    expect(desktopResult.current).toBe(false);
  });

  it("desktop includes wide desktop viewport", () => {
    // At 1280px+, both desktop and wide desktop should be true
    const queryResults: Record<string, boolean> = {
      "(min-width: 1024px)": true,
      "(min-width: 1280px)": true,
    };

    window.matchMedia = (query: string) => ({
      matches: queryResults[query] ?? false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    });

    const { result: desktopResult } = renderHook(() => useIsDesktop());
    const { result: wideDesktopResult } = renderHook(() => useIsWideDesktop());

    expect(desktopResult.current).toBe(true);
    expect(wideDesktopResult.current).toBe(true);
  });

  it("narrow desktop is desktop but not wide desktop", () => {
    // At 1024px-1279px, desktop true but wide desktop false
    const queryResults: Record<string, boolean> = {
      "(min-width: 1024px)": true,
      "(min-width: 1280px)": false,
    };

    window.matchMedia = (query: string) => ({
      matches: queryResults[query] ?? false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    });

    const { result: desktopResult } = renderHook(() => useIsDesktop());
    const { result: wideDesktopResult } = renderHook(() => useIsWideDesktop());

    expect(desktopResult.current).toBe(true);
    expect(wideDesktopResult.current).toBe(false);
  });

  it("only one breakpoint category is active at a time for standard viewports", () => {
    // Mobile viewport
    const mobileQueryResults: Record<string, boolean> = {
      "(max-width: 639px)": true,
      "(min-width: 640px) and (max-width: 1023px)": false,
      "(min-width: 1024px)": false,
    };

    window.matchMedia = (query: string) => ({
      matches: mobileQueryResults[query] ?? false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    });

    const { result: mobileResult } = renderHook(() => useIsMobile());
    const { result: tabletResult } = renderHook(() => useIsTablet());
    const { result: desktopResult } = renderHook(() => useIsDesktop());

    // Only mobile should be true
    expect(mobileResult.current).toBe(true);
    expect(tabletResult.current).toBe(false);
    expect(desktopResult.current).toBe(false);
  });
});
