const co = require("co");
const { zipObj } = require("ramda");
const fs = require("promisify-fs");
const path = require("path");

const readArtifactVersion = co.wrap(function* (artifact) {
    const fullPath = path.resolve("node_modules", artifact, "package.json");
    
    const exists = yield fs.fileExists(fullPath)
    if (! exists) return undefined;
    
    const data = yield fs.readFile(fullPath);
    return JSON.parse(data).version;
});

/**
 * For a given set of artifacts (an array of artifacts names) returns an object that
 * maps from artifact name => version that is currently installed.
 */
module.exports = co.wrap(function* (artifacts) {
    const versions = yield Promise.all(artifacts.map(readArtifactVersion))
    return zipObj(artifacts, versions);
});