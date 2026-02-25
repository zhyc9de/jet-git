import type * as vscode from "vscode";
import type { GitService } from "../git/gitService";

export const GIT_BRAINS_SCHEME = "git-brains";

/**
 * Provides virtual document content for git file revisions.
 * Uri format: git-brains:/<filePath>?ref=<commitHash>
 */
export class GitContentProvider implements vscode.TextDocumentContentProvider {
  constructor(private readonly gitService: GitService) {}

  async provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
    const ref = new URLSearchParams(uri.query).get("ref") ?? "";
    const filePath = uri.path.startsWith("/") ? uri.path.slice(1) : uri.path;
    if (!ref || !filePath) {
      return "";
    }
    return this.gitService.getFileContent(ref, filePath);
  }
}
