import { useCallback, useRef } from "react";
import { usePanelStore } from "../../shared/store/panel-store";

export function Toolbar() {
  const setFilter = usePanelStore((s) => s.setFilter);
  const filter = usePanelStore((s) => s.filter);
  const currentBranch = usePanelStore((s) => s.currentBranch);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const historyBranch = filter.branch || currentBranch;

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setFilter({ searchQuery: value });
      }, 300);
    },
    [setFilter],
  );

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "4px 8px",
        borderBottom: "1px solid var(--border)",
        flexShrink: 0,
      }}
    >
      <input
        type="text"
        placeholder="Search commits..."
        defaultValue={filter.searchQuery}
        onChange={handleSearch}
        style={{
          width: 220,
          padding: "3px 8px",
          background: "var(--input-bg)",
          color: "var(--input-fg)",
          border: "1px solid var(--input-border)",
          borderRadius: 2,
          fontSize: "var(--font-size)",
          fontFamily: "var(--font-family)",
          outline: "none",
        }}
      />
      <span
        title={historyBranch || "No active branch"}
        style={{
          color: "var(--description-fg)",
          fontSize: "12px",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          maxWidth: 260,
        }}
      >
        Branch: {historyBranch || "-"}
      </span>
    </div>
  );
}
