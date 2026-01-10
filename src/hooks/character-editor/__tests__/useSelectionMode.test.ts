import { renderHook, act } from "@testing-library/react";
import { useSelectionMode } from "@/hooks/character-editor/useSelectionMode";

describe("useSelectionMode", () => {
  const createDefaultOptions = (overrides = {}) => ({
    itemCount: 10,
    selectedIndex: 0,
    batchSelection: new Set<number>(),
    onSelect: jest.fn(),
    ...overrides,
  });

  describe("initial state", () => {
    it("initializes with selection mode inactive", () => {
      const { result } = renderHook(() =>
        useSelectionMode(createDefaultOptions())
      );

      expect(result.current.isSelectionMode).toBe(false);
    });

    it("computes selectionCount as 1 when only primary is selected", () => {
      const { result } = renderHook(() =>
        useSelectionMode(createDefaultOptions())
      );

      expect(result.current.selectionCount).toBe(1);
    });

    it("computes hasMultipleSelected as false when only primary is selected", () => {
      const { result } = renderHook(() =>
        useSelectionMode(createDefaultOptions())
      );

      expect(result.current.hasMultipleSelected).toBe(false);
    });

    it("includes primary selection in selectedIndices", () => {
      const { result } = renderHook(() =>
        useSelectionMode(createDefaultOptions({ selectedIndex: 3 }))
      );

      expect(result.current.selectedIndices.has(3)).toBe(true);
      expect(result.current.selectedIndices.size).toBe(1);
    });
  });

  describe("enterSelectionMode", () => {
    it("activates selection mode", () => {
      const { result } = renderHook(() =>
        useSelectionMode(createDefaultOptions())
      );

      act(() => {
        result.current.enterSelectionMode();
      });

      expect(result.current.isSelectionMode).toBe(true);
    });

    it("activates selection mode with initial index", () => {
      const onSelect = jest.fn();
      const { result } = renderHook(() =>
        useSelectionMode(createDefaultOptions({ onSelect }))
      );

      act(() => {
        result.current.enterSelectionMode(5);
      });

      expect(result.current.isSelectionMode).toBe(true);
      expect(onSelect).toHaveBeenCalledWith(5, false, true);
    });

    it("does not call onSelect if initial index is already primary", () => {
      const onSelect = jest.fn();
      const { result } = renderHook(() =>
        useSelectionMode(createDefaultOptions({ selectedIndex: 3, onSelect }))
      );

      act(() => {
        result.current.enterSelectionMode(3);
      });

      expect(result.current.isSelectionMode).toBe(true);
      expect(onSelect).not.toHaveBeenCalled();
    });

    it("does not call onSelect if initial index is already in batch", () => {
      const onSelect = jest.fn();
      const { result } = renderHook(() =>
        useSelectionMode(
          createDefaultOptions({
            batchSelection: new Set([5, 6, 7]),
            onSelect,
          })
        )
      );

      act(() => {
        result.current.enterSelectionMode(6);
      });

      expect(result.current.isSelectionMode).toBe(true);
      expect(onSelect).not.toHaveBeenCalled();
    });

    it("calls onSelectionModeChange callback when entering", () => {
      const onSelectionModeChange = jest.fn();
      const { result } = renderHook(() =>
        useSelectionMode(createDefaultOptions({ onSelectionModeChange }))
      );

      act(() => {
        result.current.enterSelectionMode();
      });

      expect(onSelectionModeChange).toHaveBeenCalledWith(true);
    });
  });

  describe("exitSelectionMode", () => {
    it("deactivates selection mode", () => {
      const { result } = renderHook(() =>
        useSelectionMode(createDefaultOptions())
      );

      act(() => {
        result.current.enterSelectionMode();
      });

      expect(result.current.isSelectionMode).toBe(true);

      act(() => {
        result.current.exitSelectionMode();
      });

      expect(result.current.isSelectionMode).toBe(false);
    });

    it("clears batch selection by calling onSelect", () => {
      const onSelect = jest.fn();
      const { result } = renderHook(() =>
        useSelectionMode(
          createDefaultOptions({
            selectedIndex: 2,
            batchSelection: new Set([3, 4, 5]),
            onSelect,
          })
        )
      );

      act(() => {
        result.current.enterSelectionMode();
      });

      onSelect.mockClear();

      act(() => {
        result.current.exitSelectionMode();
      });

      expect(onSelect).toHaveBeenCalledWith(2, false, false);
    });

    it("calls onSelectionModeChange callback when exiting", () => {
      const onSelectionModeChange = jest.fn();
      const { result } = renderHook(() =>
        useSelectionMode(createDefaultOptions({ onSelectionModeChange }))
      );

      act(() => {
        result.current.enterSelectionMode();
      });

      onSelectionModeChange.mockClear();

      act(() => {
        result.current.exitSelectionMode();
      });

      expect(onSelectionModeChange).toHaveBeenCalledWith(false);
    });
  });

  describe("toggleSelectionMode", () => {
    it("enters selection mode when inactive", () => {
      const { result } = renderHook(() =>
        useSelectionMode(createDefaultOptions())
      );

      act(() => {
        result.current.toggleSelectionMode();
      });

      expect(result.current.isSelectionMode).toBe(true);
    });

    it("exits selection mode when active", () => {
      const { result } = renderHook(() =>
        useSelectionMode(createDefaultOptions())
      );

      act(() => {
        result.current.enterSelectionMode();
      });

      act(() => {
        result.current.toggleSelectionMode();
      });

      expect(result.current.isSelectionMode).toBe(false);
    });
  });

  describe("toggleItem", () => {
    it("calls onSelect with toggle flag", () => {
      const onSelect = jest.fn();
      const { result } = renderHook(() =>
        useSelectionMode(createDefaultOptions({ onSelect }))
      );

      act(() => {
        result.current.toggleItem(5);
      });

      expect(onSelect).toHaveBeenCalledWith(5, false, true);
    });

    it("can toggle multiple items", () => {
      const onSelect = jest.fn();
      const { result } = renderHook(() =>
        useSelectionMode(createDefaultOptions({ onSelect }))
      );

      act(() => {
        result.current.toggleItem(3);
        result.current.toggleItem(7);
      });

      expect(onSelect).toHaveBeenCalledWith(3, false, true);
      expect(onSelect).toHaveBeenCalledWith(7, false, true);
    });
  });

  describe("selectAll", () => {
    it("selects all items that are not already selected", () => {
      const onSelect = jest.fn();
      const { result } = renderHook(() =>
        useSelectionMode(
          createDefaultOptions({
            itemCount: 5,
            selectedIndex: 0,
            batchSelection: new Set<number>(),
            onSelect,
          })
        )
      );

      act(() => {
        result.current.selectAll();
      });

      // Should select indices 1, 2, 3, 4 (not 0 which is primary)
      expect(onSelect).toHaveBeenCalledTimes(4);
      expect(onSelect).toHaveBeenCalledWith(1, false, true);
      expect(onSelect).toHaveBeenCalledWith(2, false, true);
      expect(onSelect).toHaveBeenCalledWith(3, false, true);
      expect(onSelect).toHaveBeenCalledWith(4, false, true);
    });

    it("does not re-select items already in batch", () => {
      const onSelect = jest.fn();
      const { result } = renderHook(() =>
        useSelectionMode(
          createDefaultOptions({
            itemCount: 5,
            selectedIndex: 0,
            batchSelection: new Set([2, 4]),
            onSelect,
          })
        )
      );

      act(() => {
        result.current.selectAll();
      });

      // Should only select 1 and 3 (not 0 which is primary, not 2 and 4 which are in batch)
      expect(onSelect).toHaveBeenCalledTimes(2);
      expect(onSelect).toHaveBeenCalledWith(1, false, true);
      expect(onSelect).toHaveBeenCalledWith(3, false, true);
    });

    it("does nothing when all items are already selected", () => {
      const onSelect = jest.fn();
      const { result } = renderHook(() =>
        useSelectionMode(
          createDefaultOptions({
            itemCount: 3,
            selectedIndex: 0,
            batchSelection: new Set([1, 2]),
            onSelect,
          })
        )
      );

      act(() => {
        result.current.selectAll();
      });

      expect(onSelect).not.toHaveBeenCalled();
    });
  });

  describe("clearSelection", () => {
    it("clears selection by calling onSelect on current index", () => {
      const onSelect = jest.fn();
      const { result } = renderHook(() =>
        useSelectionMode(
          createDefaultOptions({
            selectedIndex: 3,
            batchSelection: new Set([1, 2, 5]),
            onSelect,
          })
        )
      );

      act(() => {
        result.current.clearSelection();
      });

      expect(onSelect).toHaveBeenCalledWith(3, false, false);
    });
  });

  describe("handleItemInteraction", () => {
    it("toggles item when in selection mode", () => {
      const onSelect = jest.fn();
      const { result } = renderHook(() =>
        useSelectionMode(createDefaultOptions({ onSelect }))
      );

      act(() => {
        result.current.enterSelectionMode();
      });

      onSelect.mockClear();

      act(() => {
        result.current.handleItemInteraction(5, false, false);
      });

      expect(onSelect).toHaveBeenCalledWith(5, false, true);
    });

    it("ignores shift/ctrl keys when in selection mode", () => {
      const onSelect = jest.fn();
      const { result } = renderHook(() =>
        useSelectionMode(createDefaultOptions({ onSelect }))
      );

      act(() => {
        result.current.enterSelectionMode();
      });

      onSelect.mockClear();

      act(() => {
        result.current.handleItemInteraction(5, true, true);
      });

      // Should still call with toggle behavior, ignoring shift/ctrl
      expect(onSelect).toHaveBeenCalledWith(5, false, true);
    });

    it("passes shift key to onSelect when not in selection mode", () => {
      const onSelect = jest.fn();
      const { result } = renderHook(() =>
        useSelectionMode(createDefaultOptions({ onSelect }))
      );

      act(() => {
        result.current.handleItemInteraction(5, true, false);
      });

      expect(onSelect).toHaveBeenCalledWith(5, true, false);
    });

    it("passes ctrl/meta key to onSelect when not in selection mode", () => {
      const onSelect = jest.fn();
      const { result } = renderHook(() =>
        useSelectionMode(createDefaultOptions({ onSelect }))
      );

      act(() => {
        result.current.handleItemInteraction(5, false, true);
      });

      expect(onSelect).toHaveBeenCalledWith(5, false, true);
    });

    it("passes both shift and ctrl keys when not in selection mode", () => {
      const onSelect = jest.fn();
      const { result } = renderHook(() =>
        useSelectionMode(createDefaultOptions({ onSelect }))
      );

      act(() => {
        result.current.handleItemInteraction(5, true, true);
      });

      expect(onSelect).toHaveBeenCalledWith(5, true, true);
    });
  });

  describe("handleLongPress", () => {
    it("enters selection mode with the pressed index", () => {
      const onSelect = jest.fn();
      const { result } = renderHook(() =>
        useSelectionMode(createDefaultOptions({ onSelect }))
      );

      act(() => {
        result.current.handleLongPress(5);
      });

      expect(result.current.isSelectionMode).toBe(true);
      expect(onSelect).toHaveBeenCalledWith(5, false, true);
    });

    it("does nothing if already in selection mode", () => {
      const onSelect = jest.fn();
      const { result } = renderHook(() =>
        useSelectionMode(createDefaultOptions({ onSelect }))
      );

      act(() => {
        result.current.enterSelectionMode();
      });

      onSelect.mockClear();

      act(() => {
        result.current.handleLongPress(5);
      });

      // onSelect should not be called again
      expect(onSelect).not.toHaveBeenCalled();
    });
  });

  describe("selectionCount", () => {
    it("includes primary selection in count", () => {
      const { result } = renderHook(() =>
        useSelectionMode(
          createDefaultOptions({
            selectedIndex: 0,
            batchSelection: new Set<number>(),
          })
        )
      );

      expect(result.current.selectionCount).toBe(1);
    });

    it("counts batch selections plus primary", () => {
      const { result } = renderHook(() =>
        useSelectionMode(
          createDefaultOptions({
            selectedIndex: 0,
            batchSelection: new Set([1, 2, 3]),
          })
        )
      );

      expect(result.current.selectionCount).toBe(4);
    });

    it("updates when batchSelection changes", () => {
      const { result, rerender } = renderHook(
        (props) => useSelectionMode(props),
        { initialProps: createDefaultOptions() }
      );

      expect(result.current.selectionCount).toBe(1);

      rerender(
        createDefaultOptions({
          batchSelection: new Set([1, 2]),
        })
      );

      expect(result.current.selectionCount).toBe(3);
    });
  });

  describe("hasMultipleSelected", () => {
    it("returns false when only primary is selected", () => {
      const { result } = renderHook(() =>
        useSelectionMode(
          createDefaultOptions({
            batchSelection: new Set<number>(),
          })
        )
      );

      expect(result.current.hasMultipleSelected).toBe(false);
    });

    it("returns true when batch has items", () => {
      const { result } = renderHook(() =>
        useSelectionMode(
          createDefaultOptions({
            batchSelection: new Set([1]),
          })
        )
      );

      expect(result.current.hasMultipleSelected).toBe(true);
    });
  });

  describe("selectedIndices", () => {
    it("combines primary and batch selections", () => {
      const { result } = renderHook(() =>
        useSelectionMode(
          createDefaultOptions({
            selectedIndex: 2,
            batchSelection: new Set([4, 6, 8]),
          })
        )
      );

      expect(result.current.selectedIndices.has(2)).toBe(true);
      expect(result.current.selectedIndices.has(4)).toBe(true);
      expect(result.current.selectedIndices.has(6)).toBe(true);
      expect(result.current.selectedIndices.has(8)).toBe(true);
      expect(result.current.selectedIndices.size).toBe(4);
    });

    it("does not duplicate when primary is also in batch", () => {
      const { result } = renderHook(() =>
        useSelectionMode(
          createDefaultOptions({
            selectedIndex: 2,
            batchSelection: new Set([2, 4, 6]),
          })
        )
      );

      expect(result.current.selectedIndices.size).toBe(3);
    });

    it("updates when selectedIndex changes", () => {
      const { result, rerender } = renderHook(
        (props) => useSelectionMode(props),
        {
          initialProps: createDefaultOptions({
            selectedIndex: 0,
            batchSelection: new Set([1]),
          }),
        }
      );

      expect(result.current.selectedIndices.has(0)).toBe(true);
      expect(result.current.selectedIndices.has(5)).toBe(false);

      rerender(
        createDefaultOptions({
          selectedIndex: 5,
          batchSelection: new Set([1]),
        })
      );

      expect(result.current.selectedIndices.has(0)).toBe(false);
      expect(result.current.selectedIndices.has(5)).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("handles itemCount of zero", () => {
      const onSelect = jest.fn();
      const { result } = renderHook(() =>
        useSelectionMode(
          createDefaultOptions({
            itemCount: 0,
            onSelect,
          })
        )
      );

      act(() => {
        result.current.selectAll();
      });

      expect(onSelect).not.toHaveBeenCalled();
    });

    it("handles itemCount of one", () => {
      const onSelect = jest.fn();
      const { result } = renderHook(() =>
        useSelectionMode(
          createDefaultOptions({
            itemCount: 1,
            selectedIndex: 0,
            onSelect,
          })
        )
      );

      act(() => {
        result.current.selectAll();
      });

      // Only item 0 exists and it's the primary, so nothing to select
      expect(onSelect).not.toHaveBeenCalled();
    });

    it("maintains selection mode state across prop changes", () => {
      const { result, rerender } = renderHook(
        (props) => useSelectionMode(props),
        { initialProps: createDefaultOptions() }
      );

      act(() => {
        result.current.enterSelectionMode();
      });

      expect(result.current.isSelectionMode).toBe(true);

      rerender(
        createDefaultOptions({
          selectedIndex: 5,
        })
      );

      expect(result.current.isSelectionMode).toBe(true);
    });
  });
});
