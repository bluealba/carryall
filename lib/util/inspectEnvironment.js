"use strict";

const { zipObj } = require("ramda");
const fs = require("promisify-fs");
const path = require("path");

const readArtifactVersion = async artifact => {
	const fullPath = path.resolve("node_modules", artifact, "package.json");

	const exists = await fs.fileExists(fullPath)
	if (! exists) return undefined;

	const data = await fs.readFile(fullPath);
	return JSON.parse(data).version;
};

/**
 * For a given set of artifacts (an array of artifacts names) returns an object that
 * maps from artifact name => version that is currently installed.
 */
module.exports = async artifacts => {
	const versions = await Promise.all(artifacts.map(readArtifactVersion))
	return zipObj(artifacts, versions);
};
