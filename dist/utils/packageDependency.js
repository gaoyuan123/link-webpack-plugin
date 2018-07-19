"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const yarnParser = require("./yarnParser");
const fs = require("fs");
const path = require("path");
const NODE_MODULES_PATH = path.resolve("./node_modules");
function convertEntryToList(entry) {
    if (typeof entry === "string") {
        return [entry];
    } else if (Array.isArray(entry)) {
        return entry;
    } else if (typeof entry === "object") {
        let list = [];
        Object.keys(entry).forEach(k => {
            list = list.concat(entry[k]);
        });
        return list;
    } else {
        throw `Incorrect entry type.`;
    }
}
function getDependencyFromYarn(entry) {
    let entryList = convertEntryToList(entry);
    const packageJson = JSON.parse(fs.readFileSync("package.json").toString());
    if (!packageJson.dependencies) {
        return null;
    }
    let dependency;
    let content;
    try {
        content = fs.readFileSync("package-lock.json").toString();
        dependency = JSON.parse(content).dependencies;
        entryList = entryList.filter(item => !!item);
    } catch (e) {
        content = fs.readFileSync("yarn.lock").toString();
        dependency = yarnParser.parse(content, "yarn.lock");
        entryList = entryList
            .map(item => {
                const version = packageJson.dependencies[item];
                return version ? `${item}@${version}` : "";
            })
            .filter(item => !!item);
    }
    function findDependency(entryList) {
        let m = {};
        entryList.map(k => {
            const info = dependency[k] || {};
            let item = {
                version: info.version
            };
            if (info.dependencies) {
                item.dependencies = findDependency(
                    Object.keys(info.dependencies).map(
                        k => `${k}@${info.dependencies[k].version}`
                    )
                );
            }
            m[k] = item;
        });
        return m;
    }
    return findDependency(entryList);
}
exports.getDependencyFromYarn = getDependencyFromYarn;
function getPKGVersion(yarnEntryName) {
    const atIndex = yarnEntryName.lastIndexOf("@");
    if (atIndex > 0) {
        yarnEntryName = yarnEntryName.substring(0, atIndex);
    }
    const pkgPath = path.join(NODE_MODULES_PATH, yarnEntryName, "package.json");
    const pkg = require(pkgPath);
    return pkg.version;
}
exports.getPKGVersion = getPKGVersion;
