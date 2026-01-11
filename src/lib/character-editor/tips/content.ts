/**
 * Tips & Tricks Content
 *
 * Comprehensive tips and guidance for the Character ROM Editor.
 * Organized into categories covering all major features.
 *
 * @module lib/character-editor/tips/content
 */

import { TipCategory } from "./types";

/**
 * All tip categories with their tips
 */
export const TIPS_CATEGORIES: TipCategory[] = [
  // ==========================================================================
  // Category 1: Drawing Tools
  // ==========================================================================
  {
    id: "drawing",
    title: "Drawing Tools",
    icon: "pencil",
    description: "Master the pixel editing canvas",
    defaultExpanded: true,
    tips: [
      {
        id: "click-toggle",
        title: "Click to Toggle Pixels",
        description:
          "Click any pixel on the canvas to toggle it between foreground and background colors. This is the most basic drawing operation - simple clicks let you place individual pixels with precision.",
      },
      {
        id: "drag-paint",
        title: "Drag to Paint",
        description:
          "Hold the mouse button and drag across the canvas to paint multiple pixels in a single stroke. Great for drawing lines, curves, and filling in larger areas quickly. The paint operation continues as long as you hold the button.",
      },
      {
        id: "right-click-erase",
        title: "Right-Click to Erase",
        description:
          "Right-click and drag to erase pixels (set them to background color) without switching tools. This two-button approach lets you quickly alternate between drawing and erasing without any mode changes.",
      },
      {
        id: "zoom-controls",
        title: "Zoom for Precision",
        description:
          "Use the zoom slider in the header or scroll your mouse wheel over the canvas to zoom in and out. Higher zoom levels are great for detailed pixel work, while zoomed out gives you a better view of the overall character shape.",
      },
      {
        id: "grid-visibility",
        title: "Adaptive Grid",
        description:
          "The pixel grid automatically adjusts its visibility based on your zoom level. At lower zoom levels, the grid fades to give you a cleaner view of the character. Zoom in to see individual pixel boundaries clearly.",
      },
      {
        id: "color-presets",
        title: "Color Presets",
        description:
          "Choose from various color presets in the header to change the foreground and background colors. Different color schemes can help you visualize how your characters will look on different systems - from classic green phosphor to amber CRT to modern high-contrast displays.",
      },
    ],
  },

  // ==========================================================================
  // Category 2: Character Navigation
  // ==========================================================================
  {
    id: "navigation",
    title: "Character Navigation",
    icon: "navigation",
    description: "Navigate through your character set efficiently",
    tips: [
      {
        id: "arrow-keys",
        title: "Arrow Key Navigation",
        description:
          "Use the Left and Right arrow keys to move between characters in your set. Navigation wraps around - pressing Right on the last character takes you to the first, and Left on the first takes you to the last.",
        shortcut: "Left/Right",
      },
      {
        id: "page-navigation",
        title: "Page Navigation",
        description:
          "Press Page Up or Page Down to jump 16 characters at a time. This is perfect for quickly navigating through large character sets, especially when looking for specific character ranges like uppercase letters, lowercase, or symbols.",
        shortcut: "PageUp/PageDown",
      },
      {
        id: "home-end",
        title: "Jump to Start or End",
        description:
          "Press Home to instantly jump to the first character (index 0), or End to jump to the last character in your set. Useful when you need to quickly get to the beginning or end of your character set.",
        shortcut: "Home/End",
      },
      {
        id: "go-to-dialog",
        title: "Go To Character",
        description:
          "Press G to open the Go To dialog where you can enter a specific character index (0-255) or hexadecimal value (00-FF) to jump directly to that character. You can also enter an ASCII character to find its position.",
        shortcut: "G",
      },
      {
        id: "ascii-map",
        title: "ASCII Map View",
        description:
          "Press M to open the ASCII Map - a complete grid showing all characters with their decimal and hex codes. Click any character in the map to select it for editing. Great for finding specific characters or getting an overview of your entire set.",
        shortcut: "M",
      },
      {
        id: "sidebar-click",
        title: "Sidebar Character Grid",
        description:
          "The sidebar shows a scrollable grid of all characters in your set. Click any character thumbnail to immediately select and edit it. The current character is highlighted, and the sidebar scrolls to keep your selection visible.",
      },
    ],
  },

  // ==========================================================================
  // Category 3: Transform Tools
  // ==========================================================================
  {
    id: "transform",
    title: "Transform Tools",
    icon: "transform",
    description: "Rotate, flip, shift, and modify characters",
    tips: [
      {
        id: "rotate",
        title: "Rotate Characters",
        description:
          "Press [ (left bracket) to rotate the character 90 degrees counter-clockwise, or ] (right bracket) to rotate clockwise. Multiple rotations let you orient characters in any direction. Works on selected characters in batch mode too.",
        shortcut: "[ / ]",
      },
      {
        id: "flip",
        title: "Flip Operations",
        description:
          "Press H to flip horizontally (mirror left-to-right) or V to flip vertically (mirror top-to-bottom). Flipping is perfect for creating mirrored versions of characters or fixing orientation issues.",
        shortcut: "H / V",
      },
      {
        id: "shift-pixels",
        title: "Shift Pixels",
        description:
          "Use Shift + Arrow keys to move all pixels in the character one position in that direction. Pixels that move off one edge wrap around to the opposite edge. Great for repositioning characters within their grid.",
        shortcut: "Shift+Arrows",
      },
      {
        id: "invert",
        title: "Invert Colors",
        description:
          "Press I to invert all pixels in the character - foreground becomes background and vice versa. This creates an inverse video effect, useful for highlighted or selected-state characters.",
        shortcut: "I",
      },
      {
        id: "clear-fill",
        title: "Clear and Fill",
        description:
          "The transform toolbar on the right side has Clear (empties all pixels) and Fill (sets all pixels) buttons. Clear is useful for starting fresh, while Fill creates a solid block character.",
      },
      {
        id: "center",
        title: "Center Character",
        description:
          "The Center button automatically repositions your character to be centered within the grid. Useful after importing or when pixels have drifted to one side. Found in the transform toolbar.",
      },
      {
        id: "scale",
        title: "Scale Characters",
        description:
          "Scale your character up or down using different algorithms. Nearest neighbor preserves hard pixel edges (best for pixel art), while bilinear smoothing creates anti-aliased results. Access via the toolbar.",
      },
    ],
  },

  // ==========================================================================
  // Category 4: Batch Selection
  // ==========================================================================
  {
    id: "selection",
    title: "Batch Selection",
    icon: "layers",
    description: "Select and modify multiple characters at once",
    tips: [
      {
        id: "ctrl-select",
        title: "Multi-Select with Ctrl",
        description:
          "Hold Ctrl (or Cmd on Mac) and click characters in the sidebar to add them to your selection. Each click toggles that character's selection state. Build up a selection of non-contiguous characters for batch operations.",
        shortcut: "Ctrl+Click",
      },
      {
        id: "shift-range",
        title: "Range Select with Shift",
        description:
          "Click a character, then Shift+click another to select all characters between them (inclusive). This is the fastest way to select a contiguous range like all uppercase letters or all digits.",
        shortcut: "Shift+Click",
      },
      {
        id: "select-all",
        title: "Select All Characters",
        description:
          "Press Ctrl+A (or Cmd+A on Mac) to select every character in your set. Useful when you want to apply a transform to the entire character set at once.",
        shortcut: "Ctrl+A",
      },
      {
        id: "batch-transforms",
        title: "Batch Transforms",
        description:
          "When multiple characters are selected, all transform operations (rotate, flip, invert, shift, etc.) apply to every selected character simultaneously. This lets you maintain consistency across related characters.",
      },
      {
        id: "long-press",
        title: "Long-Press Selection (Touch)",
        description:
          "On touch devices, long-press (hold for about 500ms) on any character to enter selection mode. Once in selection mode, tap characters to toggle their selection. A floating action bar appears with batch operations.",
      },
      {
        id: "selection-bar",
        title: "Selection Mode Bar",
        description:
          "When multiple characters are selected, a floating bar appears showing the selection count and quick action buttons. Use it to apply transforms, copy, delete, or clear your selection. Press Escape to exit selection mode.",
      },
      {
        id: "drag-select",
        title: "Drag to Select",
        description:
          "In selection mode, drag across the character grid to select multiple characters in one motion. This rubber-band selection works like selecting files in a file manager - fast and intuitive.",
      },
    ],
  },

  // ==========================================================================
  // Category 5: Keyboard Shortcuts
  // ==========================================================================
  {
    id: "shortcuts",
    title: "Keyboard Shortcuts",
    icon: "keyboard",
    description: "Speed up your workflow with keyboard shortcuts",
    tips: [
      {
        id: "help-dialog",
        title: "View All Shortcuts",
        description:
          "Press ? (question mark) at any time to open the complete keyboard shortcuts reference. This modal shows all available shortcuts organized by context - editor, sidebar, and global shortcuts.",
        shortcut: "?",
      },
      {
        id: "undo-redo",
        title: "Undo and Redo",
        description:
          "Press Ctrl+Z to undo your last action, or Ctrl+Y (or Ctrl+Shift+Z) to redo. The editor maintains a full history of your changes with descriptions, so you can step back through your entire editing session.",
        shortcut: "Ctrl+Z / Ctrl+Y",
      },
      {
        id: "save-shortcuts",
        title: "Save Shortcuts",
        description:
          "Press Ctrl+S to save your current character set. Use Ctrl+Alt+S to open the Save As dialog for creating a copy with a new name. Your work is also auto-saved periodically.",
        shortcut: "Ctrl+S",
      },
      {
        id: "quick-actions",
        title: "Single-Key Actions",
        description:
          "Many common actions have single-key shortcuts: I (invert), N (notes), T (text preview), E (export), G (go to), M (ASCII map). These work when focus is on the editor canvas.",
      },
      {
        id: "escape-key",
        title: "Escape to Cancel",
        description:
          "Press Escape to close any open modal, exit selection mode, or cancel the current operation. It's the universal 'cancel' action throughout the editor.",
        shortcut: "Escape",
      },
    ],
  },

  // ==========================================================================
  // Category 6: Overlays & Comparison
  // ==========================================================================
  {
    id: "overlay",
    title: "Overlays & Comparison",
    icon: "overlay",
    description: "Compare and trace from other character sets",
    tips: [
      {
        id: "overlay-feature",
        title: "Character Set Overlay",
        description:
          "Load another character set as a transparent overlay on your canvas for tracing or comparison. Click the Overlay button in the toolbar to select a reference set. The overlay appears semi-transparent so you can see both your work and the reference.",
      },
      {
        id: "overlay-modes",
        title: "Three Overlay Modes",
        description:
          "Choose between overlay modes: '1:1 Pixels' shows the reference at exact pixel scale (best for same-size sets), 'Stretch' scales the reference to fit your canvas, and 'Side by Side' shows both characters next to each other for direct comparison.",
      },
      {
        id: "similar-sets",
        title: "Find Similar Sets",
        description:
          "Click the 'Similar' button in the toolbar to find character sets with similar dimensions to your current set. This helps you find compatible sets for overlay comparison or to use as references.",
      },
      {
        id: "toggle-overlay",
        title: "Quick Toggle",
        description:
          "Once an overlay is configured, click the Overlay button again to quickly toggle it on and off. The overlay settings are preserved, so you can easily switch between reference view and clean editing.",
      },
    ],
  },

  // ==========================================================================
  // Category 7: Saving & History
  // ==========================================================================
  {
    id: "saving",
    title: "Saving & History",
    icon: "save",
    description: "Save your work and navigate history",
    tips: [
      {
        id: "autosave",
        title: "Auto-Save Recovery",
        description:
          "The editor automatically saves your work in progress. If your browser closes unexpectedly or you navigate away, you'll be prompted to recover your unsaved changes when you return. Your work is never lost.",
      },
      {
        id: "snapshots",
        title: "Named Snapshots",
        description:
          "Save named snapshots of your character set at any point. Unlike undo history, snapshots persist across sessions and can be given descriptive names. Restore a full snapshot or selectively restore just specific characters.",
      },
      {
        id: "history-timeline",
        title: "Visual History",
        description:
          "The undo/redo system tracks all your changes with timestamps and descriptions. Each action is recorded so you can step back through your entire editing session and see exactly what changed at each step.",
      },
      {
        id: "builtin-readonly",
        title: "Built-In Sets are Read-Only",
        description:
          "Built-in character sets (like C64, Apple II, etc.) are read-only to preserve the originals. To modify them, use 'Save As' to create your own editable copy. Your copy will appear in your library alongside the built-ins.",
      },
      {
        id: "notes",
        title: "Character Set Notes",
        description:
          "Press N to add notes and annotations to any character set. Notes are saved with your set and can include information about the design, intended use, or any other details you want to remember.",
        shortcut: "N",
      },
    ],
  },

  // ==========================================================================
  // Category 8: Import & Export
  // ==========================================================================
  {
    id: "export",
    title: "Import & Export",
    icon: "export",
    description: "Import from and export to various formats",
    tips: [
      {
        id: "export-formats",
        title: "Multiple Export Formats",
        description:
          "Export your character set as: binary ROM files (ready to burn), C header files, assembly source, PNG images of individual characters or the full set, and printable PDF reference sheets. Each format is optimized for its use case.",
        shortcut: "E",
      },
      {
        id: "import-sources",
        title: "Import From Many Sources",
        description:
          "Import characters from: ROM binary files, PNG grid images (auto-detects character boundaries), font files (TTF, OTF, WOFF), or paste C/assembly code directly. The import wizard guides you through each format.",
      },
      {
        id: "share-links",
        title: "Shareable Links",
        description:
          "Generate a shareable URL that encodes your entire character set. Recipients can open the link to view and import your characters directly - no file downloads needed. Great for sharing on forums or social media.",
      },
      {
        id: "text-preview",
        title: "Text Preview",
        description:
          "Press T to open the text preview panel where you can type sample text and see how it renders with your character set. Includes CRT effects simulation to see how your characters look on vintage displays.",
        shortcut: "T",
      },
      {
        id: "color-export",
        title: "Color Options in Export",
        description:
          "When exporting to PNG or PDF, you can choose custom foreground and background colors. The exported files will use your chosen color scheme, letting you create reference materials that match your target system's display.",
      },
      {
        id: "qr-sharing",
        title: "QR Code Sharing",
        description:
          "Generate a QR code for your shareable link. This is perfect for sharing your character set at meetups, in printed materials, or anywhere you want quick mobile access. Scan the code to instantly load the character set.",
      },
    ],
  },
];
