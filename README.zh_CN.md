<a name="readme-top"></a>

<div align="center">

<h1>JetGit</h1>

JetBrains 风格的 Git 可视化工具 —— 在一个扩展中提供 Git Graph、Diff 查看器和三方合并编辑器。

[English](./README.md) · **简体中文**

<!-- SHIELD GROUP -->

[![][github-license-shield]][github-license-link]

</div>

## 功能

### Git Graph — 直观的提交历史

![Git Graph](./images/git-graph.png)

- 左侧**分支树**：按 Current Branch / Local / Remote / Tags 分层展示，快速导航
- 中间**提交列表**：彩色分支线连接提交，显示分支/标签标记（如 `HEAD → main`、`origin/main`）、作者、时间
- 右侧**详情面板**：选中 commit 后查看完整提交信息和变更文件列表，支持按目录分组或平铺展示
- 支持搜索 commits，按分支筛选
- 点击变更文件可打开 **Diff 编辑器**，并排对比代码差异

### 三方合并编辑器 — 清晰的三方合并

![三方合并编辑器](./images/three-way-merge.png)

- 三栏布局：**Left (Theirs)** | **Center (Result)** | **Right (Yours)**
- 冲突区域用红色/绿色高亮标记，一眼区分变更内容
- 每个冲突块上有操作按钮可快速处理
- 顶部显示冲突统计（如 "3 changes · 3 conflicts"）
- 底部操作栏：**Accept Left** / **Accept Right** 批量接受一侧，**Cancel** / **Apply** 确认操作
- 语法高亮让代码在合并过程中保持可读

### 冲突列表 — 高效的冲突管理

![冲突列表](./images/conflicts-list.png)

- 显示合并信息（如 "Merging branch conflict-branch-a into conflict-branch-b"）
- 冲突文件列表，每个文件显示 Yours / Theirs 的修改状态
- 支持按目录分组（Group files by directory）
- 右侧快捷操作：**Accept Yours** / **Accept Theirs** 一键接受，**Merge...** 按钮打开三方合并编辑器
- 与 VS Code **源代码管理**面板无缝集成，Merge Changes 区域直接可见冲突文件

## 安装

1. 在 VS Code 扩展中搜索 **"JetGit"** 并点击**安装**。
2. 或从 [Visual Studio Code Marketplace](https://marketplace.visualstudio.com/items?itemName=zhycde.git-brains) 安装。

## 环境要求

- VS Code 1.85.0 或更高版本
- Git 已安装并在 PATH 中可用
- Windows 支持为实验性

## 命令

| 命令 | 描述 | 访问方式 |
|------|------|----------|
| JetGit: Refresh Git Log | 刷新提交图 | 命令面板 / 面板工具栏 |
| JetGit: Conflicts | 打开冲突列表 | 命令面板 / SCM 工具栏 |
| JetGit: Open Merge Editor | 打开合并编辑器 | 命令面板 |
| JetGit: Open in JetGit Merge Editor | 从 SCM 打开合并编辑器 | 右键冲突文件 |

## TODO

- [ ] Local Changes — 类似 JetBrains 的 Changelists，管理未提交的变更
- [ ] 三方合并编辑器：Result 列暂为只读（编辑支持开发中）
- [ ] 主题适配进行中

## 本地开发

```bash
git clone https://github.com/zhyc9de/git-brains.git
cd git-brains
pnpm install
cd webview && pnpm install && cd ..
```

在 VS Code 中打开项目，按 **F5** 启动扩展开发宿主。

```bash
pnpm run watch       # 监听模式（扩展 + webview）
pnpm run build       # 完整生产构建
```

## License

本项目基于 [MIT](./LICENSE) 协议开源。

<!-- LINK GROUP -->

[github-license-link]: https://github.com/zhyc9de/git-brains/blob/main/LICENSE
[github-license-shield]: https://img.shields.io/github/license/user/git-brains?color=white&labelColor=black&style=flat-square
