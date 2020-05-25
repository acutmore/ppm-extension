import express = require("express");
import chromeLauncher = require("chrome-launcher");
import chromeRemote = require("chrome-remote-interface");
import util = require("util");

// Mostly taken from https://gist.github.com/paulirish/78f46a302083dd757288b5fcc660d75c

export class PPMCoverageCollecter {
    constructor(private workspace: string, private httpPort = 8000) {}

    async start() {
        const app = express();
        app.use(express.static(this.workspace));
        const server = app.listen(this.httpPort, () =>
            console.log(`Example app listening at http://localhost:${this.httpPort}`),
        );

        const chrome = await chromeLauncher.launch({
            handleSIGINT: true,
        });

        const protocol = await chromeRemote({ port: chrome.port });
        try {
            const { Page, Profiler } = protocol;
            await Profiler.enable();
            await Page.enable();

            await Profiler.startPreciseCoverage({
                callCount: true,
                detailed: true,
            });

            Page.navigate({
                url: `http://localhost:${this.httpPort}/test.html`,
            });
            await Page.loadEventFired();

            const res = await Profiler.takePreciseCoverage();
            await Profiler.stopPreciseCoverage();

            console.log(util.inspect(res, true, 100));
        } catch (err) {
            console.error(err);
        } finally {
            protocol.close();
            chrome.kill();
            server.close();
        }
    }
}
