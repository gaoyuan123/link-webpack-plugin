"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const md5 = require("md5");
const chalk = require("chalk");
const packageDependency_1 = require("./packageDependency");
function isVersionEqual(versionA, versionB) {
    if (!versionA && !versionB) {
        return true;
    }
    else if (versionA && versionB) {
        return Object.keys(versionA).every(k => versionB[k] &&
            versionA[k].version === versionB[k].version &&
            isVersionEqual(versionA[k].dependencies, versionB[k].dependencies));
    }
    else {
        return false;
    }
}
// just check entry version, not include entry dependency.
function shadowCheckEntryVersion(entryVersion) {
    return Object.keys(entryVersion).every(k => {
        let neededVersion = entryVersion[k].version;
        let pkgInfo = packageDependency_1.getPKGInfo(k);
        let isFromGit = neededVersion && neededVersion.indexOf('git+') != -1;
        let localVersion = isFromGit ? pkgInfo._resolved : pkgInfo.version;
        if (localVersion != neededVersion) {
            console.log(chalk.yellow(`[dll-link-plugin]: ${k} needed version is ${neededVersion}, but local veriosn is ${localVersion},please reinstall the package.`));
        }
        return localVersion === neededVersion;
    });
}
class CacheController {
    constructor(options) {
        this.newManifest = {};
        const { manifestFile } = options;
        this.manifestFile = manifestFile;
        this.readCacheFile();
    }
    readCacheFile() {
        try {
            const content = fs.readFileSync(this.manifestFile);
            this.manifestCache = JSON.parse(content.toString());
        }
        catch (e) {
            this.manifestCache = {};
        }
    }
    checkCache(entryName, entry) {
        const entryVersion = packageDependency_1.getDependencyFromYarn(entry);
        const isLocalVersionRight = entryVersion && shadowCheckEntryVersion(entryVersion);
        if (entryVersion && !isLocalVersionRight) {
            throw new Error("[dll-link-plugin]: Version in yarn or package-lock is different from node_modules. Please reinstall package.");
        }
        const cacheEntryInfo = this.manifestCache[entryName];
        this.newManifest[entryName] = this.newManifest[entryName] || { output: '' };
        this.newManifest[entryName].entryVersion = entryVersion;
        this.newManifest[entryName].output = cacheEntryInfo && cacheEntryInfo.output || '';
        const isShouldUpdate = !isLocalVersionRight ||
            !cacheEntryInfo ||
            !isVersionEqual(entryVersion, cacheEntryInfo.entryVersion);
        return isShouldUpdate;
    }
    writeCache() {
        fs.writeFileSync(this.manifestFile, JSON.stringify(this.newManifest, null, 2));
    }
    updateJSNamesCache(val = {}) {
        Object.keys(val).forEach(entryName => {
            this.newManifest[entryName] = this.newManifest[entryName] || { output: '' };
            this.newManifest[entryName].output = val[entryName];
        });
    }
    getCacheJSNames() {
        return Object.keys(this.newManifest).map(entryName => {
            return this.newManifest[entryName].output;
        });
    }
    getCacheVersion() {
        const jsNames = JSON.stringify(this.newManifest);
        return md5(jsNames).slice(0, 6);
    }
}
exports.CacheController = CacheController;
