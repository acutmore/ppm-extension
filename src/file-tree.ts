import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

class FileItem extends vscode.TreeItem {
    constructor(
        label: string,
        public readonly path: string,
        public readonly folderOrFile: "folder" | "file",
    ) {
        super(
            vscode.Uri.file(path),
            folderOrFile === "file"
                ? vscode.TreeItemCollapsibleState.None
                : vscode.TreeItemCollapsibleState.Collapsed,
        );
        const level = Math.random() * 100;
        this.label = progressBar(level) + " " + label;
    }
}

export class PPMTreeDataProvider implements vscode.TreeDataProvider<FileItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<
        FileItem | undefined
    >();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    constructor(private workspaceRoot?: string) {}

    getTreeItem(
        element: FileItem,
    ): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    async getChildren(element?: FileItem | undefined): Promise<FileItem[]> {
        const root = this.workspaceRoot;
        // No Workspace
        if (!root) {
            return [];
        }
        // Root
        if (!element) {
            return fileItemsForDirectory(root);
        }
        // File
        if (element.folderOrFile === "file") {
            return [];
        }
        // Folder
        return fileItemsForDirectory(element.path);
    }

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }
}

async function fileItemsForDirectory(directory: string) {
    const dir = await fs.promises.readdir(directory, {
        encoding: "utf8",
        withFileTypes: true,
    });

    return dir.flatMap((entry) => {
        let folderOrFile: "folder" | "file" | null = null;

        if (entry.isFile()) {
            folderOrFile = "file" as const;
        } else if (entry.isDirectory()) {
            folderOrFile = "folder" as const;
        }

        if (folderOrFile) {
            return new FileItem(
                entry.name,
                path.join(directory, entry.name),
                folderOrFile,
            );
        }

        return [];
    });
}

function progressBar(p: number): string {
    const bar = `⣿⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀`.split("");
    const fill = bar.shift()!;

    for (let i = 10; i <= Math.min(p, 100); i += 10) {
        bar[i / 10 - 1] = fill;
    }

    return bar.join("");
}
