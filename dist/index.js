"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const md5 = require("md5");
const fs = require("fs-extra");
const chalk = require("chalk");
const CacheController_1 = require("./CacheController");
const BundleController_1 = require("./BundleController");
// const cacheDir = path.resolve(".dll-link-plugin");
const MANIFEST_FILE = "manifest.json";
const pluginName = "DllLinkWebpackPlugin";
function md5Slice(msg) {
    return md5(msg).slice(0, 10);
}
function changeName(name, version) {
    const tmp = name.split(".");
    const ext = tmp.splice(-1);
    if (ext[0] === "js") {
        return `${tmp.join(".")}.${version}.js`;
    } else {
        return name;
    }
}
/**
 * Takes a string in train case and transforms it to camel case
 *
 * Example: 'hello-my-world' to 'helloMyWorld'
 *
 * @param {string} word
 */
function trainCaseToCamelCase(word) {
    return word.replace(/-([\w])/g, function(match, p1) {
        return p1.toUpperCase();
    });
}
class DllLinkWebpackPlugin {
    constructor(options) {
        this.check = this.check.bind(this);
        this.addAssets = this.addAssets.bind(this);
        this.hookIntoHTML = this.hookIntoHTML.bind(this);
        this.updateNames = this.updateNames.bind(this);
        this.options = options;
        const { config } = this.options;
        this.outputPath = config.output.path;
        const { entry } = config;
        const configIndex = config["name"] || md5Slice(JSON.stringify(config));
        this.cacheController = new CacheController_1.CacheController({
            configIndex,
            entry,
            manifestFile: `${this.outputPath}/${MANIFEST_FILE}`
        });
        this.bundleController = new BundleController_1.BundleController({
            webpackConfig: config
        });
        this.hasCompile = false;
    }
    hookIntoHTML(compilation) {
        const hookFunction = (htmlPluginData, cb) => {
            const { publicPath } = this.options.config.output;
            let jsNames = this.cacheController
                .getCacheJSNames()
                .filter(item => {
                    // only include js files(there may be map files in it)
                    const ext = item.split(".").reverse()[0];
                    if (ext === "js") {
                        return true;
                    }
                    return false;
                });
            if (publicPath) {
                jsNames = jsNames.map(name => path.join(publicPath, name));
            }
            const assets = htmlPluginData.assets;
            assets.js = jsNames.concat(assets.js);
            cb(null, htmlPluginData);
        };
        if (compilation.hooks) {
            if (compilation.hooks.htmlWebpackPluginBeforeHtmlGeneration) {
                compilation.hooks.htmlWebpackPluginBeforeHtmlGeneration.tapAsync(
                    pluginName,
                    hookFunction
                );
            }
        } else {
            compilation.plugin(
                "html-webpack-plugin-before-html-generation",
                hookFunction
            );
        }
    }
    addAssets(compilation, cb) {
        this.cacheController.getCacheJSNames().map(name => {
            const source = fs
                .readFileSync(`${this.outputPath}/${name}`)
                .toString();
            compilation.assets[name] = {
                source: () => source,
                size: () => source.length
            };
        });
        return cb();
    }
    async check(compilation, cb) {
        if (!this.hasCompile) {
            this.hasCompile = true;
            if (this.cacheController.shouldUpdateCache()) {
                console.log();
                console.log(chalk.cyan("[dll-link-plugin]: Rebuilding dll."));
                console.log();
                let assets = [];
                try {
                    assets = await this.bundleController.webpackBuild();
                } catch (err) {
                    return cb(err);
                }
                this.cacheController.updateJSNamesCache(assets);
            }
            // const { htmlMode, assetsMode } = this.options;
            // if (!htmlMode && !assetsMode) {
            //     this.bundleController.copyAllFiles();
            // }
            this.cacheController.writeCache();
        }
        return cb();
    }
    updateNames(compilation, cb) {
        const ver = this.cacheController.getCacheVersion();
        let entryChunks = {};
        // change related chunks name
        const chunks = compilation.chunks;
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            if (
                (typeof chunk.isInitial === "function" && chunk.isInitial()) ||
                chunk.isInitial === true
            ) {
                chunk.files = chunk.files.map(file => {
                    entryChunks[file] = true;
                    return changeName(file, ver);
                });
            }
        }
        // change assets name
        const newAssets = {};
        Object.keys(compilation.assets).forEach(k => {
            let newKey = k;
            if (entryChunks[k]) {
                newKey = changeName(k, ver);
            }
            newAssets[newKey] = compilation.assets[k];
        });
        compilation.assets = newAssets;
        return cb();
    }
    attachCompiler(compiler, eventName, isAsync, func) {
        if ("hooks" in compiler) {
            // webpack 4
            eventName = trainCaseToCamelCase(eventName);
            if (compiler.hooks[eventName]) {
                compiler.hooks[eventName][isAsync ? "tapAsync" : "tap"](
                    pluginName,
                    func
                );
            }
        } else {
            // webpack 2/3
            compiler.plugin(eventName, func);
        }
    }
    apply(compiler) {
        const { htmlMode, assetsMode, appendVersion } = this.options;
        this.attachCompiler(compiler, "before-compile", true, this.check);
        if (htmlMode) {
            // Hook into the html-webpack-plugin processing
            this.attachCompiler(
                compiler,
                "compilation",
                false,
                this.hookIntoHTML
            );
        }
        if (appendVersion) {
            this.attachCompiler(compiler, "emit", true, this.updateNames);
        }
        if (htmlMode || assetsMode) {
            this.attachCompiler(compiler, "emit", true, this.addAssets);
        }
        this.bundleController.applyDllReferencePlugins(compiler);
    }
}
exports.DllLinkWebpackPlugin = DllLinkWebpackPlugin;
module.exports = DllLinkWebpackPlugin;
