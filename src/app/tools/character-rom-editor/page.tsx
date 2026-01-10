import { Metadata } from "next";
import { CharacterEditorLibrary } from "./CharacterEditorLibrary";

export const metadata: Metadata = {
  title: "Character ROM Editor - RetroStack",
  description:
    "Design and edit character sets for vintage computer systems. Import, edit, and export character ROMs for C64, Apple II, ZX Spectrum, and more.",
};

export default function CharacterROMEditorPage() {
  return <CharacterEditorLibrary />;
}
