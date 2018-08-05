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
    entry: {}
    
    constructor(options: DllLinkWebpackPluginOptions) {
        options.filename = options.filename || MANIFEST_FILE;
        super(options);
        this.options = options;

        const entry = this.entry = this.options.config.entry;

        let updateEntry = {};
        Object.keys(entry).forEach(name => {
            if (this.cacheController.checkCache(name, entry[name])) {
                updateEntry[name] = entry[name];
            }
        })
        this.options.config.entry = updateEntry;
    }

    apply(compiler) {
        super.apply(compiler);
        new DllRefController({
            webpackConfig: this.options.config,
            entry: this.entry
        }).applyDllReferencePlugins(compiler);
    }
}