import { CommitDetail } from "./CommitDetail";
import { FileChangeTree } from "./FileChangeTree";

export function DetailPanel() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          flex: 1,
          overflow: "hidden",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <FileChangeTree />
      </div>
      <div style={{ flex: 1, overflow: "auto" }}>
        <CommitDetail />
      </div>
    </div>
  );
}
