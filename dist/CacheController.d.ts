import * as webpack from "webpack";
import { PackageDependency } from "./utils/packageDependency";
export declare type DllEntry = string | string[] | webpack.Entry;
export interface DllConfigFile {
    outputJSNames: string[];
    entryVersion: PackageDependency;
}
export interface ManifestCache {
    configFiles: {
        [index: string]: DllConfigFile;
    };
}
export interface CacheOptions {
    configIndex: string;
    entry: DllEntry;
    manifestFile: string;
}
export declare class CacheController {
    private manifestCache;
    private currentConfigContent;
    private configIndex;
    private shouldUpdate;
    private manifestFile;
    constructor(options: CacheOptions);
    private readCacheFile;
    private checkCache;
    writeCache(): void;
    updateJSNamesCache(val: string[]): void;
    getCacheJSNames(): string[];
    shouldUpdateCache(): boolean;
    getCacheVersion(): any;
}
