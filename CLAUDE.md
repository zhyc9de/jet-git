# Claude Code Project Guide

## Project Structure

```
src/                    Extension Host (TypeScript + Node.js)
  ├── extension.ts        Entry point, command registration & MessageRouter handlers
  ├── git/                Git CLI wrappers (gitService, graphLayout, types)
  ├── messages/           Communication protocol (protocol, messageRouter)
  └── views/              Webview managers (mergeEditorManager, conflictsManager, diffEditorManager, html)
webview/                Webview Frontend (React 19 + Vite)
  └── src/
      ├── panel/          Git Log panel (Graph, CommitList, BranchTree, DetailPanel)
      ├── conflicts/      Conflict list page + 3-Way Merge Editor
      ├── shared/         Shared modules (bridge, store, hooks, components, theme)
      └── main.tsx        Router entry (mode: panel | merge | conflicts)
```

## Code Conventions

### Formatting & Linting

- Formatter & linter: `biome check` (config in biome.json)
- Must pass `pnpm run compile` (check-types + lint + esbuild) before publishing

### Tech Stack

- **Extension Host**: TypeScript, Node.js, child_process (execFile), esbuild
- **Webview**: React 19, Zustand, allotment, @tanstack/react-virtual, shiki, diff, node-diff3
- **Communication**: postMessage request-response + event broadcast (MessageRouter)
- **Graph Rendering**: SVG + DOM (not Canvas)
- **Package Manager**: pnpm (monorepo, pnpm-workspace.yaml)

### Key Design Decisions

- Direct Git CLI calls (no simple-git), custom `\x00` delimiter parsing
- Self-implemented graph layout algorithm (greedy lane allocation + LaneSnapshot)
- 3-way merge via node-diff3, 2-way diff via diff library
- Single MessageRouter architecture shared by all Webviews
- Bridge protocol maintained in sync across `webview/src/shared/bridge/types.ts` and `src/messages/protocol.ts`

### Version Pinning

- Do not upgrade React or Vite versions proactively

## Build Commands

```bash
pnpm run compile          # Extension: check-types + lint + esbuild
pnpm run build:web        # Webview: tsc + vite build
pnpm run build            # Both of the above
pnpm run watch            # Dev mode (esbuild + tsc + vite parallel watch)
pnpm run package          # Production build (for vsce publish)
```
