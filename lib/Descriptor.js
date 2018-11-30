const fs = require("fs");
const co = require("co");
const inspectEnvironment = require("./inspectEnvironment");
const { keys } = require("ramda");

class Descriptor {
    constructor(descriptor) {
        this.dependencies = descriptor.dependencies;
        this.requiredActions = co.wrap(this.requiredActions.bind(this));
    }
    
    /**
     * Returns a list of artifacts to be managed
     */
    get artifacts() {
        return keys(this.dependencies);
    }
    
    /**
     * For one particular artifact informs the required version ofr it
     */
    requiredVersion(artifact) {
        return this.dependencies[artifact];
    }
    
    /**
     * Resolves to a list of required actions that is represented as an object that carried
     * { artifact: <artifact name>, current: <current version>, required: <required version> }
     */
    * requiredActions() {
        const currentVersions = yield this.inspectEnvironment();
        const diff = this.artifacts.filter(artifact => this.requiredVersion(artifact) !== currentVersions[artifact]);
        return diff.map(artifact =>({ 
            artifact, 
            current: currentVersions[artifact], 
            required: this.requiredVersion(artifact) 
        }));
    }
    
    inspectEnvironment() {
        return inspectEnvironment(this.artifacts);
    }
}

module.exports = {
    git: () => Promise.reject(),
    fs: () => new Promise((resolve, reject) => fs.readFile("./package.json", (err, data) => {
        err ? reject(err) : resolve(new Descriptor(JSON.parse(data)));
    })),
}