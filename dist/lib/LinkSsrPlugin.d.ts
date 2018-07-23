interface Options {
    manifest: string;
}
export default class LinkSsrPlugin {
    private options;
    constructor(options: Options);
    apply(compiler: any): void;
}
export {};
