"use strict";

const co = require("co");
const { defaultReporter } = require("./Reporter");
const { interactive } = require("./Control");
const { git } = require("./Descriptor");

const installPackages = require("./installPackages");
const restartServices = require("./restartServices");

class Carryall {
	constructor({ reporterFactory = defaultReporter, controlFactory = interactive, descriptorFactory = git } = {}) {
		this.reporterFactory = reporterFactory;
		this.controlFactory = controlFactory;
		this.descriptorFactory = descriptorFactory;

		this.deploy = co.wrap(this.deploy.bind(this));
		this.state = co.wrap(this.state.bind(this));
	}

	/**
	 * Reports the current state of the environment into the reporter
	 */
	* state(config) {
		try {
			const reporter = this.reporterFactory(config);
			const descriptor = yield this.descriptorFactory(config);

			const newState = yield descriptor.inspectEnvironment();
			const pendingActions = yield descriptor.requiredActions(); //should be empty
			reporter.reportCurrentState(newState, pendingActions);
		} catch (error) {
			console.log(error);
		}
	}

	/**
	 * Syncs the current environemnt with the uploaded descriptor
	 */
	* deploy(config) {
		const reporter = this.reporterFactory(config);

		try {
			const control = this.controlFactory(config);
			reporter.greet();

			// Calculate required actions
			const descriptor = yield this.descriptorFactory(config);
			const necessaryUpgrades = yield descriptor.requiredActions();
			reporter.reportPendingActions(necessaryUpgrades);

			// Confirm and proceeed
			if (! necessaryUpgrades.length) return; //noop
			const proceed = yield control.confirmInstall();
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
			const proceedRestart = yield control.confirmRestart(necessaryRestarts);
			if (! proceedRestart) return;

			yield restartServices(necessaryRestarts);
		} catch (error) {
			reporter.reportError(error);
		}
	}

}

module.exports = Carryall;
