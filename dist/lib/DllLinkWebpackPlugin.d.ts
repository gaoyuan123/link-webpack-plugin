import * as webpack from "webpack";
import { DllRefController } from "./DllRefController";
import LinkWebpackPlugin from "./LinkWebpackPlugin";
export interface DllLinkWebpackPluginOptions {
    config: webpack.Configuration;
    assetsMode?: boolean;
    htmlMode?: boolean;
    filename?: string;
    path?: string;
    ssrMode?: boolean;
}
export default class DllLinkWebpackPlugin extends LinkWebpackPlugin {
    dllRefController: DllRefController;
    options: DllLinkWebpackPluginOptions;
    shouldUpdate: boolean;
    constructor(options: DllLinkWebpackPluginOptions);
    apply(compiler: any): void;
}
