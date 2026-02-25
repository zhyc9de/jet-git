import { useCallback, useRef, useState } from "react";
import CodiconListFlat from "~icons/codicon/list-flat";
import CodiconListTree from "~icons/codicon/list-tree";
import { FileTree } from "../../shared/components/FileTree";
import { usePanelStore } from "../../shared/store/panel-store";
import type { DiffFile } from "../../shared/types/git";

export function FileChangeTree() {
  const commitFiles = usePanelStore((s) => s.commitFiles);
  const selectedFilePath = usePanelStore((s) => s.selectedFilePath);
  const selectedCommitHash = usePanelStore((s) => s.selectedCommitHash);
  const selectFile = usePanelStore((s) => s.selectFile);
  const openDiffEditor = usePanelStore((s) => s.openDiffEditor);
  const lastClickRef = useRef<{ path: string; time: number }>({
    path: "",
    time: 0,
  });

  const [viewMode, setViewMode] = useState<"tree" | "flat">("tree");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const handleFileClick = useCallback(
    (_e: React.MouseEvent, file: DiffFile) => {
      const now = Date.now();
      const last = lastClickRef.current;
      const filePath = file.newPath || file.oldPath;

      if (last.path === filePath && now - last.time < 400) {
        if (selectedCommitHash) {
          openDiffEditor(selectedCommitHash, file);
        }
        lastClickRef.current = { path: "", time: 0 };
      } else {
        selectFile(filePath);
        lastClickRef.current = { path: filePath, time: now };
      }
    },
    [selectedCommitHash, selectFile, openDiffEditor],
  );

  const toggleCollapse = (key: string) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (commitFiles.length === 0) {
    return (
      <div style={{ padding: 12, opacity: 0.5 }}>
        Select a commit to see changed files
      </div>
    );
  }

  const selectedFiles = selectedFilePath ? [selectedFilePath] : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Fixed header — does not scroll */}
      <div
        style={{
          padding: "6px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontWeight: 600,
            fontSize: "0.8em",
            opacity: 0.6,
            textTransform: "uppercase",
          }}
        >
          Changed Files
        </span>
        <span style={{ display: "flex", gap: 2 }}>
          <button
            type="button"
            onClick={() => setViewMode("tree")}
            title="Tree View"
            style={{
              background:
                viewMode === "tree" ? "var(--selected-bg)" : "transparent",
              border: "none",
              borderRadius: 3,
              cursor: "pointer",
              padding: "2px 4px",
              display: "flex",
              alignItems: "center",
              color: "inherit",
            }}
          >
            <CodiconListTree />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("flat")}
            title="Flat List"
            style={{
              background:
                viewMode === "flat" ? "var(--selected-bg)" : "transparent",
              border: "none",
              borderRadius: 3,
              cursor: "pointer",
              padding: "2px 4px",
              display: "flex",
              alignItems: "center",
              color: "inherit",
            }}
          >
            <CodiconListFlat />
          </button>
        </span>
      </div>

      {/* Scrollable content area */}
      <div style={{ flex: 1, overflow: "auto", overflowX: "hidden" }}>
        <FileTree
          files={commitFiles}
          viewMode={viewMode}
          selectedFiles={selectedFiles}
          onFileClick={handleFileClick}
          collapsed={collapsed}
          onToggle={toggleCollapse}
        />
      </div>
    </div>
  );
}
