import * as fs from "fs-extra";
import * as chalk from "chalk";
import * as webpack from "webpack";
import { CacheController } from "../utils/CacheController";
import LinkSsrPlugin from "./LinkSsrPlugin";

const pluginName = "LinkWebpackPlugin";
const MANIFEST_FILE = "link-manifest.json";

export interface LinkWebpackPluginOptions {
    config: webpack.Configuration;
    htmlMode?: boolean;
    assetsMode?: boolean;
    ssrMode?: boolean;
    filename?: string;
}

/**
 * Takes a string in train case and transforms it to camel case
 *
 * Example: 'hello-my-world' to 'helloMyWorld'
 *
 * @param {string} word
 */
function trainCaseToCamelCase(word: string) {
    return word.replace(/-([\w])/g, function (match, p1) {
        return p1.toUpperCase();
    });
}

export default class LinkWebpackPlugin {
    options: LinkWebpackPluginOptions;
    cacheController: CacheController;
    hasCompile: boolean;
    manifestFile: string;

    constructor(options: LinkWebpackPluginOptions) {
        this.options = options;
        this.manifestFile = `${this.options.config.output.path}/${this.options.filename || MANIFEST_FILE}`;

        this.webpackBuild = this.webpackBuild.bind(this);
        this.addAssets = this.addAssets.bind(this);
        this.hookIntoHTML = this.hookIntoHTML.bind(this);

        this.cacheController = new CacheController({
            manifestFile: this.manifestFile,
        });
    }

    hookIntoHTML(compilation) {
        const hookFunction = (htmlPluginData, cb) => {
            const publicPath  = this.options.config.output.publicPath || compilation.options.output.publicPath;
            let js = this.cacheController.getCacheJSNames()
                .filter(item => {
                    // only include js files(there may be map files in it)
                    const ext = item.split(".").reverse()[0];
                    if (ext === "js") {
                        return true;
                    }
                    return false;
                });
            if (publicPath) {
                js = js.map(name => publicPath + name);
            }

            const assets = htmlPluginData.assets as { js: string[] };
            assets.js = js.concat(assets.js);
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
                .readFileSync(`${this.options.config.output.path}/${name}`)
                .toString();
            compilation.assets[name] = {
                source: () => source,
                size: () => source.length
            };
        });

        return cb();
    }

    attachCompiler(compiler, eventName: string, isAsync: boolean, func) {
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
        const { htmlMode, assetsMode, ssrMode, config } = this.options;
        if(Object.keys(config.entry).length >0){
            this.attachCompiler(compiler, "before-compile", true, this.webpackBuild);
        }

        if (htmlMode) {
            // Hook into the html-webpack-plugin processing
            this.attachCompiler(
                compiler,
                "compilation",
                false,
                this.hookIntoHTML
            );
        }

        if (htmlMode || assetsMode) {
            this.attachCompiler(compiler, "emit", true, this.addAssets);
        }

        if (ssrMode) {
            this.applySrrPlugin(compiler);
        }
    }

    webpackBuild(compilation, cb) {
        if (this.hasCompile) {
            return cb();
        }
        this.hasCompile = true;
        console.log(chalk.cyan("[link-plugin]: building:" + Object.keys(this.options.config.entry)));
        webpack(this.options.config, (err, stats) => {
            if (err) {
                cb(err);
            } else if (stats.hasErrors()) {
                cb(new Error(stats.toJson().errors.join("\n")));
            } else {
                const assets = stats.toJson().assetsByChunkName;
                this.cacheController.updateJSNamesCache(assets);
                this.cacheController.writeCache();
                cb();
            }
        });
    }

    applySrrPlugin(compiler) {
        new LinkSsrPlugin({
            manifest: this.manifestFile
        }).apply(compiler);
    }
}