import type React from "react";
import { useMemo } from "react";
import type { BundledLanguage, Highlighter, SpecialLanguage } from "shiki";
import { useShiki } from "../../shared/hooks/useShiki";
import type { MergeBlock } from "../../shared/models/merge";
import { calculateInlineDiffs, type InlineDiff } from "../utils/inline-diff";
import { calculateBlockLayout } from "../utils/merge-logic";

interface MergeColumnProps {
  block: MergeBlock;
  side: "left" | "center" | "right";
  language: string;
}

/** Check if this side has been decided (accepted or skipped). */
function isSideDecided(block: MergeBlock, side: string): boolean {
  if (block.state !== "conflict") return false;
  if (side === "left") return block.leftAccepted || block.leftSkipped;
  if (side === "right") return block.rightAccepted || block.rightSkipped;
  return false;
}

function getStateColor(block: MergeBlock, side: string): string {
  const { state } = block;
  if (state === "equal") return "transparent";

  // Decided side (accepted or skipped): transparent background, outline handled separately
  if (state === "conflict" && isSideDecided(block, side)) return "transparent";

  if (state === "conflict") {
    if (side === "center") return "rgba(255, 0, 0, 0.05)";
    return "rgba(255, 0, 0, 0.1)";
  }

  if (state === "modified_left" && (side === "left" || side === "center"))
    return "rgba(0, 150, 255, 0.1)";
  if (state === "modified_right" && (side === "right" || side === "center"))
    return "rgba(0, 150, 255, 0.1)";
  if (state === "modified_both" && side !== "transparent")
    return "rgba(0, 150, 255, 0.1)";

  return "transparent";
}

/** Decided sides get red dashed top/bottom borders instead of background color. */
function getDecidedBorder(
  block: MergeBlock,
  side: string,
): React.CSSProperties | undefined {
  if (block.state !== "conflict") return undefined;
  if (!isSideDecided(block, side)) return undefined;
  const border = "1px dashed rgba(255, 80, 60, 0.5)";
  return { borderTop: border, borderBottom: border };
}

/**
 * Represents a character-level span with a foreground color (from Shiki)
 * and an optional background color (from word-diff).
 */
interface MergedSpan {
  text: string;
  color?: string;
  backgroundColor?: string;
}

/**
 * Get Shiki syntax tokens for a single line, returned as character-range spans.
 */
function getShikiSpans(
  highlighter: Highlighter,
  line: string,
  language: string,
): Array<{ start: number; end: number; color?: string }> {
  const lang = normalizeShikiLang(language);
  const theme = getShikiTheme();
  const result = (() => {
    try {
      return highlighter.codeToTokens(line, {
        lang,
        theme,
      });
    } catch {
      return highlighter.codeToTokens(line, {
        lang: "typescript",
        theme,
      });
    }
  })();
  const spans: Array<{ start: number; end: number; color?: string }> = [];

  // Shiki v3 `codeToTokens` returns Token[][], older shape may include `{ tokens }`.
  const lines = Array.isArray(result)
    ? result
    : ((
        result as unknown as {
          tokens?: Array<Array<{ content: string; color?: string }>>;
        }
      ).tokens ?? []);
  const firstLine = lines[0] ?? [];

  let offset = 0;
  for (const token of firstLine) {
    spans.push({
      start: offset,
      end: offset + token.content.length,
      color: token.color,
    });
    offset += token.content.length;
  }

  return spans;
}

function getShikiTheme(): "github-light" | "github-dark" {
  if (typeof document === "undefined") return "github-dark";
  const cls = document.body.classList;
  if (cls.contains("vscode-dark") || cls.contains("vscode-high-contrast")) {
    return "github-dark";
  }
  return "github-light";
}

function normalizeShikiLang(
  language: string,
): BundledLanguage | SpecialLanguage {
  const lang = language.toLowerCase();
  if (lang === "typescriptreact") return "tsx";
  if (lang === "javascriptreact") return "jsx";
  if (lang === "plaintext") return "text";
  if (lang === "typescript") return "typescript";
  if (lang === "javascript") return "javascript";
  if (lang === "json") return "json";
  if (lang === "css") return "css";
  if (lang === "html") return "html";
  if (lang === "markdown") return "markdown";
  return "typescript";
}

/**
 * Convert word-diff tokens for a single line into character-range spans
 * with background color info. Removed tokens are skipped (they don't
 * appear in the side text).
 */
function getDiffSpans(
  diffTokens: InlineDiff[],
): Array<{ start: number; end: number; backgroundColor?: string }> {
  const spans: Array<{
    start: number;
    end: number;
    backgroundColor?: string;
  }> = [];
  let offset = 0;
  for (const token of diffTokens) {
    // Removed tokens are not present in the side text, skip them
    if (token.removed) continue;
    const bg = token.added ? "rgba(255, 100, 70, 0.35)" : undefined;
    spans.push({
      start: offset,
      end: offset + token.value.length,
      backgroundColor: bg,
    });
    offset += token.value.length;
  }
  return spans;
}

/**
 * Merge Shiki syntax spans (foreground color) with word-diff spans (background color)
 * by splitting at all boundary points so each output span carries both properties.
 */
