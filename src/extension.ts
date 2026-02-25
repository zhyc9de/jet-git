import * as vscode from "vscode";
import { GitService } from "./git/gitService";
import type { DiffFile, LaneSnapshot } from "./git/types";
import { MessageRouter } from "./messages/messageRouter";
import { ConflictsManager } from "./views/conflictsManager";
import { DiffEditorManager } from "./views/diffEditorManager";
import {
  GIT_BRAINS_SCHEME,
  GitContentProvider,
} from "./views/gitContentProvider";
import { GitLogViewProvider } from "./views/gitLogViewProvider";
import { MergeEditorManager } from "./views/mergeEditorManager";
import { GitWatcher } from "./watchers/gitWatcher";

const NOT_GIT_REPO = { status: "not_git_repo" as const, data: null };

export function activate(context: vscode.ExtensionContext) {
  // 1. MessageRouter (always created)
  const messageRouter = new MessageRouter();

  // 2. GitLogViewProvider (always registered)
  const logProvider = new GitLogViewProvider(
    context.extensionUri,
    messageRouter,
  );
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      GitLogViewProvider.viewType,
      logProvider,
      { webviewOptions: { retainContextWhenHidden: true } },
    ),
  );

  // 3. MergeEditorManager + ConflictsManager (always created)
  const mergeManager = new MergeEditorManager(
    context.extensionUri,
    messageRouter,
  );
  const conflictsManager = new ConflictsManager(
    context.extensionUri,
    messageRouter,
  );

  // 4. GitService (may be null if no workspace)
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  let gitService: GitService | null = null;
  let diffManager: DiffEditorManager | null = null;

  if (workspaceRoot) {
    gitService = new GitService(workspaceRoot);

    // Register virtual document provider for git file content
    const contentProvider = new GitContentProvider(gitService);
    context.subscriptions.push(
      vscode.workspace.registerTextDocumentContentProvider(
        GIT_BRAINS_SCHEME,
        contentProvider,
      ),
    );

    diffManager = new DiffEditorManager(gitService);
  }

  // 5. Register VSCode commands (always registered)
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "git-brains.openMergeEditor",
      (file?: string) => {
        mergeManager.openMergeEditor(file ?? "untitled");
      },
    ),
    vscode.commands.registerCommand(
      "git-brains.openDiffEditor",
      (commit?: string, filePath?: string) => {
        if (commit && filePath && diffManager) {
          diffManager.openDiffEditor(commit, filePath);
        }
      },
    ),
    vscode.commands.registerCommand("git-brains.refreshLog", () => {
      messageRouter.broadcastEvent("gitStateChanged", { scope: "all" });
    }),
    vscode.commands.registerCommand("git-brains.openConflicts", () => {
      conflictsManager.openConflictsPanel();
    }),
    vscode.commands.registerCommand(
      "git-brains.openMergeEditorFromSCM",
      (arg?: unknown) => {
        const filePath = getScmResourcePath(arg);
        if (!filePath) {
          void vscode.window.showWarningMessage(
            "Unable to locate conflict file from SCM item.",
          );
          return;
        }
        mergeManager.openMergeEditor(filePath);
      },
    ),
  );

  // 6. Register command handlers to MessageRouter
  // If GitService is unavailable, handlers return { status: 'not_git_repo' }

  messageRouter.handle("openMergeEditor", async (params) => {
    const file = (params.file as string) ?? "untitled";
    mergeManager.openMergeEditor(file);
    return undefined;
  });

  messageRouter.handle("openDiffEditor", async (params) => {
    if (!diffManager) return undefined;
    const commit = params.commit as string;
    const filePathParam = params.filePath as string | undefined;
    const fileParam = params.file as string | DiffFile | undefined;
    const baseRef = params.baseRef as string | undefined;
    const cherryPickHashes = params.cherryPickHashes as string[] | undefined;
    const fileMeta =
      typeof fileParam === "object" && fileParam !== null
        ? (fileParam as DiffFile)
        : undefined;
    const filePath =
      filePathParam ??
      (typeof fileParam === "string" ? fileParam : undefined) ??
      fileMeta?.newPath ??
      fileMeta?.oldPath;

    if (commit && filePath) {
      await diffManager.openDiffEditor(
        commit,
        filePath,
        fileMeta,
        baseRef,
        cherryPickHashes,
      );
    }
    return undefined;
  });

  messageRouter.handle("getGraphData", async (params) => {
    if (!gitService) {
      return NOT_GIT_REPO;
    }
    const options = {
      maxCount: (params.maxCount as number) ?? 200,
      skip: params.skip as number | undefined,
      branch: params.branch as string | undefined,
      search: params.search as string | undefined,
      author: params.author as string | undefined,
    };
    const snapshot = params.snapshot as LaneSnapshot | undefined;
    const result = await gitService.getGraphTopology(options, snapshot);
    return result;
  });

  messageRouter.handle("getLog", async (params) => {
    if (!gitService) {
      return NOT_GIT_REPO;
    }
    return gitService.getLog(
      params as Record<string, unknown> & { maxCount?: number },
    );
  });

  messageRouter.handle("loadMoreLog", async (params) => {
    if (!gitService) {
      return NOT_GIT_REPO;
    }
    const options = {
      maxCount: (params.count as number) ?? 200,
      skip: (params.skip as number) ?? 0,
      branch: params.branch as string | undefined,
      search: params.search as string | undefined,
      author: params.author as string | undefined,
    };
    const snapshot = params.snapshot as LaneSnapshot | undefined;
    const result = await gitService.getGraphTopology(options, snapshot);
    return result;
  });

  messageRouter.handle("getBranches", async () => {
    if (!gitService) {
      return NOT_GIT_REPO;
    }
    return gitService.getBranches();
  });

  messageRouter.handle("getTags", async () => {
    if (!gitService) {
      return NOT_GIT_REPO;
    }
    return gitService.getTags();
  });

  messageRouter.handle("getDiff", async (params) => {
    if (!gitService) {
      return NOT_GIT_REPO;
    }
    const ref1 = params.ref1 as string;
    const ref2 = params.ref2 as string;
    const file = params.file as string | undefined;
    return gitService.getDiff(ref1, ref2, file);
  });

  messageRouter.handle("getFileContent", async (params) => {
    if (!gitService) {
      return NOT_GIT_REPO;
    }
    const ref = params.ref as string;
    const filePath = params.filePath as string;
    return gitService.getFileContent(ref, filePath);
  });

  messageRouter.handle("getCommitFiles", async (params) => {
    if (!gitService) {
      return NOT_GIT_REPO;
    }
    const hash = params.hash as string;
    return gitService.getCommitFiles(hash);
  });

  messageRouter.handle("getCommitRangeFiles", async (params) => {
    if (!gitService) {
      return NOT_GIT_REPO;
    }
    const hashes = params.hashes as string[];
    return gitService.getCommitRangeFiles(hashes);
  });

  messageRouter.handle("getStatus", async () => {
    if (!gitService) {
      return NOT_GIT_REPO;
    }
    return gitService.getStatus();
  });

  messageRouter.handle("getMergeState", async () => {
    if (!gitService) return NOT_GIT_REPO;
    return gitService.getMergeState();
  });

  messageRouter.handle("getConflictFiles", async () => {
    if (!gitService) return NOT_GIT_REPO;
    return gitService.getConflictFiles();
  });

  messageRouter.handle("getFileVersions", async (params) => {
    if (!gitService) return NOT_GIT_REPO;
    const filePath = params.filePath as string;
    const versions = await gitService.getFileVersions(filePath);
    const mergeState = await gitService.getMergeState();
    const ext = filePath.split(".").pop() ?? "";
    return {
      ...versions,
      language: extToLanguage(ext),
      mergeMsg: mergeState.mergeMsg,
    };
  });

  messageRouter.handle("saveMergedContent", async (params) => {
    if (!gitService) return NOT_GIT_REPO;
    await gitService.saveMergedContent(
      params.filePath as string,
      params.content as string,
    );
    return { success: true };
  });

  messageRouter.handle("stageFile", async (params) => {
    if (!gitService) return NOT_GIT_REPO;
    await gitService.stageFile(params.filePath as string);
    return { success: true };
  });

  messageRouter.handle("acceptOurs", async (params) => {
    if (!gitService) return NOT_GIT_REPO;
    await gitService.acceptOurs(params.filePath as string);
    return { success: true };
  });

  messageRouter.handle("acceptTheirs", async (params) => {
    if (!gitService) return NOT_GIT_REPO;
    await gitService.acceptTheirs(params.filePath as string);
    return { success: true };
  });

  messageRouter.handle("confirmCancelMerge", async (params) => {
    const hasChanges = params.hasChanges as boolean;
    if (!hasChanges) return { confirmed: true };
    const choice = await vscode.window.showWarningMessage(
      "You have unsaved merge changes. Discard them?",
      { modal: true },
      "Discard",
    );
    return { confirmed: choice === "Discard" };
  });

  messageRouter.handle("closeMergeEditor", async (params) => {
    const filePath = params.filePath as string;
    mergeManager.closeMergeEditor(filePath);
    return { success: true };
  });

  messageRouter.handle("openFile", async (params) => {
    const filePath = params.filePath as string;
    const absPath = workspaceRoot
      ? vscode.Uri.joinPath(vscode.Uri.file(workspaceRoot), filePath)
      : vscode.Uri.file(filePath);
    await vscode.window.showTextDocument(absPath);
    return { success: true };
  });

  // 7. GitWatcher (only if GitService is available)
  if (gitService && workspaceRoot) {
    const watcher = new GitWatcher(
      workspaceRoot,
      messageRouter,
      gitService.cache,
    );
    context.subscriptions.push(watcher);
  }
}

