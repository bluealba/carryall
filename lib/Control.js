"use strict";

const inquirer = require("inquirer");
const { prop } = require("ramda");

class Control {
	confirmInstall() {}
}

class InteractiveConsole extends Control {
	confirm(message) {
		return inquirer
			.prompt([{ name: "prompt", type: "confirm", default: false, message }])
			.then(prop("prompt"));
	}

	confirmInstall() {
		return this.confirm("Proceed?")
	}
}

module.exports = {
	Control,
	interactiveConsole: new InteractiveConsole(),
}
