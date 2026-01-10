import { renderHook, act } from "@testing-library/react";
import { useUndoRedo, deepClone } from "@/hooks/character-editor/useUndoRedo";

describe("useUndoRedo", () => {
  describe("initialization", () => {
    it("initializes with the provided initial state", () => {
      const { result } = renderHook(() => useUndoRedo("initial"));

      expect(result.current.state).toBe("initial");
    });

    it("initializes with canUndo as false", () => {
      const { result } = renderHook(() => useUndoRedo("initial"));

      expect(result.current.canUndo).toBe(false);
    });

    it("initializes with canRedo as false", () => {
      const { result } = renderHook(() => useUndoRedo("initial"));

      expect(result.current.canRedo).toBe(false);
    });

    it("initializes historyIndex at 0", () => {
      const { result } = renderHook(() => useUndoRedo("initial"));

      expect(result.current.historyIndex).toBe(0);
    });

    it("initializes history with single entry", () => {
      const { result } = renderHook(() => useUndoRedo("initial"));

      expect(result.current.history).toHaveLength(1);
      expect(result.current.history[0].state).toBe("initial");
    });

    it("initializes totalHistoryEntries as 1", () => {
      const { result } = renderHook(() => useUndoRedo("initial"));

      expect(result.current.totalHistoryEntries).toBe(1);
    });

    it("works with complex object state", () => {
      const initialState = { count: 0, items: ["a", "b"] };
      const { result } = renderHook(() => useUndoRedo(initialState));

      expect(result.current.state).toEqual(initialState);
    });
  });

  describe("setState", () => {
    it("updates state correctly", () => {
      const { result } = renderHook(() => useUndoRedo("initial"));

      act(() => {
        result.current.setState("updated");
      });

      expect(result.current.state).toBe("updated");
    });

    it("adds entry to history", () => {
      const { result } = renderHook(() => useUndoRedo("initial"));

      act(() => {
        result.current.setState("second");
      });

      expect(result.current.history).toHaveLength(2);
      expect(result.current.totalHistoryEntries).toBe(2);
    });

    it("sets canUndo to true after first setState", () => {
      const { result } = renderHook(() => useUndoRedo("initial"));

      act(() => {
        result.current.setState("updated");
      });

      expect(result.current.canUndo).toBe(true);
    });

    it("updates historyIndex after setState", () => {
      const { result } = renderHook(() => useUndoRedo("initial"));

      act(() => {
        result.current.setState("second");
      });

      expect(result.current.historyIndex).toBe(1);
    });

    it("clears redo stack when new state is set", () => {
      const { result } = renderHook(() => useUndoRedo("initial"));

      act(() => {
        result.current.setState("second");
        result.current.setState("third");
      });

      act(() => {
        result.current.undo();
      });

      expect(result.current.canRedo).toBe(true);

      act(() => {
        result.current.setState("new-branch");
      });

      expect(result.current.canRedo).toBe(false);
    });

    it("preserves label in history entry", () => {
      const { result } = renderHook(() => useUndoRedo("initial"));

      act(() => {
        result.current.setState("updated", "Update operation");
      });

      expect(result.current.history[1].label).toBe("Update operation");
    });

    it("creates timestamp for each entry", () => {
      const { result } = renderHook(() => useUndoRedo("initial"));
      const beforeTimestamp = Date.now();

      act(() => {
        result.current.setState("updated");
      });

      const afterTimestamp = Date.now();
      const entryTimestamp = result.current.history[1].timestamp;

      expect(entryTimestamp).toBeGreaterThanOrEqual(beforeTimestamp);
      expect(entryTimestamp).toBeLessThanOrEqual(afterTimestamp);
    });
  });

  describe("undo", () => {
    it("reverts to previous state", () => {
      const { result } = renderHook(() => useUndoRedo("initial"));

      act(() => {
        result.current.setState("updated");
      });

      act(() => {
        result.current.undo();
      });

      expect(result.current.state).toBe("initial");
    });

    it("sets canRedo to true after undo", () => {
      const { result } = renderHook(() => useUndoRedo("initial"));

      act(() => {
        result.current.setState("updated");
      });

      act(() => {
        result.current.undo();
      });

      expect(result.current.canRedo).toBe(true);
    });

    it("sets canUndo to false when at initial state", () => {
      const { result } = renderHook(() => useUndoRedo("initial"));

      act(() => {
        result.current.setState("updated");
      });

      act(() => {
        result.current.undo();
      });

      expect(result.current.canUndo).toBe(false);
    });

    it("updates historyIndex on undo", () => {
      const { result } = renderHook(() => useUndoRedo("initial"));

      act(() => {
        result.current.setState("second");
        result.current.setState("third");
      });

      expect(result.current.historyIndex).toBe(2);

      act(() => {
        result.current.undo();
      });

      expect(result.current.historyIndex).toBe(1);
    });

    it("does nothing when canUndo is false", () => {
      const { result } = renderHook(() => useUndoRedo("initial"));

      act(() => {
        result.current.undo();
      });

      expect(result.current.state).toBe("initial");
      expect(result.current.historyIndex).toBe(0);
    });

    it("supports multiple consecutive undos", () => {
      const { result } = renderHook(() => useUndoRedo("first"));

      act(() => {
        result.current.setState("second");
        result.current.setState("third");
        result.current.setState("fourth");
      });

      act(() => {
        result.current.undo();
      });
      expect(result.current.state).toBe("third");

      act(() => {
        result.current.undo();
      });
      expect(result.current.state).toBe("second");

      act(() => {
        result.current.undo();
      });
      expect(result.current.state).toBe("first");
    });
  });

  describe("redo", () => {
    it("restores undone state", () => {
      const { result } = renderHook(() => useUndoRedo("initial"));

      act(() => {
        result.current.setState("updated");
      });

      act(() => {
        result.current.undo();
      });

      act(() => {
        result.current.redo();
      });

      expect(result.current.state).toBe("updated");
    });

    it("sets canUndo to true after redo", () => {
      const { result } = renderHook(() => useUndoRedo("initial"));

      act(() => {
        result.current.setState("updated");
      });

      act(() => {
        result.current.undo();
      });

      act(() => {
        result.current.redo();
      });

      expect(result.current.canUndo).toBe(true);
    });

    it("sets canRedo to false when at latest state", () => {
      const { result } = renderHook(() => useUndoRedo("initial"));

      act(() => {
        result.current.setState("updated");
      });

      act(() => {
        result.current.undo();
      });

      act(() => {
        result.current.redo();
      });

      expect(result.current.canRedo).toBe(false);
    });

    it("updates historyIndex on redo", () => {
      const { result } = renderHook(() => useUndoRedo("initial"));

      act(() => {
        result.current.setState("second");
      });

      act(() => {
        result.current.undo();
      });

      expect(result.current.historyIndex).toBe(0);

      act(() => {
        result.current.redo();
      });

      expect(result.current.historyIndex).toBe(1);
    });

    it("does nothing when canRedo is false", () => {
      const { result } = renderHook(() => useUndoRedo("initial"));

      act(() => {
        result.current.redo();
      });

      expect(result.current.state).toBe("initial");
    });

    it("supports multiple consecutive redos", () => {
      const { result } = renderHook(() => useUndoRedo("first"));

      act(() => {
        result.current.setState("second");
        result.current.setState("third");
        result.current.setState("fourth");
      });

      act(() => {
        result.current.undo();
        result.current.undo();
        result.current.undo();
      });

      expect(result.current.state).toBe("first");

      act(() => {
        result.current.redo();
      });
      expect(result.current.state).toBe("second");

      act(() => {
        result.current.redo();
      });
      expect(result.current.state).toBe("third");

      act(() => {
        result.current.redo();
      });
      expect(result.current.state).toBe("fourth");
    });
  });

  describe("canUndo and canRedo flags", () => {
    it("both are false initially", () => {
      const { result } = renderHook(() => useUndoRedo("initial"));

      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    });

    it("canUndo is true and canRedo is false after setState", () => {
      const { result } = renderHook(() => useUndoRedo("initial"));

      act(() => {
        result.current.setState("updated");
      });

      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);
    });

    it("both are true after partial undo", () => {
      const { result } = renderHook(() => useUndoRedo("initial"));

      act(() => {
        result.current.setState("second");
        result.current.setState("third");
      });

      act(() => {
        result.current.undo();
      });

      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(true);
    });

    it("canUndo is false and canRedo is true after full undo", () => {
      const { result } = renderHook(() => useUndoRedo("initial"));

      act(() => {
        result.current.setState("updated");
      });

      act(() => {
        result.current.undo();
      });

      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(true);
    });

    it("updates correctly through undo/redo cycles", () => {
      const { result } = renderHook(() => useUndoRedo("initial"));

      act(() => {
        result.current.setState("updated");
      });

      // Undo then redo
      act(() => {
        result.current.undo();
      });

      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(true);

      act(() => {
        result.current.redo();
      });

      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);
    });
  });

  describe("jumpToHistory", () => {
    it("jumps to specific history index", () => {
      const { result } = renderHook(() => useUndoRedo("first"));

      act(() => {
        result.current.setState("second");
        result.current.setState("third");
        result.current.setState("fourth");
      });

      act(() => {
        result.current.jumpToHistory(1);
      });

      expect(result.current.state).toBe("second");
      expect(result.current.historyIndex).toBe(1);
    });

    it("updates canUndo and canRedo correctly", () => {
      const { result } = renderHook(() => useUndoRedo("first"));

      act(() => {
        result.current.setState("second");
        result.current.setState("third");
        result.current.setState("fourth");
      });

      act(() => {
        result.current.jumpToHistory(1);
      });

      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(true);
    });

    it("clamps to valid range when index is too low", () => {
      const { result } = renderHook(() => useUndoRedo("first"));

      act(() => {
        result.current.setState("second");
      });

      act(() => {
        result.current.jumpToHistory(-5);
      });

      expect(result.current.state).toBe("first");
      expect(result.current.historyIndex).toBe(0);
    });

    it("clamps to valid range when index is too high", () => {
      const { result } = renderHook(() => useUndoRedo("first"));

      act(() => {
        result.current.setState("second");
        result.current.setState("third");
      });

      act(() => {
        result.current.jumpToHistory(100);
      });

      expect(result.current.state).toBe("third");
      expect(result.current.historyIndex).toBe(2);
    });

    it("does nothing when jumping to current index", () => {
      const { result } = renderHook(() => useUndoRedo("first"));

      act(() => {
        result.current.setState("second");
      });

      const historyBefore = result.current.history;

      act(() => {
        result.current.jumpToHistory(1);
      });

      expect(result.current.state).toBe("second");
      expect(result.current.history).toBe(historyBefore);
    });

    it("preserves history entries when jumping", () => {
      const { result } = renderHook(() => useUndoRedo("first"));

      act(() => {
        result.current.setState("second");
        result.current.setState("third");
        result.current.setState("fourth");
      });

      const originalHistory = result.current.history.map((h) => h.state);

      act(() => {
        result.current.jumpToHistory(1);
      });

      const currentHistory = result.current.history.map((h) => h.state);
      expect(currentHistory).toEqual(originalHistory);
    });

    it("allows jumping forward after jumping backward", () => {
      const { result } = renderHook(() => useUndoRedo("first"));

      act(() => {
        result.current.setState("second");
        result.current.setState("third");
      });

      act(() => {
        result.current.jumpToHistory(0);
      });

      expect(result.current.state).toBe("first");

      act(() => {
        result.current.jumpToHistory(2);
      });

      expect(result.current.state).toBe("third");
    });
  });

  describe("resetState", () => {
    it("resets state to new value", () => {
      const { result } = renderHook(() => useUndoRedo("initial"));

      act(() => {
        result.current.setState("modified");
      });

      act(() => {
        result.current.resetState("new-initial");
      });

      expect(result.current.state).toBe("new-initial");
    });

    it("clears all history", () => {
      const { result } = renderHook(() => useUndoRedo("initial"));

      act(() => {
        result.current.setState("second");
        result.current.setState("third");
      });

      act(() => {
        result.current.resetState("new-initial");
      });

      expect(result.current.history).toHaveLength(1);
      expect(result.current.totalHistoryEntries).toBe(1);
    });

    it("resets canUndo to false", () => {
      const { result } = renderHook(() => useUndoRedo("initial"));

      act(() => {
        result.current.setState("modified");
      });

      expect(result.current.canUndo).toBe(true);

      act(() => {
        result.current.resetState("new-initial");
      });

      expect(result.current.canUndo).toBe(false);
    });

    it("resets canRedo to false", () => {
      const { result } = renderHook(() => useUndoRedo("initial"));

      act(() => {
        result.current.setState("modified");
      });

      act(() => {
        result.current.undo();
      });

      expect(result.current.canRedo).toBe(true);

      act(() => {
        result.current.resetState("new-initial");
      });

      expect(result.current.canRedo).toBe(false);
    });

    it("resets historyIndex to 0", () => {
      const { result } = renderHook(() => useUndoRedo("initial"));

      act(() => {
        result.current.setState("second");
        result.current.setState("third");
      });

      expect(result.current.historyIndex).toBe(2);

      act(() => {
        result.current.resetState("new-initial");
      });

      expect(result.current.historyIndex).toBe(0);
    });
  });

  describe("clearHistory", () => {
    it("clears past history while keeping current state", () => {
      const { result } = renderHook(() => useUndoRedo("initial"));

      act(() => {
        result.current.setState("second");
        result.current.setState("third");
      });

      act(() => {
        result.current.clearHistory();
      });

      expect(result.current.state).toBe("third");
      expect(result.current.canUndo).toBe(false);
    });

    it("clears future history while keeping current state", () => {
      const { result } = renderHook(() => useUndoRedo("initial"));

      act(() => {
        result.current.setState("second");
        result.current.setState("third");
      });

      act(() => {
        result.current.undo();
      });

      expect(result.current.canRedo).toBe(true);

      act(() => {
        result.current.clearHistory();
      });

      expect(result.current.state).toBe("second");
      expect(result.current.canRedo).toBe(false);
    });

    it("results in single entry in history", () => {
      const { result } = renderHook(() => useUndoRedo("initial"));

      act(() => {
        result.current.setState("second");
        result.current.setState("third");
      });

      act(() => {
        result.current.clearHistory();
      });

      expect(result.current.history).toHaveLength(1);
      expect(result.current.totalHistoryEntries).toBe(1);
    });
  });

  describe("batching with startBatch and endBatch", () => {
    it("creates single history entry for multiple setState calls", () => {
      const { result } = renderHook(() => useUndoRedo(0));

      act(() => {
        result.current.startBatch();
        result.current.setState(1);
        result.current.setState(2);
        result.current.setState(3);
        result.current.endBatch("Batch operation");
      });

      expect(result.current.state).toBe(3);
      expect(result.current.history).toHaveLength(2); // initial + batch
    });

    it("allows undo to revert entire batch", () => {
      const { result } = renderHook(() => useUndoRedo(0));

      act(() => {
        result.current.startBatch();
        result.current.setState(1);
        result.current.setState(2);
        result.current.setState(3);
        result.current.endBatch();
      });

      act(() => {
        result.current.undo();
      });

      expect(result.current.state).toBe(0);
    });

    it("preserves batch label in history", () => {
      const { result } = renderHook(() => useUndoRedo(0));

      act(() => {
        result.current.startBatch();
        result.current.setState(1);
        result.current.setState(2);
        result.current.endBatch("Increment twice");
      });

      const lastEntry = result.current.history[result.current.history.length - 1];
      expect(lastEntry.label).toBe("Increment twice");
    });

    it("does not create history entry if state unchanged during batch", () => {
      const { result } = renderHook(() => useUndoRedo({ value: 0 }));

      const historyLengthBefore = result.current.history.length;

      act(() => {
        result.current.startBatch();
        // Set to same value (no actual change)
        result.current.setState({ value: 0 });
        result.current.endBatch();
      });

      expect(result.current.history.length).toBe(historyLengthBefore);
    });

    it("handles nested batch calls gracefully", () => {
      const { result } = renderHook(() => useUndoRedo(0));

      act(() => {
        result.current.startBatch();
        result.current.setState(1);
        result.current.startBatch(); // Should be ignored
        result.current.setState(2);
        result.current.endBatch();
      });

      expect(result.current.state).toBe(2);
      expect(result.current.history).toHaveLength(2);
    });

    it("handles endBatch without startBatch gracefully", () => {
      const { result } = renderHook(() => useUndoRedo(0));

      const historyLengthBefore = result.current.history.length;

      act(() => {
        result.current.endBatch();
      });

      expect(result.current.history.length).toBe(historyLengthBefore);
    });

    it("clears future on batch end", () => {
      const { result } = renderHook(() => useUndoRedo(0));

      act(() => {
        result.current.setState(1);
        result.current.setState(2);
      });

      act(() => {
        result.current.undo();
      });

      expect(result.current.canRedo).toBe(true);

      act(() => {
        result.current.startBatch();
        result.current.setState(5);
        result.current.endBatch();
      });

      expect(result.current.canRedo).toBe(false);
    });
  });

  describe("maxHistory limit", () => {
    it("enforces maximum history length", () => {
      const { result } = renderHook(() => useUndoRedo(0, 3));

      act(() => {
        result.current.setState(1);
        result.current.setState(2);
        result.current.setState(3);
        result.current.setState(4);
        result.current.setState(5);
      });

      // Should have max 3 past entries + present
      expect(result.current.history.length).toBeLessThanOrEqual(4);
    });

    it("removes oldest entries when limit exceeded", () => {
      const { result } = renderHook(() => useUndoRedo("a", 2));

      act(() => {
        result.current.setState("b");
        result.current.setState("c");
        result.current.setState("d");
      });

      // Can only undo to "b" (not "a") because max past is 2
      act(() => {
        result.current.undo();
      });
      expect(result.current.state).toBe("c");

      act(() => {
        result.current.undo();
      });
      expect(result.current.state).toBe("b");

      // Cannot undo further
      expect(result.current.canUndo).toBe(false);
    });

    it("respects limit during batch operations", () => {
      const { result } = renderHook(() => useUndoRedo(0, 2));

      act(() => {
        result.current.setState(1);
        result.current.setState(2);
        result.current.setState(3);
      });

      act(() => {
        result.current.startBatch();
        result.current.setState(10);
        result.current.setState(20);
        result.current.setState(30);
        result.current.endBatch();
      });

      // History should still respect the limit
      act(() => {
        result.current.undo();
        result.current.undo();
      });

      expect(result.current.canUndo).toBe(false);
    });

    it("allows unlimited history when maxHistory is Infinity", () => {
      const { result } = renderHook(() => useUndoRedo(0));

      act(() => {
        for (let i = 1; i <= 100; i++) {
          result.current.setState(i);
        }
      });

      expect(result.current.history.length).toBe(101); // 0 + 100 states
    });
  });

  describe("state immutability", () => {
    it("maintains separate state objects in history", () => {
      const { result } = renderHook(() => useUndoRedo({ count: 0 }));

      act(() => {
        result.current.setState({ count: 1 });
      });

      // Verify states are different objects
      expect(result.current.history[0].state).not.toBe(
        result.current.history[1].state
      );
    });

    it("undone state is not same reference as current", () => {
      const { result } = renderHook(() => useUndoRedo({ count: 0 }));

      act(() => {
        result.current.setState({ count: 1 });
      });

      const stateBeforeUndo = result.current.state;

      act(() => {
        result.current.undo();
      });

      expect(result.current.state).not.toBe(stateBeforeUndo);
    });

    it("redo state is not same reference as current", () => {
      const { result } = renderHook(() => useUndoRedo({ count: 0 }));

      act(() => {
        result.current.setState({ count: 1 });
      });

      act(() => {
        result.current.undo();
      });

      const stateBeforeRedo = result.current.state;

      act(() => {
        result.current.redo();
      });

      expect(result.current.state).not.toBe(stateBeforeRedo);
    });
  });

  describe("historyLength", () => {
    it("returns 0 initially (no past or future)", () => {
      const { result } = renderHook(() => useUndoRedo("initial"));

      expect(result.current.historyLength).toBe(0);
    });

    it("increases with setState", () => {
      const { result } = renderHook(() => useUndoRedo("initial"));

      act(() => {
        result.current.setState("second");
      });

      expect(result.current.historyLength).toBe(1);

      act(() => {
        result.current.setState("third");
      });

      expect(result.current.historyLength).toBe(2);
    });

    it("includes both past and future", () => {
      const { result } = renderHook(() => useUndoRedo("initial"));

      act(() => {
        result.current.setState("second");
        result.current.setState("third");
      });

      act(() => {
        result.current.undo();
      });

      // 1 past + 1 future = 2
      expect(result.current.historyLength).toBe(2);
    });
  });

  describe("complex state types", () => {
    it("handles arrays correctly", () => {
      const { result } = renderHook(() => useUndoRedo<number[]>([]));

      act(() => {
        result.current.setState([1, 2, 3]);
      });

      expect(result.current.state).toEqual([1, 2, 3]);

      act(() => {
        result.current.undo();
      });

      expect(result.current.state).toEqual([]);
    });

    it("handles nested objects correctly", () => {
      const { result } = renderHook(() =>
        useUndoRedo({
          user: { name: "Alice", age: 30 },
          settings: { theme: "dark" },
        })
      );

      act(() => {
        result.current.setState({
          user: { name: "Bob", age: 25 },
          settings: { theme: "light" },
        });
      });

      expect(result.current.state.user.name).toBe("Bob");

      act(() => {
        result.current.undo();
      });

      expect(result.current.state.user.name).toBe("Alice");
    });

    it("handles null state", () => {
      const { result } = renderHook(() => useUndoRedo<string | null>("initial"));

      act(() => {
        result.current.setState(null);
      });

      expect(result.current.state).toBeNull();

      act(() => {
        result.current.undo();
      });

      expect(result.current.state).toBe("initial");
    });
  });

  describe("rapid operations", () => {
    it("handles rapid undo/redo cycles", () => {
      const { result } = renderHook(() => useUndoRedo(0));

      act(() => {
        result.current.setState(1);
        result.current.setState(2);
        result.current.setState(3);
      });

      act(() => {
        result.current.undo();
        result.current.redo();
        result.current.undo();
        result.current.undo();
        result.current.redo();
      });

      expect(result.current.state).toBe(2);
    });

    it("handles many setState calls", () => {
      const { result } = renderHook(() => useUndoRedo(0));

      act(() => {
        for (let i = 1; i <= 50; i++) {
          result.current.setState(i);
        }
      });

      expect(result.current.state).toBe(50);
      expect(result.current.canUndo).toBe(true);

      act(() => {
        for (let i = 0; i < 50; i++) {
          result.current.undo();
        }
      });

      expect(result.current.state).toBe(0);
      expect(result.current.canUndo).toBe(false);
    });
  });
});

