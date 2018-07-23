import * as fs from "fs-extra";
import * as webpack from "webpack";
import * as md5 from "md5";
import * as chalk from "chalk";
import {
    getDependencyFromYarn,
    PackageDependency,
    getPKGInfo
} from "./packageDependency";

function isVersionEqual(
    versionA: PackageDependency,
    versionB: PackageDependency
) {
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
function shadowCheckEntryVersion(entryVersion: PackageDependency) {
    return Object.keys(entryVersion).every(
        k =>{ 
            let neededVersion = entryVersion[k].version;
            let pkgInfo = getPKGInfo(k);
            let isFromGit = neededVersion && neededVersion.indexOf('git+')!=-1;
            let localVersion = isFromGit? pkgInfo._resolved : pkgInfo.version
            
            if(localVersion!=neededVersion){
                console.log(
                    chalk.yellow(
                        `[dll-link-plugin]: ${k} needed version is ${neededVersion}, but local veriosn is ${localVersion},please reinstall the package.`
                    )
                );
            }
            return localVersion === neededVersion;
        }
    );
}

export type DllEntry = string | string[] |webpack.Entry;

export interface ManifestEntry {
    output: string;
    entryVersion?: PackageDependency;
}

export interface ManifestCache {
    [entryName:string]:ManifestEntry
}

export interface CacheOptions {
    manifestFile: string;
}

export class CacheController {
    private manifestCache: ManifestCache;
    private newManifest: ManifestCache = {};
    private manifestFile: string;

    constructor(options: CacheOptions) {
        const { manifestFile } = options;

        this.manifestFile = manifestFile;
        this.readCacheFile();
    }

    private readCacheFile() {
        try {
            const content = fs.readFileSync(this.manifestFile);
            this.manifestCache = JSON.parse(content.toString());
        } catch (e) {
            this.manifestCache = {};
        }
    }

    public checkCache(entryName, entry: DllEntry) {
        const entryVersion = getDependencyFromYarn(entry);

        const isLocalVersionRight = 
            entryVersion && shadowCheckEntryVersion(entryVersion);

        if (entryVersion && !isLocalVersionRight) {
            throw new Error(
                    "[dll-link-plugin]: Version in yarn or package-lock is different from node_modules. Please reinstall package."
                )
        }
        const cacheEntryInfo = this.manifestCache[entryName];
        this.newManifest[entryName] = this.newManifest[entryName] || {output:''}
        this.newManifest[entryName].entryVersion = entryVersion;
        this.newManifest[entryName].output = cacheEntryInfo && cacheEntryInfo.output || ''

        const isShouldUpdate = 
            !isLocalVersionRight ||  
            !cacheEntryInfo ||
            !isVersionEqual(
                entryVersion,
                cacheEntryInfo.entryVersion
            )
        return isShouldUpdate;
    }

    public writeCache() {
        fs.writeFileSync(this.manifestFile, JSON.stringify(this.newManifest,null,2));
    }

    public updateJSNamesCache(val = {}) {
        Object.keys(val).forEach(entryName=>{
            this.newManifest[entryName] = this.newManifest[entryName] || {output:''}
            this.newManifest[entryName].output = val[entryName];
        })
    }

    public getCacheJSNames() {
        return Object.keys(this.newManifest).map(entryName=>{
            return this.newManifest[entryName].output;
        });
    }

    public getCacheVersion() {
        const jsNames = JSON.stringify(this.newManifest);
        return md5(jsNames).slice(0, 6);
    }
}
