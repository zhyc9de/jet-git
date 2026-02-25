import * as vscode from "vscode";
import type { MessageRouter } from "../messages/messageRouter";
import { getWebviewHtml } from "./html";

export class MergeEditorManager {
  private panels = new Map<string, vscode.WebviewPanel>();

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly messageRouter: MessageRouter,
  ) {}

  openMergeEditor(filePath: string, mergeMsg?: string): void {
    const existing = this.panels.get(filePath);
    if (existing) {
      existing.reveal();
      return;
    }

    const fileName = filePath.split("/").pop() ?? filePath;
    const panel = vscode.window.createWebviewPanel(
      "git-brains.mergeEditor",
      `Merge: ${fileName}`,
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, "dist")],
      },
    );

    panel.webview.html = getWebviewHtml(
      panel.webview,
      this.extensionUri,
      "merge",
      {
        file: filePath,
        "merge-msg": mergeMsg ?? "",
      },
    );

    const routerDisposable = this.messageRouter.registerWebview(panel.webview);

    this.panels.set(filePath, panel);
    panel.onDidDispose(() => {
      this.panels.delete(filePath);
      routerDisposable.dispose();
    });
  }

  closeMergeEditor(filePath: string): void {
    const panel = this.panels.get(filePath);
    if (panel) {
      panel.dispose();
    }
  }
}
