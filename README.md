<a name="readme-top"></a>

<div align="center">

<h1>JetGit</h1>

JetBrains-style Git visualization for VS Code — Git Graph, Diff viewer, and 3-Way Merge Editor in one extension.

**English** · [简体中文](./README.zh_CN.md)

<!-- SHIELD GROUP -->

[![][github-license-shield]][github-license-link]

</div>

## ✨ Features

- 🌳 **Git Graph** — SVG-rendered commit graph with branch lanes, collapsible sequences, and virtual scrolling for large repos.
- 🔀 **Branch Tree** — Browse and filter local/remote branches with keyboard navigation.
- 📄 **Diff Editor** — Side-by-side text diff viewer powered by syntax highlighting.
- 🔧 **3-Way Merge Editor** — Three-column comparison (Theirs | Result | Yours) with Shiki syntax highlighting and word-level inline diffs.
- ⚡ **Conflict Resolution** — Per-block Accept / Skip / Undo, bulk Accept Left / Accept Right, prev/next conflict navigation.
- 📋 **Conflict List** — File tree showing all conflicting files with multi-select Accept Ours / Accept Theirs.
- 🔗 **SCM Integration** — Open Merge Editor and Conflict List directly from the VS Code Source Control panel.

## 📦 Installation

1. Search for **"JetGit"** in VS Code Extensions and click **Install**.
2. Or install from the [Visual Studio Code Marketplace](https://marketplace.visualstudio.com/items?itemName=zhycde.git-brains).

> **Note**
> Requires Git installed in your PATH. Windows is not fully tested yet.

## 🤯 Usage

### Git Graph

Open the bottom panel and switch to the **JetGit** tab to view the commit graph, branch tree, and commit details.

![Git Graph](./images/git-graph.png)

### Merge Editor

1. When merge conflicts occur, click the merge icon in the **Source Control** panel title bar to open the **Conflict List**.

![Conflict List](./images/conflicts-list.png)

2. Double-click a conflicting file to open the **3-Way Merge Editor**.

![3-Way Merge Editor](./images/three-way-merge.png)
3. Use per-block buttons or the bottom action bar (**Accept Left** / **Accept Right**) to resolve conflicts.
4. Navigate between conflicts using the **▲ / ▼** buttons in the toolbar.
5. Click **Apply** to save, stage, and open the merged result.

## TODO

- [ ] 3-Way Merge Editor: the Result column is read-only for now (editing support coming soon)
- [ ] Adapt to different VS Code color themes

## ⌨️ Local Development

```bash
git clone https://github.com/zhyc9de/git-brains.git
cd git-brains
pnpm install
cd webview && pnpm install && cd ..
```

Open the project in VS Code. Press **F5** to launch the Extension Development Host.

```bash
pnpm run watch       # Watch mode (extension + webview)
pnpm run build       # Full production build
```

## 📝 License

This project is [MIT](./LICENSE) licensed.

<!-- LINK GROUP -->

[github-license-link]: https://github.com/zhyc9de/git-brains/blob/main/LICENSE
[github-license-shield]: https://img.shields.io/github/license/user/git-brains?color=white&labelColor=black&style=flat-square