function mergeSpans(
  shikiSpans: Array<{ start: number; end: number; color?: string }>,
  diffSpans: Array<{
    start: number;
    end: number;
    backgroundColor?: string;
  }>,
  lineText: string,
): MergedSpan[] {
  // Collect all unique boundary points
  const boundaries = new Set<number>();
  for (const s of shikiSpans) {
    boundaries.add(s.start);
    boundaries.add(s.end);
  }
  for (const s of diffSpans) {
    boundaries.add(s.start);
    boundaries.add(s.end);
  }
  boundaries.add(0);
  boundaries.add(lineText.length);

  const sorted = Array.from(boundaries).sort((a, b) => a - b);
  const result: MergedSpan[] = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    const start = sorted[i];
    const end = sorted[i + 1];
    if (start >= end || start >= lineText.length) continue;

    const text = lineText.slice(start, end);
    // Find the shiki span covering this range
    const shiki = shikiSpans.find((s) => s.start <= start && s.end >= end);
    // Find the diff span covering this range
    const diff = diffSpans.find((s) => s.start <= start && s.end >= end);

    result.push({
      text,
      color: shiki?.color,
      backgroundColor: diff?.backgroundColor,
    });
  }

  return result;
}

export const MergeColumn: React.FC<MergeColumnProps> = ({
  block,
  side,
  language,
}) => {
  const layout = calculateBlockLayout(block);
  const highlighter = useShiki();

  const { lines, paddingLines, wordDiffSourceLines } = useMemo(() => {
    let _lines: string[] = [];
    let _paddingLines = 0;
    let _wordDiffSourceLines: InlineDiff[][] | null = null;

    const leftDecided = block.leftAccepted || block.leftSkipped;
    const rightDecided = block.rightAccepted || block.rightSkipped;

    if (side === "left") {
      _lines = block.leftLines;
      _paddingLines = layout.leftPadding;
      // No word diff once this side is decided (accepted or skipped)
      if (block.state !== "equal" && !leftDecided) {
        _wordDiffSourceLines = calculateInlineDiffs(
          block.rightLines.join("\n"),
          block.leftLines.join("\n"),
        );
      }
    } else if (side === "right") {
      _lines = block.rightLines;
      _paddingLines = layout.rightPadding;
      // No word diff once this side is decided (accepted or skipped)
      if (block.state !== "equal" && !rightDecided) {
        _wordDiffSourceLines = calculateInlineDiffs(
          block.leftLines.join("\n"),
          block.rightLines.join("\n"),
        );
      }
    } else {
      _lines = block.resultLines;
      _paddingLines = layout.centerPadding;
      // Center shows word diff against the undecided side
      if (block.state !== "equal") {
        const onlyLeftDecided = leftDecided && !rightDecided;
        const onlyRightDecided = rightDecided && !leftDecided;
        if (onlyLeftDecided) {
          _wordDiffSourceLines = calculateInlineDiffs(
            block.rightLines.join("\n"),
            block.resultLines.join("\n"),
          );
        } else if (onlyRightDecided) {
          _wordDiffSourceLines = calculateInlineDiffs(
            block.leftLines.join("\n"),
            block.resultLines.join("\n"),
          );
        }
      }
    }

    return {
      lines: _lines,
      paddingLines: _paddingLines,
      wordDiffSourceLines: _wordDiffSourceLines,
    };
  }, [block, side, layout]);

  const backgroundColor = getStateColor(block, side);
  const decidedBorder = getDecidedBorder(block, side);

  const renderedLines = useMemo(() => {
    return lines.map((line, i) => {
      let content: React.ReactNode = line || " ";

      if (highlighter) {
        const shikiSpans = getShikiSpans(highlighter, line, language);

        if (wordDiffSourceLines?.[i]) {
          // Merge Shiki syntax colors with word-diff background colors
          const diffSpans = getDiffSpans(wordDiffSourceLines[i]);
          const merged = mergeSpans(shikiSpans, diffSpans, line);
          content = merged.map((span, idx) => (
            <span
              key={idx}
              style={{
                color: span.color,
                backgroundColor: span.backgroundColor,
              }}
            >
              {span.text}
            </span>
          ));
        } else if (shikiSpans.length > 0) {
          // Syntax highlighting only, no word-diff
          content = shikiSpans.map((span, idx) => (
            <span key={idx} style={{ color: span.color }}>
              {line.slice(span.start, span.end)}
            </span>
          ));
        }
      } else if (wordDiffSourceLines?.[i]) {
        // No highlighter loaded yet, fall back to word-diff only
        const diffSpans = getDiffSpans(wordDiffSourceLines[i]);
        content = diffSpans.map((span, idx) => (
          <span key={idx} style={{ backgroundColor: span.backgroundColor }}>
            {line.slice(span.start, span.end)}
          </span>
        ));
      }

      return (
        <div
          key={`line-${i}`}
          style={{
            height: "20px",
            whiteSpace: "pre",
            paddingLeft: "8px",
          }}
        >
          {content}
        </div>
      );
    });
  }, [lines, highlighter, wordDiffSourceLines, language]);

  return (
    <div
      style={{
        backgroundColor,
        ...decidedBorder,
        padding: 0,
        margin: 0,
        fontSize: "var(--editor-font-size)",
        fontFamily: "var(--editor-font)",
        lineHeight: "20px",
        width: "100%",
      }}
    >
      {/* Render actual code lines */}
      {renderedLines}

      {/* Render virtual padding to maintain alignment */}
      {Array.from({ length: paddingLines }).map((_, i) => (
        <div
          key={`pad-${i}`}
          style={{
            height: "20px",
            backgroundColor: "rgba(0,0,0,0.05)",
            width: "100%",
            position: "sticky",
            left: 0,
            backgroundImage:
              "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.03) 10px, rgba(0,0,0,0.03) 20px)",
          }}
        />
      ))}
    </div>
  );
};
