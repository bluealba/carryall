"use strict";

const co = require("co");
const { consoleReporter } = require("./Reporter");
const { interactiveConsole } = require("./Control");
const { git } = require("./Descriptor");

const installPackages = require("./installPackages");

class Carryall {
	constructor({ reporter = consoleReporter, control = interactiveConsole, descriptorFactory = git } = {}) {
		this.reporter = reporter;
		this.control = control;
		this.descriptorFactory = descriptorFactory;

		this.deploy = co.wrap(this.deploy.bind(this));
	}

	* deploy(config) {
		this.reporter.greet();

		const descriptor = yield this.descriptorFactory(config);
		const necessaryUpgrades = yield descriptor.requiredActions();
		this.reporter.reportPendingActions(necessaryUpgrades);

		if (! necessaryUpgrades.length) return; //noop

		const proceed = yield this.control.confirmInstall();
		if (! proceed) return;

		this.reporter.reportInstallStart();
		yield installPackages(necessaryUpgrades);
		this.reporter.reportInstallDone();

		const newState = yield descriptor.inspectEnvironment();
		const pendingActions = yield descriptor.requiredActions(); //should be empty
		this.reporter.reportActionsDone(newState, necessaryUpgrades, pendingActions);
	}
}

module.exports = Carryall;
