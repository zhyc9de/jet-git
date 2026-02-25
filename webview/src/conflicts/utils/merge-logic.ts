import { diffArrays } from "diff";
import { diff3MergeRegions, type IRegion } from "node-diff3";
import type { MergeBlock, MergeState } from "../../shared/models/merge";

/**
 * Generates a unique ID for a block based on its index and state.
 */
function generateBlockId(index: number, prefix: string): string {
  return `block-${prefix}-${index}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * For conflict blocks, run a secondary 2-way diff between leftLines and rightLines
 * to split into finer-grained sub-blocks:
 *   - identical line runs → equal sub-blocks
 *   - differing line runs → conflict sub-blocks
 *
 * This fixes the issue where diff3 with empty base lumps shared content
 * into one big conflict.
 */
function refineConflictBlock(
  block: MergeBlock,
  blockIndex: number,
): MergeBlock[] {
  const changes = diffArrays(block.leftLines, block.rightLines);

  const subBlocks: MergeBlock[] = [];
  let subIdx = 0;

  let i = 0;
  while (i < changes.length) {
    const change = changes[i];

    if (!change.added && !change.removed) {
      // Equal lines — both sides are the same
      const lines = change.value;
      subBlocks.push({
        id: generateBlockId(blockIndex * 1000 + subIdx++, "equal"),
        state: "equal",
        baseLines: lines,
        leftLines: lines,
        rightLines: lines,
        resultLines: [...lines],
        isResolved: true,
        leftAccepted: false,
        rightAccepted: false,
        leftSkipped: false,
        rightSkipped: false,
      });
      i++;
    } else {
      // Collect consecutive removed + added as a conflict pair
      let leftLines: string[] = [];
      let rightLines: string[] = [];

      if (change.removed) {
        leftLines = change.value;
        i++;
        if (i < changes.length && changes[i].added) {
          rightLines = changes[i].value;
          i++;
        }
      } else if (change.added) {
        rightLines = change.value;
        i++;
      }

      subBlocks.push({
        id: generateBlockId(blockIndex * 1000 + subIdx++, "conflict"),
        state: "conflict",
        baseLines: [],
        leftLines,
        rightLines,
        resultLines: [],
        isResolved: false,
        leftAccepted: false,
        rightAccepted: false,
        leftSkipped: false,
        rightSkipped: false,
      });
    }
  }

  return subBlocks;
}

/**
 * Parses three versions of a file into an array of MergeBlock structures.
 *
 * @param base Base/Ancestor format string
 * @param left Left/Theirs format string
 * @param right Right/Yours format string
 * @returns Array of parsed MergeBlocks ready for UI rendering
 */
export function parseMergeBlocks(
  base: string,
  left: string,
  right: string,
): MergeBlock[] {
  // node-diff3 expects arrays of lines
  const baseLines = base.split("\n");
  const leftLines = left.split("\n");
  const rightLines = right.split("\n");

  // We are using diff3MergeRegions to get exact chunks
  // The typing of node-diff3 might vary, usually a is left, o is base, b is right.
  const regions = diff3MergeRegions(leftLines, baseLines, rightLines);

  const blocks: MergeBlock[] = [];

  regions.forEach((region: IRegion<string>, index: number) => {
    // region.stable = true means it's equal in all three
    if (region.stable) {
      blocks.push({
        id: generateBlockId(index, "equal"),
        state: "equal",
        baseLines: region.bufferContent || [],
        leftLines: region.bufferContent || [],
        rightLines: region.bufferContent || [],
        resultLines: region.bufferContent || [],
        isResolved: true, // Equal blocks are implicitly resolved
        leftAccepted: false,
        rightAccepted: false,
        leftSkipped: false,
        rightSkipped: false,
      });
      return;
    }

    // Unstable region means there's a difference
    // node-diff3 diff3MergeRegions provides:
    // aContent (left), oContent (base), bContent (right)

    const bLines = region.oContent || [];
    const lLines = region.aContent || [];
    const rLines = region.bContent || [];

    // Determine the specific state
    let state: MergeState = "conflict";

    const leftChanged = JSON.stringify(bLines) !== JSON.stringify(lLines);
    const rightChanged = JSON.stringify(bLines) !== JSON.stringify(rLines);
    const bothChangedSame =
      leftChanged &&
      rightChanged &&
      JSON.stringify(lLines) === JSON.stringify(rLines);

    if (bothChangedSame) {
      state = "modified_both";
    } else if (leftChanged && !rightChanged) {
      state = "modified_left";
    } else if (!leftChanged && rightChanged) {
      state = "modified_right";
    } else if (leftChanged && rightChanged) {
      state = "conflict";
    } else {
      // Fallback, should theoretically be stable if none changed
      state = "equal";
    }

    // Default result lines for non-conflict is the changed side;
    // For conflict, start with base content so the center column is not empty.
    let defaultResultLines: string[] = [...bLines];
    let implicitlyResolved = false;

    if (state === "modified_left") {
      defaultResultLines = [...lLines];
      implicitlyResolved = true;
    } else if (state === "modified_right") {
      defaultResultLines = [...rLines];
      implicitlyResolved = true;
    } else if (state === "modified_both") {
      defaultResultLines = [...lLines]; // either is fine
      implicitlyResolved = true;
    }

    const block: MergeBlock = {
      id: generateBlockId(index, state),
      state,
      baseLines: bLines,
      leftLines: lLines,
      rightLines: rLines,
      resultLines: defaultResultLines,
      isResolved: implicitlyResolved,
      leftAccepted: false,
      rightAccepted: false,
      leftSkipped: false,
      rightSkipped: false,
    };

    // For conflict blocks, refine by doing a 2-way diff between left and right
    // to extract shared lines as equal sub-blocks
    if (state === "conflict") {
      const refined = refineConflictBlock(block, index);
      blocks.push(...refined);
    } else {
      blocks.push(block);
    }
  });

  return blocks;
}

/**
 * Calculates layout padding for a block to ensure absolute 3-way alignment.
 */
export function calculateBlockLayout(block: MergeBlock) {
  const leftLineCount = block.leftLines.length;
  const rightLineCount = block.rightLines.length;
  const centerLineCount = block.resultLines.length;

  const maxLines = Math.max(leftLineCount, rightLineCount, centerLineCount);

  return {
    totalHeight: maxLines,
    leftPadding: maxLines - leftLineCount,
    rightPadding: maxLines - rightLineCount,
    centerPadding: maxLines - centerLineCount,
  };
}
