# Changelog

All notable changes to JetGit will be documented in this file.

## [0.0.2] - 2026-02-25

### Fixed

- Show all changed files for root commit.

### Changed

- Remove VS Code version restriction.

## [0.0.1] - 2026-02-25

### Added

- **Git Graph**: SVG-rendered commit graph with branch lanes, collapsible sequences, and virtual scrolling.
- **Branch Tree**: Browse and filter local/remote branches.
- **Commit Detail**: File change tree with diff viewer.
- **Diff Editor**: Text diff rendering powered by syntax highlighting.
- **3-Way Merge Editor**: Three-column comparison with Shiki syntax highlighting and word-level inline diffs.
- **Conflict Resolution**: Per-block Accept/Skip/Undo, bulk Accept Left/Accept Right.
- **Conflict Navigation**: Prev/next conflict jump with change/conflict stats display.
- **Apply Flow**: Save + stage + open merged result + close editor.
- **Cancel Flow**: Dirty state confirmation dialog, close discards in-memory state.
- **Conflict List Page**: File tree showing conflict files with multi-select Accept Ours/Theirs.
- **SCM Integration**: Open Merge Editor and Conflict List from Source Control panel.
- **Modifier-click Selection**: Shift/Cmd click for multi-select in file lists.
