import * as vscode from "vscode";

function createDecoration() {
    return vscode.window.createTextEditorDecorationType({
        isWholeLine: true,
        backgroundColor: `rgba(26, 137, 26, 0.1)`,
    });
}

const decay = 10;

export class PPMDecorator {
    private decorationTypes = new Array(decay).fill(null).map(() => createDecoration());

    private ranges = new Map<string, { range: vscode.Range; count: number }>();

    updateDecorations(activeEditor = vscode.window.activeTextEditor) {
        if (!activeEditor || !activeEditor.document) {
            return;
        }
    }

    clear() {
        this.ranges.clear();
        for (const d of this.decorationTypes) {
            vscode.window.activeTextEditor?.setDecorations(d, []);
        }
    }

    loadDecorations(
        filePath: string,
        chromeRanges: {
            startOffset: number;
            endOffset: number;
            count: number;
        }[],
    ) {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor || !activeEditor.document) {
            return;
        }

        // decrement previous decorations
        this.ranges.forEach((range) => {
            const { count } = range;
            if (count > 0) {
                range.count = count - 1;
            }
        });

        let editorRanges = chromeRanges
            .filter((range) => range.count > 0)
            .map((range) => {
                const start = activeEditor.document.positionAt(
                    range.startOffset,
                );
                const end = activeEditor.document.positionAt(range.endOffset);
                return new vscode.Range(start, end);
            });

        const zeros = chromeRanges
            .filter((range) => range.count === 0)
            .map((range) => {
                const start = activeEditor.document.positionAt(
                    range.startOffset,
                );
                const end = activeEditor.document.positionAt(range.endOffset);
                return new vscode.Range(start, end);
            });

        for (const zero of zeros) {
            editorRanges = editorRanges.flatMap((range) => {
                if (range.contains(zero)) {
                    return [
                        new vscode.Range(range.start, zero.start),
                        new vscode.Range(zero.end, range.end),
                    ];
                }
                return [range];
            });
        }

        editorRanges = editorRanges.filter((range) => !range.isEmpty);

        editorRanges.forEach((range) => {
            const key = `${range.start.line}::${range.start.character}::${range.end.line}::${range.end.character}`;
            let r = this.ranges.get(key);
            if (!r) {
                r = {
                    range,
                    count: decay - 1,
                };
                this.ranges.set(key, r);
            } else {
                r.count = decay - 1;
            }
        });

        const decorations: vscode.Range[][] = new Array(decay).fill(null).map(() => []);

        this.ranges.forEach(({ range, count }) => {
            for (let i = 0; i < count; i++) {
                decorations[i].push(range);
            }
        });

        for (let i = 0; i < decay; i++) {
            activeEditor.setDecorations(this.decorationTypes[i], decorations[i]);
        }
    }
}
