import { renderHook, act, waitFor } from "@testing-library/react";
import { useAutoSave } from "@/hooks/character-editor/useAutoSave";
import {
  createMockKeyValueStorage,
  createMockCharacters,
  createMockConfig,
} from "@/lib/character-editor/__tests__/testUtils";
import { CHARACTER_EDITOR_STORAGE_KEY_AUTOSAVE } from "@/lib/character-editor/storage/keys";
import type { Character, CharacterSetConfig } from "@/lib/character-editor/types";

describe("useAutoSave", () => {
  const mockCharacterSetId = "test-charset-id-123";
  const mockSelectedIndex = 5;

  let mockStorage: ReturnType<typeof createMockKeyValueStorage>;
  let mockCharacters: Character[];
  let mockConfig: CharacterSetConfig;

  beforeEach(() => {
    jest.useFakeTimers();
    mockStorage = createMockKeyValueStorage();
    mockCharacters = createMockCharacters(16, 8, 8, ["checkerboard"]);
    mockConfig = createMockConfig();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function createDefaultOptions(overrides?: Partial<Parameters<typeof useAutoSave>[0]>) {
    return {
      characterSetId: mockCharacterSetId,
      characters: mockCharacters,
      config: mockConfig,
      selectedIndex: mockSelectedIndex,
      isDirty: true,
      enabled: true,
      kvStorage: mockStorage,
      ...overrides,
    };
  }

  describe("initialization", () => {
    it("initializes with hasRecoveryData as false when no saved data exists", () => {
      const { result } = renderHook(() => useAutoSave(createDefaultOptions()));

      expect(result.current.hasRecoveryData).toBe(false);
      expect(result.current.recoveryData).toBeNull();
    });

    it("checks for recovery data on mount", async () => {
      // Pre-populate storage with recovery data
      const savedData = {
        characterSetId: mockCharacterSetId,
        binaryData: "dGVzdA==",
        config: mockConfig,
        selectedIndex: 10,
        timestamp: Date.now() - 60000,
        isDirty: true,
      };
      mockStorage.setItem(
        CHARACTER_EDITOR_STORAGE_KEY_AUTOSAVE,
        JSON.stringify(savedData)
      );

      const { result } = renderHook(() => useAutoSave(createDefaultOptions()));

      await waitFor(() => {
        expect(result.current.hasRecoveryData).toBe(true);
      });

      expect(result.current.recoveryData).not.toBeNull();
      expect(result.current.recoveryData?.characterSetId).toBe(mockCharacterSetId);
      expect(result.current.recoveryData?.selectedIndex).toBe(10);
    });

    it("does not offer recovery for different character set", async () => {
      const savedData = {
        characterSetId: "different-charset-id",
        binaryData: "dGVzdA==",
        config: mockConfig,
        selectedIndex: 10,
        timestamp: Date.now() - 60000,
        isDirty: true,
      };
      mockStorage.setItem(
        CHARACTER_EDITOR_STORAGE_KEY_AUTOSAVE,
        JSON.stringify(savedData)
      );

      const { result } = renderHook(() => useAutoSave(createDefaultOptions()));

      // Wait a tick to ensure effect runs
      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.hasRecoveryData).toBe(false);
      expect(result.current.recoveryData).toBeNull();
    });

    it("does not offer recovery when saved data is not dirty", async () => {
      const savedData = {
        characterSetId: mockCharacterSetId,
        binaryData: "dGVzdA==",
        config: mockConfig,
        selectedIndex: 10,
        timestamp: Date.now() - 60000,
        isDirty: false,
      };
      mockStorage.setItem(
        CHARACTER_EDITOR_STORAGE_KEY_AUTOSAVE,
        JSON.stringify(savedData)
      );

      const { result } = renderHook(() => useAutoSave(createDefaultOptions()));

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.hasRecoveryData).toBe(false);
    });

    it("does not check for recovery when characterSetId is null", () => {
      const savedData = {
        characterSetId: mockCharacterSetId,
        binaryData: "dGVzdA==",
        config: mockConfig,
        selectedIndex: 10,
        timestamp: Date.now(),
        isDirty: true,
      };
      mockStorage.setItem(
        CHARACTER_EDITOR_STORAGE_KEY_AUTOSAVE,
        JSON.stringify(savedData)
      );

      const { result } = renderHook(() =>
        useAutoSave(createDefaultOptions({ characterSetId: null }))
      );

      expect(result.current.hasRecoveryData).toBe(false);
    });
  });

  describe("saveNow()", () => {
    it("serializes and stores characters to storage", () => {
      const { result } = renderHook(() => useAutoSave(createDefaultOptions()));

      act(() => {
        result.current.saveNow();
      });

      const storedValue = mockStorage.getItem(CHARACTER_EDITOR_STORAGE_KEY_AUTOSAVE);
      expect(storedValue).not.toBeNull();

      const parsed = JSON.parse(storedValue!);
      expect(parsed.characterSetId).toBe(mockCharacterSetId);
      expect(parsed.config).toEqual(mockConfig);
      expect(parsed.selectedIndex).toBe(mockSelectedIndex);
      expect(parsed.isDirty).toBe(true);
      expect(parsed.binaryData).toBeDefined();
      expect(typeof parsed.timestamp).toBe("number");
    });

    it("stores base64 encoded binary data", () => {
      const { result } = renderHook(() => useAutoSave(createDefaultOptions()));

      act(() => {
        result.current.saveNow();
      });

      const storedValue = mockStorage.getItem(CHARACTER_EDITOR_STORAGE_KEY_AUTOSAVE);
      const parsed = JSON.parse(storedValue!);

      // Check that binaryData is valid base64 (contains only valid base64 chars)
      expect(parsed.binaryData).toMatch(/^[A-Za-z0-9+/=]+$/);
    });

    it("does not save when characterSetId is null", () => {
      const { result } = renderHook(() =>
        useAutoSave(createDefaultOptions({ characterSetId: null }))
      );

      act(() => {
        result.current.saveNow();
      });

      expect(mockStorage.getItem(CHARACTER_EDITOR_STORAGE_KEY_AUTOSAVE)).toBeNull();
    });

    it("does not save when enabled is false", () => {
      const { result } = renderHook(() =>
        useAutoSave(createDefaultOptions({ enabled: false }))
      );

      act(() => {
        result.current.saveNow();
      });

      expect(mockStorage.getItem(CHARACTER_EDITOR_STORAGE_KEY_AUTOSAVE)).toBeNull();
    });

    it("does not save when characters array is empty", () => {
      const { result } = renderHook(() =>
        useAutoSave(createDefaultOptions({ characters: [] }))
      );

      act(() => {
        result.current.saveNow();
      });

      expect(mockStorage.getItem(CHARACTER_EDITOR_STORAGE_KEY_AUTOSAVE)).toBeNull();
    });

    it("updates timestamp on each save", () => {
      const { result } = renderHook(() => useAutoSave(createDefaultOptions()));

      act(() => {
        result.current.saveNow();
      });

      const firstSave = JSON.parse(
        mockStorage.getItem(CHARACTER_EDITOR_STORAGE_KEY_AUTOSAVE)!
      );

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      act(() => {
        result.current.saveNow();
      });

      const secondSave = JSON.parse(
        mockStorage.getItem(CHARACTER_EDITOR_STORAGE_KEY_AUTOSAVE)!
      );

      expect(secondSave.timestamp).toBeGreaterThan(firstSave.timestamp);
    });
  });

  describe("auto-save interval", () => {
    it("triggers auto-save after 30 seconds when dirty", () => {
      renderHook(() => useAutoSave(createDefaultOptions({ isDirty: true })));

      expect(mockStorage.getItem(CHARACTER_EDITOR_STORAGE_KEY_AUTOSAVE)).toBeNull();

      act(() => {
        jest.advanceTimersByTime(30000);
      });

      expect(mockStorage.getItem(CHARACTER_EDITOR_STORAGE_KEY_AUTOSAVE)).not.toBeNull();
    });

    it("does not trigger auto-save when not dirty", () => {
      renderHook(() => useAutoSave(createDefaultOptions({ isDirty: false })));

      act(() => {
        jest.advanceTimersByTime(60000);
      });

      expect(mockStorage.getItem(CHARACTER_EDITOR_STORAGE_KEY_AUTOSAVE)).toBeNull();
    });

    it("does not trigger auto-save when disabled", () => {
      renderHook(() =>
        useAutoSave(createDefaultOptions({ isDirty: true, enabled: false }))
      );

      act(() => {
        jest.advanceTimersByTime(60000);
      });

      expect(mockStorage.getItem(CHARACTER_EDITOR_STORAGE_KEY_AUTOSAVE)).toBeNull();
    });

    it("does not trigger auto-save when characterSetId is null", () => {
      renderHook(() =>
        useAutoSave(createDefaultOptions({ isDirty: true, characterSetId: null }))
      );

      act(() => {
        jest.advanceTimersByTime(60000);
      });

      expect(mockStorage.getItem(CHARACTER_EDITOR_STORAGE_KEY_AUTOSAVE)).toBeNull();
    });

    it("stops scheduling new saves when disabled changes to false", () => {
      // Start with enabled=true, isDirty=true
      const { result, rerender } = renderHook(
        (props) => useAutoSave(createDefaultOptions(props)),
        { initialProps: { isDirty: true, enabled: true } }
      );

      // First auto-save triggers after 30 seconds
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      expect(mockStorage.getItem(CHARACTER_EDITOR_STORAGE_KEY_AUTOSAVE)).not.toBeNull();

      // Clear the storage and disable
      act(() => {
        result.current.clearAutoSave();
      });

      expect(mockStorage.getItem(CHARACTER_EDITOR_STORAGE_KEY_AUTOSAVE)).toBeNull();

      // Disable auto-save
      rerender({ isDirty: true, enabled: false });

      // Wait another 30 seconds - should not save since disabled
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      expect(mockStorage.getItem(CHARACTER_EDITOR_STORAGE_KEY_AUTOSAVE)).toBeNull();
    });

    it("clears timer when conditions change before timer fires", () => {
      // Start with enabled=true, isDirty=true
      // First trigger saves immediately due to the delay calculation
      const { result, rerender } = renderHook(
        (props) => useAutoSave(createDefaultOptions(props)),
        { initialProps: { isDirty: true, enabled: true } }
      );

      // Wait for initial auto-save
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      expect(mockStorage.getItem(CHARACTER_EDITOR_STORAGE_KEY_AUTOSAVE)).not.toBeNull();

      // Clear storage
      act(() => {
        result.current.clearAutoSave();
      });

      // Mark as clean (no longer dirty) - this should prevent future saves
      rerender({ isDirty: false, enabled: true });

      // Advance past when the next timer would have fired
      act(() => {
        jest.advanceTimersByTime(60000);
      });

      // Should still be empty since dirty is false
      expect(mockStorage.getItem(CHARACTER_EDITOR_STORAGE_KEY_AUTOSAVE)).toBeNull();
    });

    it("schedules subsequent saves after manual save", () => {
      const { result } = renderHook(() =>
        useAutoSave(createDefaultOptions({ isDirty: true }))
      );

      // Manual save
      act(() => {
        result.current.saveNow();
      });

      expect(mockStorage.getItem(CHARACTER_EDITOR_STORAGE_KEY_AUTOSAVE)).not.toBeNull();

      // Clear storage to detect next save
      act(() => {
        result.current.clearAutoSave();
      });

      expect(mockStorage.getItem(CHARACTER_EDITOR_STORAGE_KEY_AUTOSAVE)).toBeNull();

      // Advance time - the hook should schedule a new save 30s after the manual save
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      // Should have auto-saved again
      expect(mockStorage.getItem(CHARACTER_EDITOR_STORAGE_KEY_AUTOSAVE)).not.toBeNull();
    });
  });

  describe("hasRecoveryData flag", () => {
    it("returns false when no recovery data exists", () => {
      const { result } = renderHook(() => useAutoSave(createDefaultOptions()));

      expect(result.current.hasRecoveryData).toBe(false);
    });

    it("returns true when recovery data exists for matching character set", async () => {
      const savedData = {
        characterSetId: mockCharacterSetId,
        binaryData: "dGVzdA==",
        config: mockConfig,
        selectedIndex: 10,
        timestamp: Date.now(),
        isDirty: true,
      };
      mockStorage.setItem(
        CHARACTER_EDITOR_STORAGE_KEY_AUTOSAVE,
        JSON.stringify(savedData)
      );

      const { result } = renderHook(() => useAutoSave(createDefaultOptions()));

      await waitFor(() => {
        expect(result.current.hasRecoveryData).toBe(true);
      });
    });

    it("becomes false after recover() is called", async () => {
      const savedData = {
        characterSetId: mockCharacterSetId,
        binaryData: "dGVzdA==",
        config: mockConfig,
        selectedIndex: 10,
        timestamp: Date.now(),
        isDirty: true,
      };
      mockStorage.setItem(
        CHARACTER_EDITOR_STORAGE_KEY_AUTOSAVE,
        JSON.stringify(savedData)
      );

      const { result } = renderHook(() => useAutoSave(createDefaultOptions()));

      await waitFor(() => {
        expect(result.current.hasRecoveryData).toBe(true);
      });

      act(() => {
        result.current.recover();
      });

      expect(result.current.hasRecoveryData).toBe(false);
    });

    it("becomes false after discard() is called", async () => {
      const savedData = {
        characterSetId: mockCharacterSetId,
        binaryData: "dGVzdA==",
        config: mockConfig,
        selectedIndex: 10,
        timestamp: Date.now(),
        isDirty: true,
      };
      mockStorage.setItem(
        CHARACTER_EDITOR_STORAGE_KEY_AUTOSAVE,
        JSON.stringify(savedData)
      );

      const { result } = renderHook(() => useAutoSave(createDefaultOptions()));

      await waitFor(() => {
        expect(result.current.hasRecoveryData).toBe(true);
      });

      act(() => {
        result.current.discard();
      });

      expect(result.current.hasRecoveryData).toBe(false);
    });
  });

  describe("recover()", () => {
    it("returns stored recovery data", async () => {
      const savedData = {
        characterSetId: mockCharacterSetId,
        binaryData: "dGVzdA==",
        config: mockConfig,
        selectedIndex: 10,
        timestamp: 1234567890,
        isDirty: true,
      };
      mockStorage.setItem(
        CHARACTER_EDITOR_STORAGE_KEY_AUTOSAVE,
        JSON.stringify(savedData)
      );

      const { result } = renderHook(() => useAutoSave(createDefaultOptions()));

      await waitFor(() => {
        expect(result.current.hasRecoveryData).toBe(true);
      });

      let recovered: ReturnType<typeof result.current.recover>;
      act(() => {
        recovered = result.current.recover();
      });

      expect(recovered!).toEqual(savedData);
    });

    it("clears recovery data state after being called", async () => {
      const savedData = {
        characterSetId: mockCharacterSetId,
        binaryData: "dGVzdA==",
        config: mockConfig,
        selectedIndex: 10,
        timestamp: Date.now(),
        isDirty: true,
      };
      mockStorage.setItem(
        CHARACTER_EDITOR_STORAGE_KEY_AUTOSAVE,
        JSON.stringify(savedData)
      );

      const { result } = renderHook(() => useAutoSave(createDefaultOptions()));

      await waitFor(() => {
        expect(result.current.hasRecoveryData).toBe(true);
      });

      act(() => {
        result.current.recover();
      });

      expect(result.current.recoveryData).toBeNull();
      expect(result.current.hasRecoveryData).toBe(false);
    });

    it("returns null when no recovery data exists", () => {
      const { result } = renderHook(() => useAutoSave(createDefaultOptions()));

      let recovered: ReturnType<typeof result.current.recover>;
      act(() => {
        recovered = result.current.recover();
      });

      expect(recovered!).toBeNull();
    });

    it("returns null on subsequent calls", async () => {
      const savedData = {
        characterSetId: mockCharacterSetId,
        binaryData: "dGVzdA==",
        config: mockConfig,
        selectedIndex: 10,
        timestamp: Date.now(),
        isDirty: true,
      };
      mockStorage.setItem(
        CHARACTER_EDITOR_STORAGE_KEY_AUTOSAVE,
        JSON.stringify(savedData)
      );

      const { result } = renderHook(() => useAutoSave(createDefaultOptions()));

      await waitFor(() => {
        expect(result.current.hasRecoveryData).toBe(true);
      });

      let firstRecover: ReturnType<typeof result.current.recover>;
      let secondRecover: ReturnType<typeof result.current.recover>;

      act(() => {
        firstRecover = result.current.recover();
      });

      act(() => {
        secondRecover = result.current.recover();
      });

      expect(firstRecover!).not.toBeNull();
      expect(secondRecover!).toBeNull();
    });
  });

  describe("discard()", () => {
    it("removes recovery data from state", async () => {
      const savedData = {
        characterSetId: mockCharacterSetId,
        binaryData: "dGVzdA==",
        config: mockConfig,
        selectedIndex: 10,
        timestamp: Date.now(),
        isDirty: true,
      };
      mockStorage.setItem(
        CHARACTER_EDITOR_STORAGE_KEY_AUTOSAVE,
        JSON.stringify(savedData)
      );

      const { result } = renderHook(() => useAutoSave(createDefaultOptions()));

      await waitFor(() => {
        expect(result.current.hasRecoveryData).toBe(true);
      });

      act(() => {
        result.current.discard();
      });

      expect(result.current.hasRecoveryData).toBe(false);
      expect(result.current.recoveryData).toBeNull();
    });

    it("removes recovery data from storage", async () => {
      const savedData = {
        characterSetId: mockCharacterSetId,
        binaryData: "dGVzdA==",
        config: mockConfig,
        selectedIndex: 10,
        timestamp: Date.now(),
        isDirty: true,
      };
      mockStorage.setItem(
        CHARACTER_EDITOR_STORAGE_KEY_AUTOSAVE,
        JSON.stringify(savedData)
      );

      const { result } = renderHook(() => useAutoSave(createDefaultOptions()));

      await waitFor(() => {
        expect(result.current.hasRecoveryData).toBe(true);
      });

      act(() => {
        result.current.discard();
      });

      expect(mockStorage.getItem(CHARACTER_EDITOR_STORAGE_KEY_AUTOSAVE)).toBeNull();
    });

    it("works even when no recovery data exists", () => {
      const { result } = renderHook(() => useAutoSave(createDefaultOptions()));

      act(() => {
        result.current.discard();
      });

      expect(result.current.hasRecoveryData).toBe(false);
      expect(mockStorage.getItem(CHARACTER_EDITOR_STORAGE_KEY_AUTOSAVE)).toBeNull();
    });
  });

  describe("enabled flag", () => {
    it("prevents saving when enabled is false", () => {
      const { result } = renderHook(() =>
        useAutoSave(createDefaultOptions({ enabled: false }))
      );

      act(() => {
        result.current.saveNow();
      });

      expect(mockStorage.getItem(CHARACTER_EDITOR_STORAGE_KEY_AUTOSAVE)).toBeNull();
    });

    it("prevents auto-save timer when enabled is false", () => {
      renderHook(() =>
        useAutoSave(createDefaultOptions({ enabled: false, isDirty: true }))
      );

      act(() => {
        jest.advanceTimersByTime(60000);
      });

      expect(mockStorage.getItem(CHARACTER_EDITOR_STORAGE_KEY_AUTOSAVE)).toBeNull();
    });

    it("allows saving when enabled is true (default)", () => {
      const { result } = renderHook(() => useAutoSave(createDefaultOptions()));

      act(() => {
        result.current.saveNow();
      });

      expect(mockStorage.getItem(CHARACTER_EDITOR_STORAGE_KEY_AUTOSAVE)).not.toBeNull();
    });

    it("defaults enabled to true when not specified", () => {
      const { result } = renderHook(() =>
        useAutoSave({
          characterSetId: mockCharacterSetId,
          characters: mockCharacters,
          config: mockConfig,
          selectedIndex: mockSelectedIndex,
          isDirty: true,
          kvStorage: mockStorage,
        })
      );

      act(() => {
        result.current.saveNow();
      });

      expect(mockStorage.getItem(CHARACTER_EDITOR_STORAGE_KEY_AUTOSAVE)).not.toBeNull();
    });
  });

  describe("clearAutoSave()", () => {
    it("removes stored auto-save data", () => {
      const { result } = renderHook(() => useAutoSave(createDefaultOptions()));

      act(() => {
        result.current.saveNow();
      });

      expect(mockStorage.getItem(CHARACTER_EDITOR_STORAGE_KEY_AUTOSAVE)).not.toBeNull();

      act(() => {
        result.current.clearAutoSave();
      });

      expect(mockStorage.getItem(CHARACTER_EDITOR_STORAGE_KEY_AUTOSAVE)).toBeNull();
    });

    it("works when no auto-save data exists", () => {
      const { result } = renderHook(() => useAutoSave(createDefaultOptions()));

      act(() => {
        result.current.clearAutoSave();
      });

      expect(mockStorage.getItem(CHARACTER_EDITOR_STORAGE_KEY_AUTOSAVE)).toBeNull();
    });

    it("does not clear recovery data state", async () => {
      const savedData = {
        characterSetId: mockCharacterSetId,
        binaryData: "dGVzdA==",
        config: mockConfig,
        selectedIndex: 10,
        timestamp: Date.now(),
        isDirty: true,
      };
      mockStorage.setItem(
        CHARACTER_EDITOR_STORAGE_KEY_AUTOSAVE,
        JSON.stringify(savedData)
      );

      const { result } = renderHook(() => useAutoSave(createDefaultOptions()));

      await waitFor(() => {
        expect(result.current.hasRecoveryData).toBe(true);
      });

      act(() => {
        result.current.clearAutoSave();
      });

      // clearAutoSave removes from storage but recovery data state remains
      // (it was already loaded into state)
      expect(result.current.hasRecoveryData).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("handles corrupted storage data gracefully", () => {
      mockStorage.setItem(CHARACTER_EDITOR_STORAGE_KEY_AUTOSAVE, "invalid json");

      const { result } = renderHook(() => useAutoSave(createDefaultOptions()));

      expect(result.current.hasRecoveryData).toBe(false);
      expect(result.current.recoveryData).toBeNull();
    });

    it("handles storage errors during save gracefully", () => {
      const errorStorage = {
        getItem: () => null,
        setItem: () => {
          throw new Error("Storage quota exceeded");
        },
        removeItem: () => {},
      };

      const { result } = renderHook(() =>
        useAutoSave({
          ...createDefaultOptions(),
          kvStorage: errorStorage,
        })
      );

      // Should not throw
      expect(() => {
        act(() => {
          result.current.saveNow();
        });
      }).not.toThrow();
    });

    it("handles storage errors during discard gracefully", () => {
      const errorStorage = {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {
          throw new Error("Storage error");
        },
      };

      const { result } = renderHook(() =>
        useAutoSave({
          ...createDefaultOptions(),
          kvStorage: errorStorage,
        })
      );

      // Should not throw
      expect(() => {
        act(() => {
          result.current.discard();
        });
      }).not.toThrow();
    });

    it("handles storage errors during clearAutoSave gracefully", () => {
      const errorStorage = {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {
          throw new Error("Storage error");
        },
      };

      const { result } = renderHook(() =>
        useAutoSave({
          ...createDefaultOptions(),
          kvStorage: errorStorage,
        })
      );

      // Should not throw
      expect(() => {
        act(() => {
          result.current.clearAutoSave();
        });
      }).not.toThrow();
    });
  });

  describe("return value stability", () => {
    it("returns stable function references across renders", () => {
      const { result, rerender } = renderHook(() =>
        useAutoSave(createDefaultOptions())
      );

      const initialSaveNow = result.current.saveNow;
      const initialDiscard = result.current.discard;
      const initialClearAutoSave = result.current.clearAutoSave;

      rerender();

      // Functions should be memoized with useCallback
      expect(result.current.discard).toBe(initialDiscard);
      expect(result.current.clearAutoSave).toBe(initialClearAutoSave);

      // Note: saveNow depends on many values and may change when those change
      // Here we just verify it exists
      expect(typeof result.current.saveNow).toBe("function");
      expect(typeof initialSaveNow).toBe("function");
    });
  });
});
