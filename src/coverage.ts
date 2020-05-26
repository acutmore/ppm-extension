import express = require("express");
import chromeLauncher = require("chrome-launcher");
import chromeRemote = require("chrome-remote-interface");

interface Profiler {
    takePreciseCoverage(): Promise<CoverageReport>;
}

export interface CoverageReport {
    timestamp: number;
    result: {
        scriptId: string;
        url: string;
        functions: {
            functionMame: string;
            ranges: {
                startOffset: number;
                endOffset: number;
                count: number;
            }[];
            isBlockCoverage: boolean;
        }[];
    }[];
}

export class PPMCoverageCollecter {
    private readonly cleanups: (() => unknown)[] = [];
    private profiler: Profiler | undefined = undefined;

    constructor(private workspace: string, private httpPort = 8000) {}

    async destroy() {
        while (this.cleanups.length > 0) {
            const fn = this.cleanups.pop();
            await fn!();
        }
    }

    async start() {
        if (this.profiler) {
            return;
        }

        let success = false;
        try {
            // Server
            const app = express();
            app.use(express.static(this.workspace));
            const server = app.listen(this.httpPort, () =>
                console.log(
                    `Example app listening at http://localhost:${this.httpPort}`,
                ),
            );
            this.cleanups.push(() => server.close());

            // Browser
            const chrome = await chromeLauncher.launch({
                handleSIGINT: true,
            });
            this.cleanups.push(() => chrome.kill());

            // Remote protocol
            const protocol = await chromeRemote({ port: chrome.port });
            this.cleanups.push(() => protocol.close());
            const { Page, Profiler } = protocol;
            await Profiler.enable();
            await Page.enable();

            await Profiler.startPreciseCoverage({
                callCount: true,
                detailed: true,
            });
            this.cleanups.push(() => Profiler.stopPreciseCoverage());

            // Load Webpage
            Page.navigate({
                url: `http://localhost:${this.httpPort}/test.html`,
            });
            await Page.loadEventFired();

            this.profiler = Profiler;
            this.cleanups.push(() => (this.profiler = undefined));

            success = true;
        } finally {
            if (!success) {
                await this.destroy();
            }
        }
    }

    async collectCoverage(): Promise<CoverageReport> {
        if (!this.profiler) {
            throw new Error(`coverage collector has not been started`);
        }

        return await this.profiler.takePreciseCoverage();
    }
}
