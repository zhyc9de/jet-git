import { useMemo } from "react";
import {
  getFileIcon,
  IconFolder,
  IconFolderOpen,
} from "../../panel/utils/file-icons";
import type { DiffFile } from "../types/git";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const STATUS_COLORS: Record<string, string> = {
  added: "rgb(7, 114, 23)",
  modified: "rgb(0, 45, 170)",
  deleted: "rgb(97, 101, 115)",
  renamed: "#f0c674",
  copied: "#f0c674",
  conflicts: "rgb(217, 26, 41)",
};

// ---------------------------------------------------------------------------
// Tree data structure
// ---------------------------------------------------------------------------

export interface FileTreeNode {
  name: string;
  fullPath: string;
  children: FileTreeNode[];
  file?: DiffFile;
  isLeaf: boolean;
  fileCount: number;
}

export function buildFileTree(files: DiffFile[]): FileTreeNode[] {
  const roots: FileTreeNode[] = [];

  for (const file of files) {
    const filePath = file.newPath || file.oldPath;
    const segments = filePath.split("/");
    let siblings = roots;

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const isLast = i === segments.length - 1;
      const fullPath = segments.slice(0, i + 1).join("/");

      let existing = siblings.find(
        (n) => n.name === seg && n.isLeaf === isLast,
      );
      if (!existing && !isLast) {
        existing = siblings.find((n) => n.name === seg && !n.isLeaf);
      }

      if (existing) {
        siblings = existing.children;
      } else {
        const node: FileTreeNode = {
          name: seg,
          fullPath,
          children: [],
          isLeaf: isLast,
          file: isLast ? file : undefined,
          fileCount: 0,
        };
        siblings.push(node);
        siblings = node.children;
      }
    }
  }

  computeFileCount(roots);
  sortFileTreeNodes(roots);
  compactTree(roots);
  return roots;
}

function computeFileCount(nodes: FileTreeNode[]): number {
  let total = 0;
  for (const node of nodes) {
    if (node.isLeaf) {
      node.fileCount = 1;
      total += 1;
    } else {
      node.fileCount = computeFileCount(node.children);
      total += node.fileCount;
    }
  }
  return total;
}

