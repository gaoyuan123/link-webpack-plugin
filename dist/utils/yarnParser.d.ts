export interface PackageInfo {
    dependencies: {
        [index: string]: string;
    };
    resolved: string;
    version: string;
}
export interface LockInfo {
    [index: string]: PackageInfo;
}
export declare function parse(str: string, fileLoc?: string): LockInfo;
