"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const md5 = require("md5");
const chalk = require("chalk");
const packageDependency_1 = require("./utils/packageDependency");
function isVersionEqual(versionA, versionB) {
    if (!versionA && !versionB) {
        return true;
    } else if (versionA && versionB) {
        return Object.keys(versionA).every(
            k =>
                versionB[k] &&
                versionA[k].version === versionB[k].version &&
                isVersionEqual(
                    versionA[k].dependencies,
                    versionB[k].dependencies
                )
        );
    } else {
        return false;
    }
}
// just check entry version, not include entry dependency.
function shadowCheckEntryVersion(entryVersion) {
    return Object.keys(entryVersion).every(
        k => entryVersion[k].version === packageDependency_1.getPKGVersion(k)
    );
}
class CacheController {
    constructor(options) {
        const { configIndex, manifestFile } = options;
        this.configIndex = configIndex;
        this.manifestFile = manifestFile;
        this.readCacheFile();
        this.checkCache(options.entry);
    }
    readCacheFile() {
        try {
            const content = fs.readFileSync(this.manifestFile);
            this.manifestCache = JSON.parse(content.toString());
        } catch (e) {
            this.manifestCache = {
                configFiles: {}
            };
        }
        this.currentConfigContent = this.manifestCache.configFiles[
            this.configIndex
        ] || { outputJSNames: [], entryVersion: null };
    }
    checkCache(entry) {
        const entryVersion = packageDependency_1.getDependencyFromYarn(entry);
        const isYarnVersionRight =
            entryVersion && shadowCheckEntryVersion(entryVersion);
        if (entryVersion && !isYarnVersionRight) {
            console.log(
                chalk.yellow(
                    "[dll-link-plugin]: Version in yarn is different from node_modules. Please reinstall package."
                )
            );
        }
        if (isYarnVersionRight) {
            this.shouldUpdate =
                this.currentConfigContent.outputJSNames.length === 0 ||
                !isVersionEqual(
                    this.currentConfigContent.entryVersion,
                    entryVersion
                );
            this.currentConfigContent.entryVersion = entryVersion;
        } else {
            this.shouldUpdate = true;
        }
    }
    writeCache() {
        fs.writeFileSync(this.manifestFile, JSON.stringify(this.manifestCache));
    }
    updateJSNamesCache(val) {
        this.manifestCache.configFiles[
            this.configIndex
        ] = this.currentConfigContent = Object.assign(
            {},
            this.currentConfigContent,
            { outputJSNames: val }
        );
    }
    getCacheJSNames() {
        return this.currentConfigContent.outputJSNames;
    }
    shouldUpdateCache() {
        return this.shouldUpdate;
    }
    getCacheVersion() {
        const jsNames = this.currentConfigContent.outputJSNames.join(";");
        return md5(jsNames).slice(0, 6);
    }
}
exports.CacheController = CacheController;
