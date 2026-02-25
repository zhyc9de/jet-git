import { usePanelStore } from "../../shared/store/panel-store";
import type { Commit } from "../../shared/types/git";

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

function CommitInfo({ commit }: { commit: Commit }) {
  const branchRef = commit.refs.find((r) => r.type === "branch");
  const hasHead = commit.refs.some((r) => r.type === "HEAD");
  const displayRefs = commit.refs
    .filter((r) => !(hasHead && r.type === "branch"))
    .map((r) =>
      r.type === "HEAD" && branchRef
        ? { ...r, name: `HEAD → ${branchRef.name}` }
        : r,
    );

  return (
    <div>
      {/* Commit message */}
      <div
        style={{
          fontWeight: 600,
          fontSize: "1.05em",
          lineHeight: 1.4,
          marginBottom: 4,
        }}
      >
        {commit.subject}
      </div>
      {commit.body && (
        <div
          style={{
            whiteSpace: "pre-wrap",
            lineHeight: 1.5,
            color: "var(--description-fg)",
            marginBottom: 8,
          }}
        >
          {commit.body}
        </div>
      )}

      {/* Metadata: hash + author + date in one line */}
      <div
        style={{
          fontSize: "0.92em",
          color: "var(--description-fg)",
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontFamily: "var(--editor-font)",
            fontSize: "var(--editor-font-size)",
          }}
        >
          {commit.shortHash}
        </span>{" "}
        {commit.authorName} on {formatDateTime(commit.authorDate)}
      </div>

      {/* Ref badges */}
      {displayRefs.length > 0 && (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {displayRefs.map((r, i) => {
            const colors = REF_COLORS[r.type] ?? REF_COLORS.branch;
            return (
              <span
                key={`${r.type}:${r.name}:${i}`}
                style={{
                  display: "inline-block",
                  padding: "0 6px",
                  borderRadius: 3,
                  fontSize: "0.8em",
                  fontWeight: 500,
                  lineHeight: "18px",
                  background: colors.bg,
                  color: colors.fg,
                  border: "1px solid #00000022",
                  whiteSpace: "nowrap",
                }}
                title={r.name}
              >
                {r.name}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function CommitDetail() {
  const commits = usePanelStore((s) => s.commits);
  const selectedCommitHashes = usePanelStore((s) => s.selectedCommitHashes);

  const selectedCommits = selectedCommitHashes
    .map((h) => commits.find((c) => c.hash === h))
    .filter((c): c is Commit => c != null);

  if (selectedCommits.length === 0) {
    return (
      <div style={{ padding: 12, opacity: 0.5 }}>
        Select a commit to view details
      </div>
    );
  }

  return (
    <div style={{ padding: 12, overflow: "auto", overflowX: "hidden" }}>
      {selectedCommits.map((commit, i) => (
        <div key={commit.hash}>
          {i > 0 && (
            <hr
              style={{
                border: "none",
                borderTop: "1px solid var(--border)",
                margin: "10px 0",
              }}
            />
          )}
          <CommitInfo commit={commit} />
        </div>
      ))}
    </div>
  );
}
