/**
 * Character ROM Editor - In-Memory Storage Tests
 *
 * Tests for in-memory storage implementations that provide test-friendly
 * alternatives to browser storage APIs.
 */

import {
  InMemoryKeyValueStorage,
  InMemoryCharacterSetStorage,
  InMemorySnapshotStorage,
  InMemoryAutoSaveStorage,
  createMockKeyValueStorage,
  createMockCharacterSetStorage,
  createMockSnapshotStorage,
  createMockAutoSaveStorage,
} from "@/lib/character-editor/storage/memoryStorage";
import {
  createMockSerializedCharacterSet,
  createMockSnapshot,
} from "@/lib/character-editor/__tests__/testUtils";
import type { AutoSaveData } from "@/lib/character-editor/storage/interfaces";

// ============================================================================
// InMemoryKeyValueStorage Tests
// ============================================================================

describe("InMemoryKeyValueStorage", () => {
  let storage: InMemoryKeyValueStorage;

  beforeEach(() => {
    storage = new InMemoryKeyValueStorage();
  });

  describe("getItem", () => {
    it("returns null for missing keys", () => {
      expect(storage.getItem("nonexistent")).toBeNull();
    });

    it("returns null for keys that were never set", () => {
      expect(storage.getItem("unknown-key")).toBeNull();
      expect(storage.getItem("")).toBeNull();
    });

    it("returns the stored value for existing keys", () => {
      storage.setItem("test-key", "test-value");
      expect(storage.getItem("test-key")).toBe("test-value");
    });
  });

  describe("setItem", () => {
    it("stores a value by key", () => {
      storage.setItem("my-key", "my-value");
      expect(storage.getItem("my-key")).toBe("my-value");
    });

    it("overwrites existing values", () => {
      storage.setItem("key", "original");
      storage.setItem("key", "updated");
      expect(storage.getItem("key")).toBe("updated");
    });

    it("stores empty strings", () => {
      storage.setItem("empty", "");
      expect(storage.getItem("empty")).toBe("");
    });

    it("stores complex JSON strings", () => {
      const json = JSON.stringify({ nested: { data: [1, 2, 3] } });
      storage.setItem("json-data", json);
      expect(storage.getItem("json-data")).toBe(json);
    });

    it("handles keys with special characters", () => {
      storage.setItem("key-with-special!@#$%", "value");
      expect(storage.getItem("key-with-special!@#$%")).toBe("value");
    });
  });

  describe("removeItem", () => {
    it("removes an existing value", () => {
      storage.setItem("to-remove", "value");
      expect(storage.getItem("to-remove")).toBe("value");

      storage.removeItem("to-remove");
      expect(storage.getItem("to-remove")).toBeNull();
    });

    it("does nothing when removing a nonexistent key", () => {
      expect(() => storage.removeItem("never-existed")).not.toThrow();
      expect(storage.getItem("never-existed")).toBeNull();
    });

    it("only removes the specified key", () => {
      storage.setItem("keep", "value-1");
      storage.setItem("remove", "value-2");

      storage.removeItem("remove");

      expect(storage.getItem("keep")).toBe("value-1");
      expect(storage.getItem("remove")).toBeNull();
    });
  });

  describe("clear", () => {
    it("removes all stored values", () => {
      storage.setItem("key-1", "value-1");
      storage.setItem("key-2", "value-2");
      storage.setItem("key-3", "value-3");

      storage.clear();

      expect(storage.getItem("key-1")).toBeNull();
      expect(storage.getItem("key-2")).toBeNull();
      expect(storage.getItem("key-3")).toBeNull();
    });

    it("resets the size to zero", () => {
      storage.setItem("key", "value");
      expect(storage.size).toBe(1);

      storage.clear();
      expect(storage.size).toBe(0);
    });

    it("works on empty storage", () => {
      expect(() => storage.clear()).not.toThrow();
      expect(storage.size).toBe(0);
    });
  });

  describe("keys", () => {
    it("returns empty array for empty storage", () => {
      expect(storage.keys()).toEqual([]);
    });

    it("returns all stored keys", () => {
      storage.setItem("alpha", "1");
      storage.setItem("beta", "2");
      storage.setItem("gamma", "3");

      const keys = storage.keys();
      expect(keys).toHaveLength(3);
      expect(keys).toContain("alpha");
      expect(keys).toContain("beta");
      expect(keys).toContain("gamma");
    });
  });

  describe("size", () => {
    it("returns 0 for empty storage", () => {
      expect(storage.size).toBe(0);
    });

    it("reflects the number of stored items", () => {
      storage.setItem("a", "1");
      expect(storage.size).toBe(1);

      storage.setItem("b", "2");
      expect(storage.size).toBe(2);

      storage.removeItem("a");
      expect(storage.size).toBe(1);
    });
  });
});

