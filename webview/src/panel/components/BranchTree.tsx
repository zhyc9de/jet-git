import { useState } from "react";
import MdiChevronDown from "~icons/mdi/chevron-down";
import MdiChevronRight from "~icons/mdi/chevron-right";
import MdiFolder from "~icons/mdi/folder";
import MdiFolderOpen from "~icons/mdi/folder-open";
import MdiSourceBranch from "~icons/mdi/source-branch";
import MdiTag from "~icons/mdi/tag";
import MdiTagOutline from "~icons/mdi/tag-outline";
import { useModifierClickSelection } from "../../shared/hooks/useModifierClickSelection";
import { usePreventSelect } from "../../shared/hooks/usePreventSelect";
import { usePanelStore } from "../../shared/store/panel-store";
import type { BranchInfo, TagInfo } from "../../shared/types/git";

// ---------------------------------------------------------------------------
// Tree data structure
// ---------------------------------------------------------------------------

interface TreeNode {
  name: string; // segment name, e.g. "feature"
  fullPath: string; // full joined path, e.g. "feature/auth"
  children: TreeNode[];
  branch?: BranchInfo; // only on leaf nodes
  tag?: TagInfo; // only on leaf nodes (for tag trees)
  isLeaf: boolean;
}

function buildTree(
  items: { segments: string[]; branch?: BranchInfo; tag?: TagInfo }[],
): TreeNode[] {
  const roots: TreeNode[] = [];

  for (const item of items) {
    const { segments } = item;
    let siblings = roots;

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const isLast = i === segments.length - 1;
      const fullPath = segments.slice(0, i + 1).join("/");

      let existing = siblings.find(
        (n) => n.name === seg && n.isLeaf === isLast,
      );
      // For intermediate nodes, match any non-leaf with the same name
      if (!existing && !isLast) {
        existing = siblings.find((n) => n.name === seg && !n.isLeaf);
      }

      if (existing) {
        siblings = existing.children;
      } else {
        const node: TreeNode = {
          name: seg,
          fullPath,
          children: [],
          isLeaf: isLast,
          branch: isLast ? item.branch : undefined,
          tag: isLast ? item.tag : undefined,
        };
        siblings.push(node);
        siblings = node.children;
      }
    }
  }

  sortTreeNodes(roots);
  return roots;
}

function sortTreeNodes(nodes: TreeNode[]): void {
  nodes.sort((a, b) => {
    // Folders first, leaves after.
    if (a.isLeaf !== b.isLeaf) {
      return a.isLeaf ? 1 : -1;
    }
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });

  for (const node of nodes) {
    if (!node.isLeaf && node.children.length > 0) {
      sortTreeNodes(node.children);
    }
  }
}

function branchesToTree(branches: BranchInfo[]): TreeNode[] {
  return buildTree(
    branches.map((b) => ({
      segments: b.name.split("/"),
      branch: b,
    })),
  );
}