describe("deepClone", () => {
  it("clones primitive values", () => {
    expect(deepClone(42)).toBe(42);
    expect(deepClone("hello")).toBe("hello");
    expect(deepClone(true)).toBe(true);
    expect(deepClone(null)).toBeNull();
  });

  it("clones arrays", () => {
    const original = [1, 2, 3];
    const cloned = deepClone(original);

    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
  });

  it("clones nested arrays", () => {
    const original = [[1, 2], [3, 4]];
    const cloned = deepClone(original);

    expect(cloned).toEqual(original);
    expect(cloned[0]).not.toBe(original[0]);
  });

  it("clones objects", () => {
    const original = { a: 1, b: 2 };
    const cloned = deepClone(original);

    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
  });

  it("clones nested objects", () => {
    const original = {
      outer: {
        inner: {
          value: "deep",
        },
      },
    };
    const cloned = deepClone(original);

    expect(cloned).toEqual(original);
    expect(cloned.outer).not.toBe(original.outer);
    expect(cloned.outer.inner).not.toBe(original.outer.inner);
  });

  it("clones mixed arrays and objects", () => {
    const original = {
      items: [{ id: 1 }, { id: 2 }],
      metadata: { count: 2 },
    };
    const cloned = deepClone(original);

    expect(cloned).toEqual(original);
    expect(cloned.items).not.toBe(original.items);
    expect(cloned.items[0]).not.toBe(original.items[0]);
    expect(cloned.metadata).not.toBe(original.metadata);
  });

  it("handles empty objects", () => {
    expect(deepClone({})).toEqual({});
  });

  it("handles empty arrays", () => {
    expect(deepClone([])).toEqual([]);
  });
});
