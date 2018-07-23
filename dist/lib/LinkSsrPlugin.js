"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
            t[p[i]] = s[p[i]];
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
class LinkSsrPlugin {
    constructor(options) {
        this.options = options;
    }
    apply(compiler) {
        // emit（'编译器'对'生成最终资源'这个事件的监听）
        const manifestPath = this.options.manifest;
        compiler.plugin("emit", function (compilation, callback) {
            let ssrManifest = compilation.assets['vue-ssr-client-manifest.json'];
            let source = JSON.parse(ssrManifest.source());
            const dllManifest = require(manifestPath);
            const dllFiles = Object.keys(dllManifest).map(entryName => {
                return dllManifest[entryName].output;
            });
            const _a = source.initial, { manifestJs } = _a, otherJs = __rest(_a, ["manifestJs"]);
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
exports.default = LinkSsrPlugin;
