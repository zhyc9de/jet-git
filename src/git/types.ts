export interface CommitNode {
  hash: string;
  shortHash: string;
  parents: string[];
  authorName: string;
  authorEmail: string;
  authorDate: string; // ISO 8601
  subject: string;
  body: string;
  refs: RefInfo[];
}

export interface RefInfo {
  type: "branch" | "remote-branch" | "tag" | "HEAD";
  name: string;
}

/** postMessage 传输用 Record（Map 不可 JSON 序列化） */
export interface GraphData {
  commits: CommitNode[];
  lanes: Record<string, LaneInfo>;
}

export interface LaneInfo {
  column: number;
  color: number;
  lines: LaneLine[];
}

export interface LaneLine {
  fromColumn: number;
  toColumn: number;
  toCommit: string;
  type: "straight" | "merge-left" | "merge-right" | "fork-left" | "fork-right";
  /** Parent is hidden by current filter window; keep relation for later pages. */
  hiddenParent?: boolean;
}

export interface LaneSnapshot {
  activeLanes: (string | null)[];
  laneColors: (number | null)[];
  nextColorIndex: number;
  /** legacy field for backward compatibility when reading old snapshots */
  colorIndex?: number;
}

export interface GraphLayoutResult {
  graphData: GraphData;
  snapshot: LaneSnapshot;
}

export interface BranchInfo {
  name: string;
  isRemote: boolean;
  isCurrent: boolean;
  upstream?: string;
  ahead: number;
  behind: number;
  lastCommitHash: string;
}

export interface TagInfo {
  name: string;
  hash: string;
  isAnnotated: boolean;
  message?: string;
}

export interface FileStatus {
  path: string;
  oldPath?: string;
  indexStatus: string;
  workTreeStatus: string;
}

export interface DiffFile {
  oldPath: string;
  newPath: string;
  status: "added" | "deleted" | "modified" | "renamed" | "copied";
  isBinary: boolean;
}

export interface LogOptions {
  maxCount?: number; // default 200
  skip?: number;
  branch?: string; // specific branch, default --all
  author?: string;
  search?: string; // --grep
  file?: string;
  since?: string;
  until?: string;
}

export interface MergeState {
  isMerging: boolean;
  mergeHead?: string;
  mergeMsg?: string;
}

export interface FileVersions {
  base: string;
  ours: string;
  theirs: string;
  language: string;
}

export interface MergeResult {
  merged: string;
  conflicts: ConflictRegion[];
  hasConflict: boolean;
}

export interface ConflictRegion {
  index: number;
  oursStart: number;
  oursEnd: number;
  theirsStart: number;
  theirsEnd: number;
  baseStart: number;
  baseEnd: number;
  oursContent: string;
  theirsContent: string;
  baseContent: string;
  mergedStart: number;
  mergedEnd: number;
}
