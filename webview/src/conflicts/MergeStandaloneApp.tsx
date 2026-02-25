import { useCallback, useEffect, useMemo, useState } from "react";
import { bridge } from "../shared/bridge";
import { useMergeStore } from "../shared/store/merge-store";
import { MergeContainer } from "./components/MergeContainer";
import { parseMergeBlocks } from "./utils/merge-logic";

interface FileVersionsPayload {
  base: string;
  ours: string;
  theirs: string;
  language: string;
}

function getMergeFileFromRoot(): string | null {
  const root = document.getElementById("root");
  return root?.dataset.file ?? null;
}

export function MergeStandaloneApp() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const {
    setBlocks,
    blocks,
    isDirty,
    acceptAllLeft,
    acceptAllRight,
    resetToInitial,
  } = useMergeStore();

  const filePath = useMemo(() => getMergeFileFromRoot(), []);

  // Conflict navigation state
  const conflictBlockIds = useMemo(
    () => blocks.filter((b) => b.state === "conflict").map((b) => b.id),
    [blocks],
  );
  const changeCount = useMemo(
    () => blocks.filter((b) => b.state !== "equal").length,
    [blocks],
  );
  const conflictCount = conflictBlockIds.length;
  const allResolved = useMemo(
    () => blocks.every((b) => b.state === "equal" || b.isResolved),
    [blocks],
  );

  const [activeConflictIndex, setActiveConflictIndex] = useState(-1);
  const activeBlockId =
    activeConflictIndex >= 0 && activeConflictIndex < conflictBlockIds.length
      ? conflictBlockIds[activeConflictIndex]
      : undefined;

  const goToPrevConflict = useCallback(() => {
    if (conflictCount === 0) return;
    setActiveConflictIndex((prev) =>
      prev <= 0 ? conflictCount - 1 : prev - 1,
    );
  }, [conflictCount]);

  const goToNextConflict = useCallback(() => {
    if (conflictCount === 0) return;
    setActiveConflictIndex((prev) =>
      prev >= conflictCount - 1 ? 0 : prev + 1,
    );
  }, [conflictCount]);

  // Apply: save + stage + close
  const handleApply = useCallback(async () => {
    if (!filePath) return;
    try {
      const content = blocks.map((b) => b.resultLines.join("\n")).join("\n");
      await bridge.request("saveMergedContent", { filePath, content });
      await bridge.request("stageFile", { filePath });
      await bridge.request("openFile", { filePath });
      await bridge.request("closeMergeEditor", { filePath });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`Apply failed: ${msg}`);
    }
  }, [filePath, blocks]);

  // Cancel: confirm if dirty, then close
  const handleCancel = useCallback(async () => {
    if (!filePath) return;
    if (isDirty) {
      const res = (await bridge.request("confirmCancelMerge", {
        filePath,
        hasChanges: true,
      })) as { confirmed: boolean };
      if (!res.confirmed) return;
    }
    resetToInitial();
    await bridge.request("closeMergeEditor", { filePath });
  }, [filePath, isDirty, resetToInitial]);

  useEffect(() => {
    if (!filePath) {
      setLoading(false);
      setError("Missing merge file path.");
      return;
    }

    let disposed = false;
    void (async () => {
      try {
        const versions = (await bridge.request("getFileVersions", {
          filePath,
        })) as FileVersionsPayload;
        if (disposed) return;
        const parsed = parseMergeBlocks(
          versions.base,
          versions.theirs,
          versions.ours,
        );
        setBlocks(parsed, versions.language);
      } catch (e) {
        if (!disposed) {
          const message = e instanceof Error ? e.message : String(e);
          setError(message || "Failed to load merge content.");
        }
      } finally {
        if (!disposed) setLoading(false);
      }
    })();

    return () => {
      disposed = true;
    };
  }, [filePath, setBlocks]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          opacity: 0.7,
        }}
      >
        Loading merge editor...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: 16,
          color: "var(--app-fg)",
          fontFamily: "var(--font-family)",
          fontSize: 13,
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        fontFamily: "var(--font-family)",
      }}
    >
      {/* File path header */}
      <div
        style={{
          padding: "6px 12px",
          borderBottom: "1px solid var(--border)",
          fontSize: 13,
          opacity: 0.85,
          flexShrink: 0,
        }}
      >
        {filePath}
      </div>

      {/* Toolbar: navigation + stats */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "4px 12px",
          borderBottom: "1px solid var(--border)",
          fontSize: 12,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button
            type="button"
            onClick={goToPrevConflict}
            disabled={conflictCount === 0}
            style={navButtonStyle}
            title="Previous Conflict"
          >
            &#x25B2;
          </button>
          <button
            type="button"
            onClick={goToNextConflict}
            disabled={conflictCount === 0}
            style={navButtonStyle}
            title="Next Conflict"
          >
            &#x25BC;
          </button>
        </div>
        <span style={{ opacity: 0.7 }}>
          {changeCount} changes &middot; {conflictCount} conflicts
        </span>
      </div>

      {/* Main merge content */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <MergeContainer
          activeBlockId={activeBlockId}
          onClearActive={() => setActiveConflictIndex(-1)}
        />
      </div>

      {/* Bottom action bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
          borderTop: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={acceptAllLeft}
            disabled={conflictCount === 0}
            style={actionButtonStyle}
          >
            Accept Left
          </button>
          <button
            type="button"
            onClick={acceptAllRight}
            disabled={conflictCount === 0}
            style={actionButtonStyle}
          >
            Accept Right
          </button>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={handleCancel}
            style={actionButtonStyle}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={!allResolved}
            style={applyButtonStyle}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

const navButtonStyle: React.CSSProperties = {
  background: "transparent",
  border: "1px solid var(--border)",
  borderRadius: 3,
  color: "var(--app-fg)",
  padding: "2px 6px",
  fontSize: 10,
  lineHeight: 1,
};

const actionButtonStyle: React.CSSProperties = {
  borderRadius: 3,
  padding: "4px 12px",
  fontSize: 12,
};

const applyButtonStyle: React.CSSProperties = {
  ...actionButtonStyle,
  background: "var(--button-bg)",
  color: "var(--button-fg)",
};