function tagsToTree(tags: TagInfo[]): TreeNode[] {
  return buildTree(
    tags.map((t) => ({
      segments: t.name.split("/"),
      tag: t,
    })),
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function collectVisibleLeaves(
  nodes: TreeNode[],
  collapsed: Record<string, boolean>,
  groupPrefix: string,
): string[] {
  const result: string[] = [];
  for (const node of nodes) {
    if (node.isLeaf && node.branch) {
      result.push(node.branch.name);
    } else {
      const collapseKey = `${groupPrefix}:${node.fullPath}`;
      if (!collapsed[collapseKey]) {
        result.push(
          ...collectVisibleLeaves(node.children, collapsed, groupPrefix),
        );
      }
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

export function BranchTree() {
  const branches = usePanelStore((s) => s.branches);
  const tags = usePanelStore((s) => s.tags);
  const commits = usePanelStore((s) => s.commits);
  const currentBranch = usePanelStore((s) => s.currentBranch);
  const filter = usePanelStore((s) => s.filter);
  const setFilter = usePanelStore((s) => s.setFilter);
  const selectedBranches = usePanelStore((s) => s.selectedBranches);
  const selectBranch = usePanelStore((s) => s.selectBranch);

  const containerRef = usePreventSelect();

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [currentBranchRowSelected, setCurrentBranchRowSelected] =
    useState(false);

  const toggle = (key: string) => {
    setCurrentBranchRowSelected(false);
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const localBranches = branches.filter((b) => !b.isRemote);
  const remoteBranches = branches.filter((b) => b.isRemote);

  const headBranch = localBranches.find((b) => b.isCurrent);
  const headCommit = commits.find((c) => c.refs.some((r) => r.type === "HEAD"));

  const localTree = branchesToTree(localBranches);
  const remoteTree = branchesToTree(remoteBranches);
  const tagTree = tagsToTree(tags);

  const allVisibleBranches: string[] = [
    ...(!collapsed.local
      ? collectVisibleLeaves(localTree, collapsed, "local")
      : []),
    ...(!collapsed.remote
      ? collectVisibleLeaves(remoteTree, collapsed, "remote")
      : []),
  ];

  const handleClick = useModifierClickSelection<string>(
    (branchName, mode) => {
      selectBranch(branchName, mode, allVisibleBranches);
    },
    () => setCurrentBranchRowSelected(false),
  );

  const handleBranchDoubleClick = (name: string) => {
    setCurrentBranchRowSelected(false);
    if (filter.branch === name) {
      setFilter({ branch: "" });
    } else {
      setFilter({ branch: name });
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        height: "100%",
        overflow: "auto",
        padding: "4px 0",
      }}
    >
      <div
        style={{
          padding: "0 8px",
          fontWeight: 600,
          opacity: 0.6,
          fontSize: "0.8em",
          textTransform: "uppercase",
          marginBottom: 4,
        }}
      >
        Branches
      </div>

      {/* HEAD – unified "Current Branch" entry */}
      {(headBranch || headCommit) && (
        <div
          onClick={() => {
            setCurrentBranchRowSelected(true);
          }}
          onDoubleClick={() => {
            if (headBranch) {
              handleBranchDoubleClick(headBranch.name);
            }
          }}
          style={{
            padding: "4px 8px 4px 20px",
            cursor: "pointer",
            fontWeight: 600,
            background: currentBranchRowSelected
              ? "var(--selected-bg)"
              : "transparent",
            color: currentBranchRowSelected
              ? "var(--selected-fg)"
              : "var(--description-fg)",
          }}
        >
          Current Branch
        </div>
      )}

      {/* Local */}
      <GroupSection
        title="Local"
        collapsed={collapsed.local}
        onToggle={() => toggle("local")}
      >
        {localTree.map((node) => (
          <TreeNodeView
            key={node.fullPath}
            node={node}
            depth={0}
            groupPrefix="local"
            currentBranch={currentBranch}
            selectedBranches={selectedBranches}
            filteredBranch={filter.branch}
            onBranchClick={handleClick}
            onBranchDoubleClick={handleBranchDoubleClick}
            collapsed={collapsed}
            onToggle={toggle}
          />
        ))}
      </GroupSection>

      {/* Remote */}
      <GroupSection
        title="Remote"
        collapsed={collapsed.remote}
        onToggle={() => toggle("remote")}
      >
        {remoteTree.map((node) => (
          <TreeNodeView
            key={node.fullPath}
            node={node}
            depth={0}
            groupPrefix="remote"
            currentBranch={currentBranch}
            selectedBranches={selectedBranches}
            filteredBranch={filter.branch}
            onBranchClick={handleClick}
            onBranchDoubleClick={handleBranchDoubleClick}
            collapsed={collapsed}
            onToggle={toggle}
          />
        ))}
      </GroupSection>

      {/* Tags */}
      <GroupSection
        title="Tags"
        collapsed={collapsed.tags}
        onToggle={() => toggle("tags")}
      >
        {tagTree.map((node) => (
          <TagTreeNodeView
            key={node.fullPath}
            node={node}
            depth={0}
            groupPrefix="tags"
            collapsed={collapsed}
            onToggle={toggle}
          />
        ))}
      </GroupSection>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TreeNodeView – recursive renderer for branch nodes
// ---------------------------------------------------------------------------

function TreeNodeView({
  node,
  depth,
  groupPrefix,
  currentBranch,
  selectedBranches,
  filteredBranch,
  onBranchClick,
  onBranchDoubleClick,
  collapsed,
  onToggle,
}: {
  node: TreeNode;
  depth: number;
  groupPrefix: string;
  currentBranch: string;
  selectedBranches: string[];
  filteredBranch: string;
  onBranchClick: (e: React.MouseEvent, name: string) => void;
  onBranchDoubleClick: (name: string) => void;
  collapsed: Record<string, boolean>;
  onToggle: (key: string) => void;
}) {
  const collapseKey = `${groupPrefix}:${node.fullPath}`;

  const branch = node.branch;
  if (node.isLeaf && branch) {
    const isCurrent = branch.name === currentBranch;
    return (
      <BranchItem
        icon={
          isCurrent ? (
            <MdiTag style={{ verticalAlign: "middle", color: "#d4a017" }} />
          ) : (
            <MdiSourceBranch
              style={{
                verticalAlign: "middle",
                color: "var(--description-fg)",
              }}
            />
          )
        }
        name={node.name}
        isCurrent={isCurrent}
        isSelected={selectedBranches.includes(branch.name)}
        isFiltered={filteredBranch === branch.name}
        onClick={(e) => onBranchClick(e, branch.name)}
        onDoubleClick={() => onBranchDoubleClick(branch.name)}
        depth={depth}
        behind={branch.behind}
      />
    );
  }

  // Directory node
  const isCollapsed = collapsed[collapseKey] ?? false;

  return (
    <div>
      <div
        onClick={() => onToggle(collapseKey)}
        style={{
          padding: `4px 8px 4px ${20 + depth * 12}px`,
          cursor: "pointer",
          userSelect: "none",
          opacity: 0.8,
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        {isCollapsed ? (
          <MdiFolder style={{ verticalAlign: "middle", color: "#90794e" }} />
        ) : (
          <MdiFolderOpen
            style={{ verticalAlign: "middle", color: "#90794e" }}
          />
        )}{" "}
        {node.name}
      </div>
      {!isCollapsed &&
        node.children.map((child) => (
          <TreeNodeView
            key={child.fullPath}
            node={child}
            depth={depth + 1}
            groupPrefix={groupPrefix}
            currentBranch={currentBranch}
            selectedBranches={selectedBranches}
            filteredBranch={filteredBranch}
            onBranchClick={onBranchClick}
            onBranchDoubleClick={onBranchDoubleClick}
            collapsed={collapsed}
            onToggle={onToggle}
          />
        ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TagTreeNodeView – recursive renderer for tag nodes
// ---------------------------------------------------------------------------

function TagTreeNodeView({
  node,
  depth,
  groupPrefix,
  collapsed,
  onToggle,
}: {
  node: TreeNode;
  depth: number;
  groupPrefix: string;
  collapsed: Record<string, boolean>;
  onToggle: (key: string) => void;
}) {
  const collapseKey = `${groupPrefix}:${node.fullPath}`;

  if (node.isLeaf) {
    return (
      <div
        style={{
          padding: `4px 8px 4px ${20 + depth * 12}px`,
          cursor: "default",
          color: "var(--description-fg)",
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        <MdiTagOutline
          style={{ verticalAlign: "middle", color: "var(--description-fg)" }}
        />
        {node.name}
      </div>
    );
  }

  const isCollapsed = collapsed[collapseKey] ?? false;

  return (
    <div>
      <div
        onClick={() => onToggle(collapseKey)}
        style={{
          padding: `4px 8px 4px ${20 + depth * 12}px`,
          cursor: "pointer",
          userSelect: "none",
          opacity: 0.8,
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        {isCollapsed ? (
          <MdiFolder style={{ verticalAlign: "middle", color: "#90794e" }} />
        ) : (
          <MdiFolderOpen
            style={{ verticalAlign: "middle", color: "#90794e" }}
          />
        )}{" "}
        {node.name}
      </div>
      {!isCollapsed &&
        node.children.map((child) => (
          <TagTreeNodeView
            key={child.fullPath}
            node={child}
            depth={depth + 1}
            groupPrefix={groupPrefix}
            collapsed={collapsed}
            onToggle={onToggle}
          />
        ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

function GroupSection({
  title,
  collapsed,
  onToggle,
  children,
}: {
  title: string;
  collapsed?: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        onClick={onToggle}
        style={{
          padding: "4px 8px",
          cursor: "pointer",
          userSelect: "none",
          opacity: 0.8,
          fontWeight: 500,
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        {collapsed ? (
          <MdiChevronRight style={{ verticalAlign: "middle" }} />
        ) : (
          <MdiChevronDown style={{ verticalAlign: "middle" }} />
        )}{" "}
        {title}
      </div>
      {!collapsed && children}
    </div>
  );
}

function BranchItem({
  icon,
  name,
  isCurrent,
  isSelected,
  isFiltered,
  onClick,
  onDoubleClick,
  depth,
  behind = 0,
}: {
  icon: React.ReactNode;
  name: string;
  isCurrent: boolean;
  isSelected: boolean;
  isFiltered: boolean;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  depth: number;
  behind?: number;
}) {
  return (
    <div
      className={`selectable-row${isSelected ? " selected" : ""}`}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      style={{
        padding: `4px 8px 4px ${20 + depth * 12}px`,
        fontWeight: isCurrent || isFiltered ? 600 : 400,
        background:
          isCurrent && !isSelected
            ? "var(--list-hoverBackground, rgba(0,0,0,0.04))"
            : undefined,
        color: isSelected ? "var(--selected-fg)" : "inherit",
        outline: isFiltered ? "1px solid var(--focus-border, #007fd4)" : "none",
        display: "flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      <span style={{ flexShrink: 0 }}>{icon}</span>
      <span
        style={{
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {name}
      </span>
      {behind > 0 && (
        <span
          style={{
            color: "var(--link-fg, #1a73e8)",
            marginLeft: 4,
            flexShrink: 0,
            whiteSpace: "nowrap",
          }}
        >
          ↙ {behind}
        </span>
      )}
    </div>
  );
}
