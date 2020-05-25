import * as vscode from "vscode";
import { PPMTreeDataProvider } from "./file-tree";
import { PPMDecorator } from "./highlight";
import {PPMCoverageCollecter} from './coverage';

/**
 * Called by VSCode when the extension is first activated
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('PPM activated');

    const root = vscode.workspace.rootPath;
    if (!root) {
        vscode.window.showErrorMessage(`No workspace is open`);
        return;
    }

    context.subscriptions.push(
    vscode.commands.registerCommand(
        "extension.ppm",
        () => {
            vscode.window.setStatusBarMessage("Starting PPM...", 4_000);
            vscode.window.createTreeView("ppm-explorer", {
                treeDataProvider: new PPMTreeDataProvider(
                    root,
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

    const converage = new PPMCoverageCollecter(root);
    converage.start();
}

// this method is called when your extension is deactivated
export function deactivate() {}
