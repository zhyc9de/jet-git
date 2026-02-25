import { useEffect, useRef, useState } from "react";
import { CommitList } from "./CommitList";
import { GitGraphSvg } from "./GitGraphSvg";

export function GitGraphPanel() {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    ro.observe(node);
    setContainerHeight(node.clientHeight);

    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        minHeight: 0,
      }}
    >
      <CommitList onScroll={setScrollTop} />
      <GitGraphSvg scrollTop={scrollTop} height={containerHeight} />
    </div>
  );
}
