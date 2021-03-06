"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const inspectEnvironment = require("../util/inspectEnvironment");
const { keys, prop } = require("ramda");
const git = require("simple-git/promise");

class Descriptor {
	constructor(descriptor) {
		this.dependencies = descriptor.dependencies;
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
	async requiredActions() {
		const currentVersions = await this.inspectEnvironment();
		const diff = this.artifacts.filter(artifact => this.requiredVersion(artifact) !== currentVersions[artifact]);
		return diff.map(artifact =>({
			artifact,
			current: currentVersions[artifact],
			required: this.requiredVersion(artifact)
		}));
	}

	/**
	 * Which ones of the following aftifacts are PM2 based?
	 */
	requiredRestarts(upgradedServices) {
		return upgradedServices.map(prop("artifact")).filter(artifact => fs.existsSync(`${artifact}.pm2.json`));
	}

	inspectEnvironment() {
		return inspectEnvironment(this.artifacts);
	}
}

module.exports = {
	Descriptor,

	git: async config => {
		const hash = crypto.createHash("md5").update(config.descriptor.repository).digest("hex");
		const target = path.join(config.workdir, hash);
		const remote = `https://${config.descriptor.username}:${config.descriptor.password}@${config.descriptor.repository}`;

		if (fs.existsSync(target)) {
			const repo = git(target);
			await repo.checkout(config.descriptor.branch);
			await repo.pull(remote, config.descriptor.branch);
		} else {
			await git().clone(remote, target);
			await git(target).checkout(config.descriptor.branch);
		}

		return new Promise((resolve, reject) => fs.readFile(path.join(target, "package.json"), (err, data) => {
			err ? reject(err) : resolve(new Descriptor(JSON.parse(data)));
		}))
	},

	fs: config => new Promise((resolve, reject) => fs.readFile("./package.json", (err, data) => {
		err ? reject(err) : resolve(new Descriptor(JSON.parse(data)));
	})),
}
