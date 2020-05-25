import * as vscode from "vscode";
import { PPMTreeDataProvider } from "./file-tree";
import { PPMDecorator } from "./highlight";

/**
 * Called by VSCode when the extension is first activated
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('PPM activated');

    context.subscriptions.push(
    vscode.commands.registerCommand(
        "extension.ppm",
        () => {
            vscode.window.setStatusBarMessage("Starting PPM...", 4_000);
            vscode.window.createTreeView("ppm-explorer", {
                treeDataProvider: new PPMTreeDataProvider(
                    vscode.workspace.rootPath,
                ),
            });
        },
    ));

    const decorator = new PPMDecorator();
    decorator.updateDecorations(vscode.window.activeTextEditor);
    vscode.window.onDidChangeActiveTextEditor(
        (editor) => decorator.updateDecorations(editor),
        null,
        context.subscriptions,
    );
}

// this method is called when your extension is deactivated
export function deactivate() {}
