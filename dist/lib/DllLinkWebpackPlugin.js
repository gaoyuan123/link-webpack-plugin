"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DllRefController_1 = require("./DllRefController");
const LinkWebpackPlugin_1 = require("./LinkWebpackPlugin");
// const cacheDir = path.resolve(".dll-link-plugin");
const MANIFEST_FILE = "dll-link-manifest.json";
class DllLinkWebpackPlugin extends LinkWebpackPlugin_1.default {
    constructor(options) {
        options.filename = options.filename || MANIFEST_FILE;
        super(options);
        this.options = options;
        const { entry } = this.options.config;
        let updateEntry = {};
        Object.keys(entry).forEach(name => {
            if (this.cacheController.checkCache(name, entry[name])) {
                updateEntry[name] = entry[name];
            }
        });
        this.options.config.entry = updateEntry;
        this.shouldUpdate = Object.keys(updateEntry).length > 0;
    }
    apply(compiler) {
        super.apply(compiler);
        new DllRefController_1.DllRefController({
            webpackConfig: this.options.config
        }).applyDllReferencePlugins(compiler);
    }
}
exports.default = DllLinkWebpackPlugin;
