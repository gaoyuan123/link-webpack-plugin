import * as webpack from "webpack";
import { CacheController } from "../utils/CacheController";
export interface LinkWebpackPluginOptions {
    config: webpack.Configuration;
    htmlMode?: boolean;
    assetsMode?: boolean;
    ssrMode?: boolean;
    filename?: string;
}
export default class LinkWebpackPlugin {
    options: LinkWebpackPluginOptions;
    cacheController: CacheController;
    hasCompile: boolean;
    manifestFile: string;
    constructor(options: LinkWebpackPluginOptions);
    hookIntoHTML(compilation: any): void;
    addAssets(compilation: any, cb: any): any;
    attachCompiler(compiler: any, eventName: string, isAsync: boolean, func: any): void;
    apply(compiler: any): void;
    webpackBuild(compilation: any, cb: any): any;
    applySrrPlugin(compiler: any): void;
}