// ============================================================================
// InMemoryCharacterSetStorage Tests
// ============================================================================

describe("InMemoryCharacterSetStorage", () => {
  let storage: InMemoryCharacterSetStorage;

  beforeEach(() => {
    storage = new InMemoryCharacterSetStorage();
  });

  describe("initialize", () => {
    it("marks storage as initialized", async () => {
      expect(storage.isInitialized).toBe(false);
      await storage.initialize();
      expect(storage.isInitialized).toBe(true);
    });

    it("can be called multiple times safely", async () => {
      await storage.initialize();
      await storage.initialize();
      expect(storage.isInitialized).toBe(true);
    });
  });

  describe("getAll", () => {
    it("returns empty array when no sets are stored", async () => {
      const result = await storage.getAll();
      expect(result).toEqual([]);
    });

    it("returns all stored character sets", async () => {
      const set1 = createMockSerializedCharacterSet({ metadata: { name: "Set 1" } });
      const set2 = createMockSerializedCharacterSet({ metadata: { name: "Set 2" } });

      await storage.save(set1);
      await storage.save(set2);

      const result = await storage.getAll();
      expect(result).toHaveLength(2);
    });

    it("sorts pinned items first", async () => {
      const unpinned = createMockSerializedCharacterSet({
        metadata: { name: "Unpinned", isPinned: false, updatedAt: Date.now() },
      });
      const pinned = createMockSerializedCharacterSet({
        metadata: { name: "Pinned", isPinned: true, updatedAt: Date.now() - 1000 },
      });

      await storage.save(unpinned);
      await storage.save(pinned);

      const result = await storage.getAll();
      expect(result[0].metadata.name).toBe("Pinned");
      expect(result[1].metadata.name).toBe("Unpinned");
    });

    it("sorts by updatedAt within pinned/unpinned groups", async () => {
      const older = createMockSerializedCharacterSet({
        metadata: { name: "Older", isPinned: false, updatedAt: 1000 },
      });
      const newer = createMockSerializedCharacterSet({
        metadata: { name: "Newer", isPinned: false, updatedAt: 2000 },
      });

      await storage.save(older);
      await storage.save(newer);

      const result = await storage.getAll();
      expect(result[0].metadata.name).toBe("Newer");
      expect(result[1].metadata.name).toBe("Older");
    });
  });

  describe("getById", () => {
    it("returns null for nonexistent ID", async () => {
      const result = await storage.getById("nonexistent-id");
      expect(result).toBeNull();
    });

    it("returns the character set with matching ID", async () => {
      const set = createMockSerializedCharacterSet({ metadata: { name: "Target Set" } });
      await storage.save(set);

      const result = await storage.getById(set.metadata.id);
      expect(result).not.toBeNull();
      expect(result?.metadata.name).toBe("Target Set");
    });

    it("returns exact match only", async () => {
      const set = createMockSerializedCharacterSet({ metadata: { id: "exact-id" } });
      await storage.save(set);

      expect(await storage.getById("exact-id")).not.toBeNull();
      expect(await storage.getById("exact")).toBeNull();
      expect(await storage.getById("exact-id-suffix")).toBeNull();
    });
  });

  describe("save", () => {
    it("saves a new character set and returns its ID", async () => {
      const set = createMockSerializedCharacterSet({ metadata: { name: "New Set" } });
      const id = await storage.save(set);

      expect(id).toBe(set.metadata.id);
      expect(await storage.count()).toBe(1);
    });

    it("updates an existing character set with the same ID", async () => {
      const original = createMockSerializedCharacterSet({ metadata: { name: "Original" } });
      await storage.save(original);

      const updated = {
        ...original,
        metadata: { ...original.metadata, name: "Updated" },
      };
      await storage.save(updated);

      expect(await storage.count()).toBe(1);
      const result = await storage.getById(original.metadata.id);
      expect(result?.metadata.name).toBe("Updated");
    });
  });

  describe("saveAs", () => {
    it("creates a new character set with a new ID and name", async () => {
      const original = createMockSerializedCharacterSet({ metadata: { name: "Original" } });
      await storage.save(original);

      const newId = await storage.saveAs(original, "Copy of Original");

      expect(newId).not.toBe(original.metadata.id);
      expect(await storage.count()).toBe(2);

      const newSet = await storage.getById(newId);
      expect(newSet?.metadata.name).toBe("Copy of Original");
    });

    it("sets isBuiltIn to false for the new set", async () => {
      const builtIn = createMockSerializedCharacterSet({
        metadata: { name: "Built-in", isBuiltIn: true },
      });
      await storage.save(builtIn);

      const newId = await storage.saveAs(builtIn, "User Copy");
      const newSet = await storage.getById(newId);

      expect(newSet?.metadata.isBuiltIn).toBe(false);
    });

    it("sets source to yourself for the new set", async () => {
      const original = createMockSerializedCharacterSet({
        metadata: { source: "external" },
      });
      await storage.save(original);

      const newId = await storage.saveAs(original, "My Version");
      const newSet = await storage.getById(newId);

      expect(newSet?.metadata.source).toBe("yourself");
    });

    it("updates createdAt and updatedAt timestamps", async () => {
      const oldTime = Date.now() - 100000;
      const original = createMockSerializedCharacterSet({
        metadata: { createdAt: oldTime, updatedAt: oldTime },
      });
      await storage.save(original);

      const beforeSave = Date.now();
      const newId = await storage.saveAs(original, "New Copy");
      const newSet = await storage.getById(newId);

      expect(newSet?.metadata.createdAt).toBeGreaterThanOrEqual(beforeSave);
      expect(newSet?.metadata.updatedAt).toBeGreaterThanOrEqual(beforeSave);
    });
  });

  describe("delete", () => {
    it("removes a character set by ID", async () => {
      const set = createMockSerializedCharacterSet();
      await storage.save(set);
      expect(await storage.count()).toBe(1);

      await storage.delete(set.metadata.id);
      expect(await storage.count()).toBe(0);
    });

    it("does nothing when deleting a nonexistent ID", async () => {
      await storage.save(createMockSerializedCharacterSet());
      expect(await storage.count()).toBe(1);

      await storage.delete("nonexistent-id");
      expect(await storage.count()).toBe(1);
    });

    it("only removes the specified set", async () => {
      const set1 = createMockSerializedCharacterSet({ metadata: { name: "Keep" } });
      const set2 = createMockSerializedCharacterSet({ metadata: { name: "Remove" } });

      await storage.save(set1);
      await storage.save(set2);

      await storage.delete(set2.metadata.id);

      expect(await storage.count()).toBe(1);
      expect(await storage.getById(set1.metadata.id)).not.toBeNull();
      expect(await storage.getById(set2.metadata.id)).toBeNull();
    });
  });

  describe("togglePinned", () => {
    it("toggles pinned state from false to true", async () => {
      const set = createMockSerializedCharacterSet({ metadata: { isPinned: false } });
      await storage.save(set);

      const result = await storage.togglePinned(set.metadata.id);
      expect(result).toBe(true);

      const updated = await storage.getById(set.metadata.id);
      expect(updated?.metadata.isPinned).toBe(true);
    });

    it("toggles pinned state from true to false", async () => {
      const set = createMockSerializedCharacterSet({ metadata: { isPinned: true } });
      await storage.save(set);

      const result = await storage.togglePinned(set.metadata.id);
      expect(result).toBe(false);

      const updated = await storage.getById(set.metadata.id);
      expect(updated?.metadata.isPinned).toBe(false);
    });

    it("throws error for nonexistent ID", async () => {
      await expect(storage.togglePinned("nonexistent")).rejects.toThrow(
        "Character set not found"
      );
    });
  });

  describe("search", () => {
    beforeEach(async () => {
      await storage.save(
        createMockSerializedCharacterSet({
          metadata: {
            name: "Commodore 64 Characters",
            description: "Original C64 character ROM",
            manufacturer: "Commodore",
            system: "C64",
            source: "dump",
            locale: "English",
          },
        })
      );
      await storage.save(
        createMockSerializedCharacterSet({
          metadata: {
            name: "Apple II Font",
            description: "Apple II character set",
            manufacturer: "Apple",
            system: "Apple II",
            source: "recreation",
            locale: "English",
          },
        })
      );
      await storage.save(
        createMockSerializedCharacterSet({
          metadata: {
            name: "ZX Spectrum",
            description: "Sinclair ZX Spectrum font",
            manufacturer: "Sinclair",
            system: "ZX Spectrum",
            source: "dump",
            locale: "UK",
          },
        })
      );
    });

    it("finds sets by name (case-insensitive)", async () => {
      const results = await storage.search("commodore");
      expect(results).toHaveLength(1);
      expect(results[0].metadata.name).toBe("Commodore 64 Characters");
    });

    it("finds sets by description", async () => {
      const results = await storage.search("character set");
      expect(results).toHaveLength(1);
      expect(results[0].metadata.name).toBe("Apple II Font");
    });

    it("finds sets by manufacturer", async () => {
      const results = await storage.search("sinclair");
      expect(results).toHaveLength(1);
      expect(results[0].metadata.name).toBe("ZX Spectrum");
    });

    it("finds sets by system", async () => {
      const results = await storage.search("c64");
      expect(results).toHaveLength(1);
      expect(results[0].metadata.name).toBe("Commodore 64 Characters");
    });

    it("finds sets by source", async () => {
      const results = await storage.search("dump");
      expect(results).toHaveLength(2);
    });

    it("finds sets by locale", async () => {
      const results = await storage.search("UK");
      expect(results).toHaveLength(1);
      expect(results[0].metadata.name).toBe("ZX Spectrum");
    });

    it("returns empty array when no matches found", async () => {
      const results = await storage.search("nonexistent");
      expect(results).toEqual([]);
    });

    it("returns multiple matches", async () => {
      const results = await storage.search("English");
      expect(results).toHaveLength(2);
    });
  });

  describe("filterBySize", () => {
    beforeEach(async () => {
      await storage.save(
        createMockSerializedCharacterSet({ config: { width: 8, height: 8 } })
      );
      await storage.save(
        createMockSerializedCharacterSet({ config: { width: 8, height: 16 } })
      );
      await storage.save(
        createMockSerializedCharacterSet({ config: { width: 16, height: 16 } })
      );
    });

    it("filters by width only", async () => {
      const results = await storage.filterBySize(8, null);
      expect(results).toHaveLength(2);
    });

    it("filters by height only", async () => {
      const results = await storage.filterBySize(null, 16);
      expect(results).toHaveLength(2);
    });

    it("filters by both width and height", async () => {
      const results = await storage.filterBySize(8, 8);
      expect(results).toHaveLength(1);
    });

    it("returns all when both are null", async () => {
      const results = await storage.filterBySize(null, null);
      expect(results).toHaveLength(3);
    });
  });

  describe("filterByManufacturers", () => {
    beforeEach(async () => {
      await storage.save(
        createMockSerializedCharacterSet({ metadata: { manufacturer: "Commodore" } })
      );
      await storage.save(
        createMockSerializedCharacterSet({ metadata: { manufacturer: "Apple" } })
      );
      await storage.save(
        createMockSerializedCharacterSet({ metadata: { manufacturer: "Commodore" } })
      );
    });

    it("filters by single manufacturer", async () => {
      const results = await storage.filterByManufacturers(["Commodore"]);
      expect(results).toHaveLength(2);
    });

    it("filters by multiple manufacturers (OR logic)", async () => {
      const results = await storage.filterByManufacturers(["Commodore", "Apple"]);
      expect(results).toHaveLength(3);
    });

    it("returns all when array is empty", async () => {
      const results = await storage.filterByManufacturers([]);
      expect(results).toHaveLength(3);
    });

    it("is case-insensitive", async () => {
      const results = await storage.filterByManufacturers(["COMMODORE"]);
      expect(results).toHaveLength(2);
    });
  });

  describe("filterBySystems", () => {
    beforeEach(async () => {
      await storage.save(
        createMockSerializedCharacterSet({ metadata: { system: "C64" } })
      );
      await storage.save(
        createMockSerializedCharacterSet({ metadata: { system: "VIC-20" } })
      );
      await storage.save(
        createMockSerializedCharacterSet({ metadata: { system: "C64" } })
      );
    });

    it("filters by single system", async () => {
      const results = await storage.filterBySystems(["C64"]);
      expect(results).toHaveLength(2);
    });

    it("filters by multiple systems (OR logic)", async () => {
      const results = await storage.filterBySystems(["C64", "VIC-20"]);
      expect(results).toHaveLength(3);
    });

    it("returns all when array is empty", async () => {
      const results = await storage.filterBySystems([]);
      expect(results).toHaveLength(3);
    });

    it("is case-insensitive", async () => {
      const results = await storage.filterBySystems(["c64"]);
      expect(results).toHaveLength(2);
    });
  });

  describe("getAvailableSizes", () => {
    it("returns empty array when no sets exist", async () => {
      const result = await storage.getAvailableSizes();
      expect(result).toEqual([]);
    });

    it("returns unique sizes sorted by width then height", async () => {
      await storage.save(createMockSerializedCharacterSet({ config: { width: 16, height: 16 } }));
      await storage.save(createMockSerializedCharacterSet({ config: { width: 8, height: 8 } }));
      await storage.save(createMockSerializedCharacterSet({ config: { width: 8, height: 16 } }));
      await storage.save(createMockSerializedCharacterSet({ config: { width: 8, height: 8 } })); // Duplicate

      const result = await storage.getAvailableSizes();
      expect(result).toEqual([
        { width: 8, height: 8 },
        { width: 8, height: 16 },
        { width: 16, height: 16 },
      ]);
    });
  });

  describe("getAvailableManufacturers", () => {
    it("returns empty array when no sets exist", async () => {
      const result = await storage.getAvailableManufacturers();
      expect(result).toEqual([]);
    });

    it("returns unique manufacturers sorted alphabetically", async () => {
      await storage.save(createMockSerializedCharacterSet({ metadata: { manufacturer: "Commodore" } }));
      await storage.save(createMockSerializedCharacterSet({ metadata: { manufacturer: "Apple" } }));
      await storage.save(createMockSerializedCharacterSet({ metadata: { manufacturer: "Commodore" } }));

      const result = await storage.getAvailableManufacturers();
      expect(result).toEqual(["Apple", "Commodore"]);
    });

    it("excludes empty manufacturer strings", async () => {
      await storage.save(createMockSerializedCharacterSet({ metadata: { manufacturer: "" } }));
      await storage.save(createMockSerializedCharacterSet({ metadata: { manufacturer: "Apple" } }));

      const result = await storage.getAvailableManufacturers();
      expect(result).toEqual(["Apple"]);
    });
  });

  describe("getAvailableSystems", () => {
    it("returns empty array when no sets exist", async () => {
      const result = await storage.getAvailableSystems();
      expect(result).toEqual([]);
    });

    it("returns unique systems sorted alphabetically", async () => {
      await storage.save(createMockSerializedCharacterSet({ metadata: { system: "C64" } }));
      await storage.save(createMockSerializedCharacterSet({ metadata: { system: "Apple II" } }));
      await storage.save(createMockSerializedCharacterSet({ metadata: { system: "C64" } }));

      const result = await storage.getAvailableSystems();
      expect(result).toEqual(["Apple II", "C64"]);
    });

    it("excludes empty system strings", async () => {
      await storage.save(createMockSerializedCharacterSet({ metadata: { system: "" } }));
      await storage.save(createMockSerializedCharacterSet({ metadata: { system: "C64" } }));

      const result = await storage.getAvailableSystems();
      expect(result).toEqual(["C64"]);
    });
  });

  describe("nameExists", () => {
    beforeEach(async () => {
      await storage.save(createMockSerializedCharacterSet({ metadata: { name: "Existing Set" } }));
    });

    it("returns true for existing name", async () => {
      const result = await storage.nameExists("Existing Set");
      expect(result).toBe(true);
    });

    it("returns false for nonexistent name", async () => {
      const result = await storage.nameExists("New Name");
      expect(result).toBe(false);
    });

    it("is case-insensitive", async () => {
      expect(await storage.nameExists("existing set")).toBe(true);
      expect(await storage.nameExists("EXISTING SET")).toBe(true);
    });

    it("excludes the specified ID from check", async () => {
      const set = (await storage.getAll())[0];
      const result = await storage.nameExists("Existing Set", set.metadata.id);
      expect(result).toBe(false);
    });
  });

  describe("count", () => {
    it("returns 0 for empty storage", async () => {
      expect(await storage.count()).toBe(0);
    });

    it("returns the number of stored sets", async () => {
      await storage.save(createMockSerializedCharacterSet());
      await storage.save(createMockSerializedCharacterSet());
      await storage.save(createMockSerializedCharacterSet());

      expect(await storage.count()).toBe(3);
    });
  });

  describe("isEmpty", () => {
    it("returns true for empty storage", async () => {
      expect(await storage.isEmpty()).toBe(true);
    });

    it("returns false when sets are stored", async () => {
      await storage.save(createMockSerializedCharacterSet());
      expect(await storage.isEmpty()).toBe(false);
    });
  });

  describe("clear", () => {
    it("removes all character sets", async () => {
      await storage.save(createMockSerializedCharacterSet());
      await storage.save(createMockSerializedCharacterSet());

      await storage.clear();

      expect(await storage.count()).toBe(0);
      expect(await storage.isEmpty()).toBe(true);
    });
  });

  describe("reset", () => {
    it("clears all data and resets initialization state", async () => {
      await storage.initialize();
      await storage.save(createMockSerializedCharacterSet());

      storage.reset();

      expect(storage.isInitialized).toBe(false);
      expect(await storage.count()).toBe(0);
    });
  });

  describe("sets accessor", () => {
    it("provides direct access to underlying data", async () => {
      const set = createMockSerializedCharacterSet();
      await storage.save(set);

      expect(storage.sets).toHaveLength(1);
      expect(storage.sets[0].metadata.id).toBe(set.metadata.id);
    });
  });
});

