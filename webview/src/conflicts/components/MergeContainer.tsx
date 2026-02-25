import type React from "react";
import { useEffect, useMemo, useRef } from "react";
import type { MergeBlock } from "../../shared/models/merge";
import { useMergeStore } from "../../shared/store/merge-store";
import { MergeColumn } from "./MergeColumn";
import { MergeGutter } from "./MergeGutter";

/**
 * Compute cumulative 1-based line offsets for each block.
 * Padding lines do NOT count towards line numbering.
 */
function computeLineOffsets(blocks: MergeBlock[]) {
  const offsets: Array<{ left: number; center: number; right: number }> = [];
  let leftLine = 1;
  let centerLine = 1;
  let rightLine = 1;

  for (const block of blocks) {
    offsets.push({ left: leftLine, center: centerLine, right: rightLine });
    leftLine += block.leftLines.length;
    centerLine += block.resultLines.length;
    rightLine += block.rightLines.length;
  }

  return offsets;
}

const headerStyle: React.CSSProperties = {
  padding: "8px",
  fontWeight: "bold",
  borderBottom: "1px solid var(--border)",
  position: "sticky",
  top: 0,
  backgroundColor: "var(--app-bg)",
  zIndex: 1,
};

/** Scrollable but not by user interaction — only programmatic via ref */
const gutterScrollStyle: React.CSSProperties = {
  overflow: "auto",
  scrollbarWidth: "none", // Firefox
  msOverflowStyle: "none", // IE/Edge
  pointerEvents: "none",
};

interface MergeContainerProps {
  activeBlockId?: string;
  onClearActive?: () => void;
}

export const MergeContainer: React.FC<MergeContainerProps> = ({
  activeBlockId,
  onClearActive,
}) => {
  const { blocks, language } = useMergeStore();

  const lineOffsets = useMemo(() => computeLineOffsets(blocks), [blocks]);

  const leftRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const leftGutterRef = useRef<HTMLDivElement>(null);
  const rightGutterRef = useRef<HTMLDivElement>(null);

  // Block element refs for scroll-to-conflict
  const blockRefMap = useRef<Map<string, HTMLDivElement>>(new Map());
  const setBlockRef = (id: string, el: HTMLDivElement | null) => {
    if (el) blockRefMap.current.set(id, el);
    else blockRefMap.current.delete(id);
  };

  // Scroll all columns to active conflict block
  useEffect(() => {
    if (!activeBlockId) return;
    const el = blockRefMap.current.get(activeBlockId);
    const container = centerRef.current;
    if (!el || !container) return;
    // Compute target scrollTop so the block is vertically centered
    const elTop = el.offsetTop;
    const elHeight = el.offsetHeight;
    const viewHeight = container.clientHeight;
    const targetScrollTop = elTop - viewHeight / 2 + elHeight / 2;
    // Set center column — the onScroll handler will sync left/right/gutters
    container.scrollTop = Math.max(0, targetScrollTop);
  }, [activeBlockId]);

  // Synchronized scrolling (both vertical and horizontal)
  const scrollingRef = useRef(false);

  const handleScroll =
    (source: "left" | "center" | "right") =>
    (e: React.UIEvent<HTMLDivElement>) => {
      if (scrollingRef.current) return;
      scrollingRef.current = true;

      const { scrollTop, scrollLeft } = e.currentTarget;
      const targets = [
        { key: "left", ref: leftRef },
        { key: "center", ref: centerRef },
        { key: "right", ref: rightRef },
      ];
      for (const t of targets) {
        if (t.key !== source && t.ref.current) {
          t.ref.current.scrollTop = scrollTop;
          t.ref.current.scrollLeft = scrollLeft;
        }
      }

      // Sync gutters directly via DOM — no React state, zero delay
      if (leftGutterRef.current) leftGutterRef.current.scrollTop = scrollTop;
      if (rightGutterRef.current) rightGutterRef.current.scrollTop = scrollTop;

      scrollingRef.current = false;
    };

  return (
    <div
      onClick={onClearActive}
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 96px 1fr 96px 1fr",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Left Column (Theirs) */}
      <div
        ref={leftRef}
        onScroll={handleScroll("left")}
        style={{ overflow: "auto", borderRight: "1px solid var(--border)" }}
      >
        <div style={headerStyle}>Left (Theirs)</div>
        <div style={{ width: "max-content", minWidth: "100%" }}>
          {blocks.map((block) => (
            <MergeColumn
              key={`l-${block.id}`}
              block={block}
              side="left"
              language={language}
            />
          ))}
        </div>
      </div>

      {/* Left Gutter */}
      <div ref={leftGutterRef} style={gutterScrollStyle}>
        <div style={headerStyle}>&nbsp;</div>
        {blocks.map((block, idx) => (
          <MergeGutter
            key={`gl-${block.id}`}
            block={block}
            position="left-center"
            lineOffsets={lineOffsets[idx]}
          />
        ))}
      </div>

      {/* Center Column (Result) */}
      <div
        ref={centerRef}
        onScroll={handleScroll("center")}
        style={{ overflow: "auto", borderRight: "1px solid var(--border)" }}
      >
        <div style={headerStyle}>Center (Result)</div>
        <div style={{ width: "max-content", minWidth: "100%" }}>
          {blocks.map((block) => (
            <div
              key={`cw-${block.id}`}
              ref={(el) => setBlockRef(block.id, el)}
              style={
                activeBlockId === block.id
                  ? {
                      outline: "2px solid var(--button-bg)",
                      outlineOffset: -2,
                      borderRadius: 2,
                    }
                  : undefined
              }
            >
              <MergeColumn
                key={`c-${block.id}`}
                block={block}
                side="center"
                language={language}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Right Gutter */}
      <div ref={rightGutterRef} style={gutterScrollStyle}>
        <div style={headerStyle}>&nbsp;</div>
        {blocks.map((block, idx) => (
          <MergeGutter
            key={`gr-${block.id}`}
            block={block}
            position="center-right"
            lineOffsets={lineOffsets[idx]}
          />
        ))}
      </div>

      {/* Right Column (Yours) */}
      <div
        ref={rightRef}
        onScroll={handleScroll("right")}
        style={{ overflow: "auto" }}
      >
        <div style={headerStyle}>Right (Yours)</div>
        <div style={{ width: "max-content", minWidth: "100%" }}>
          {blocks.map((block) => (
            <MergeColumn
              key={`r-${block.id}`}
              block={block}
              side="right"
              language={language}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
