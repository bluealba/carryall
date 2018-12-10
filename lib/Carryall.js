"use strict";

const co = require("co");
const { defaultReporter } = require("./Reporter");
const { interactiveConsole } = require("./Control");
const { git } = require("./Descriptor");

const installPackages = require("./installPackages");
const restartServices = require("./restartServices");

class Carryall {
	constructor({ reporterFactory = defaultReporter, control = interactiveConsole, descriptorFactory = git } = {}) {
		this.reporterFactory = reporterFactory;
		this.control = control;
		this.descriptorFactory = descriptorFactory;

		this.deploy = co.wrap(this.deploy.bind(this));
	}

	* deploy(config) {
		const reporter = this.reporterFactory(config);
		reporter.greet();

		// Calculate required actions
		const descriptor = yield this.descriptorFactory(config);
		const necessaryUpgrades = yield descriptor.requiredActions();
		reporter.reportPendingActions(necessaryUpgrades);

		// Confirm and proceeed
		if (! necessaryUpgrades.length) return; //noop
		const proceed = yield this.control.confirmInstall();
		if (! proceed) return;

		// Install upgrades
		reporter.reportInstallStart();
		yield installPackages(necessaryUpgrades);
		reporter.reportInstallDone();

		// Reports new state
		const newState = yield descriptor.inspectEnvironment();
		const pendingActions = yield descriptor.requiredActions(); //should be empty
		reporter.reportActionsDone(newState, necessaryUpgrades, pendingActions);

		// Restart PM2s
		const necessaryRestarts = descriptor.requiredRestarts(necessaryUpgrades);
		const proceedRestart = yield this.control.confirmRestart(necessaryRestarts);
		if (! proceedRestart) return;

		yield restartServices(necessaryRestarts);
	}
}

module.exports = Carryall;