// ============================================================================
// InMemorySnapshotStorage Tests
// ============================================================================

describe("InMemorySnapshotStorage", () => {
  let storage: InMemorySnapshotStorage;
  const characterSetId = "test-character-set-id";

  beforeEach(() => {
    storage = new InMemorySnapshotStorage();
  });

  describe("save", () => {
    it("saves a new snapshot", async () => {
      const snapshot = createMockSnapshot({ characterSetId });
      await storage.save(snapshot);

      expect(storage.snapshots).toHaveLength(1);
    });

    it("updates an existing snapshot with the same ID", async () => {
      const snapshot = createMockSnapshot({ characterSetId, name: "Original" });
      await storage.save(snapshot);

      const updated = { ...snapshot, name: "Updated" };
      await storage.save(updated);

      expect(storage.snapshots).toHaveLength(1);
      expect(storage.snapshots[0].name).toBe("Updated");
    });

    it("throws error when capacity is reached", async () => {
      storage.setMaxSnapshots(2);

      await storage.save(createMockSnapshot({ characterSetId }));
      await storage.save(createMockSnapshot({ characterSetId }));

      await expect(
        storage.save(createMockSnapshot({ characterSetId }))
      ).rejects.toThrow("Maximum of 2 snapshots per character set");
    });

    it("allows saving to different character sets up to capacity each", async () => {
      storage.setMaxSnapshots(2);

      await storage.save(createMockSnapshot({ characterSetId: "set-1" }));
      await storage.save(createMockSnapshot({ characterSetId: "set-1" }));
      await storage.save(createMockSnapshot({ characterSetId: "set-2" }));
      await storage.save(createMockSnapshot({ characterSetId: "set-2" }));

      expect(storage.snapshots).toHaveLength(4);
    });
  });

  describe("getForCharacterSet", () => {
    it("returns empty array when no snapshots exist", async () => {
      const result = await storage.getForCharacterSet(characterSetId);
      expect(result).toEqual([]);
    });

    it("returns only snapshots for the specified character set", async () => {
      await storage.save(createMockSnapshot({ characterSetId, name: "Snapshot 1" }));
      await storage.save(createMockSnapshot({ characterSetId: "other-id", name: "Other" }));
      await storage.save(createMockSnapshot({ characterSetId, name: "Snapshot 2" }));

      const result = await storage.getForCharacterSet(characterSetId);
      expect(result).toHaveLength(2);
      expect(result.every((s) => s.characterSetId === characterSetId)).toBe(true);
    });

    it("sorts snapshots by createdAt descending (newest first)", async () => {
      await storage.save(createMockSnapshot({ characterSetId, name: "Old", createdAt: 1000 }));
      await storage.save(createMockSnapshot({ characterSetId, name: "New", createdAt: 3000 }));
      await storage.save(createMockSnapshot({ characterSetId, name: "Middle", createdAt: 2000 }));

      const result = await storage.getForCharacterSet(characterSetId);
      expect(result[0].name).toBe("New");
      expect(result[1].name).toBe("Middle");
      expect(result[2].name).toBe("Old");
    });
  });

  describe("getById", () => {
    it("returns null for nonexistent ID", async () => {
      const result = await storage.getById("nonexistent");
      expect(result).toBeNull();
    });

    it("returns the snapshot with matching ID", async () => {
      const snapshot = createMockSnapshot({ name: "Target" });
      await storage.save(snapshot);

      const result = await storage.getById(snapshot.id);
      expect(result?.name).toBe("Target");
    });
  });

  describe("delete", () => {
    it("removes a snapshot by ID", async () => {
      const snapshot = createMockSnapshot();
      await storage.save(snapshot);

      await storage.delete(snapshot.id);

      expect(storage.snapshots).toHaveLength(0);
    });

    it("does nothing when deleting a nonexistent ID", async () => {
      await storage.save(createMockSnapshot());

      await storage.delete("nonexistent");

      expect(storage.snapshots).toHaveLength(1);
    });
  });

  describe("deleteAllForCharacterSet", () => {
    it("removes all snapshots for a character set", async () => {
      await storage.save(createMockSnapshot({ characterSetId }));
      await storage.save(createMockSnapshot({ characterSetId }));
      await storage.save(createMockSnapshot({ characterSetId: "other-id" }));

      await storage.deleteAllForCharacterSet(characterSetId);

      expect(storage.snapshots).toHaveLength(1);
      expect(storage.snapshots[0].characterSetId).toBe("other-id");
    });

    it("does nothing when no snapshots exist for the character set", async () => {
      await storage.save(createMockSnapshot({ characterSetId: "other-id" }));

      await storage.deleteAllForCharacterSet(characterSetId);

      expect(storage.snapshots).toHaveLength(1);
    });
  });

  describe("rename", () => {
    it("renames a snapshot", async () => {
      const snapshot = createMockSnapshot({ name: "Original Name" });
      await storage.save(snapshot);

      await storage.rename(snapshot.id, "New Name");

      const updated = await storage.getById(snapshot.id);
      expect(updated?.name).toBe("New Name");
    });

    it("throws error for nonexistent ID", async () => {
      await expect(storage.rename("nonexistent", "New Name")).rejects.toThrow(
        "Snapshot not found"
      );
    });
  });

  describe("getCount", () => {
    it("returns 0 when no snapshots exist", async () => {
      const count = await storage.getCount(characterSetId);
      expect(count).toBe(0);
    });

    it("returns the count for a specific character set", async () => {
      await storage.save(createMockSnapshot({ characterSetId }));
      await storage.save(createMockSnapshot({ characterSetId }));
      await storage.save(createMockSnapshot({ characterSetId: "other-id" }));

      const count = await storage.getCount(characterSetId);
      expect(count).toBe(2);
    });
  });

  describe("isAtCapacity", () => {
    it("returns false when under capacity", async () => {
      storage.setMaxSnapshots(5);
      await storage.save(createMockSnapshot({ characterSetId }));
      await storage.save(createMockSnapshot({ characterSetId }));

      const result = await storage.isAtCapacity(characterSetId);
      expect(result).toBe(false);
    });

    it("returns true when at capacity", async () => {
      storage.setMaxSnapshots(2);
      await storage.save(createMockSnapshot({ characterSetId }));
      await storage.save(createMockSnapshot({ characterSetId }));

      const result = await storage.isAtCapacity(characterSetId);
      expect(result).toBe(true);
    });
  });

  describe("getMaxSnapshots", () => {
    it("returns the default max snapshots", () => {
      expect(storage.getMaxSnapshots()).toBe(10);
    });

    it("returns the configured max snapshots", () => {
      storage.setMaxSnapshots(25);
      expect(storage.getMaxSnapshots()).toBe(25);
    });
  });

  describe("setMaxSnapshots", () => {
    it("sets the maximum snapshots allowed", () => {
      storage.setMaxSnapshots(5);
      expect(storage.getMaxSnapshots()).toBe(5);
    });
  });

  describe("clear", () => {
    it("removes all snapshots", async () => {
      await storage.save(createMockSnapshot({ characterSetId }));
      await storage.save(createMockSnapshot({ characterSetId: "other" }));

      storage.clear();

      expect(storage.snapshots).toHaveLength(0);
    });
  });

  describe("snapshots accessor", () => {
    it("provides direct access to underlying data", async () => {
      const snapshot = createMockSnapshot();
      await storage.save(snapshot);

      expect(storage.snapshots).toHaveLength(1);
      expect(storage.snapshots[0].id).toBe(snapshot.id);
    });
  });
});

