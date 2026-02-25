import { diffWordsWithSpace } from "diff";

export interface InlineDiff {
  value: string;
  added?: boolean;
  removed?: boolean;
}

/**
 * Compares two multi-line strings and maps the word-level differences back to an array of lines,
 * where each line is an array of inline tokens (added, removed, or unchanged).
 */
export function calculateInlineDiffs(
  baseText: string,
  compareText: string,
): InlineDiff[][] {
  const changes = diffWordsWithSpace(baseText, compareText);
  const lines: InlineDiff[][] = [[]];

  for (const change of changes) {
    // If we are comparing Left vs Base:
    // Left has 'added' tokens (stuff in Left not in Base)
    // Left also has 'removed' tokens (stuff in Base not in Left).
    // BUT we only want to highlight what was added/removed IN THIS SPECIFIC column vs base.

    // For a traditional 3-way view:
    // The side panel shows what it changed relative to base.
    // If it added something, we highlight it green.
    // If it removed something, the text isn't there anymore, so we can't highlight it in-line!
    // (JetBrains usually uses a chunk marker for deletion, but for inline words, we just show additions).
    // Actually, sometimes people want to see deletions struck through. Let's keep both for flexibility.

    const parts = change.value.split("\n");
    for (let i = 0; i < parts.length; i++) {
      if (i > 0) lines.push([]);
      if (parts[i]) {
        lines[lines.length - 1].push({
          value: parts[i],
          added: change.added,
          removed: change.removed,
        });
      }
    }
  }

  return lines;
}
