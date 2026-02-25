export interface Commit {
  hash: string;
  shortHash: string;
  parents: string[];
  authorName: string;
  authorEmail: string;
  authorDate: string;
  subject: string;
  body: string;
  refs: RefInfo[];
}

export interface RefInfo {
  type: "branch" | "remote-branch" | "tag" | "HEAD";
  name: string;
}

export interface GraphData {
  commits: Commit[];
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

export interface DiffFile {
  oldPath: string;
  newPath: string;
  status: "added" | "deleted" | "modified" | "renamed" | "copied";
  isBinary: boolean;
}

export interface LogOptions {
  maxCount?: number;
  skip?: number;
  branch?: string;
  author?: string;
  search?: string;
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
  mergeMsg?: string;
}

export interface CollapsibleSequence {
  id: string; // "seq-{headHash}-{tailHash}"
  headHash: string; // 序列上方锚点（可见，不被折叠）
  tailHash: string; // 序列下方锚点（可见，不被折叠）
  intermediates: string[]; // 中间可折叠的 commit hash（newest-first）
  column: number;
  color: number;
}

export interface ConflictRegion {
  index: number;
  oursContent: string;
  theirsContent: string;
  baseContent: string;
  mergedStart: number;
  mergedEnd: number;
}