// ============================================================================
// InMemoryAutoSaveStorage Tests
// ============================================================================

describe("InMemoryAutoSaveStorage", () => {
  let storage: InMemoryAutoSaveStorage;

  const createAutoSaveData = (overrides?: Partial<AutoSaveData>): AutoSaveData => ({
    characterSetId: "test-set-id",
    binaryData: "base64encodeddata",
    config: {
      width: 8,
      height: 8,
      padding: "right",
      bitDirection: "msb",
    },
    selectedIndex: 0,
    timestamp: Date.now(),
    isDirty: true,
    ...overrides,
  });

  beforeEach(() => {
    storage = new InMemoryAutoSaveStorage();
  });

  describe("get", () => {
    it("returns null when no auto-save data exists", () => {
      expect(storage.get()).toBeNull();
    });

    it("returns the stored auto-save data", () => {
      const data = createAutoSaveData();
      storage.save(data);

      const result = storage.get();
      expect(result).toEqual(data);
    });
  });

  describe("save", () => {
    it("stores auto-save data", () => {
      const data = createAutoSaveData();
      storage.save(data);

      expect(storage.get()).not.toBeNull();
      expect(storage.get()?.characterSetId).toBe(data.characterSetId);
    });

    it("overwrites previous auto-save data", () => {
      storage.save(createAutoSaveData({ characterSetId: "first" }));
      storage.save(createAutoSaveData({ characterSetId: "second" }));

      expect(storage.get()?.characterSetId).toBe("second");
    });
  });

  describe("clear", () => {
    it("removes auto-save data", () => {
      storage.save(createAutoSaveData());
      expect(storage.get()).not.toBeNull();

      storage.clear();
      expect(storage.get()).toBeNull();
    });

    it("works when no data exists", () => {
      expect(() => storage.clear()).not.toThrow();
      expect(storage.get()).toBeNull();
    });
  });

  describe("hasNewerAutoSave", () => {
    it("returns false when no auto-save data exists", () => {
      const result = storage.hasNewerAutoSave("any-id", 1000);
      expect(result).toBe(false);
    });

    it("returns false when character set ID does not match", () => {
      storage.save(createAutoSaveData({
        characterSetId: "different-id",
        timestamp: 2000,
        isDirty: true,
      }));

      const result = storage.hasNewerAutoSave("target-id", 1000);
      expect(result).toBe(false);
    });

    it("returns false when auto-save is older than stored version", () => {
      storage.save(createAutoSaveData({
        characterSetId: "target-id",
        timestamp: 500,
        isDirty: true,
      }));

      const result = storage.hasNewerAutoSave("target-id", 1000);
      expect(result).toBe(false);
    });

    it("returns false when auto-save is not dirty", () => {
      storage.save(createAutoSaveData({
        characterSetId: "target-id",
        timestamp: 2000,
        isDirty: false,
      }));

      const result = storage.hasNewerAutoSave("target-id", 1000);
      expect(result).toBe(false);
    });

    it("returns true when auto-save is newer and dirty", () => {
      storage.save(createAutoSaveData({
        characterSetId: "target-id",
        timestamp: 2000,
        isDirty: true,
      }));

      const result = storage.hasNewerAutoSave("target-id", 1000);
      expect(result).toBe(true);
    });

    it("returns false when timestamps are equal", () => {
      storage.save(createAutoSaveData({
        characterSetId: "target-id",
        timestamp: 1000,
        isDirty: true,
      }));

      const result = storage.hasNewerAutoSave("target-id", 1000);
      expect(result).toBe(false);
    });
  });

  describe("autoSaveData accessor", () => {
    it("provides direct access to underlying data", () => {
      expect(storage.autoSaveData).toBeNull();

      const data = createAutoSaveData();
      storage.save(data);

      expect(storage.autoSaveData).toEqual(data);
    });
  });
});

