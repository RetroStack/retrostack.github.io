import { renderHook, act } from "@testing-library/react";
import {
  useChangeLog,
  getOperationDisplayName,
  getOperationColor,
  getOperationIcon,
  type ChangeOperationType,
} from "@/hooks/character-editor/useChangeLog";

describe("useChangeLog", () => {
  describe("log()", () => {
    it("creates entry with unique ID", () => {
      const { result } = renderHook(() => useChangeLog());

      act(() => {
        result.current.log("edit", "Modified character");
      });

      expect(result.current.entries).toHaveLength(1);
      expect(result.current.entries[0].id).toBeDefined();
      expect(result.current.entries[0].id).toMatch(/^\d+-[a-z0-9]+-\d+$/);
    });

    it("creates entries with unique IDs for multiple logs", () => {
      const { result } = renderHook(() => useChangeLog());

      act(() => {
        result.current.log("edit", "First change");
        result.current.log("add", "Second change");
        result.current.log("delete", "Third change");
      });

      const ids = result.current.entries.map((e) => e.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(3);
    });

    it("stores entry with correct type and description", () => {
      const { result } = renderHook(() => useChangeLog());

      act(() => {
        result.current.log("transform", "Rotated 90 degrees");
      });

      expect(result.current.entries[0].type).toBe("transform");
      expect(result.current.entries[0].description).toBe("Rotated 90 degrees");
    });

    it("stores timestamp on entry", () => {
      const { result } = renderHook(() => useChangeLog());
      const beforeTime = Date.now();

      act(() => {
        result.current.log("edit", "Character edit");
      });

      const afterTime = Date.now();
      expect(result.current.entries[0].timestamp).toBeGreaterThanOrEqual(
        beforeTime
      );
      expect(result.current.entries[0].timestamp).toBeLessThanOrEqual(
        afterTime
      );
    });
  });

  describe("entry ordering", () => {
    it("stores entries in reverse chronological order (newest first)", () => {
      const { result } = renderHook(() => useChangeLog());

      act(() => {
        result.current.log("edit", "First operation");
      });

      act(() => {
        result.current.log("add", "Second operation");
      });

      act(() => {
        result.current.log("delete", "Third operation");
      });

      expect(result.current.entries[0].description).toBe("Third operation");
      expect(result.current.entries[1].description).toBe("Second operation");
      expect(result.current.entries[2].description).toBe("First operation");
    });
  });

  describe("maxEntries limit", () => {
    it("enforces maxEntries limit", () => {
      const { result } = renderHook(() => useChangeLog({ maxEntries: 3 }));

      act(() => {
        result.current.log("edit", "Entry 1");
        result.current.log("edit", "Entry 2");
        result.current.log("edit", "Entry 3");
        result.current.log("edit", "Entry 4");
        result.current.log("edit", "Entry 5");
      });

      expect(result.current.entries).toHaveLength(3);
    });

    it("removes oldest entries when limit exceeded", () => {
      const { result } = renderHook(() => useChangeLog({ maxEntries: 2 }));

      act(() => {
        result.current.log("edit", "Entry 1");
        result.current.log("edit", "Entry 2");
        result.current.log("edit", "Entry 3");
      });

      expect(result.current.entries).toHaveLength(2);
      expect(result.current.entries[0].description).toBe("Entry 3");
      expect(result.current.entries[1].description).toBe("Entry 2");
    });

    it("uses default maxEntries of 100", () => {
      const { result } = renderHook(() => useChangeLog());

      act(() => {
        for (let i = 0; i < 105; i++) {
          result.current.log("edit", `Entry ${i}`);
        }
      });

      expect(result.current.entries).toHaveLength(100);
    });
  });

  describe("clear()", () => {
    it("removes all entries", () => {
      const { result } = renderHook(() => useChangeLog());

      act(() => {
        result.current.log("edit", "Entry 1");
        result.current.log("add", "Entry 2");
        result.current.log("delete", "Entry 3");
      });

      expect(result.current.entries).toHaveLength(3);

      act(() => {
        result.current.clear();
      });

      expect(result.current.entries).toHaveLength(0);
    });

    it("allows logging new entries after clearing", () => {
      const { result } = renderHook(() => useChangeLog());

      act(() => {
        result.current.log("edit", "Old entry");
        result.current.clear();
        result.current.log("add", "New entry");
      });

      expect(result.current.entries).toHaveLength(1);
      expect(result.current.entries[0].description).toBe("New entry");
    });
  });

  describe("exportAsText()", () => {
    it("returns message when no entries exist", () => {
      const { result } = renderHook(() => useChangeLog());

      const text = result.current.exportAsText();

      expect(text).toBe("No changes logged.");
    });

    it("formats export with header information", () => {
      const { result } = renderHook(() => useChangeLog());

      act(() => {
        result.current.log("edit", "Test operation");
      });

      const text = result.current.exportAsText();

      expect(text).toContain("Character ROM Editor - Change Log");
      expect(text).toContain("Exported:");
      expect(text).toContain("Total entries: 1");
    });

    it("includes operation type in uppercase", () => {
      const { result } = renderHook(() => useChangeLog());

      act(() => {
        result.current.log("transform", "Rotated character");
      });

      const text = result.current.exportAsText();

      expect(text).toContain("TRANSFORM");
      expect(text).toContain("Rotated character");
    });

    it("includes affected indices when present", () => {
      const { result } = renderHook(() => useChangeLog());

      act(() => {
        result.current.log("edit", "Modified characters", [0, 1, 2]);
      });

      const text = result.current.exportAsText();

      expect(text).toContain("Affected: #0, #1, #2");
    });

    it("truncates affected indices list when more than 5", () => {
      const { result } = renderHook(() => useChangeLog());

      act(() => {
        result.current.log("batch", "Batch operation", [0, 1, 2, 3, 4, 5, 6, 7]);
      });

      const text = result.current.exportAsText();

      expect(text).toContain("Affected: #0, #1, #2, #3, #4 +3 more");
    });

    it("includes details when present", () => {
      const { result } = renderHook(() => useChangeLog());

      act(() => {
        result.current.log(
          "import",
          "Imported character set",
          [],
          "From file: charset.bin"
        );
      });

      const text = result.current.exportAsText();

      expect(text).toContain("Details: From file: charset.bin");
    });

    it("exports entries in chronological order (oldest first)", () => {
      const { result } = renderHook(() => useChangeLog());

      act(() => {
        result.current.log("edit", "First change");
      });

      act(() => {
        result.current.log("add", "Second change");
      });

      const text = result.current.exportAsText();
      const firstIndex = text.indexOf("First change");
      const secondIndex = text.indexOf("Second change");

      expect(firstIndex).toBeLessThan(secondIndex);
    });
  });

  describe("getEntry()", () => {
    it("retrieves entry by ID", () => {
      const { result } = renderHook(() => useChangeLog());

      act(() => {
        result.current.log("edit", "Test operation");
      });

      const entryId = result.current.entries[0].id;
      const retrieved = result.current.getEntry(entryId);

      expect(retrieved).toBeDefined();
      expect(retrieved?.description).toBe("Test operation");
      expect(retrieved?.type).toBe("edit");
    });

    it("returns undefined for non-existent ID", () => {
      const { result } = renderHook(() => useChangeLog());

      act(() => {
        result.current.log("edit", "Test operation");
      });

      const retrieved = result.current.getEntry("non-existent-id");

      expect(retrieved).toBeUndefined();
    });

    it("returns undefined when entries are empty", () => {
      const { result } = renderHook(() => useChangeLog());

      const retrieved = result.current.getEntry("any-id");

      expect(retrieved).toBeUndefined();
    });
  });

  describe("count property", () => {
    it("returns 0 for empty log", () => {
      const { result } = renderHook(() => useChangeLog());

      expect(result.current.count).toBe(0);
    });

    it("returns accurate count after logging", () => {
      const { result } = renderHook(() => useChangeLog());

      act(() => {
        result.current.log("edit", "Entry 1");
        result.current.log("add", "Entry 2");
        result.current.log("delete", "Entry 3");
      });

      expect(result.current.count).toBe(3);
    });

    it("updates count after clearing", () => {
      const { result } = renderHook(() => useChangeLog());

      act(() => {
        result.current.log("edit", "Entry 1");
        result.current.log("add", "Entry 2");
      });

      expect(result.current.count).toBe(2);

      act(() => {
        result.current.clear();
      });

      expect(result.current.count).toBe(0);
    });

    it("reflects maxEntries enforcement", () => {
      const { result } = renderHook(() => useChangeLog({ maxEntries: 2 }));

      act(() => {
        result.current.log("edit", "Entry 1");
        result.current.log("edit", "Entry 2");
        result.current.log("edit", "Entry 3");
      });

      expect(result.current.count).toBe(2);
    });
  });

  describe("enabled flag", () => {
    it("logs entries when enabled is true (default)", () => {
      const { result } = renderHook(() => useChangeLog({ enabled: true }));

      act(() => {
        result.current.log("edit", "Test operation");
      });

      expect(result.current.entries).toHaveLength(1);
    });

    it("prevents logging when enabled is false", () => {
      const { result } = renderHook(() => useChangeLog({ enabled: false }));

      act(() => {
        result.current.log("edit", "Test operation");
      });

      expect(result.current.entries).toHaveLength(0);
    });

    it("still allows clear when disabled", () => {
      const { result } = renderHook(() => useChangeLog({ enabled: true }));

      act(() => {
        result.current.log("edit", "Test operation");
      });

      // Simulate re-render with disabled
      const { result: disabledResult } = renderHook(() =>
        useChangeLog({ enabled: false })
      );

      // The clear function should still work
      act(() => {
        disabledResult.current.clear();
      });

      expect(disabledResult.current.entries).toHaveLength(0);
    });
  });

  describe("affectedIndices tracking", () => {
    it("stores empty array when no indices provided", () => {
      const { result } = renderHook(() => useChangeLog());

      act(() => {
        result.current.log("edit", "No indices");
      });

      expect(result.current.entries[0].affectedIndices).toEqual([]);
    });

    it("stores provided indices correctly", () => {
      const { result } = renderHook(() => useChangeLog());

      act(() => {
        result.current.log("batch", "Batch edit", [5, 10, 15, 20]);
      });

      expect(result.current.entries[0].affectedIndices).toEqual([5, 10, 15, 20]);
    });

    it("stores single index correctly", () => {
      const { result } = renderHook(() => useChangeLog());

      act(() => {
        result.current.log("edit", "Single character edit", [42]);
      });

      expect(result.current.entries[0].affectedIndices).toEqual([42]);
    });

    it("stores large array of indices", () => {
      const { result } = renderHook(() => useChangeLog());
      const manyIndices = Array.from({ length: 256 }, (_, i) => i);

      act(() => {
        result.current.log("batch", "Full set operation", manyIndices);
      });

      expect(result.current.entries[0].affectedIndices).toHaveLength(256);
      expect(result.current.entries[0].affectedIndices[0]).toBe(0);
      expect(result.current.entries[0].affectedIndices[255]).toBe(255);
    });
  });

  describe("details field", () => {
    it("stores undefined when no details provided", () => {
      const { result } = renderHook(() => useChangeLog());

      act(() => {
        result.current.log("edit", "No details");
      });

      expect(result.current.entries[0].details).toBeUndefined();
    });

    it("stores provided details string", () => {
      const { result } = renderHook(() => useChangeLog());

      act(() => {
        result.current.log(
          "import",
          "Imported from file",
          [],
          "filename.bin, 2048 bytes"
        );
      });

      expect(result.current.entries[0].details).toBe(
        "filename.bin, 2048 bytes"
      );
    });
  });
});

describe("getOperationDisplayName", () => {
  it("returns display name for all operation types", () => {
    const operations: ChangeOperationType[] = [
      "edit",
      "add",
      "delete",
      "transform",
      "resize",
      "import",
      "restore",
      "copy",
      "reorder",
      "batch",
    ];

    const expectedNames: Record<ChangeOperationType, string> = {
      edit: "Edit",
      add: "Add",
      delete: "Delete",
      transform: "Transform",
      resize: "Resize",
      import: "Import",
      restore: "Restore",
      copy: "Copy",
      reorder: "Reorder",
      batch: "Batch",
    };

    for (const op of operations) {
      expect(getOperationDisplayName(op)).toBe(expectedNames[op]);
    }
  });
});

describe("getOperationColor", () => {
  it("returns color class for all operation types", () => {
    const operations: ChangeOperationType[] = [
      "edit",
      "add",
      "delete",
      "transform",
      "resize",
      "import",
      "restore",
      "copy",
      "reorder",
      "batch",
    ];

    for (const op of operations) {
      const color = getOperationColor(op);
      expect(color).toMatch(/^text-/);
    }
  });

  it("returns expected colors for specific operations", () => {
    expect(getOperationColor("edit")).toBe("text-retro-cyan");
    expect(getOperationColor("add")).toBe("text-green-400");
    expect(getOperationColor("delete")).toBe("text-red-400");
    expect(getOperationColor("transform")).toBe("text-retro-pink");
  });
});

describe("getOperationIcon", () => {
  it("returns SVG path for all operation types", () => {
    const operations: ChangeOperationType[] = [
      "edit",
      "add",
      "delete",
      "transform",
      "resize",
      "import",
      "restore",
      "copy",
      "reorder",
      "batch",
    ];

    for (const op of operations) {
      const icon = getOperationIcon(op);
      expect(icon).toBeDefined();
      expect(typeof icon).toBe("string");
      expect(icon.length).toBeGreaterThan(0);
    }
  });
});
