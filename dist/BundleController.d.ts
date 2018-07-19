import * as webpack from "webpack";
export interface BundleOptions {
    webpackConfig: webpack.Configuration;
}
export declare class BundleController {
    private webpackConfig;
    private outputJsonNames;
    private referencePlugins;
    constructor(options: BundleOptions);
    private initDllReferencePlugins;
    applyDllReferencePlugins(compiler: any): void;
    webpackBuild(): Promise<string[]>;
}
