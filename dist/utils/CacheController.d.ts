import * as webpack from "webpack";
import { PackageDependency } from "./packageDependency";
export declare type DllEntry = string | string[] | webpack.Entry;
export interface ManifestEntry {
    output: string;
    entryVersion?: PackageDependency;
}
export interface ManifestCache {
    [entryName: string]: ManifestEntry;
}
export interface CacheOptions {
    manifestFile: string;
}
export declare class CacheController {
    private manifestCache;
    private newManifest;
    private manifestFile;
    constructor(options: CacheOptions);
    private readCacheFile;
    checkCache(entryName: any, entry: DllEntry): boolean;
    writeCache(): void;
    updateJSNamesCache(val?: {}): void;
    getCacheJSNames(): string[];
    getCacheVersion(): any;
}
