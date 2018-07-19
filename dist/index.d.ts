import * as webpack from "webpack";
import { CacheController } from "./CacheController";
import { BundleController } from "./BundleController";
export interface DllLinkWebpackPluginOptions {
    config: webpack.Configuration;
    manifestNames?: string[];
    assetsMode?: boolean;
    htmlMode?: boolean;
    appendVersion?: boolean;
}
export declare class DllLinkWebpackPlugin {
    cacheController: CacheController;
    bundleController: BundleController;
    hasCompile: boolean;
    outputPath: string;
    options: DllLinkWebpackPluginOptions;
    constructor(options: DllLinkWebpackPluginOptions);
    hookIntoHTML(compilation: any): void;
    addAssets(compilation: any, cb: any): any;
    check(compilation: any, cb: any): Promise<any>;
    updateNames(compilation: any, cb: any): any;
    attachCompiler(
        compiler: any,
        eventName: string,
        isAsync: boolean,
        func: any
    ): void;
    apply(compiler: any): void;
}
