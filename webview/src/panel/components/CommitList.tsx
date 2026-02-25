import { useVirtualizer } from "@tanstack/react-virtual";
import { useCallback, useEffect, useRef } from "react";
import { useModifierClickSelection } from "../../shared/hooks/useModifierClickSelection";
import { usePanelStore } from "../../shared/store/panel-store";
import { CommitRow } from "./CommitRow";

const ROW_HEIGHT = 28;
const COLUMN_WIDTH = 16;
const GRAPH_PADDING = 8;

export function CommitList({
  onScroll,
}: {
  onScroll?: (scrollTop: number) => void;
}) {
  const visibleCommits = usePanelStore((s) => s.visibleCommits);
  const graphLayout = usePanelStore((s) => s.graphLayout);
  const hasMore = usePanelStore((s) => s.hasMore);
  const loadMore = usePanelStore((s) => s.loadMore);
  const loading = usePanelStore((s) => s.loading);
  const selectCommit = usePanelStore((s) => s.selectCommit);

  const parentRef = useRef<HTMLDivElement>(null);

  const maxColumn = Math.max(
    0,
    ...Object.values(graphLayout).map((l) => l.column),
  );
  const graphWidth = (maxColumn + 1) * COLUMN_WIDTH + GRAPH_PADDING * 2;

  const virtualizer = useVirtualizer({
    count: visibleCommits.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 20,
  });
  const allVisibleCommitHashes = visibleCommits.map((commit) => commit.hash);

  const handleCommitClick = useModifierClickSelection<string>((hash, mode) => {
    void selectCommit(hash, mode, allVisibleCommitHashes);
  });

  const handleScroll = useCallback(() => {
    const el = parentRef.current;
    if (!el) return;
    onScroll?.(el.scrollTop);
    // Load more when near bottom
    if (
      !loading &&
      hasMore &&
      el.scrollTop + el.clientHeight >= el.scrollHeight - ROW_HEIGHT * 5
    ) {
      loadMore();
    }
  }, [onScroll, loading, hasMore, loadMore]);

  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <div
      ref={parentRef}
      style={{ flex: 1, minHeight: 0, overflow: "auto", position: "relative" }}
    >
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((item) => {
          const commit = visibleCommits[item.index];
          const lane = graphLayout[commit.hash];
          return (
            <div
              key={commit.hash}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: ROW_HEIGHT,
                transform: `translateY(${item.start}px)`,
              }}
            >
              <CommitRow
                commit={commit}
                lane={lane}
                graphWidth={graphWidth}
                onCommitClick={handleCommitClick}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
