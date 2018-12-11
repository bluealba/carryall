"use strict";

const inquirer = require("inquirer");
const { prop } = require("ramda");

class Control {
	confirmInstall() {}
	confirmRestart(services) {}
}

class InteractiveConsole extends Control {
	constructor(config) {
		super();
		this.config = config;
	}

	confirm(message) {
		if (this.config.control.silent) {
			return Promise.resolve(true);
		}

		return inquirer
			.prompt([{ name: "prompt", type: "confirm", default: false, message }])
			.then(prop("prompt"));
	}

	confirmRestart(services) {
		if (this.config.control.noRestart) {
			return Promise.resolve(false);
		}
		return this.confirm(`Restart PM2 for ${services.length} services?`)
	}

	confirmInstall() {
		return this.confirm("Proceed?")
	}
}

module.exports = {
	interactive: config => new InteractiveConsole(config),
}
