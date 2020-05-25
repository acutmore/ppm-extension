import * as vscode from "vscode";
import { PPMTreeDataProvider } from "./file-tree";
import { PPMDecorator } from "./highlight";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)

    // This line of code will only be executed once when your extension is activated
    console.log(
        'Congratulations, your extension "helloworld-sample" is now active!',
    );

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand(
        "extension.helloWorld",
        () => {
            // The code you place here will be executed every time your command is executed

            // Display a message box to the user
            vscode.window.showInformationMessage("Hello World!");
            vscode.window.createTreeView("ppm-explorer", {
                treeDataProvider: new PPMTreeDataProvider(
                    vscode.workspace.rootPath,
                ),
            });
        },
    );

    context.subscriptions.push(disposable);

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
