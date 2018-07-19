export interface YarnDependency {
    version: string;
    dependencies?: PackageDependency;
}
export interface PackageDependency {
    [index: string]: YarnDependency;
}
export declare function getDependencyFromYarn(
    entry: any
): PackageDependency | null;
export declare function getPKGVersion(yarnEntryName: string): any;
