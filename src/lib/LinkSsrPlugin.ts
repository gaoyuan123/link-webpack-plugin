
interface Options {
    manifest: string;
}

export default class LinkSsrPlugin {
    private options: Options;

    constructor(options: Options) {
        this.options = options;
    }

    apply(compiler) {
        // emit（'编译器'对'生成最终资源'这个事件的监听）
        const manifestPath = this.options.manifest;
        compiler.plugin("emit", function (compilation, callback) {
            let ssrManifest = compilation.assets['vue-ssr-client-manifest.json']
            let source = JSON.parse(ssrManifest.source());

            const dllManifest = require(manifestPath);
            const dllFiles = Object.keys(dllManifest).map(entryName => {
                return dllManifest[entryName].output;
            })
            const {manifestJs,...otherJs} = source.initial;
            source.initial = [manifestJs].concat(dllFiles || []).concat(otherJs);

            source = JSON.stringify(source);
            compilation.assets['vue-ssr-client-manifest.json'] = {
                source: function () { return source; },
                size: function () { return source.length; }
            };
            // callback在最后必须调用
            callback();
        });
    }
}