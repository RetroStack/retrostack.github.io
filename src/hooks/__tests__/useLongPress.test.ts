import { renderHook, act } from "@testing-library/react";
import { useLongPress } from "@/hooks/useLongPress";

describe("useLongPress", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("returns correct event handlers", () => {
    it("returns all required event handler functions", () => {
      const onLongPress = jest.fn();
      const { result } = renderHook(() => useLongPress({ onLongPress }));

      expect(result.current.onMouseDown).toBeInstanceOf(Function);
      expect(result.current.onMouseUp).toBeInstanceOf(Function);
      expect(result.current.onMouseLeave).toBeInstanceOf(Function);
      expect(result.current.onTouchStart).toBeInstanceOf(Function);
      expect(result.current.onTouchEnd).toBeInstanceOf(Function);
      expect(result.current.onTouchMove).toBeInstanceOf(Function);
      expect(result.current.onContextMenu).toBeInstanceOf(Function);
    });
  });

  describe("long press detection with mouse", () => {
    it("fires onLongPress after default threshold of 500ms", () => {
      const onLongPress = jest.fn();
      const { result } = renderHook(() => useLongPress({ onLongPress }));

      act(() => {
        result.current.onMouseDown({
          button: 0,
          clientX: 100,
          clientY: 100,
        } as React.MouseEvent);
      });

      expect(onLongPress).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(onLongPress).toHaveBeenCalledTimes(1);
    });

    it("does NOT fire onLongPress if released before threshold", () => {
      const onLongPress = jest.fn();
      const { result } = renderHook(() => useLongPress({ onLongPress }));

      act(() => {
        result.current.onMouseDown({
          button: 0,
          clientX: 100,
          clientY: 100,
        } as React.MouseEvent);
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      act(() => {
        result.current.onMouseUp({} as React.MouseEvent);
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(onLongPress).not.toHaveBeenCalled();
    });

    it("fires onPress for short clicks when provided", () => {
      const onLongPress = jest.fn();
      const onPress = jest.fn();
      const { result } = renderHook(() =>
        useLongPress({ onLongPress, onPress })
      );

      act(() => {
        result.current.onMouseDown({
          button: 0,
          clientX: 100,
          clientY: 100,
        } as React.MouseEvent);
      });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      act(() => {
        result.current.onMouseUp({} as React.MouseEvent);
      });

      expect(onPress).toHaveBeenCalledTimes(1);
      expect(onLongPress).not.toHaveBeenCalled();
    });

    it("does NOT fire onPress after a long press", () => {
      const onLongPress = jest.fn();
      const onPress = jest.fn();
      const { result } = renderHook(() =>
        useLongPress({ onLongPress, onPress })
      );

      act(() => {
        result.current.onMouseDown({
          button: 0,
          clientX: 100,
          clientY: 100,
        } as React.MouseEvent);
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(onLongPress).toHaveBeenCalledTimes(1);

      act(() => {
        result.current.onMouseUp({} as React.MouseEvent);
      });

      expect(onPress).not.toHaveBeenCalled();
    });

    it("cancels long press when mouse leaves", () => {
      const onLongPress = jest.fn();
      const onPress = jest.fn();
      const { result } = renderHook(() =>
        useLongPress({ onLongPress, onPress })
      );

      act(() => {
        result.current.onMouseDown({
          button: 0,
          clientX: 100,
          clientY: 100,
        } as React.MouseEvent);
      });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      act(() => {
        result.current.onMouseLeave({} as React.MouseEvent);
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(onLongPress).not.toHaveBeenCalled();
      expect(onPress).not.toHaveBeenCalled();
    });

    it("ignores non-left mouse button clicks", () => {
      const onLongPress = jest.fn();
      const { result } = renderHook(() => useLongPress({ onLongPress }));

      // Right click (button 2)
      act(() => {
        result.current.onMouseDown({
          button: 2,
          clientX: 100,
          clientY: 100,
        } as React.MouseEvent);
      });

      act(() => {
        jest.advanceTimersByTime(600);
      });

      expect(onLongPress).not.toHaveBeenCalled();
    });
  });

  describe("long press detection with touch", () => {
    it("fires onLongPress after threshold on touch", () => {
      const onLongPress = jest.fn();
      const { result } = renderHook(() => useLongPress({ onLongPress }));

      act(() => {
        result.current.onTouchStart({
          touches: [{ clientX: 100, clientY: 100 }],
        } as unknown as React.TouchEvent);
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(onLongPress).toHaveBeenCalledTimes(1);
    });

    it("fires onPress for short taps when provided", () => {
      const onLongPress = jest.fn();
      const onPress = jest.fn();
      const { result } = renderHook(() =>
        useLongPress({ onLongPress, onPress })
      );

      act(() => {
        result.current.onTouchStart({
          touches: [{ clientX: 100, clientY: 100 }],
        } as unknown as React.TouchEvent);
      });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      act(() => {
        result.current.onTouchEnd({} as React.TouchEvent);
      });

      expect(onPress).toHaveBeenCalledTimes(1);
      expect(onLongPress).not.toHaveBeenCalled();
    });

    it("cancels when multiple touches detected on start", () => {
      const onLongPress = jest.fn();
      const { result } = renderHook(() => useLongPress({ onLongPress }));

      act(() => {
        result.current.onTouchStart({
          touches: [
            { clientX: 100, clientY: 100 },
            { clientX: 200, clientY: 200 },
          ],
        } as unknown as React.TouchEvent);
      });

      act(() => {
        jest.advanceTimersByTime(600);
      });

      expect(onLongPress).not.toHaveBeenCalled();
    });

    it("cancels when multiple touches detected during move", () => {
      const onLongPress = jest.fn();
      const { result } = renderHook(() => useLongPress({ onLongPress }));

      act(() => {
        result.current.onTouchStart({
          touches: [{ clientX: 100, clientY: 100 }],
        } as unknown as React.TouchEvent);
      });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      act(() => {
        result.current.onTouchMove({
          touches: [
            { clientX: 100, clientY: 100 },
            { clientX: 200, clientY: 200 },
          ],
        } as unknown as React.TouchEvent);
      });

      act(() => {
        jest.advanceTimersByTime(400);
      });

      expect(onLongPress).not.toHaveBeenCalled();
    });
  });

  describe("movement threshold", () => {
    it("cancels if finger moves beyond default moveThreshold of 10px", () => {
      const onLongPress = jest.fn();
      const { result } = renderHook(() => useLongPress({ onLongPress }));

      act(() => {
        result.current.onTouchStart({
          touches: [{ clientX: 100, clientY: 100 }],
        } as unknown as React.TouchEvent);
      });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      // Move 15px horizontally (beyond threshold)
      act(() => {
        result.current.onTouchMove({
          touches: [{ clientX: 115, clientY: 100 }],
        } as unknown as React.TouchEvent);
      });

      act(() => {
        jest.advanceTimersByTime(400);
      });

      expect(onLongPress).not.toHaveBeenCalled();
    });

    it("does NOT cancel if movement is within threshold", () => {
      const onLongPress = jest.fn();
      const { result } = renderHook(() => useLongPress({ onLongPress }));

      act(() => {
        result.current.onTouchStart({
          touches: [{ clientX: 100, clientY: 100 }],
        } as unknown as React.TouchEvent);
      });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      // Move only 5px (within threshold)
      act(() => {
        result.current.onTouchMove({
          touches: [{ clientX: 105, clientY: 100 }],
        } as unknown as React.TouchEvent);
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(onLongPress).toHaveBeenCalledTimes(1);
    });

    it("cancels if vertical movement exceeds threshold", () => {
      const onLongPress = jest.fn();
      const { result } = renderHook(() => useLongPress({ onLongPress }));

      act(() => {
        result.current.onTouchStart({
          touches: [{ clientX: 100, clientY: 100 }],
        } as unknown as React.TouchEvent);
      });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      // Move 15px vertically (beyond threshold)
      act(() => {
        result.current.onTouchMove({
          touches: [{ clientX: 100, clientY: 115 }],
        } as unknown as React.TouchEvent);
      });

      act(() => {
        jest.advanceTimersByTime(400);
      });

      expect(onLongPress).not.toHaveBeenCalled();
    });

    it("respects custom moveThreshold", () => {
      const onLongPress = jest.fn();
      const { result } = renderHook(() =>
        useLongPress({ onLongPress, moveThreshold: 50 })
      );

      act(() => {
        result.current.onTouchStart({
          touches: [{ clientX: 100, clientY: 100 }],
        } as unknown as React.TouchEvent);
      });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      // Move 30px (within custom 50px threshold)
      act(() => {
        result.current.onTouchMove({
          touches: [{ clientX: 130, clientY: 100 }],
        } as unknown as React.TouchEvent);
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(onLongPress).toHaveBeenCalledTimes(1);
    });
  });

  describe("configurable threshold", () => {
    it("fires onLongPress after custom threshold", () => {
      const onLongPress = jest.fn();
      const { result } = renderHook(() =>
        useLongPress({ onLongPress, threshold: 1000 })
      );

      act(() => {
        result.current.onMouseDown({
          button: 0,
          clientX: 100,
          clientY: 100,
        } as React.MouseEvent);
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(onLongPress).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(onLongPress).toHaveBeenCalledTimes(1);
    });

    it("fires onPress when released before custom threshold", () => {
      const onLongPress = jest.fn();
      const onPress = jest.fn();
      const { result } = renderHook(() =>
        useLongPress({ onLongPress, onPress, threshold: 1000 })
      );

      act(() => {
        result.current.onMouseDown({
          button: 0,
          clientX: 100,
          clientY: 100,
        } as React.MouseEvent);
      });

      act(() => {
        jest.advanceTimersByTime(800);
      });

      act(() => {
        result.current.onMouseUp({} as React.MouseEvent);
      });

      expect(onPress).toHaveBeenCalledTimes(1);
      expect(onLongPress).not.toHaveBeenCalled();
    });

    it("works with short threshold", () => {
      const onLongPress = jest.fn();
      const { result } = renderHook(() =>
        useLongPress({ onLongPress, threshold: 100 })
      );

      act(() => {
        result.current.onMouseDown({
          button: 0,
          clientX: 100,
          clientY: 100,
        } as React.MouseEvent);
      });

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(onLongPress).toHaveBeenCalledTimes(1);
    });
  });

  describe("context menu prevention", () => {
    it("prevents context menu during long press", () => {
      const onLongPress = jest.fn();
      const { result } = renderHook(() => useLongPress({ onLongPress }));

      const preventDefault = jest.fn();

      act(() => {
        result.current.onTouchStart({
          touches: [{ clientX: 100, clientY: 100 }],
        } as unknown as React.TouchEvent);
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(onLongPress).toHaveBeenCalled();

      act(() => {
        result.current.onContextMenu({
          preventDefault,
        } as unknown as React.MouseEvent);
      });

      expect(preventDefault).toHaveBeenCalledTimes(1);
    });

    it("does NOT prevent context menu before long press fires", () => {
      const onLongPress = jest.fn();
      const { result } = renderHook(() => useLongPress({ onLongPress }));

      const preventDefault = jest.fn();

      act(() => {
        result.current.onTouchStart({
          touches: [{ clientX: 100, clientY: 100 }],
        } as unknown as React.TouchEvent);
      });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      act(() => {
        result.current.onContextMenu({
          preventDefault,
        } as unknown as React.MouseEvent);
      });

      expect(preventDefault).not.toHaveBeenCalled();
    });
  });

  describe("disabled state", () => {
    it("does not fire onLongPress when disabled", () => {
      const onLongPress = jest.fn();
      const { result } = renderHook(() =>
        useLongPress({ onLongPress, disabled: true })
      );

      act(() => {
        result.current.onMouseDown({
          button: 0,
          clientX: 100,
          clientY: 100,
        } as React.MouseEvent);
      });

      act(() => {
        jest.advanceTimersByTime(600);
      });

      expect(onLongPress).not.toHaveBeenCalled();
    });

    it("does not fire onPress when disabled", () => {
      const onLongPress = jest.fn();
      const onPress = jest.fn();
      const { result } = renderHook(() =>
        useLongPress({ onLongPress, onPress, disabled: true })
      );

      act(() => {
        result.current.onMouseDown({
          button: 0,
          clientX: 100,
          clientY: 100,
        } as React.MouseEvent);
      });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      act(() => {
        result.current.onMouseUp({} as React.MouseEvent);
      });

      expect(onPress).not.toHaveBeenCalled();
      expect(onLongPress).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("handles rapid press and release cycles", () => {
      const onLongPress = jest.fn();
      const onPress = jest.fn();
      const { result } = renderHook(() =>
        useLongPress({ onLongPress, onPress })
      );

      for (let i = 0; i < 5; i++) {
        act(() => {
          result.current.onMouseDown({
            button: 0,
            clientX: 100,
            clientY: 100,
          } as React.MouseEvent);
        });

        act(() => {
          jest.advanceTimersByTime(100);
        });

        act(() => {
          result.current.onMouseUp({} as React.MouseEvent);
        });
      }

      expect(onPress).toHaveBeenCalledTimes(5);
      expect(onLongPress).not.toHaveBeenCalled();
    });

    it("handles long press followed by short press", () => {
      const onLongPress = jest.fn();
      const onPress = jest.fn();
      const { result } = renderHook(() =>
        useLongPress({ onLongPress, onPress })
      );

      // First: long press
      act(() => {
        result.current.onMouseDown({
          button: 0,
          clientX: 100,
          clientY: 100,
        } as React.MouseEvent);
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(onLongPress).toHaveBeenCalledTimes(1);

      act(() => {
        result.current.onMouseUp({} as React.MouseEvent);
      });

      // Second: short press
      act(() => {
        result.current.onMouseDown({
          button: 0,
          clientX: 100,
          clientY: 100,
        } as React.MouseEvent);
      });

      act(() => {
        jest.advanceTimersByTime(100);
      });

      act(() => {
        result.current.onMouseUp({} as React.MouseEvent);
      });

      expect(onPress).toHaveBeenCalledTimes(1);
      expect(onLongPress).toHaveBeenCalledTimes(1);
    });

    it("handles touch move with no prior touch start", () => {
      const onLongPress = jest.fn();
      const { result } = renderHook(() => useLongPress({ onLongPress }));

      // Should not throw
      act(() => {
        result.current.onTouchMove({
          touches: [{ clientX: 100, clientY: 100 }],
        } as unknown as React.TouchEvent);
      });

      expect(onLongPress).not.toHaveBeenCalled();
    });

    it("handles mouse up with no prior mouse down", () => {
      const onLongPress = jest.fn();
      const onPress = jest.fn();
      const { result } = renderHook(() =>
        useLongPress({ onLongPress, onPress })
      );

      // Should not throw and should not fire callbacks
      act(() => {
        result.current.onMouseUp({} as React.MouseEvent);
      });

      expect(onLongPress).not.toHaveBeenCalled();
      expect(onPress).not.toHaveBeenCalled();
    });
  });
});
