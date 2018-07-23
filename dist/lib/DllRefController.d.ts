import * as webpack from "webpack";
export interface DllRefOptions {
    webpackConfig: webpack.Configuration;
}
export declare class DllRefController {
    private referencePlugins;
    private options;
    constructor(options: DllRefOptions);
    private initDllReferencePlugins;
    applyDllReferencePlugins(compiler: any): void;
}
