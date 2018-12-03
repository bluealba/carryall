"use strict";

const co = require("co");
const { defaultReporter } = require("./Reporter");
const { interactiveConsole } = require("./Control");
const { git } = require("./Descriptor");

const installPackages = require("./installPackages");

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

		const descriptor = yield this.descriptorFactory(config);
		const necessaryUpgrades = yield descriptor.requiredActions();
		reporter.reportPendingActions(necessaryUpgrades);

		if (! necessaryUpgrades.length) return; //noop

		const proceed = yield this.control.confirmInstall();
		if (! proceed) return;

		reporter.reportInstallStart();
		yield installPackages(necessaryUpgrades);
		reporter.reportInstallDone();

		const newState = yield descriptor.inspectEnvironment();
		const pendingActions = yield descriptor.requiredActions(); //should be empty
		reporter.reportActionsDone(newState, necessaryUpgrades, pendingActions);
	}
}

module.exports = Carryall;