function extToLanguage(ext: string): string {
  const map: Record<string, string> = {
    ts: "typescript",
    tsx: "typescriptreact",
    js: "javascript",
    jsx: "javascriptreact",
    py: "python",
    rb: "ruby",
    go: "go",
    rs: "rust",
    java: "java",
    kt: "kotlin",
    swift: "swift",
    c: "c",
    cpp: "cpp",
    h: "c",
    hpp: "cpp",
    cs: "csharp",
    css: "css",
    scss: "scss",
    less: "less",
    html: "html",
    xml: "xml",
    json: "json",
    yaml: "yaml",
    yml: "yaml",
    md: "markdown",
    sql: "sql",
    sh: "shellscript",
    bash: "shellscript",
    toml: "toml",
    ini: "ini",
    vue: "vue",
    svelte: "svelte",
  };
  return map[ext.toLowerCase()] ?? "plaintext";
}

export function deactivate() {}

function getScmResourcePath(arg?: unknown): string | undefined {
  const value = arg as unknown;
  let uri: vscode.Uri | undefined;
  if (value instanceof vscode.Uri) {
    uri = value;
  } else if (value && typeof value === "object") {
    if ("resourceUri" in value) {
      uri = (value as { resourceUri?: vscode.Uri }).resourceUri;
    } else if ("sourceUri" in value) {
      uri = (value as { sourceUri?: vscode.Uri }).sourceUri;
    }
  }
  if (!uri) return undefined;

  return vscode.workspace.asRelativePath(uri, false);
}
