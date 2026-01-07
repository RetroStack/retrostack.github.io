"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { CharacterPreviewGrid } from "@/components/character-editor";
import {
  decodeCharacterSet,
  getHashFromUrl,
} from "@/lib/character-editor/sharing";
import {
  Character,
  CharacterSetConfig,
  CharacterSet,
  generateId,
} from "@/lib/character-editor/types";
import { useCharacterLibrary } from "@/hooks/character-editor";

interface DecodedSet {
  name: string;
  description: string;
  characters: Character[];
  config: CharacterSetConfig;
}

function SharedPageContent() {
  const router = useRouter();
  const { save } = useCharacterLibrary();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [decodedSet, setDecodedSet] = useState<DecodedSet | null>(null);
  const [importing, setImporting] = useState(false);
  const [importName, setImportName] = useState("");

  // Decode the shared character set from URL hash
  useEffect(() => {
    const hash = getHashFromUrl();

    if (!hash) {
      setError("No shared character set found in the URL");
      setLoading(false);
      return;
    }

    try {
      const decoded = decodeCharacterSet(hash);
      setDecodedSet(decoded);
      setImportName(decoded.name);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to decode shared character set");
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle import
  const handleImport = useCallback(async () => {
    if (!decodedSet) return;

    setImporting(true);
    try {
      const now = Date.now();
      const newSet: CharacterSet = {
        metadata: {
          id: generateId(),
          name: importName.trim() || decodedSet.name,
          description: decodedSet.description,
          source: "Shared via URL",
          isBuiltIn: false,
          createdAt: now,
          updatedAt: now,
          manufacturer: "",
          system: "",
          isPinned: false,
        },
        config: decodedSet.config,
        characters: decodedSet.characters,
      };

      const savedId = await save(newSet);
      router.push(`/tools/character-rom-editor/edit?id=${savedId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to import character set");
    } finally {
      setImporting(false);
    }
  }, [decodedSet, importName, save, router]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-retro-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-retro-cyan border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-400">Loading shared character set...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !decodedSet) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-retro-dark p-4">
        <div className="w-full max-w-md text-center">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h1 className="text-xl font-medium text-white mb-2">Unable to Load</h1>
          <p className="text-gray-400 mb-6">{error || "Invalid share link"}</p>
          <Link href="/tools/character-rom-editor">
            <Button variant="cyan">Go to Library</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-retro-dark p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/tools/character-rom-editor"
            className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-retro-cyan transition-colors mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Library
          </Link>
          <h1 className="text-2xl font-medium text-white">Shared Character Set</h1>
          <p className="text-gray-400 mt-1">Preview and import this character set</p>
        </div>

        {/* Character set card */}
        <div className="bg-retro-navy border border-retro-grid/50 rounded-lg overflow-hidden">
          {/* Preview header */}
          <div className="p-4 border-b border-retro-grid/30">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded bg-retro-cyan/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-retro-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg text-white font-medium truncate">{decodedSet.name}</h2>
                <p className="text-sm text-gray-400">
                  {decodedSet.characters.length} characters | {decodedSet.config.width}x{decodedSet.config.height} px
                </p>
              </div>
            </div>
            {decodedSet.description && (
              <p className="text-sm text-gray-500 mt-3">{decodedSet.description}</p>
            )}
          </div>

          {/* Character preview */}
          <div className="p-4 bg-retro-dark/30">
            <h3 className="text-xs text-gray-400 uppercase tracking-wide mb-3">Preview</h3>
            <div className="bg-retro-dark rounded border border-retro-grid/30 p-3 overflow-auto">
              <CharacterPreviewGrid
                characters={decodedSet.characters}
                config={decodedSet.config}
                maxCharacters={128}
                smallScale={2}
                foregroundColor="#00ffc8"
                backgroundColor="#000000"
              />
              {decodedSet.characters.length > 128 && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  +{decodedSet.characters.length - 128} more characters
                </p>
              )}
            </div>
          </div>

          {/* Import form */}
          <div className="p-4 border-t border-retro-grid/30">
            <div className="mb-4">
              <label className="block text-xs text-gray-400 mb-1">Save as</label>
              <input
                type="text"
                value={importName}
                onChange={(e) => setImportName(e.target.value)}
                placeholder="Character set name"
                className="w-full px-3 py-2 bg-retro-dark border border-retro-grid/50 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-retro-cyan"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleImport}
                disabled={importing}
                variant="cyan"
                className="flex-1"
              >
                {importing ? "Importing..." : "Import to Library"}
              </Button>
              <Link href="/tools/character-rom-editor">
                <Button variant="ghost">Cancel</Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Info box */}
        <div className="mt-6 p-4 bg-retro-dark/30 rounded border border-retro-grid/20">
          <h3 className="text-xs font-medium text-gray-400 mb-2">About shared character sets</h3>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>This character set was shared via URL and is not stored on any server.</li>
            <li>Importing will save a copy to your browser&apos;s local storage.</li>
            <li>The original sharer will not see your changes.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function SharedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-retro-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-retro-cyan border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-400">Loading...</span>
        </div>
      </div>
    }>
      <SharedPageContent />
    </Suspense>
  );
}
