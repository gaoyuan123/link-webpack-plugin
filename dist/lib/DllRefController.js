"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const webpack = require("webpack");
class DllRefController {
    constructor(options) {
        this.options = options;
        const { plugins } = options.webpackConfig;
        const dllPlugin = (plugins || []).find(item => {
            return item instanceof webpack.DllPlugin;
        });
        if (!dllPlugin) {
            throw new Error("Your webpack dll config miss DllPlugin.");
        }
        const dllOptions = dllPlugin.options;
        this.initDllReferencePlugins(this.options.entry, dllOptions);
        // this.pluginStartTime = Date.now();
    }
    initDllReferencePlugins(entry, dllOptions) {
        const dllJsonFullPath = dllOptions.path;
        const referenceNames = Object.keys(entry).map(entryName => {
            return dllJsonFullPath.replace("[name]", entryName);
        });
        let referenceConf = referenceNames.map(name => ({
            manifest: name
        }));
        if (dllOptions.context) {
            referenceConf = referenceConf.map(conf => (Object.assign({}, conf, { context: dllOptions.context })));
        }
        this.referencePlugins = referenceConf.map(conf => new webpack.DllReferencePlugin(conf));
    }
    applyDllReferencePlugins(compiler) {
        this.referencePlugins.forEach(plugin => {
            plugin.apply.call(plugin, compiler);
        });
    }
}
exports.DllRefController = DllRefController;
