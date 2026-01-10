import { renderHook, act } from "@testing-library/react";
import { useDragSelect } from "@/hooks/useDragSelect";

describe("useDragSelect", () => {
  describe("returns correct event handlers", () => {
    it("returns all required event handler functions", () => {
      const onItemTouched = jest.fn();
      const getIndexFromPoint = jest.fn();
      const { result } = renderHook(() =>
        useDragSelect({
          enabled: true,
          onItemTouched,
          getIndexFromPoint,
        })
      );

      expect(result.current.onTouchStart).toBeInstanceOf(Function);
      expect(result.current.onTouchMove).toBeInstanceOf(Function);
      expect(result.current.onTouchEnd).toBeInstanceOf(Function);
      expect(result.current.onMouseDown).toBeInstanceOf(Function);
      expect(result.current.onMouseMove).toBeInstanceOf(Function);
      expect(result.current.onMouseUp).toBeInstanceOf(Function);
      expect(result.current.onClickCapture).toBeInstanceOf(Function);
      expect(typeof result.current.isDragging).toBe("boolean");
    });

    it("initializes isDragging to false", () => {
      const onItemTouched = jest.fn();
      const getIndexFromPoint = jest.fn();
      const { result } = renderHook(() =>
        useDragSelect({
          enabled: true,
          onItemTouched,
          getIndexFromPoint,
        })
      );

      expect(result.current.isDragging).toBe(false);
    });
  });

  describe("drag threshold", () => {
    it("does NOT activate drag until movement exceeds default threshold of 5px", () => {
      const onItemTouched = jest.fn();
      const getIndexFromPoint = jest.fn().mockReturnValue(0);
      const { result } = renderHook(() =>
        useDragSelect({
          enabled: true,
          onItemTouched,
          getIndexFromPoint,
        })
      );

      act(() => {
        result.current.onMouseDown({
          button: 0,
          clientX: 100,
          clientY: 100,
          preventDefault: jest.fn(),
        } as unknown as React.MouseEvent);
      });

      // Move less than threshold
      act(() => {
        result.current.onMouseMove({
          clientX: 103,
          clientY: 102,
        } as unknown as React.MouseEvent);
      });

      expect(result.current.isDragging).toBe(false);
      expect(onItemTouched).not.toHaveBeenCalled();
    });

    it("activates drag when movement exceeds default threshold", () => {
      const onItemTouched = jest.fn();
      const getIndexFromPoint = jest.fn().mockReturnValue(0);
      const { result } = renderHook(() =>
        useDragSelect({
          enabled: true,
          onItemTouched,
          getIndexFromPoint,
        })
      );

      act(() => {
        result.current.onMouseDown({
          button: 0,
          clientX: 100,
          clientY: 100,
          preventDefault: jest.fn(),
        } as unknown as React.MouseEvent);
      });

      // Move more than threshold
      act(() => {
        result.current.onMouseMove({
          clientX: 110,
          clientY: 100,
        } as unknown as React.MouseEvent);
      });

      expect(result.current.isDragging).toBe(true);
      expect(onItemTouched).toHaveBeenCalledWith(0);
    });

    it("respects custom dragThreshold", () => {
      const onItemTouched = jest.fn();
      const getIndexFromPoint = jest.fn().mockReturnValue(0);
      const { result } = renderHook(() =>
        useDragSelect({
          enabled: true,
          onItemTouched,
          getIndexFromPoint,
          dragThreshold: 20,
        })
      );

      act(() => {
        result.current.onMouseDown({
          button: 0,
          clientX: 100,
          clientY: 100,
          preventDefault: jest.fn(),
        } as unknown as React.MouseEvent);
      });

      // Move 15px (within custom 20px threshold)
      act(() => {
        result.current.onMouseMove({
          clientX: 115,
          clientY: 100,
        } as unknown as React.MouseEvent);
      });

      expect(result.current.isDragging).toBe(false);
      expect(onItemTouched).not.toHaveBeenCalled();

      // Move beyond threshold
      act(() => {
        result.current.onMouseMove({
          clientX: 125,
          clientY: 100,
        } as unknown as React.MouseEvent);
      });

      expect(result.current.isDragging).toBe(true);
    });

    it("considers vertical movement for threshold", () => {
      const onItemTouched = jest.fn();
      const getIndexFromPoint = jest.fn().mockReturnValue(0);
      const { result } = renderHook(() =>
        useDragSelect({
          enabled: true,
          onItemTouched,
          getIndexFromPoint,
        })
      );

      act(() => {
        result.current.onMouseDown({
          button: 0,
          clientX: 100,
          clientY: 100,
          preventDefault: jest.fn(),
        } as unknown as React.MouseEvent);
      });

      // Move vertically beyond threshold
      act(() => {
        result.current.onMouseMove({
          clientX: 100,
          clientY: 110,
        } as unknown as React.MouseEvent);
      });

      expect(result.current.isDragging).toBe(true);
    });
  });

  describe("tracks touched items during drag", () => {
    it("toggles the first item when drag starts", () => {
      const onItemTouched = jest.fn();
      const getIndexFromPoint = jest.fn().mockReturnValue(0);
      const { result } = renderHook(() =>
        useDragSelect({
          enabled: true,
          onItemTouched,
          getIndexFromPoint,
        })
      );

      act(() => {
        result.current.onMouseDown({
          button: 0,
          clientX: 100,
          clientY: 100,
          preventDefault: jest.fn(),
        } as unknown as React.MouseEvent);
      });

      act(() => {
        result.current.onMouseMove({
          clientX: 110,
          clientY: 100,
        } as unknown as React.MouseEvent);
      });

      expect(onItemTouched).toHaveBeenCalledWith(0);
      expect(onItemTouched).toHaveBeenCalledTimes(1);
    });

    it("toggles new items as they are dragged over", () => {
      const onItemTouched = jest.fn();
      let currentIndex = 0;
      const getIndexFromPoint = jest.fn().mockImplementation(() => currentIndex);
      const { result } = renderHook(() =>
        useDragSelect({
          enabled: true,
          onItemTouched,
          getIndexFromPoint,
        })
      );

      act(() => {
        result.current.onMouseDown({
          button: 0,
          clientX: 100,
          clientY: 100,
          preventDefault: jest.fn(),
        } as unknown as React.MouseEvent);
      });

      // Exceed threshold to start drag
      act(() => {
        result.current.onMouseMove({
          clientX: 110,
          clientY: 100,
        } as unknown as React.MouseEvent);
      });

      expect(onItemTouched).toHaveBeenCalledWith(0);

      // Move to item 1
      currentIndex = 1;
      act(() => {
        result.current.onMouseMove({
          clientX: 150,
          clientY: 100,
        } as unknown as React.MouseEvent);
      });

      expect(onItemTouched).toHaveBeenCalledWith(1);

      // Move to item 2
      currentIndex = 2;
      act(() => {
        result.current.onMouseMove({
          clientX: 200,
          clientY: 100,
        } as unknown as React.MouseEvent);
      });

      expect(onItemTouched).toHaveBeenCalledWith(2);
      expect(onItemTouched).toHaveBeenCalledTimes(3);
    });

    it("does NOT re-toggle the same item twice during a drag", () => {
      const onItemTouched = jest.fn();
      let currentIndex = 0;
      const getIndexFromPoint = jest.fn().mockImplementation(() => currentIndex);
      const { result } = renderHook(() =>
        useDragSelect({
          enabled: true,
          onItemTouched,
          getIndexFromPoint,
        })
      );

      act(() => {
        result.current.onMouseDown({
          button: 0,
          clientX: 100,
          clientY: 100,
          preventDefault: jest.fn(),
        } as unknown as React.MouseEvent);
      });

      // Start drag
      act(() => {
        result.current.onMouseMove({
          clientX: 110,
          clientY: 100,
        } as unknown as React.MouseEvent);
      });

      expect(onItemTouched).toHaveBeenCalledWith(0);

      // Move to item 1
      currentIndex = 1;
      act(() => {
        result.current.onMouseMove({
          clientX: 150,
          clientY: 100,
        } as unknown as React.MouseEvent);
      });

      // Move back to item 0
      currentIndex = 0;
      act(() => {
        result.current.onMouseMove({
          clientX: 100,
          clientY: 100,
        } as unknown as React.MouseEvent);
      });

      // Item 0 should only have been toggled once
      expect(onItemTouched).toHaveBeenCalledWith(0);
      expect(
        onItemTouched.mock.calls.filter((call) => call[0] === 0).length
      ).toBe(1);
    });

    it("does NOT toggle items when getIndexFromPoint returns null", () => {
      const onItemTouched = jest.fn();
      const getIndexFromPoint = jest.fn().mockReturnValue(null);
      const { result } = renderHook(() =>
        useDragSelect({
          enabled: true,
          onItemTouched,
          getIndexFromPoint,
        })
      );

      act(() => {
        result.current.onMouseDown({
          button: 0,
          clientX: 100,
          clientY: 100,
          preventDefault: jest.fn(),
        } as unknown as React.MouseEvent);
      });

      act(() => {
        result.current.onMouseMove({
          clientX: 110,
          clientY: 100,
        } as unknown as React.MouseEvent);
      });

      expect(onItemTouched).not.toHaveBeenCalled();
    });
  });

  describe("touch events", () => {
    it("supports touch start and move for drag selection", () => {
      const onItemTouched = jest.fn();
      let currentIndex = 0;
      const getIndexFromPoint = jest.fn().mockImplementation(() => currentIndex);
      const { result } = renderHook(() =>
        useDragSelect({
          enabled: true,
          onItemTouched,
          getIndexFromPoint,
        })
      );

      act(() => {
        result.current.onTouchStart({
          touches: [{ clientX: 100, clientY: 100 }],
        } as unknown as React.TouchEvent);
      });

      // Exceed threshold
      act(() => {
        result.current.onTouchMove({
          touches: [{ clientX: 110, clientY: 100 }],
        } as unknown as React.TouchEvent);
      });

      expect(result.current.isDragging).toBe(true);
      expect(onItemTouched).toHaveBeenCalledWith(0);

      // Move to item 1
      currentIndex = 1;
      act(() => {
        result.current.onTouchMove({
          touches: [{ clientX: 150, clientY: 100 }],
        } as unknown as React.TouchEvent);
      });

      expect(onItemTouched).toHaveBeenCalledWith(1);
    });

    it("ends drag on touch end", () => {
      const onItemTouched = jest.fn();
      const getIndexFromPoint = jest.fn().mockReturnValue(0);
      const { result } = renderHook(() =>
        useDragSelect({
          enabled: true,
          onItemTouched,
          getIndexFromPoint,
        })
      );

      act(() => {
        result.current.onTouchStart({
          touches: [{ clientX: 100, clientY: 100 }],
        } as unknown as React.TouchEvent);
      });

      act(() => {
        result.current.onTouchMove({
          touches: [{ clientX: 110, clientY: 100 }],
        } as unknown as React.TouchEvent);
      });

      expect(result.current.isDragging).toBe(true);

      act(() => {
        result.current.onTouchEnd({} as React.TouchEvent);
      });

      expect(result.current.isDragging).toBe(false);
    });

    it("cancels drag when multiple touches are detected on start", () => {
      const onItemTouched = jest.fn();
      const getIndexFromPoint = jest.fn().mockReturnValue(0);
      const { result } = renderHook(() =>
        useDragSelect({
          enabled: true,
          onItemTouched,
          getIndexFromPoint,
        })
      );

      act(() => {
        result.current.onTouchStart({
          touches: [
            { clientX: 100, clientY: 100 },
            { clientX: 200, clientY: 200 },
          ],
        } as unknown as React.TouchEvent);
      });

      act(() => {
        result.current.onTouchMove({
          touches: [{ clientX: 110, clientY: 100 }],
        } as unknown as React.TouchEvent);
      });

      expect(result.current.isDragging).toBe(false);
      expect(onItemTouched).not.toHaveBeenCalled();
    });

    it("cancels drag when multiple touches are detected during move", () => {
      const onItemTouched = jest.fn();
      const getIndexFromPoint = jest.fn().mockReturnValue(0);
      const { result } = renderHook(() =>
        useDragSelect({
          enabled: true,
          onItemTouched,
          getIndexFromPoint,
        })
      );

      act(() => {
        result.current.onTouchStart({
          touches: [{ clientX: 100, clientY: 100 }],
        } as unknown as React.TouchEvent);
      });

      act(() => {
        result.current.onTouchMove({
          touches: [{ clientX: 110, clientY: 100 }],
        } as unknown as React.TouchEvent);
      });

      expect(result.current.isDragging).toBe(true);

      // Add second touch
      act(() => {
        result.current.onTouchMove({
          touches: [
            { clientX: 120, clientY: 100 },
            { clientX: 200, clientY: 200 },
          ],
        } as unknown as React.TouchEvent);
      });

      expect(result.current.isDragging).toBe(false);
    });
  });

  describe("mouse events", () => {
    it("supports mouse down and move for drag selection", () => {
      const onItemTouched = jest.fn();
      let currentIndex = 0;
      const getIndexFromPoint = jest.fn().mockImplementation(() => currentIndex);
      const { result } = renderHook(() =>
        useDragSelect({
          enabled: true,
          onItemTouched,
          getIndexFromPoint,
        })
      );

      act(() => {
        result.current.onMouseDown({
          button: 0,
          clientX: 100,
          clientY: 100,
          preventDefault: jest.fn(),
        } as unknown as React.MouseEvent);
      });

      act(() => {
        result.current.onMouseMove({
          clientX: 110,
          clientY: 100,
        } as unknown as React.MouseEvent);
      });

      expect(result.current.isDragging).toBe(true);
      expect(onItemTouched).toHaveBeenCalledWith(0);

      // Move to item 1
      currentIndex = 1;
      act(() => {
        result.current.onMouseMove({
          clientX: 150,
          clientY: 100,
        } as unknown as React.MouseEvent);
      });

      expect(onItemTouched).toHaveBeenCalledWith(1);
    });

    it("ends drag on mouse up", () => {
      const onItemTouched = jest.fn();
      const getIndexFromPoint = jest.fn().mockReturnValue(0);
      const { result } = renderHook(() =>
        useDragSelect({
          enabled: true,
          onItemTouched,
          getIndexFromPoint,
        })
      );

      act(() => {
        result.current.onMouseDown({
          button: 0,
          clientX: 100,
          clientY: 100,
          preventDefault: jest.fn(),
        } as unknown as React.MouseEvent);
      });

      act(() => {
        result.current.onMouseMove({
          clientX: 110,
          clientY: 100,
        } as unknown as React.MouseEvent);
      });

      expect(result.current.isDragging).toBe(true);

      act(() => {
        result.current.onMouseUp({} as React.MouseEvent);
      });

      expect(result.current.isDragging).toBe(false);
    });

    it("ignores non-left mouse button clicks", () => {
      const onItemTouched = jest.fn();
      const getIndexFromPoint = jest.fn().mockReturnValue(0);
      const { result } = renderHook(() =>
        useDragSelect({
          enabled: true,
          onItemTouched,
          getIndexFromPoint,
        })
      );

      // Right click (button 2)
      act(() => {
        result.current.onMouseDown({
          button: 2,
          clientX: 100,
          clientY: 100,
          preventDefault: jest.fn(),
        } as unknown as React.MouseEvent);
      });

      act(() => {
        result.current.onMouseMove({
          clientX: 110,
          clientY: 100,
        } as unknown as React.MouseEvent);
      });

      expect(result.current.isDragging).toBe(false);
      expect(onItemTouched).not.toHaveBeenCalled();
    });

    it("does NOT track mouse move without prior mouse down", () => {
      const onItemTouched = jest.fn();
      const getIndexFromPoint = jest.fn().mockReturnValue(0);
      const { result } = renderHook(() =>
        useDragSelect({
          enabled: true,
          onItemTouched,
          getIndexFromPoint,
        })
      );

      act(() => {
        result.current.onMouseMove({
          clientX: 110,
          clientY: 100,
        } as unknown as React.MouseEvent);
      });

      expect(result.current.isDragging).toBe(false);
      expect(onItemTouched).not.toHaveBeenCalled();
    });

    it("prevents text selection on mouse down when enabled", () => {
      const onItemTouched = jest.fn();
      const getIndexFromPoint = jest.fn().mockReturnValue(0);
      const preventDefault = jest.fn();
      const { result } = renderHook(() =>
        useDragSelect({
          enabled: true,
          onItemTouched,
          getIndexFromPoint,
        })
      );

      act(() => {
        result.current.onMouseDown({
          button: 0,
          clientX: 100,
          clientY: 100,
          preventDefault,
        } as unknown as React.MouseEvent);
      });

      expect(preventDefault).toHaveBeenCalledTimes(1);
    });
  });

  describe("isDragging state", () => {
    it("is false before drag starts", () => {
      const onItemTouched = jest.fn();
      const getIndexFromPoint = jest.fn().mockReturnValue(0);
      const { result } = renderHook(() =>
        useDragSelect({
          enabled: true,
          onItemTouched,
          getIndexFromPoint,
        })
      );

      expect(result.current.isDragging).toBe(false);

      act(() => {
        result.current.onMouseDown({
          button: 0,
          clientX: 100,
          clientY: 100,
          preventDefault: jest.fn(),
        } as unknown as React.MouseEvent);
      });

      expect(result.current.isDragging).toBe(false);
    });

    it("is true during active drag", () => {
      const onItemTouched = jest.fn();
      const getIndexFromPoint = jest.fn().mockReturnValue(0);
      const { result } = renderHook(() =>
        useDragSelect({
          enabled: true,
          onItemTouched,
          getIndexFromPoint,
        })
      );

      act(() => {
        result.current.onMouseDown({
          button: 0,
          clientX: 100,
          clientY: 100,
          preventDefault: jest.fn(),
        } as unknown as React.MouseEvent);
      });

      act(() => {
        result.current.onMouseMove({
          clientX: 110,
          clientY: 100,
        } as unknown as React.MouseEvent);
      });

      expect(result.current.isDragging).toBe(true);
    });

    it("is false after drag ends", () => {
      const onItemTouched = jest.fn();
      const getIndexFromPoint = jest.fn().mockReturnValue(0);
      const { result } = renderHook(() =>
        useDragSelect({
          enabled: true,
          onItemTouched,
          getIndexFromPoint,
        })
      );

      act(() => {
        result.current.onMouseDown({
          button: 0,
          clientX: 100,
          clientY: 100,
          preventDefault: jest.fn(),
        } as unknown as React.MouseEvent);
      });

      act(() => {
        result.current.onMouseMove({
          clientX: 110,
          clientY: 100,
        } as unknown as React.MouseEvent);
      });

      act(() => {
        result.current.onMouseUp({} as React.MouseEvent);
      });

      expect(result.current.isDragging).toBe(false);
    });

    it("remains false if no drag occurred (movement under threshold)", () => {
      const onItemTouched = jest.fn();
      const getIndexFromPoint = jest.fn().mockReturnValue(0);
      const { result } = renderHook(() =>
        useDragSelect({
          enabled: true,
          onItemTouched,
          getIndexFromPoint,
        })
      );

      act(() => {
        result.current.onMouseDown({
          button: 0,
          clientX: 100,
          clientY: 100,
          preventDefault: jest.fn(),
        } as unknown as React.MouseEvent);
      });

      // Move less than threshold
      act(() => {
        result.current.onMouseMove({
          clientX: 102,
          clientY: 101,
        } as unknown as React.MouseEvent);
      });

      act(() => {
        result.current.onMouseUp({} as React.MouseEvent);
      });

      expect(result.current.isDragging).toBe(false);
    });
  });

  describe("prevents click after drag (onClickCapture)", () => {
    it("prevents click event after a drag operation", () => {
      const onItemTouched = jest.fn();
      const getIndexFromPoint = jest.fn().mockReturnValue(0);
      const { result } = renderHook(() =>
        useDragSelect({
          enabled: true,
          onItemTouched,
          getIndexFromPoint,
        })
      );

      act(() => {
        result.current.onMouseDown({
          button: 0,
          clientX: 100,
          clientY: 100,
          preventDefault: jest.fn(),
        } as unknown as React.MouseEvent);
      });

      act(() => {
        result.current.onMouseMove({
          clientX: 110,
          clientY: 100,
        } as unknown as React.MouseEvent);
      });

      act(() => {
        result.current.onMouseUp({} as React.MouseEvent);
      });

      const stopPropagation = jest.fn();
      const preventDefault = jest.fn();

      act(() => {
        result.current.onClickCapture({
          stopPropagation,
          preventDefault,
        } as unknown as React.MouseEvent);
      });

      expect(stopPropagation).toHaveBeenCalledTimes(1);
      expect(preventDefault).toHaveBeenCalledTimes(1);
    });

    it("does NOT prevent click when no drag occurred", () => {
      const onItemTouched = jest.fn();
      const getIndexFromPoint = jest.fn().mockReturnValue(0);
      const { result } = renderHook(() =>
        useDragSelect({
          enabled: true,
          onItemTouched,
          getIndexFromPoint,
        })
      );

      act(() => {
        result.current.onMouseDown({
          button: 0,
          clientX: 100,
          clientY: 100,
          preventDefault: jest.fn(),
        } as unknown as React.MouseEvent);
      });

      // Movement under threshold
      act(() => {
        result.current.onMouseMove({
          clientX: 102,
          clientY: 101,
        } as unknown as React.MouseEvent);
      });

      act(() => {
        result.current.onMouseUp({} as React.MouseEvent);
      });

      const stopPropagation = jest.fn();
      const preventDefault = jest.fn();

      act(() => {
        result.current.onClickCapture({
          stopPropagation,
          preventDefault,
        } as unknown as React.MouseEvent);
      });

      expect(stopPropagation).not.toHaveBeenCalled();
      expect(preventDefault).not.toHaveBeenCalled();
    });

    it("only prevents the first click after drag", () => {
      const onItemTouched = jest.fn();
      const getIndexFromPoint = jest.fn().mockReturnValue(0);
      const { result } = renderHook(() =>
        useDragSelect({
          enabled: true,
          onItemTouched,
          getIndexFromPoint,
        })
      );

      // Perform drag
      act(() => {
        result.current.onMouseDown({
          button: 0,
          clientX: 100,
          clientY: 100,
          preventDefault: jest.fn(),
        } as unknown as React.MouseEvent);
      });

      act(() => {
        result.current.onMouseMove({
          clientX: 110,
          clientY: 100,
        } as unknown as React.MouseEvent);
      });

      act(() => {
        result.current.onMouseUp({} as React.MouseEvent);
      });

      // First click after drag is prevented
      const stopPropagation1 = jest.fn();
      const preventDefault1 = jest.fn();
      act(() => {
        result.current.onClickCapture({
          stopPropagation: stopPropagation1,
          preventDefault: preventDefault1,
        } as unknown as React.MouseEvent);
      });

      expect(stopPropagation1).toHaveBeenCalledTimes(1);

      // Second click is NOT prevented
      const stopPropagation2 = jest.fn();
      const preventDefault2 = jest.fn();
      act(() => {
        result.current.onClickCapture({
          stopPropagation: stopPropagation2,
          preventDefault: preventDefault2,
        } as unknown as React.MouseEvent);
      });

      expect(stopPropagation2).not.toHaveBeenCalled();
    });
  });

  describe("disabled state", () => {
    it("does NOT start drag when disabled", () => {
      const onItemTouched = jest.fn();
      const getIndexFromPoint = jest.fn().mockReturnValue(0);
      const { result } = renderHook(() =>
        useDragSelect({
          enabled: false,
          onItemTouched,
          getIndexFromPoint,
        })
      );

      act(() => {
        result.current.onMouseDown({
          button: 0,
          clientX: 100,
          clientY: 100,
          preventDefault: jest.fn(),
        } as unknown as React.MouseEvent);
      });

      act(() => {
        result.current.onMouseMove({
          clientX: 110,
          clientY: 100,
        } as unknown as React.MouseEvent);
      });

      expect(result.current.isDragging).toBe(false);
      expect(onItemTouched).not.toHaveBeenCalled();
    });

    it("does NOT start drag with touch when disabled", () => {
      const onItemTouched = jest.fn();
      const getIndexFromPoint = jest.fn().mockReturnValue(0);
      const { result } = renderHook(() =>
        useDragSelect({
          enabled: false,
          onItemTouched,
          getIndexFromPoint,
        })
      );

      act(() => {
        result.current.onTouchStart({
          touches: [{ clientX: 100, clientY: 100 }],
        } as unknown as React.TouchEvent);
      });

      act(() => {
        result.current.onTouchMove({
          touches: [{ clientX: 110, clientY: 100 }],
        } as unknown as React.TouchEvent);
      });

      expect(result.current.isDragging).toBe(false);
      expect(onItemTouched).not.toHaveBeenCalled();
    });

    it("does NOT prevent default on mouse down when disabled", () => {
      const onItemTouched = jest.fn();
      const getIndexFromPoint = jest.fn().mockReturnValue(0);
      const preventDefault = jest.fn();
      const { result } = renderHook(() =>
        useDragSelect({
          enabled: false,
          onItemTouched,
          getIndexFromPoint,
        })
      );

      act(() => {
        result.current.onMouseDown({
          button: 0,
          clientX: 100,
          clientY: 100,
          preventDefault,
        } as unknown as React.MouseEvent);
      });

      expect(preventDefault).not.toHaveBeenCalled();
    });

    it("respects enabled state changes", () => {
      const onItemTouched = jest.fn();
      const getIndexFromPoint = jest.fn().mockReturnValue(0);
      const { result, rerender } = renderHook(
        ({ enabled }) =>
          useDragSelect({
            enabled,
            onItemTouched,
            getIndexFromPoint,
          }),
        { initialProps: { enabled: false } }
      );

      // Try drag while disabled
      act(() => {
        result.current.onMouseDown({
          button: 0,
          clientX: 100,
          clientY: 100,
          preventDefault: jest.fn(),
        } as unknown as React.MouseEvent);
      });

      act(() => {
        result.current.onMouseMove({
          clientX: 110,
          clientY: 100,
        } as unknown as React.MouseEvent);
      });

      expect(result.current.isDragging).toBe(false);

      act(() => {
        result.current.onMouseUp({} as React.MouseEvent);
      });

      // Enable and try again
      rerender({ enabled: true });

      act(() => {
        result.current.onMouseDown({
          button: 0,
          clientX: 100,
          clientY: 100,
          preventDefault: jest.fn(),
        } as unknown as React.MouseEvent);
      });

      act(() => {
        result.current.onMouseMove({
          clientX: 110,
          clientY: 100,
        } as unknown as React.MouseEvent);
      });

      expect(result.current.isDragging).toBe(true);
      expect(onItemTouched).toHaveBeenCalledWith(0);
    });
  });

  describe("callbacks", () => {
    it("calls onDragStart when drag begins", () => {
      const onItemTouched = jest.fn();
      const getIndexFromPoint = jest.fn().mockReturnValue(0);
      const onDragStart = jest.fn();
      const { result } = renderHook(() =>
        useDragSelect({
          enabled: true,
          onItemTouched,
          getIndexFromPoint,
          onDragStart,
        })
      );

      act(() => {
        result.current.onMouseDown({
          button: 0,
          clientX: 100,
          clientY: 100,
          preventDefault: jest.fn(),
        } as unknown as React.MouseEvent);
      });

      expect(onDragStart).not.toHaveBeenCalled();

      act(() => {
        result.current.onMouseMove({
          clientX: 110,
          clientY: 100,
        } as unknown as React.MouseEvent);
      });

      expect(onDragStart).toHaveBeenCalledTimes(1);
    });

    it("calls onDragEnd when drag finishes", () => {
      const onItemTouched = jest.fn();
      const getIndexFromPoint = jest.fn().mockReturnValue(0);
      const onDragEnd = jest.fn();
      const { result } = renderHook(() =>
        useDragSelect({
          enabled: true,
          onItemTouched,
          getIndexFromPoint,
          onDragEnd,
        })
      );

      act(() => {
        result.current.onMouseDown({
          button: 0,
          clientX: 100,
          clientY: 100,
          preventDefault: jest.fn(),
        } as unknown as React.MouseEvent);
      });

      act(() => {
        result.current.onMouseMove({
          clientX: 110,
          clientY: 100,
        } as unknown as React.MouseEvent);
      });

      expect(onDragEnd).not.toHaveBeenCalled();

      act(() => {
        result.current.onMouseUp({} as React.MouseEvent);
      });

      expect(onDragEnd).toHaveBeenCalledTimes(1);
    });

    it("does NOT call onDragEnd if no drag occurred", () => {
      const onItemTouched = jest.fn();
      const getIndexFromPoint = jest.fn().mockReturnValue(0);
      const onDragEnd = jest.fn();
      const { result } = renderHook(() =>
        useDragSelect({
          enabled: true,
          onItemTouched,
          getIndexFromPoint,
          onDragEnd,
        })
      );

      act(() => {
        result.current.onMouseDown({
          button: 0,
          clientX: 100,
          clientY: 100,
          preventDefault: jest.fn(),
        } as unknown as React.MouseEvent);
      });

      // Movement under threshold
      act(() => {
        result.current.onMouseMove({
          clientX: 102,
          clientY: 101,
        } as unknown as React.MouseEvent);
      });

      act(() => {
        result.current.onMouseUp({} as React.MouseEvent);
      });

      expect(onDragEnd).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("handles mouse up without prior mouse down", () => {
      const onItemTouched = jest.fn();
      const getIndexFromPoint = jest.fn().mockReturnValue(0);
      const { result } = renderHook(() =>
        useDragSelect({
          enabled: true,
          onItemTouched,
          getIndexFromPoint,
        })
      );

      // Should not throw
      act(() => {
        result.current.onMouseUp({} as React.MouseEvent);
      });

      expect(result.current.isDragging).toBe(false);
    });

    it("handles touch end without prior touch start", () => {
      const onItemTouched = jest.fn();
      const getIndexFromPoint = jest.fn().mockReturnValue(0);
      const { result } = renderHook(() =>
        useDragSelect({
          enabled: true,
          onItemTouched,
          getIndexFromPoint,
        })
      );

      // Should not throw
      act(() => {
        result.current.onTouchEnd({} as React.TouchEvent);
      });

      expect(result.current.isDragging).toBe(false);
    });

    it("resets touched items between drag sessions", () => {
      const onItemTouched = jest.fn();
      const getIndexFromPoint = jest.fn().mockReturnValue(0);
      const { result } = renderHook(() =>
        useDragSelect({
          enabled: true,
          onItemTouched,
          getIndexFromPoint,
        })
      );

      // First drag session
      act(() => {
        result.current.onMouseDown({
          button: 0,
          clientX: 100,
          clientY: 100,
          preventDefault: jest.fn(),
        } as unknown as React.MouseEvent);
      });

      act(() => {
        result.current.onMouseMove({
          clientX: 110,
          clientY: 100,
        } as unknown as React.MouseEvent);
      });

      act(() => {
        result.current.onMouseUp({} as React.MouseEvent);
      });

      expect(onItemTouched).toHaveBeenCalledWith(0);
      expect(onItemTouched).toHaveBeenCalledTimes(1);

      // Second drag session - item 0 should be toggled again
      act(() => {
        result.current.onMouseDown({
          button: 0,
          clientX: 100,
          clientY: 100,
          preventDefault: jest.fn(),
        } as unknown as React.MouseEvent);
      });

      act(() => {
        result.current.onMouseMove({
          clientX: 110,
          clientY: 100,
        } as unknown as React.MouseEvent);
      });

      expect(onItemTouched).toHaveBeenCalledTimes(2);
    });

    it("handles rapid drag operations correctly", () => {
      const onItemTouched = jest.fn();
      let currentIndex = 0;
      const getIndexFromPoint = jest.fn().mockImplementation(() => currentIndex);
      const { result } = renderHook(() =>
        useDragSelect({
          enabled: true,
          onItemTouched,
          getIndexFromPoint,
        })
      );

      // Perform multiple rapid drags
      for (let i = 0; i < 3; i++) {
        currentIndex = i;
        act(() => {
          result.current.onMouseDown({
            button: 0,
            clientX: 100 + i * 50,
            clientY: 100,
            preventDefault: jest.fn(),
          } as unknown as React.MouseEvent);
        });

        act(() => {
          result.current.onMouseMove({
            clientX: 110 + i * 50,
            clientY: 100,
          } as unknown as React.MouseEvent);
        });

        act(() => {
          result.current.onMouseUp({} as React.MouseEvent);
        });
      }

      expect(onItemTouched).toHaveBeenCalledWith(0);
      expect(onItemTouched).toHaveBeenCalledWith(1);
      expect(onItemTouched).toHaveBeenCalledWith(2);
      expect(onItemTouched).toHaveBeenCalledTimes(3);
    });

    it("handles starting drag outside of any item", () => {
      const onItemTouched = jest.fn();
      let currentIndex: number | null = null;
      const getIndexFromPoint = jest.fn().mockImplementation(() => currentIndex);
      const { result } = renderHook(() =>
        useDragSelect({
          enabled: true,
          onItemTouched,
          getIndexFromPoint,
        })
      );

      // Start outside items
      act(() => {
        result.current.onMouseDown({
          button: 0,
          clientX: 100,
          clientY: 100,
          preventDefault: jest.fn(),
        } as unknown as React.MouseEvent);
      });

      // Move to exceed threshold
      act(() => {
        result.current.onMouseMove({
          clientX: 110,
          clientY: 100,
        } as unknown as React.MouseEvent);
      });

      expect(result.current.isDragging).toBe(true);
      expect(onItemTouched).not.toHaveBeenCalled();

      // Move over item 0
      currentIndex = 0;
      act(() => {
        result.current.onMouseMove({
          clientX: 120,
          clientY: 100,
        } as unknown as React.MouseEvent);
      });

      expect(onItemTouched).toHaveBeenCalledWith(0);
    });

    it("handles dragging from item to empty space", () => {
      const onItemTouched = jest.fn();
      let currentIndex: number | null = 0;
      const getIndexFromPoint = jest.fn().mockImplementation(() => currentIndex);
      const { result } = renderHook(() =>
        useDragSelect({
          enabled: true,
          onItemTouched,
          getIndexFromPoint,
        })
      );

      // Start on item 0
      act(() => {
        result.current.onMouseDown({
          button: 0,
          clientX: 100,
          clientY: 100,
          preventDefault: jest.fn(),
        } as unknown as React.MouseEvent);
      });

      act(() => {
        result.current.onMouseMove({
          clientX: 110,
          clientY: 100,
        } as unknown as React.MouseEvent);
      });

      expect(onItemTouched).toHaveBeenCalledWith(0);

      // Move to empty space
      currentIndex = null;
      act(() => {
        result.current.onMouseMove({
          clientX: 150,
          clientY: 100,
        } as unknown as React.MouseEvent);
      });

      // Should not have called onItemTouched again
      expect(onItemTouched).toHaveBeenCalledTimes(1);
    });
  });
});
