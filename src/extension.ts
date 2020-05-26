import * as vscode from "vscode";
import { PPMTreeDataProvider } from "./file-tree";
import { PPMDecorator } from "./highlight";
import { PPMCoverageCollecter } from "./coverage";
import * as URL from "url";

/**
 * Called by VSCode when the extension is first activated
 */
export function activate(context: vscode.ExtensionContext) {
    console.log("PPM activated");

    const root = vscode.workspace.rootPath;
    if (!root) {
        vscode.window.showErrorMessage(`No workspace is open`);
        return;
    }

    context.subscriptions.push(
        vscode.commands.registerCommand("extension.ppm", () => {
            vscode.window.setStatusBarMessage("Starting PPM...", 4_000);
            vscode.window.createTreeView("ppm-explorer", {
                treeDataProvider: new PPMTreeDataProvider(root),
            });
        }),
    );

    const decorator = new PPMDecorator();
    decorator.updateDecorations(vscode.window.activeTextEditor);
    vscode.window.onDidChangeActiveTextEditor(
        (editor) => decorator.updateDecorations(editor),
        null,
        context.subscriptions,
    );

    const converage = new PPMCoverageCollecter(root);
    context.subscriptions.push(
        new vscode.Disposable(() => converage.destroy()),
    );

    async function startCollecting() {
        try {
            await converage.start();

            // Ignore page load coverage
            await converage.collectCoverage();
            decorator.clear();

            for (let i = 0; i < 1000; i++) {
                const report = await converage.collectCoverage();
                if (report.result.length === 0) {
                    decorator.loadDecorations('', []);
                }
                for (const page of report.result) {
                    const path = URL.parse(page.url).pathname;
                    if (!path) {
                        continue;
                    }
                    const ranges = page.functions.flatMap((fn) => fn.ranges);
                    decorator.loadDecorations(path, ranges);
                }
                // Wait before collecting coverage again
                await new Promise((resolve) => setTimeout(resolve, 100));
            }
        } finally {
            decorator.clear();
            await converage.destroy();
        }
    }

    startCollecting();
}

// Called by VSCode when the extension is deactivted
export function deactivate() {}
