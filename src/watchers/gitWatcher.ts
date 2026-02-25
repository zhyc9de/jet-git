import * as vscode from "vscode";
import type { GitCache } from "../git/cache";
import type { MessageRouter } from "../messages/messageRouter";

type Scope = "all" | "branches" | "status" | "mergeState" | "log";

export class GitWatcher implements vscode.Disposable {
  private disposables: vscode.Disposable[] = [];
  private debounceTimers = new Map<Scope, ReturnType<typeof setTimeout>>();

  constructor(
    private readonly workspaceRoot: string,
    private readonly messageRouter: MessageRouter,
    private readonly cache: GitCache,
  ) {
    this.setupFileWatchers();
    this.setupEditorWatchers();
  }

  private setupFileWatchers(): void {
    const gitBase = vscode.Uri.file(`${this.workspaceRoot}/.git`);

    // .git/HEAD → all
    const headWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(gitBase, "HEAD"),
    );
    headWatcher.onDidChange(() => this.notify("all"));
    headWatcher.onDidCreate(() => this.notify("all"));
    headWatcher.onDidDelete(() => this.notify("all"));
    this.disposables.push(headWatcher);

    // .git/refs/heads/** → branches
    const headsWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(gitBase, "refs/heads/**"),
    );
    headsWatcher.onDidChange(() => this.notify("branches"));
    headsWatcher.onDidCreate(() => this.notify("branches"));
    headsWatcher.onDidDelete(() => this.notify("branches"));
    this.disposables.push(headsWatcher);

    // .git/refs/remotes/** → branches
    const remotesWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(gitBase, "refs/remotes/**"),
    );
    remotesWatcher.onDidChange(() => this.notify("branches"));
    remotesWatcher.onDidCreate(() => this.notify("branches"));
    remotesWatcher.onDidDelete(() => this.notify("branches"));
    this.disposables.push(remotesWatcher);

    // .git/refs/tags/** → branches (tags group)
    const tagsWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(gitBase, "refs/tags/**"),
    );
    tagsWatcher.onDidChange(() => this.notify("branches"));
    tagsWatcher.onDidCreate(() => this.notify("branches"));
    tagsWatcher.onDidDelete(() => this.notify("branches"));
    this.disposables.push(tagsWatcher);

    // .git/index → status
    const indexWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(gitBase, "index"),
    );
    indexWatcher.onDidChange(() => this.notify("status"));
    this.disposables.push(indexWatcher);

    // .git/MERGE_HEAD → mergeState
    const mergeHeadWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(gitBase, "MERGE_HEAD"),
    );
    mergeHeadWatcher.onDidChange(() => this.notify("mergeState"));
    mergeHeadWatcher.onDidCreate(() => this.notify("mergeState"));
    mergeHeadWatcher.onDidDelete(() => this.notify("mergeState"));
    this.disposables.push(mergeHeadWatcher);

    // .git/COMMIT_EDITMSG → log
    const commitMsgWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(gitBase, "COMMIT_EDITMSG"),
    );
    commitMsgWatcher.onDidChange(() => this.notify("log"));
    commitMsgWatcher.onDidCreate(() => this.notify("log"));
    this.disposables.push(commitMsgWatcher);
  }

  private setupEditorWatchers(): void {
    // Save → status refresh
    this.disposables.push(
      vscode.workspace.onDidSaveTextDocument(() => this.notify("status")),
    );
  }

  private notify(scope: Scope): void {
    // Debounce per scope, 300ms
    const existing = this.debounceTimers.get(scope);
    if (existing) {
      clearTimeout(existing);
    }

    this.debounceTimers.set(
      scope,
      setTimeout(() => {
        this.debounceTimers.delete(scope);
        this.cache.invalidate();
        this.messageRouter.broadcastEvent("gitStateChanged", { scope });
      }, 300),
    );
  }

  dispose(): void {
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
    for (const d of this.disposables) {
      d.dispose();
    }
    this.disposables = [];
  }
}