// ============================================================================
// Factory Function Tests
// ============================================================================

describe("Factory Functions", () => {
  describe("createMockKeyValueStorage", () => {
    it("creates an empty InMemoryKeyValueStorage", () => {
      const storage = createMockKeyValueStorage();
      expect(storage).toBeInstanceOf(InMemoryKeyValueStorage);
      expect(storage.size).toBe(0);
    });
  });

  describe("createMockCharacterSetStorage", () => {
    it("creates an empty InMemoryCharacterSetStorage", async () => {
      const storage = createMockCharacterSetStorage();
      expect(storage).toBeInstanceOf(InMemoryCharacterSetStorage);
      expect(await storage.count()).toBe(0);
    });
  });

  describe("createMockSnapshotStorage", () => {
    it("creates an empty InMemorySnapshotStorage", () => {
      const storage = createMockSnapshotStorage();
      expect(storage).toBeInstanceOf(InMemorySnapshotStorage);
      expect(storage.snapshots).toHaveLength(0);
    });
  });

  describe("createMockAutoSaveStorage", () => {
    it("creates an empty InMemoryAutoSaveStorage", () => {
      const storage = createMockAutoSaveStorage();
      expect(storage).toBeInstanceOf(InMemoryAutoSaveStorage);
      expect(storage.get()).toBeNull();
    });
  });
});
