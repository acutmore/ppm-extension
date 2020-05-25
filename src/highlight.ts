import * as vscode from "vscode";

export class PPMDecorator {
    private decorationType = vscode.window.createTextEditorDecorationType({
        isWholeLine: true,
        backgroundColor: `rgba(26, 137, 26, 0.76)`
    });

    updateDecorations(activeEditor = vscode.window.activeTextEditor) {
        if (!activeEditor || !activeEditor.document) {
            return;
        }

        const text = activeEditor.document.getText();
        const startPos = activeEditor.document.positionAt(1);
        const endPos = activeEditor.document.positionAt(Math.min(text.length, 100));
        const ranges = [];
        ranges.push(new vscode.Range(startPos, endPos));
        activeEditor.setDecorations(this.decorationType, ranges);
    }
}
