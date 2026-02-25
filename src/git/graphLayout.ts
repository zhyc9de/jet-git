import type {
  CommitNode,
  GraphLayoutResult,
  LaneInfo,
  LaneLine,
  LaneSnapshot,
} from "./types";

/**
 * Compute graph layout for a list of commits.
 * Uses a greedy lane allocation algorithm with activeLanes tracking.
 * Supports cross-page stability via LaneSnapshot.
 */
export function computeGraphLayout(
  commits: CommitNode[],
  prevSnapshot?: LaneSnapshot,
  breakHiddenParents = false,
): GraphLayoutResult {
  const activeLanes: (string | null)[] = prevSnapshot
    ? [...prevSnapshot.activeLanes]
    : [];
  const laneColors: (number | null)[] = prevSnapshot?.laneColors
    ? [...prevSnapshot.laneColors]
    : activeLanes.map(() => null);
  while (laneColors.length < activeLanes.length) {
    laneColors.push(null);
  }
  let nextColorIndex =
    prevSnapshot?.nextColorIndex ?? prevSnapshot?.colorIndex ?? 0;

  const visibleSet = breakHiddenParents
    ? new Set(commits.map((c) => c.hash))
    : null;

  const lanes = new Map<string, LaneInfo>();

  for (const commit of commits) {
    // Find the lane this commit is expected in
    let col = activeLanes.indexOf(commit.hash);

    if (col === -1) {
      // New branch: assign a free lane
      col = findFreeOrAppend(activeLanes, laneColors);
      activeLanes[col] = commit.hash;
    }

    if (laneColors[col] === null || laneColors[col] === undefined) {
      laneColors[col] = nextColorIndex % 8;
      nextColorIndex++;
    }
    const color = laneColors[col] ?? 0;
    const lines: LaneLine[] = [];

    // Process parents
    if (commit.parents.length === 0) {
      // Root commit: lane ends
      activeLanes[col] = null;
      laneColors[col] = null;
    } else {
      const firstParent = commit.parents[0];
      const firstParentHidden =
        visibleSet !== null && !visibleSet.has(firstParent);

      if (firstParentHidden) {
        // Hidden parent in filter mode: keep relation metadata but end lane.
        lines.push({
          fromColumn: col,
          toColumn: col,
          toCommit: firstParent,
          type: "straight",
          hiddenParent: true,
        });
        activeLanes[col] = null;
        laneColors[col] = null;
      } else {
        // First parent continues in the same column
        const existingFirstParentCol = activeLanes.indexOf(firstParent);
        if (existingFirstParentCol !== -1 && existingFirstParentCol !== col) {
          // First parent already has a lane elsewhere: merge into it
          lines.push({
            fromColumn: col,
            toColumn: existingFirstParentCol,
            toCommit: firstParent,
            type: existingFirstParentCol < col ? "merge-left" : "merge-right",
          });
          activeLanes[col] = null;
          laneColors[col] = null;
        } else if (existingFirstParentCol === col) {
          // Already in the right lane
          lines.push({
            fromColumn: col,
            toColumn: col,
            toCommit: firstParent,
            type: "straight",
          });
        } else {
          // First parent not yet in any lane: continues in same column
          activeLanes[col] = firstParent;
          lines.push({
            fromColumn: col,
            toColumn: col,
            toCommit: firstParent,
            type: "straight",
          });
        }
      }

      // Additional parents (merge commit)
      for (let i = 1; i < commit.parents.length; i++) {
        const parent = commit.parents[i];

        // Hidden parent in filter mode: keep relation metadata, but do not
        // allocate lanes for invisible commits.
        if (visibleSet !== null && !visibleSet.has(parent)) {
          lines.push({
            fromColumn: col,
            toColumn: col,
            toCommit: parent,
            type: "straight",
            hiddenParent: true,
          });
          continue;
        }

        const existingParentCol = activeLanes.indexOf(parent);

        if (existingParentCol !== -1) {
          // Parent already tracked: draw merge line
          lines.push({
            fromColumn: col,
            toColumn: existingParentCol,
            toCommit: parent,
            type: existingParentCol < col ? "merge-left" : "merge-right",
          });
        } else {
          // Fork: assign a new lane for this parent
          const forkCol = findFreeOrAppend(activeLanes, laneColors);
          activeLanes[forkCol] = parent;
          laneColors[forkCol] = nextColorIndex % 8;
          nextColorIndex++;
          lines.push({
            fromColumn: col,
            toColumn: forkCol,
            toCommit: parent,
            type: forkCol < col ? "fork-left" : "fork-right",
          });
        }
      }
    }

    lanes.set(commit.hash, { column: col, color: color % 8, lines });
  }

  compactLanes(activeLanes, laneColors);

  // Convert Map to Record for JSON serialization
  const lanesRecord: Record<string, LaneInfo> = {};
  for (const [key, value] of lanes) {
    lanesRecord[key] = value;
  }

  return {
    graphData: {
      commits,
      lanes: lanesRecord,
    },
    snapshot: {
      activeLanes: [...activeLanes],
      laneColors: [...laneColors],
      nextColorIndex,
    },
  };
}

/** Find the first null slot in activeLanes, or append a new slot */
function findFreeOrAppend(
  activeLanes: (string | null)[],
  laneColors: (number | null)[],
): number {
  const idx = activeLanes.indexOf(null);
  if (idx !== -1) {
    return idx;
  }
  activeLanes.push(null);
  laneColors.push(null);
  return activeLanes.length - 1;
}

/** Remove trailing null entries from activeLanes and laneColors */
function compactLanes(
  activeLanes: (string | null)[],
  laneColors: (number | null)[],
): void {
  while (
    activeLanes.length > 0 &&
    activeLanes[activeLanes.length - 1] === null
  ) {
    activeLanes.pop();
    laneColors.pop();
  }
}
