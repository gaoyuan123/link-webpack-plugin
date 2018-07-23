import * as webpack from "webpack";
import { DllRefController } from "./DllRefController";
import LinkWebpackPlugin from "./LinkWebpackPlugin";

// const cacheDir = path.resolve(".dll-link-plugin");
const MANIFEST_FILE = "dll-link-manifest.json";

export interface DllLinkWebpackPluginOptions {
    config: webpack.Configuration;
    assetsMode?: boolean;
    htmlMode?: boolean;
    filename?: string,
    path?: string,
    ssrMode?: boolean
}

export default class DllLinkWebpackPlugin extends LinkWebpackPlugin{
    dllRefController: DllRefController;
    options: DllLinkWebpackPluginOptions;
    shouldUpdate: boolean;

    constructor(options: DllLinkWebpackPluginOptions) {
        options.filename = options.filename || MANIFEST_FILE;
        super(options);
        this.options = options;

        const { entry } = this.options.config;

        let updateEntry = {};
        Object.keys(entry).forEach(name => {
            if (this.cacheController.checkCache(name, entry[name])) {
                updateEntry[name] = entry[name];
            }
        })
        this.options.config.entry = updateEntry;
        this.shouldUpdate = Object.keys(updateEntry).length > 0;
    }

    apply(compiler) {
        super.apply(compiler);
        new DllRefController({
            webpackConfig: this.options.config
        }).applyDllReferencePlugins(compiler);
    }
}