declare module 'chrome-remote-interface' {
    function remote(config: {port: number}): Promise<any>;

    export = remote;
}
