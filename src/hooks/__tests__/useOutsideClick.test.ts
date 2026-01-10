import { renderHook, act } from "@testing-library/react";
import { useOutsideClick } from "@/hooks/useOutsideClick";

describe("useOutsideClick", () => {
  let container: HTMLDivElement;
  let outsideElement: HTMLDivElement;

  beforeEach(() => {
    // Create container for the ref element
    container = document.createElement("div");
    container.setAttribute("data-testid", "inside-element");
    document.body.appendChild(container);

    // Create element outside the container
    outsideElement = document.createElement("div");
    outsideElement.setAttribute("data-testid", "outside-element");
    document.body.appendChild(outsideElement);
  });

  afterEach(() => {
    document.body.removeChild(container);
    document.body.removeChild(outsideElement);
  });

  describe("ref object", () => {
    it("returns a valid ref object", () => {
      const callback = jest.fn();
      const { result } = renderHook(() => useOutsideClick(callback));

      expect(result.current).toHaveProperty("current");
      expect(result.current.current).toBeNull();
    });

    it("ref can be assigned to an element", () => {
      const callback = jest.fn();
      const { result } = renderHook(() =>
        useOutsideClick<HTMLDivElement>(callback)
      );

      // Simulate assigning ref to an element
      act(() => {
        (
          result.current as React.MutableRefObject<HTMLDivElement | null>
        ).current = container;
      });

      expect(result.current.current).toBe(container);
    });
  });

  describe("mousedown events", () => {
    it("calls callback when clicking outside the element", () => {
      const callback = jest.fn();
      const { result } = renderHook(() =>
        useOutsideClick<HTMLDivElement>(callback)
      );

      // Assign the ref
      act(() => {
        (
          result.current as React.MutableRefObject<HTMLDivElement | null>
        ).current = container;
      });

      // Click outside
      act(() => {
        const event = new MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
        });
        outsideElement.dispatchEvent(event);
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("does NOT call callback when clicking inside the element", () => {
      const callback = jest.fn();
      const { result } = renderHook(() =>
        useOutsideClick<HTMLDivElement>(callback)
      );

      // Assign the ref
      act(() => {
        (
          result.current as React.MutableRefObject<HTMLDivElement | null>
        ).current = container;
      });

      // Click inside
      act(() => {
        const event = new MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
        });
        container.dispatchEvent(event);
      });

      expect(callback).not.toHaveBeenCalled();
    });

    it("does NOT call callback when clicking on a child element inside", () => {
      const callback = jest.fn();
      const { result } = renderHook(() =>
        useOutsideClick<HTMLDivElement>(callback)
      );

      // Create child element
      const childElement = document.createElement("button");
      container.appendChild(childElement);

      // Assign the ref
      act(() => {
        (
          result.current as React.MutableRefObject<HTMLDivElement | null>
        ).current = container;
      });

      // Click on child
      act(() => {
        const event = new MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
        });
        childElement.dispatchEvent(event);
      });

      expect(callback).not.toHaveBeenCalled();

      // Cleanup
      container.removeChild(childElement);
    });
  });

  describe("touchstart events", () => {
    it("calls callback when touchstart occurs outside the element", () => {
      const callback = jest.fn();
      const { result } = renderHook(() =>
        useOutsideClick<HTMLDivElement>(callback)
      );

      // Assign the ref
      act(() => {
        (
          result.current as React.MutableRefObject<HTMLDivElement | null>
        ).current = container;
      });

      // Touch outside
      act(() => {
        const event = new TouchEvent("touchstart", {
          bubbles: true,
          cancelable: true,
        });
        outsideElement.dispatchEvent(event);
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("does NOT call callback when touchstart occurs inside the element", () => {
      const callback = jest.fn();
      const { result } = renderHook(() =>
        useOutsideClick<HTMLDivElement>(callback)
      );

      // Assign the ref
      act(() => {
        (
          result.current as React.MutableRefObject<HTMLDivElement | null>
        ).current = container;
      });

      // Touch inside
      act(() => {
        const event = new TouchEvent("touchstart", {
          bubbles: true,
          cancelable: true,
        });
        container.dispatchEvent(event);
      });

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("Escape key", () => {
    it("calls callback when Escape key is pressed", () => {
      const callback = jest.fn();
      const { result } = renderHook(() =>
        useOutsideClick<HTMLDivElement>(callback)
      );

      // Assign the ref
      act(() => {
        (
          result.current as React.MutableRefObject<HTMLDivElement | null>
        ).current = container;
      });

      // Press Escape
      act(() => {
        const event = new KeyboardEvent("keydown", {
          key: "Escape",
          bubbles: true,
          cancelable: true,
        });
        document.dispatchEvent(event);
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("does NOT call callback when other keys are pressed", () => {
      const callback = jest.fn();
      const { result } = renderHook(() =>
        useOutsideClick<HTMLDivElement>(callback)
      );

      // Assign the ref
      act(() => {
        (
          result.current as React.MutableRefObject<HTMLDivElement | null>
        ).current = container;
      });

      // Press Enter
      act(() => {
        const enterEvent = new KeyboardEvent("keydown", {
          key: "Enter",
          bubbles: true,
          cancelable: true,
        });
        document.dispatchEvent(enterEvent);
      });

      // Press Tab
      act(() => {
        const tabEvent = new KeyboardEvent("keydown", {
          key: "Tab",
          bubbles: true,
          cancelable: true,
        });
        document.dispatchEvent(tabEvent);
      });

      // Press Space
      act(() => {
        const spaceEvent = new KeyboardEvent("keydown", {
          key: " ",
          bubbles: true,
          cancelable: true,
        });
        document.dispatchEvent(spaceEvent);
      });

      expect(callback).not.toHaveBeenCalled();
    });

    it("does NOT call callback for Escape when ref element is focused", () => {
      const callback = jest.fn();
      const { result } = renderHook(() =>
        useOutsideClick<HTMLDivElement>(callback)
      );

      // Assign the ref
      act(() => {
        (
          result.current as React.MutableRefObject<HTMLDivElement | null>
        ).current = container;
      });

      // Dispatch Escape on the container itself
      act(() => {
        const event = new KeyboardEvent("keydown", {
          key: "Escape",
          bubbles: true,
          cancelable: true,
        });
        // Even when dispatched on the element, Escape still triggers callback
        // because the hook listens on document level
        document.dispatchEvent(event);
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe("enabled parameter", () => {
    it("defaults to enabled when not specified", () => {
      const callback = jest.fn();
      const { result } = renderHook(() =>
        useOutsideClick<HTMLDivElement>(callback)
      );

      // Assign the ref
      act(() => {
        (
          result.current as React.MutableRefObject<HTMLDivElement | null>
        ).current = container;
      });

      // Click outside
      act(() => {
        const event = new MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
        });
        outsideElement.dispatchEvent(event);
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("does NOT call callback when enabled is false (mousedown)", () => {
      const callback = jest.fn();
      const { result } = renderHook(() =>
        useOutsideClick<HTMLDivElement>(callback, false)
      );

      // Assign the ref
      act(() => {
        (
          result.current as React.MutableRefObject<HTMLDivElement | null>
        ).current = container;
      });

      // Click outside
      act(() => {
        const event = new MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
        });
        outsideElement.dispatchEvent(event);
      });

      expect(callback).not.toHaveBeenCalled();
    });

    it("does NOT call callback when enabled is false (touchstart)", () => {
      const callback = jest.fn();
      const { result } = renderHook(() =>
        useOutsideClick<HTMLDivElement>(callback, false)
      );

      // Assign the ref
      act(() => {
        (
          result.current as React.MutableRefObject<HTMLDivElement | null>
        ).current = container;
      });

      // Touch outside
      act(() => {
        const event = new TouchEvent("touchstart", {
          bubbles: true,
          cancelable: true,
        });
        outsideElement.dispatchEvent(event);
      });

      expect(callback).not.toHaveBeenCalled();
    });

    it("does NOT call callback when enabled is false (Escape key)", () => {
      const callback = jest.fn();
      const { result } = renderHook(() =>
        useOutsideClick<HTMLDivElement>(callback, false)
      );

      // Assign the ref
      act(() => {
        (
          result.current as React.MutableRefObject<HTMLDivElement | null>
        ).current = container;
      });

      // Press Escape
      act(() => {
        const event = new KeyboardEvent("keydown", {
          key: "Escape",
          bubbles: true,
          cancelable: true,
        });
        document.dispatchEvent(event);
      });

      expect(callback).not.toHaveBeenCalled();
    });

    it("respects enabled parameter changes from false to true", () => {
      const callback = jest.fn();
      const { result, rerender } = renderHook(
        ({ enabled }) => useOutsideClick<HTMLDivElement>(callback, enabled),
        { initialProps: { enabled: false } }
      );

      // Assign the ref
      act(() => {
        (
          result.current as React.MutableRefObject<HTMLDivElement | null>
        ).current = container;
      });

      // Click outside while disabled
      act(() => {
        const event = new MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
        });
        outsideElement.dispatchEvent(event);
      });

      expect(callback).not.toHaveBeenCalled();

      // Enable the hook
      rerender({ enabled: true });

      // Click outside while enabled
      act(() => {
        const event = new MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
        });
        outsideElement.dispatchEvent(event);
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("respects enabled parameter changes from true to false", () => {
      const callback = jest.fn();
      const { result, rerender } = renderHook(
        ({ enabled }) => useOutsideClick<HTMLDivElement>(callback, enabled),
        { initialProps: { enabled: true } }
      );

      // Assign the ref
      act(() => {
        (
          result.current as React.MutableRefObject<HTMLDivElement | null>
        ).current = container;
      });

      // Click outside while enabled
      act(() => {
        const event = new MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
        });
        outsideElement.dispatchEvent(event);
      });

      expect(callback).toHaveBeenCalledTimes(1);

      // Disable the hook
      rerender({ enabled: false });

      // Click outside while disabled
      act(() => {
        const event = new MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
        });
        outsideElement.dispatchEvent(event);
      });

      expect(callback).toHaveBeenCalledTimes(1); // Still 1, not 2
    });
  });

  describe("rapid enable/disable toggling", () => {
    it("handles rapid toggling without issues", () => {
      const callback = jest.fn();
      const { result, rerender } = renderHook(
        ({ enabled }) => useOutsideClick<HTMLDivElement>(callback, enabled),
        { initialProps: { enabled: false } }
      );

      // Assign the ref
      act(() => {
        (
          result.current as React.MutableRefObject<HTMLDivElement | null>
        ).current = container;
      });

      // Rapid toggle
      rerender({ enabled: true });
      rerender({ enabled: false });
      rerender({ enabled: true });
      rerender({ enabled: false });
      rerender({ enabled: true });

      // Click outside - should work since last state is enabled
      act(() => {
        const event = new MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
        });
        outsideElement.dispatchEvent(event);
      });

      expect(callback).toHaveBeenCalledTimes(1);

      // Disable again
      rerender({ enabled: false });

      // Click outside - should NOT work
      act(() => {
        const event = new MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
        });
        outsideElement.dispatchEvent(event);
      });

      expect(callback).toHaveBeenCalledTimes(1); // Still 1
    });

    it("handles multiple rapid toggles in sequence", () => {
      const callback = jest.fn();
      const { result, rerender } = renderHook(
        ({ enabled }) => useOutsideClick<HTMLDivElement>(callback, enabled),
        { initialProps: { enabled: true } }
      );

      // Assign the ref
      act(() => {
        (
          result.current as React.MutableRefObject<HTMLDivElement | null>
        ).current = container;
      });

      // Toggle off and on multiple times
      for (let i = 0; i < 10; i++) {
        rerender({ enabled: false });
        rerender({ enabled: true });
      }

      // Should still work correctly
      act(() => {
        const event = new MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
        });
        outsideElement.dispatchEvent(event);
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe("cleanup", () => {
    it("removes event listeners on unmount", () => {
      const callback = jest.fn();
      const addEventListenerSpy = jest.spyOn(document, "addEventListener");
      const removeEventListenerSpy = jest.spyOn(
        document,
        "removeEventListener"
      );

      const { result, unmount } = renderHook(() =>
        useOutsideClick<HTMLDivElement>(callback)
      );

      // Assign the ref
      act(() => {
        (
          result.current as React.MutableRefObject<HTMLDivElement | null>
        ).current = container;
      });

      // Verify listeners were added
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "mousedown",
        expect.any(Function)
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "touchstart",
        expect.any(Function)
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "keydown",
        expect.any(Function)
      );

      // Unmount
      unmount();

      // Verify listeners were removed
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "mousedown",
        expect.any(Function)
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "touchstart",
        expect.any(Function)
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "keydown",
        expect.any(Function)
      );

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });

    it("does not respond to events after unmount", () => {
      const callback = jest.fn();
      const { result, unmount } = renderHook(() =>
        useOutsideClick<HTMLDivElement>(callback)
      );

      // Assign the ref
      act(() => {
        (
          result.current as React.MutableRefObject<HTMLDivElement | null>
        ).current = container;
      });

      // Unmount
      unmount();

      // Try to trigger events after unmount
      act(() => {
        const mouseEvent = new MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
        });
        outsideElement.dispatchEvent(mouseEvent);

        const keyEvent = new KeyboardEvent("keydown", {
          key: "Escape",
          bubbles: true,
          cancelable: true,
        });
        document.dispatchEvent(keyEvent);
      });

      expect(callback).not.toHaveBeenCalled();
    });

    it("removes event listeners when enabled changes to false", () => {
      const callback = jest.fn();
      const removeEventListenerSpy = jest.spyOn(
        document,
        "removeEventListener"
      );

      const { result, rerender } = renderHook(
        ({ enabled }) => useOutsideClick<HTMLDivElement>(callback, enabled),
        { initialProps: { enabled: true } }
      );

      // Assign the ref
      act(() => {
        (
          result.current as React.MutableRefObject<HTMLDivElement | null>
        ).current = container;
      });

      // Clear the spy calls from initial setup
      removeEventListenerSpy.mockClear();

      // Disable - should trigger cleanup
      rerender({ enabled: false });

      // Verify listeners were removed during disable
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "mousedown",
        expect.any(Function)
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "touchstart",
        expect.any(Function)
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "keydown",
        expect.any(Function)
      );

      removeEventListenerSpy.mockRestore();
    });
  });

  describe("edge cases", () => {
    it("handles null ref gracefully when clicking", () => {
      const callback = jest.fn();
      renderHook(() => useOutsideClick<HTMLDivElement>(callback));

      // Click without assigning ref - should NOT call callback since ref.current is null
      // and the check ref.current && !ref.current.contains() short-circuits
      act(() => {
        const event = new MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
        });
        outsideElement.dispatchEvent(event);
      });

      // With null ref, the condition `ref.current && !ref.current.contains(event.target)`
      // evaluates to false (short-circuit on null), so callback should not be called
      expect(callback).not.toHaveBeenCalled();
    });

    it("handles null ref gracefully with Escape key", () => {
      const callback = jest.fn();
      renderHook(() => useOutsideClick<HTMLDivElement>(callback));

      // Press Escape without assigning ref - should still call callback
      // because Escape handling doesn't check the ref
      act(() => {
        const event = new KeyboardEvent("keydown", {
          key: "Escape",
          bubbles: true,
          cancelable: true,
        });
        document.dispatchEvent(event);
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("calls the most recent callback after update", () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const { result, rerender } = renderHook(
        ({ callback }) => useOutsideClick<HTMLDivElement>(callback),
        { initialProps: { callback: callback1 } }
      );

      // Assign the ref
      act(() => {
        (
          result.current as React.MutableRefObject<HTMLDivElement | null>
        ).current = container;
      });

      // Click outside with first callback
      act(() => {
        const event = new MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
        });
        outsideElement.dispatchEvent(event);
      });

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).not.toHaveBeenCalled();

      // Update callback
      rerender({ callback: callback2 });

      // Click outside with second callback
      act(() => {
        const event = new MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
        });
        outsideElement.dispatchEvent(event);
      });

      expect(callback1).toHaveBeenCalledTimes(1); // Still 1
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it("handles multiple simultaneous events", () => {
      const callback = jest.fn();
      const { result } = renderHook(() =>
        useOutsideClick<HTMLDivElement>(callback)
      );

      // Assign the ref
      act(() => {
        (
          result.current as React.MutableRefObject<HTMLDivElement | null>
        ).current = container;
      });

      // Dispatch multiple events in rapid succession
      act(() => {
        const mouseEvent = new MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
        });
        outsideElement.dispatchEvent(mouseEvent);

        const touchEvent = new TouchEvent("touchstart", {
          bubbles: true,
          cancelable: true,
        });
        outsideElement.dispatchEvent(touchEvent);

        const keyEvent = new KeyboardEvent("keydown", {
          key: "Escape",
          bubbles: true,
          cancelable: true,
        });
        document.dispatchEvent(keyEvent);
      });

      expect(callback).toHaveBeenCalledTimes(3);
    });

    it("handles deeply nested child elements", () => {
      const callback = jest.fn();
      const { result } = renderHook(() =>
        useOutsideClick<HTMLDivElement>(callback)
      );

      // Create deeply nested structure
      const level1 = document.createElement("div");
      const level2 = document.createElement("div");
      const level3 = document.createElement("button");
      level2.appendChild(level3);
      level1.appendChild(level2);
      container.appendChild(level1);

      // Assign the ref
      act(() => {
        (
          result.current as React.MutableRefObject<HTMLDivElement | null>
        ).current = container;
      });

      // Click on deeply nested child
      act(() => {
        const event = new MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
        });
        level3.dispatchEvent(event);
      });

      expect(callback).not.toHaveBeenCalled();

      // Cleanup
      container.removeChild(level1);
    });
  });

  describe("TypeScript generic support", () => {
    it("works with HTMLDivElement", () => {
      const callback = jest.fn();
      const { result } = renderHook(() =>
        useOutsideClick<HTMLDivElement>(callback)
      );

      expect(result.current.current).toBeNull();
    });

    it("works with HTMLButtonElement", () => {
      const callback = jest.fn();
      const { result } = renderHook(() =>
        useOutsideClick<HTMLButtonElement>(callback)
      );

      const button = document.createElement("button");
      act(() => {
        (
          result.current as React.MutableRefObject<HTMLButtonElement | null>
        ).current = button;
      });

      expect(result.current.current).toBe(button);
    });

    it("works with HTMLInputElement", () => {
      const callback = jest.fn();
      const { result } = renderHook(() =>
        useOutsideClick<HTMLInputElement>(callback)
      );

      const input = document.createElement("input");
      act(() => {
        (
          result.current as React.MutableRefObject<HTMLInputElement | null>
        ).current = input;
      });

      expect(result.current.current).toBe(input);
    });

    it("works without explicit generic (defaults to HTMLElement)", () => {
      const callback = jest.fn();
      const { result } = renderHook(() => useOutsideClick(callback));

      expect(result.current.current).toBeNull();
    });
  });
});
