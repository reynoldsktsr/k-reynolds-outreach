import { JSX as JSX_2 } from 'react';
import { ReactNode } from 'react';

/**
 * Convenience helper for scoring a command-like item against several
 * candidate strings (e.g. label + keywords), returning the best score
 * and the indices for the field that produced it.
 */
export declare function bestFuzzyMatch(candidates: string[], query: string): FuzzyMatchResult & {
    candidateIndex: number;
};

/**
 * A single entry in the command palette.
 */
export declare interface Command {
    /** Stable unique identifier for the command. */
    id: string;
    /** Text shown in the list, and matched against as the user types. */
    label: string;
    /** Optional group heading commands are clustered under. */
    group?: string;
    /** Optional leading icon, e.g. an SVG or an icon-library element. */
    icon?: ReactNode;
    /** Optional shortcut hint rendered on the right, e.g. "G then D". */
    shortcut?: string;
    /** Extra terms matched against but not displayed, for synonyms. */
    keywords?: string[];
    /** Optional secondary line rendered under the label. */
    description?: string;
    /** Called when the command is selected. The palette closes after. */
    action: () => void;
}

/**
 * A keyboard-driven command palette overlay. Render it once, controlled
 * by `open`/`onClose` (see `useCommandPalette`), and pass the list of
 * commands it should search and run.
 */
export declare function CommandPalette({ open, onClose, commands, placeholder, emptyMessage, className, }: CommandPaletteProps): JSX_2.Element | null;

export declare interface CommandPaletteProps {
    /** Whether the palette is open. */
    open: boolean;
    /** Called when the palette should close (Escape, click-outside, or after running a command). */
    onClose: () => void;
    /** The commands available to search and run. */
    commands: Command[];
    /** Placeholder text for the search input. Defaults to "Type a command or search...". */
    placeholder?: string;
    /** Text shown when no commands match the query. */
    emptyMessage?: string;
    /** Extra class names applied to the palette's outer container. */
    className?: string;
}

/**
 * Fuzzy-matches `query` against `text`, returning a score and the
 * indices that matched so callers can highlight them.
 */
export declare function fuzzyMatch(text: string, query: string): FuzzyMatchResult;

/**
 * Small, dependency-free fuzzy matcher.
 *
 * Scores how well a `query` matches a `text` by finding the query's
 * characters in the text, in order, allowing gaps. It rewards
 * consecutive matches, matches at the start of a word, and matches
 * near the beginning of the string, which is generally the behavior
 * people expect from tools like Spotlight, Sublime's "Go to File", or
 * VS Code's command palette.
 */
export declare interface FuzzyMatchResult {
    /** Whether every character in the query was found, in order. */
    matched: boolean;
    /** Higher is a better match. 0 when there is no match. */
    score: number;
    /** Indices into `text` that matched a query character, for highlighting. */
    matchedIndices: number[];
}

/**
 * Manages open/close state for a CommandPalette and wires up the
 * global Cmd/Ctrl+K shortcut to toggle it.
 *
 * @example
 * const palette = useCommandPalette();
 * <CommandPalette open={palette.open} onClose={palette.closePalette} commands={commands} />
 */
export declare function useCommandPalette(options?: UseCommandPaletteOptions): UseCommandPaletteResult;

export declare interface UseCommandPaletteOptions {
    /** Start open. Defaults to false. */
    defaultOpen?: boolean;
    /**
     * Keyboard shortcut key that combines with Cmd (macOS) / Ctrl
     * (other platforms) to toggle the palette. Defaults to "k".
     */
    shortcutKey?: string;
}

export declare interface UseCommandPaletteResult {
    open: boolean;
    setOpen: (open: boolean) => void;
    openPalette: () => void;
    closePalette: () => void;
    togglePalette: () => void;
}

export { }
