import { create } from "zustand";
import type { MergeBlock } from "../models/merge";

/** Check if a side has been decided (accepted or skipped). */
function leftDecided(b: MergeBlock) {
  return b.leftAccepted || b.leftSkipped;
}
function rightDecided(b: MergeBlock) {
  return b.rightAccepted || b.rightSkipped;
}

interface MergeStoreState {
  blocks: MergeBlock[];
  initialBlocks: MergeBlock[];
  language: string;
  isDirty: boolean;
  setBlocks: (blocks: MergeBlock[], language?: string) => void;
  acceptLeft: (id: string) => void;
  acceptRight: (id: string) => void;
  skipLeft: (id: string) => void;
  skipRight: (id: string) => void;
  undo: (id: string, side: "left" | "right") => void;
  acceptAllLeft: () => void;
  acceptAllRight: () => void;
  resetToInitial: () => void;
}

/** Build resultLines from the current accept state. */
function buildResult(
  block: MergeBlock,
  overrides: Partial<MergeBlock> = {},
): string[] {
  const la = overrides.leftAccepted ?? block.leftAccepted;
  const ra = overrides.rightAccepted ?? block.rightAccepted;
  const parts: string[] = [];
  if (la) parts.push(...block.leftLines);
  if (ra) parts.push(...block.rightLines);
  if (parts.length === 0) return [...block.baseLines];
  return parts;
}

/** Check if any conflict block has been decided compared to initial state. */
function computeIsDirty(blocks: MergeBlock[], initial: MergeBlock[]): boolean {
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    const ib = initial[i];
    if (!b || !ib) continue;
    if (b.state !== "conflict") continue;
    if (
      b.leftAccepted !== ib.leftAccepted ||
      b.rightAccepted !== ib.rightAccepted ||
      b.leftSkipped !== ib.leftSkipped ||
      b.rightSkipped !== ib.rightSkipped
    ) {
      return true;
    }
  }
  return false;
}

export const useMergeStore = create<MergeStoreState>((set) => ({
  blocks: [],
  initialBlocks: [],
  language: "plaintext",
  isDirty: false,

  setBlocks: (blocks, language = "plaintext") =>
    set({
      blocks,
      initialBlocks: blocks.map((b) => ({ ...b })),
      language,
      isDirty: false,
    }),

  acceptLeft: (id) =>
    set((state) => {
      const blocks = state.blocks.map((block) => {
        if (block.id !== id) return block;
        const next = { ...block, leftAccepted: true, leftSkipped: false };
        next.resultLines = buildResult(block, next);
        next.isResolved = leftDecided(next) && rightDecided(next);
        return next;
      });
      return { blocks, isDirty: computeIsDirty(blocks, state.initialBlocks) };
    }),

  acceptRight: (id) =>
    set((state) => {
      const blocks = state.blocks.map((block) => {
        if (block.id !== id) return block;
        const next = { ...block, rightAccepted: true, rightSkipped: false };
        next.resultLines = buildResult(block, next);
        next.isResolved = leftDecided(next) && rightDecided(next);
        return next;
      });
      return { blocks, isDirty: computeIsDirty(blocks, state.initialBlocks) };
    }),

  skipLeft: (id) =>
    set((state) => {
      const blocks = state.blocks.map((block) => {
        if (block.id !== id) return block;
        const next = { ...block, leftSkipped: true, leftAccepted: false };
        next.resultLines = buildResult(block, next);
        next.isResolved = leftDecided(next) && rightDecided(next);
        return next;
      });
      return { blocks, isDirty: computeIsDirty(blocks, state.initialBlocks) };
    }),

  skipRight: (id) =>
    set((state) => {
      const blocks = state.blocks.map((block) => {
        if (block.id !== id) return block;
        const next = { ...block, rightSkipped: true, rightAccepted: false };
        next.resultLines = buildResult(block, next);
        next.isResolved = leftDecided(next) && rightDecided(next);
        return next;
      });
      return { blocks, isDirty: computeIsDirty(blocks, state.initialBlocks) };
    }),

  undo: (id, side) =>
    set((state) => {
      const blocks = state.blocks.map((block) => {
        if (block.id !== id) return block;
        if (side === "left" && (block.leftAccepted || block.leftSkipped)) {
          const next = { ...block, leftAccepted: false, leftSkipped: false };
          next.resultLines = buildResult(block, next);
          next.isResolved = false;
          return next;
        }
        if (side === "right" && (block.rightAccepted || block.rightSkipped)) {
          const next = { ...block, rightAccepted: false, rightSkipped: false };
          next.resultLines = buildResult(block, next);
          next.isResolved = false;
          return next;
        }
        return block;
      });
      return { blocks, isDirty: computeIsDirty(blocks, state.initialBlocks) };
    }),

  acceptAllLeft: () =>
    set((state) => {
      const blocks = state.blocks.map((block) => {
        if (block.state !== "conflict") return block;
        const next = { ...block, leftAccepted: true, leftSkipped: false };
        next.resultLines = buildResult(block, next);
        next.isResolved = leftDecided(next) && rightDecided(next);
        return next;
      });
      return { blocks, isDirty: computeIsDirty(blocks, state.initialBlocks) };
    }),

  acceptAllRight: () =>
    set((state) => {
      const blocks = state.blocks.map((block) => {
        if (block.state !== "conflict") return block;
        const next = { ...block, rightAccepted: true, rightSkipped: false };
        next.resultLines = buildResult(block, next);
        next.isResolved = leftDecided(next) && rightDecided(next);
        return next;
      });
      return { blocks, isDirty: computeIsDirty(blocks, state.initialBlocks) };
    }),

  resetToInitial: () =>
    set((state) => ({
      blocks: state.initialBlocks.map((b) => ({ ...b })),
      isDirty: false,
    })),
}));
