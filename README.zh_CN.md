<a name="readme-top"></a>

<div align="center">

<h1>Git Brains</h1>

JetBrains 风格的 Git 可视化工具 —— 在一个扩展中提供 Git Graph、Diff 查看器和三方合并编辑器。

[English](./README.md) · **简体中文**

<!-- SHIELD GROUP -->

[![][github-license-shield]][github-license-link]

</div>

## ✨ 功能

- 🌳 **Git Graph** — SVG 渲染的提交图，支持分支车道、可折叠序列、虚拟滚动，轻松处理大型仓库。
- 🔀 **分支树** — 浏览和筛选本地/远程分支，支持键盘导航。
- 📄 **Diff 编辑器** — 带语法高亮的并排文本 Diff 查看。
- 🔧 **三方合并编辑器** — 三栏对比（Theirs | Result | Yours），Shiki 语法高亮，word 级别 inline diff。
- ⚡ **冲突解决** — 逐块 Accept / Skip / Undo，批量 Accept Left / Accept Right，上一个/下一个冲突导航。
- 📋 **冲突列表** — 文件树展示所有冲突文件，支持多选 Accept Ours / Accept Theirs。
- 🔗 **SCM 集成** — 从 VS Code 源代码管理面板直接打开合并编辑器和冲突列表。

## 📦 安装

1. 在 VS Code 扩展中搜索 **"Git Brains"** 并点击 **安装**。
2. 或从 [Visual Studio Code Marketplace](https://marketplace.visualstudio.com/items?itemName=zhycde.git-brains) 安装。

> **注意**
> 需要 Git 已安装并在 PATH 中。Windows 尚未充分测试。

## 🤯 使用

### Git Graph

打开底部面板，切换到 **Git Brains** 标签页即可查看提交图、分支树和提交详情。

![Git Graph](./images/git-graph.png)

### 合并编辑器

1. 出现合并冲突时，点击 **源代码管理** 面板标题栏的合并图标打开 **冲突列表**。

![冲突列表](./images/conflicts-list.png)

2. 双击冲突文件进入 **三方合并编辑器**。

![三方合并编辑器](./images/three-way-merge.png)
3. 使用逐块按钮或底部操作栏（**Accept Left** / **Accept Right**）解决冲突。
4. 使用工具栏的 **▲ / ▼** 按钮在冲突之间导航。
5. 点击 **Apply** 保存、暂存并打开合并结果。

## TODO

- [ ] 三方合并编辑器：Result 列暂不支持编辑（后续支持）
- [ ] 适配不同的 VS Code 主题

## ⌨️ 本地开发

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

## 📝 License

本项目基于 [MIT](./LICENSE) 协议开源。

<!-- LINK GROUP -->

[github-license-link]: https://github.com/zhyc9de/git-brains/blob/main/LICENSE
[github-license-shield]: https://img.shields.io/github/license/user/git-brains?color=white&labelColor=black&style=flat-square
