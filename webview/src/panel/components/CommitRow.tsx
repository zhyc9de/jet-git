import { usePreventSelect } from "../../shared/hooks/usePreventSelect";
import { usePanelStore } from "../../shared/store/panel-store";
import type { Commit, LaneInfo, RefInfo } from "../../shared/types/git";

const ROW_HEIGHT = 28;

const REF_COLORS: Record<string, { bg: string; fg: string }> = {
  branch: { bg: "#deefe3", fg: "#24663a" },
  "remote-branch": { bg: "#eee7ff", fg: "#5f4aa1" },
  tag: { bg: "#fff1d9", fg: "#7c5a08" },
  HEAD: { bg: "#e2eeff", fg: "#1f4f86" },
};

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

function truncateFromStart(text: string, maxChars = 14): string {
  if (text.length <= maxChars) return text;
  if (maxChars <= 3) return "...";
  return `...${text.slice(-(maxChars - 3))}`;
}

function buildRefDisplayItems(refs: RefInfo[]): Array<{
  key: string;
  type: RefInfo["type"];
  label: string;
}> {
  const branchRef = refs.find((ref) => ref.type === "branch");
  const hasHead = refs.some((ref) => ref.type === "HEAD");
  const seen = new Set<string>();

  return refs
    .filter((ref) => !(hasHead && ref.type === "branch"))
    .map((ref, index) => {
      const label =
        ref.type === "HEAD"
          ? branchRef
            ? `HEAD \u2192 ${branchRef.name}`
            : "HEAD"
          : ref.name;
      return {
        key: `${ref.type}:${ref.name}:${index}`,
        type: ref.type,
        label: label.trim(),
      };
    })
    .filter((item) => {
      if (!item.label) return false;
      const dedupeKey = `${item.type}:${item.label}`;
      if (seen.has(dedupeKey)) return false;
      seen.add(dedupeKey);
      return true;
    });
}

export function CommitRow({
  commit,
  lane,
  graphWidth,
  onCommitClick,
}: {
  commit: Commit;
  lane: LaneInfo | undefined;
  graphWidth: number;
  onCommitClick: (event: React.MouseEvent, hash: string) => void;
}) {
  const selectedCommitHashes = usePanelStore((s) => s.selectedCommitHashes);
  const setHoveredColumn = usePanelStore((s) => s.setHoveredColumn);
  const rowRef = usePreventSelect<HTMLDivElement>();

  const isSelected = selectedCommitHashes.includes(commit.hash);
  const col = lane?.column ?? 0;
  const refItems = buildRefDisplayItems(commit.refs);

  return (
    <div
      ref={rowRef}
      className={`selectable-row${isSelected ? " selected" : ""}`}
      onClick={(event) => onCommitClick(event, commit.hash)}
      onMouseEnter={() => setHoveredColumn(col)}
      onMouseLeave={() => setHoveredColumn(null)}
      style={{
        display: "flex",
        alignItems: "center",
        height: ROW_HEIGHT,
        paddingLeft: graphWidth,
        paddingRight: 8,
        gap: 8,
        color: isSelected ? "var(--selected-fg)" : "inherit",
      }}
    >
      <span
        style={{
          flex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {commit.subject}
      </span>

      {refItems.length > 0 && (
        <span style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          {refItems.map((item) => {
            const colors = REF_COLORS[item.type] ?? REF_COLORS.branch;
            const displayLabel = truncateFromStart(item.label, 13);
            return (
              <span
                key={item.key}
                style={{
                  padding: "0 6px",
                  borderRadius: 3,
                  display: "inline-block",
                  fontSize: "0.8em",
                  fontWeight: 500,
                  lineHeight: "18px",
                  background: colors.bg,
                  color: colors.fg,
                  border: "1px solid #00000022",
                  whiteSpace: "nowrap",
                  verticalAlign: "middle",
                }}
                title={item.label}
              >
                {displayLabel}
              </span>
            );
          })}
        </span>
      )}

      <span
        style={{
          flexShrink: 0,
          width: 80,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          opacity: 0.7,
        }}
      >
        {commit.authorName}
      </span>

      <span
        style={{
          flexShrink: 0,
          textAlign: "right",
          opacity: 0.5,
          width: 120,
        }}
      >
        {formatDateTime(commit.authorDate)}
      </span>
    </div>
  );
}