function sortFileTreeNodes(nodes: FileTreeNode[]): void {
  nodes.sort((a, b) => {
    if (a.isLeaf !== b.isLeaf) return a.isLeaf ? 1 : -1;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
  for (const node of nodes) {
    if (!node.isLeaf && node.children.length > 0) {
      sortFileTreeNodes(node.children);
    }
  }
}

function compactTree(nodes: FileTreeNode[]): void {
  for (const node of nodes) {
    while (
      !node.isLeaf &&
      node.children.length === 1 &&
      !node.children[0].isLeaf
    ) {
      const child = node.children[0];
      node.name = `${node.name}/${child.name}`;
      node.fullPath = child.fullPath;
      node.children = child.children;
      node.fileCount = child.fileCount;
    }
    if (!node.isLeaf) {
      compactTree(node.children);
    }
  }
}

// ---------------------------------------------------------------------------
// Collect visible file paths in render order (for range selection)
// ---------------------------------------------------------------------------

export function collectVisibleFilePaths(
  nodes: FileTreeNode[],
  collapsed: Record<string, boolean>,
): string[] {
  const result: string[] = [];
  function walk(nodeList: FileTreeNode[]) {
    for (const node of nodeList) {
      if (node.isLeaf && node.file) {
        result.push(node.file.newPath || node.file.oldPath);
      } else {
        if (!(collapsed[node.fullPath] ?? false)) {
          walk(node.children);
        }
      }
    }
  }
  walk(nodes);
  return result;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface FileTreeProps {
  files: DiffFile[];
  viewMode: "tree" | "flat";
  selectedFiles: string[];
  onFileClick: (e: React.MouseEvent, file: DiffFile) => void;
  onFileDoubleClick?: (file: DiffFile) => void;
  collapsed?: Record<string, boolean>;
  onToggle?: (key: string) => void;
  renderExtraColumns?: (file: DiffFile) => React.ReactNode;
  renderDirExtra?: (dir: FileTreeNode) => React.ReactNode;
  statusColorOverride?: (file: DiffFile) => string | undefined;
}

// ---------------------------------------------------------------------------
// FileTree component
// ---------------------------------------------------------------------------

export function FileTree({
  files,
  viewMode,
  selectedFiles,
  onFileClick,
  onFileDoubleClick,
  collapsed = {},
  onToggle,
  renderExtraColumns,
  renderDirExtra,
  statusColorOverride,
}: FileTreeProps) {
  const tree = useMemo(() => buildFileTree(files), [files]);

  if (viewMode === "tree") {
    return (
      <TreeView
        nodes={tree}
        depth={0}
        collapsed={collapsed}
        onToggle={onToggle ?? (() => {})}
        selectedFiles={selectedFiles}
        onFileClick={onFileClick}
        onFileDoubleClick={onFileDoubleClick}
        renderExtraColumns={renderExtraColumns}
        renderDirExtra={renderDirExtra}
        statusColorOverride={statusColorOverride}
      />
    );
  }

  return (
    <FlatView
      files={files}
      selectedFiles={selectedFiles}
      onFileClick={onFileClick}
      onFileDoubleClick={onFileDoubleClick}
      renderExtraColumns={renderExtraColumns}
      statusColorOverride={statusColorOverride}
    />
  );
}

// ---------------------------------------------------------------------------
// Tree View
// ---------------------------------------------------------------------------

function TreeView({
  nodes,
  depth,
  collapsed,
  onToggle,
  selectedFiles,
  onFileClick,
  onFileDoubleClick,
  renderExtraColumns,
  renderDirExtra,
  statusColorOverride,
}: {
  nodes: FileTreeNode[];
  depth: number;
  collapsed: Record<string, boolean>;
  onToggle: (key: string) => void;
  selectedFiles: string[];
  onFileClick: (e: React.MouseEvent, file: DiffFile) => void;
  onFileDoubleClick?: (file: DiffFile) => void;
  renderExtraColumns?: (file: DiffFile) => React.ReactNode;
  renderDirExtra?: (dir: FileTreeNode) => React.ReactNode;
  statusColorOverride?: (file: DiffFile) => string | undefined;
}) {
  return (
    <>
      {nodes.map((node) => (
        <FileTreeNodeView
          key={node.fullPath}
          node={node}
          depth={depth}
          collapsed={collapsed}
          onToggle={onToggle}
          selectedFiles={selectedFiles}
          onFileClick={onFileClick}
          onFileDoubleClick={onFileDoubleClick}
          renderExtraColumns={renderExtraColumns}
          renderDirExtra={renderDirExtra}
          statusColorOverride={statusColorOverride}
        />
      ))}
    </>
  );
}

function FileTreeNodeView({
  node,
  depth,
  collapsed,
  onToggle,
  selectedFiles,
  onFileClick,
  onFileDoubleClick,
  renderExtraColumns,
  renderDirExtra,
  statusColorOverride,
}: {
  node: FileTreeNode;
  depth: number;
  collapsed: Record<string, boolean>;
  onToggle: (key: string) => void;
  selectedFiles: string[];
  onFileClick: (e: React.MouseEvent, file: DiffFile) => void;
  onFileDoubleClick?: (file: DiffFile) => void;
  renderExtraColumns?: (file: DiffFile) => React.ReactNode;
  renderDirExtra?: (dir: FileTreeNode) => React.ReactNode;
  statusColorOverride?: (file: DiffFile) => string | undefined;
}) {
  if (node.isLeaf && node.file) {
    const filePath = node.file.newPath || node.file.oldPath;
    return (
      <FileRow
        file={node.file}
        name={node.name}
        depth={depth}
        isSelected={selectedFiles.includes(filePath)}
        onClick={(e) => node.file && onFileClick(e, node.file)}
        onDoubleClick={
          onFileDoubleClick
            ? () => node.file && onFileDoubleClick(node.file)
            : undefined
        }
        renderExtraColumns={renderExtraColumns}
        statusColorOverride={statusColorOverride}
      />
    );
  }

  const isCollapsed = collapsed[node.fullPath] ?? false;

  return (
    <div>
      <div
        className="selectable-row"
        onClick={() => onToggle(node.fullPath)}
        style={{
          padding: `2px 12px 2px ${12 + depth * 16}px`,
          userSelect: "none",
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        {isCollapsed ? (
          <IconFolder
            style={{
              flexShrink: 0,
              width: 16,
              height: 16,
            }}
          />
        ) : (
          <IconFolderOpen
            style={{
              flexShrink: 0,
              width: 16,
              height: 16,
            }}
          />
        )}
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {node.name}
        </span>
        {renderDirExtra ? (
          renderDirExtra(node)
        ) : (
          <span
            style={{
              marginLeft: "auto",
              fontSize: "0.8em",
              opacity: 0.5,
              flexShrink: 0,
            }}
          >
            {node.fileCount} {node.fileCount === 1 ? "file" : "files"}
          </span>
        )}
      </div>
      {!isCollapsed && (
        <TreeView
          nodes={node.children}
          depth={depth + 1}
          collapsed={collapsed}
          onToggle={onToggle}
          selectedFiles={selectedFiles}
          onFileClick={onFileClick}
          onFileDoubleClick={onFileDoubleClick}
          renderExtraColumns={renderExtraColumns}
          renderDirExtra={renderDirExtra}
          statusColorOverride={statusColorOverride}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// File row (shared between tree and flat)
// ---------------------------------------------------------------------------

function FileRow({
  file,
  name,
  depth,
  isSelected,
  onClick,
  onDoubleClick,
  directoryHint,
  renderExtraColumns,
  statusColorOverride,
}: {
  file: DiffFile;
  name: string;
  depth: number;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick?: () => void;
  directoryHint?: string;
  renderExtraColumns?: (file: DiffFile) => React.ReactNode;
  statusColorOverride?: (file: DiffFile) => string | undefined;
}) {
  const defaultColor = STATUS_COLORS[file.status] ?? undefined;
  const statusColor = statusColorOverride
    ? (statusColorOverride(file) ?? defaultColor)
    : defaultColor;
  const FileIcon = getFileIcon(name);

  return (
    <div
      className={`selectable-row${isSelected ? " selected" : ""}`}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: `2px 12px 2px ${12 + depth * 16}px`,
        color: statusColor,
      }}
    >
      <FileIcon style={{ flexShrink: 0, width: 16, height: 16 }} />
      <span
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {name}
      </span>
      {directoryHint && (
        <span
          style={{
            color: "var(--description-fg)",
            fontSize: "0.85em",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            opacity: 0.6,
          }}
        >
          {directoryHint}
        </span>
      )}
      {renderExtraColumns?.(file)}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Flat View
// ---------------------------------------------------------------------------

function FlatView({
  files,
  selectedFiles,
  onFileClick,
  onFileDoubleClick,
  renderExtraColumns,
  statusColorOverride,
}: {
  files: DiffFile[];
  selectedFiles: string[];
  onFileClick: (e: React.MouseEvent, file: DiffFile) => void;
  onFileDoubleClick?: (file: DiffFile) => void;
  renderExtraColumns?: (file: DiffFile) => React.ReactNode;
  statusColorOverride?: (file: DiffFile) => string | undefined;
}) {
  const sorted = useMemo(() => {
    return [...files].sort((a, b) => {
      const nameA = (a.newPath || a.oldPath).split("/").pop() ?? "";
      const nameB = (b.newPath || b.oldPath).split("/").pop() ?? "";
      return nameA.localeCompare(nameB, undefined, { sensitivity: "base" });
    });
  }, [files]);

  return (
    <>
      {sorted.map((file) => {
        const filePath = file.newPath || file.oldPath;
        const parts = filePath.split("/");
        const fileName = parts.pop() ?? filePath;
        const dirPath = parts.join("/");
        const isSelected = selectedFiles.includes(filePath);

        return (
          <FileRow
            key={filePath}
            file={file}
            name={fileName}
            depth={0}
            isSelected={isSelected}
            onClick={(e) => onFileClick(e, file)}
            onDoubleClick={
              onFileDoubleClick ? () => onFileDoubleClick(file) : undefined
            }
            directoryHint={dirPath || undefined}
            renderExtraColumns={renderExtraColumns}
            statusColorOverride={statusColorOverride}
          />
        );
      })}
    </>
  );
}
