import * as vscode from "vscode";
import type { GitService } from "../git/gitService";
import type { DiffFile } from "../git/types";
import { GIT_BRAINS_SCHEME } from "./gitContentProvider";

export class DiffEditorManager {
  constructor(private readonly gitService: GitService) {}

  async openDiffEditor(
    commit: string,
    filePath: string,
    fileMeta?: DiffFile,
    baseRef?: string,
    cherryPickHashes?: string[],
  ): Promise<void> {
    const status = fileMeta?.status ?? "modified";
    const oldPath = fileMeta?.oldPath ?? filePath;
    const newPath = fileMeta?.newPath ?? filePath;

    // Determine left (parent) and right (commit) refs
    let leftRef: string;
    let rightRef: string = commit;

    if (cherryPickHashes && cherryPickHashes.length > 1) {
      const range = await this.gitService.findFileRange(
        cherryPickHashes,
        newPath || oldPath,
      );
      if (range) {
        rightRef = range.newest;
        const parents = await this.gitService.getCommitParents(range.oldest);
        leftRef = parents[0] ?? "";
      } else {
        const parents = await this.gitService.getCommitParents(commit);
        leftRef = parents[0] ?? "";
      }
    } else if (baseRef) {
      leftRef = baseRef;
    } else {
      const parents = await this.gitService.getCommitParents(commit);
      leftRef = parents[0] ?? "";
    }

    // Build URIs based on file status
    let leftUri: vscode.Uri;
    let rightUri: vscode.Uri;

    switch (status) {
      case "added":
        leftUri = vscode.Uri.parse(
          `${GIT_BRAINS_SCHEME}:/${newPath}?ref=empty`,
        );
        rightUri = vscode.Uri.parse(
          `${GIT_BRAINS_SCHEME}:/${newPath}?ref=${rightRef}`,
        );
        break;
      case "deleted":
        leftUri = vscode.Uri.parse(
          `${GIT_BRAINS_SCHEME}:/${oldPath}?ref=${leftRef}`,
        );
        rightUri = vscode.Uri.parse(
          `${GIT_BRAINS_SCHEME}:/${oldPath}?ref=empty`,
        );
        break;
      case "renamed":
      case "copied":
        leftUri = vscode.Uri.parse(
          `${GIT_BRAINS_SCHEME}:/${oldPath}?ref=${leftRef}`,
        );
        rightUri = vscode.Uri.parse(
          `${GIT_BRAINS_SCHEME}:/${newPath}?ref=${rightRef}`,
        );
        break;
      default: // modified
        leftUri = vscode.Uri.parse(
          `${GIT_BRAINS_SCHEME}:/${newPath}?ref=${leftRef}`,
        );
        rightUri = vscode.Uri.parse(
          `${GIT_BRAINS_SCHEME}:/${newPath}?ref=${rightRef}`,
        );
        break;
    }

    // Build title
    const fileName = filePath.split("/").pop() ?? filePath;
    const shortHash = commit.substring(0, 7);
    const title =
      cherryPickHashes && cherryPickHashes.length > 1
        ? `${fileName} (${cherryPickHashes.length} commits)`
        : baseRef
          ? `${fileName} (${baseRef.substring(0, 7)}..${shortHash})`
          : `${fileName} (${shortHash})`;

    await vscode.commands.executeCommand(
      "vscode.diff",
      leftUri,
      rightUri,
      title,
    );
  }
}
