import type React from "react";
import type { MergeBlock } from "../../shared/models/merge";
import { useMergeStore } from "../../shared/store/merge-store";
import { calculateBlockLayout } from "../utils/merge-logic";

interface MergeGutterProps {
  block: MergeBlock;
  position: "left-center" | "center-right";
  lineOffsets: {
    left: number;
    center: number;
    right: number;
  };
}

const LINE_HEIGHT = 20;

const lineNoStyle: React.CSSProperties = {
  color: "var(--line-number-fg, #858585)",
  fontSize: "var(--editor-font-size, 12px)",
  fontFamily: "var(--editor-font, monospace)",
  lineHeight: `${LINE_HEIGHT}px`,
  textAlign: "right",
  userSelect: "none",
  whiteSpace: "nowrap",
  minWidth: "28px",
  paddingRight: "4px",
  paddingLeft: "4px",
};

const btnBase: React.CSSProperties = {
  cursor: "pointer",
  padding: 0,
  fontSize: "16px",
  lineHeight: `${LINE_HEIGHT}px`,
  background: "none",
  border: "none",
  fontFamily: "var(--editor-font, monospace)",
  flexShrink: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "18px",
  height: `${LINE_HEIGHT}px`,
  pointerEvents: "auto",
};

const acceptBtnStyle: React.CSSProperties = {
  ...btnBase,
  color: "var(--link-fg, #4ea1f0)",
};

const rejectBtnStyle: React.CSSProperties = {
  ...btnBase,
  color: "var(--error-fg, #f44747)",
};

export const MergeGutter: React.FC<MergeGutterProps> = ({
  block,
  position,
  lineOffsets,
}) => {
  const layout = calculateBlockLayout(block);
  const { acceptLeft, acceptRight, skipLeft, skipRight, undo } =
    useMergeStore();

  const isConflict = block.state === "conflict";

  let innerLineCount: number;
  let outerLineCount: number;
  let innerStartLine: number;
  let outerStartLine: number;

  if (position === "left-center") {
    outerLineCount = block.leftLines.length;
    innerLineCount = block.resultLines.length;
    outerStartLine = lineOffsets.left;
    innerStartLine = lineOffsets.center;
  } else {
    innerLineCount = block.resultLines.length;
    outerLineCount = block.rightLines.length;
    innerStartLine = lineOffsets.center;
    outerStartLine = lineOffsets.right;
  }

  const totalRows = layout.totalHeight;

  // Build action buttons for the first row of conflict blocks
  let actionBtns: React.ReactNode = null;
  if (isConflict) {
    if (position === "left-center") {
      const decided = block.leftAccepted || block.leftSkipped;
      if (!decided) {
        actionBtns = (
          <>
            <button
              type="button"
              onClick={() => skipLeft(block.id)}
              style={rejectBtnStyle}
              title="Skip left"
            >
              ×
            </button>
            <button
              type="button"
              onClick={() => acceptLeft(block.id)}
              style={acceptBtnStyle}
              title="Accept left"
            >
              »
            </button>
          </>
        );
      } else {
        actionBtns = (
          <button
            type="button"
            onClick={() => undo(block.id, "left")}
            style={acceptBtnStyle}
            title="Undo"
          >
            ↩
          </button>
        );
      }
    } else {
      const decided = block.rightAccepted || block.rightSkipped;
      if (!decided) {
        actionBtns = (
          <>
            <button
              type="button"
              onClick={() => acceptRight(block.id)}
              style={acceptBtnStyle}
              title="Accept right"
            >
              «
            </button>
            <button
              type="button"
              onClick={() => skipRight(block.id)}
              style={rejectBtnStyle}
              title="Skip right"
            >
              ×
            </button>
          </>
        );
      } else {
        actionBtns = (
          <button
            type="button"
            onClick={() => undo(block.id, "right")}
            style={acceptBtnStyle}
            title="Undo"
          >
            ↩
          </button>
        );
      }
    }
  }

  const rows: React.ReactNode[] = [];

  for (let i = 0; i < totalRows; i++) {
    const isOuterReal = i < outerLineCount;
    const isInnerReal = i < innerLineCount;

    const outerLineNo = isOuterReal ? outerStartLine + i : null;
    const innerLineNo = isInnerReal ? innerStartLine + i : null;

    // Actions only on first row
    const rowActions = i === 0 ? actionBtns : null;

    if (position === "left-center") {
      // Layout: [outerLineNo] [actions] [innerLineNo]
      rows.push(
        <div
          key={i}
          style={{
            display: "flex",
            height: `${LINE_HEIGHT}px`,
            alignItems: "center",
          }}
        >
          <span style={lineNoStyle}>
            {outerLineNo != null ? outerLineNo : ""}
          </span>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              minWidth: "36px",
            }}
          >
            {rowActions}
          </span>
          <span style={{ ...lineNoStyle, textAlign: "left" }}>
            {innerLineNo != null ? innerLineNo : ""}
          </span>
        </div>,
      );
    } else {
      // Layout: [innerLineNo] [actions] [outerLineNo]
      rows.push(
        <div
          key={i}
          style={{
            display: "flex",
            height: `${LINE_HEIGHT}px`,
            alignItems: "center",
          }}
        >
          <span style={lineNoStyle}>
            {innerLineNo != null ? innerLineNo : ""}
          </span>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              minWidth: "36px",
            }}
          >
            {rowActions}
          </span>
          <span style={{ ...lineNoStyle, textAlign: "left" }}>
            {outerLineNo != null ? outerLineNo : ""}
          </span>
        </div>,
      );
    }
  }

  return (
    <div
      style={{
        height: `${totalRows * LINE_HEIGHT}px`,
      }}
    >
      {rows}
    </div>
  );
};
