import * as webpack from "webpack";
// import * as fs from "fs-extra";

// const FS_ACCURACY = 10000;

export interface DllRefOptions {
    webpackConfig: webpack.Configuration;
    entry: {}
}

export class DllRefController {
    private referencePlugins: webpack.DllReferencePlugin[];
    // private pluginStartTime: number;
    private options: DllRefOptions;
    constructor(options: DllRefOptions) {
        this.options = options;
        const { plugins } = options.webpackConfig;

        const dllPlugin: any = (plugins || []).find(item => {
            return item instanceof webpack.DllPlugin;
        });
        if (!dllPlugin) {
            throw new Error("Your webpack dll config miss DllPlugin.");
        }

        const dllOptions: webpack.DllPlugin.Options = dllPlugin.options;

        this.initDllReferencePlugins(this.options.entry,dllOptions);

        // this.pluginStartTime = Date.now();
    }

    private initDllReferencePlugins(entry,dllOptions: webpack.DllPlugin.Options) {
        const dllJsonFullPath = dllOptions.path;

        const referenceNames = Object.keys(entry).map(entryName => {
            return dllJsonFullPath.replace("[name]", entryName);
        });
        let referenceConf: webpack.DllReferencePlugin.Options[] = referenceNames.map(
            name =>
                ({
                    manifest: name
                } as any)
        );
        if (dllOptions.context) {
            referenceConf = referenceConf.map(conf => ({
                ...conf,
                context: dllOptions.context
            }));
        }
        this.referencePlugins = referenceConf.map(
            conf => new webpack.DllReferencePlugin(conf)
        );
    }

    public applyDllReferencePlugins(compiler) {
        this.referencePlugins.forEach(plugin => {
            plugin.apply.call(plugin, compiler);
        });
    }

}
