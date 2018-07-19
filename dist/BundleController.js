"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const webpack = require("webpack");
class BundleController {
    // private pluginStartTime: number;
    constructor(options) {
        const { webpackConfig } = options;
        const { entry, plugins } = webpackConfig;
        let index = -1;
        for (let i = 0; i < plugins.length; i++) {
            if (plugins[i] instanceof webpack.DllPlugin) {
                index = i;
                break;
            }
        }
        const dllPlugin = (plugins || []).find(item => {
            return item instanceof webpack.DllPlugin;
        });
        if (!dllPlugin) {
            throw new Error("Your webpack dll config miss DllPlugin.");
        }
        const dllOptions = dllPlugin.options;
        const dllJsonFullPath = dllOptions.path;
        // const i = dllJsonFullPath.lastIndexOf("/");
        // const jsonNameTPL = dllJsonFullPath.slice(i + 1);
        // dllPlugin.options.path = `${cacheConfig.cacheJSONPath}/${jsonNameTPL}`;
        webpackConfig.plugins[index] = dllPlugin;
        this.outputJsonNames = Object.keys(entry).map(entryName => {
            return dllJsonFullPath.replace("[name]", entryName);
        });
        this.initDllReferencePlugins(dllOptions);
        this.webpackConfig = webpackConfig;
        // this.pluginStartTime = Date.now();
    }
    initDllReferencePlugins(dllOptions) {
        let referenceNames = this.outputJsonNames;
        let referenceConf = referenceNames.map(name => ({
            manifest: name
        }));
        if (dllOptions.context) {
            referenceConf = referenceConf.map(conf =>
                Object.assign({}, conf, { context: dllOptions.context })
            );
        }
        this.referencePlugins = referenceConf.map(
            conf => new webpack.DllReferencePlugin(conf)
        );
    }
    // private modifyGenerateFileModifyTime() {
    //     let names = [
    //         ...this.outputFiles.jsNames,
    //         ...this.outputFiles.jsonNames
    //     ];
    //     const time = parseInt(
    //         Math.floor((this.pluginStartTime - FS_ACCURACY) / 1000).toFixed()
    //     );
    //     names.forEach(name => {
    //         fs.utimesSync(name, time, time);
    //     });
    // }
    // private updateOutputJSNames(outputNames) {
    //     this.outputFiles.jsNames = outputNames;
    // }
    applyDllReferencePlugins(compiler) {
        this.referencePlugins.forEach(plugin => {
            plugin.apply.call(plugin, compiler);
        });
    }
    webpackBuild() {
        return new Promise((resolve, reject) => {
            webpack(this.webpackConfig, (err, stats) => {
                if (err) {
                    reject(err);
                } else if (stats.hasErrors()) {
                    reject(new Error(stats.toJson().errors.join("\n")));
                } else {
                    const assets = stats
                        .toJson()
                        .assets.map(asset => asset.name);
                    resolve(assets);
                }
            });
        });
    }
}
exports.BundleController = BundleController;
