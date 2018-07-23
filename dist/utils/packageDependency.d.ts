import { DllEntry } from "./CacheController";
export interface YarnDependency {
    version: string;
    dependencies?: PackageDependency;
}
export interface PackageDependency {
    [index: string]: YarnDependency;
}
export declare function getDependencyFromYarn(entry: DllEntry): PackageDependency | null;
export declare function getPKGInfo(yarnEntryName: string): any;
