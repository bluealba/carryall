"use strict";

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
	}

	/**
	 * Reports the current state of the environment into the reporter
	 */
	async state(config) {
		try {
			const reporter = this.reporterFactory(config);
			const descriptor = await this.descriptorFactory(config);

			const newState = await descriptor.inspectEnvironment();
			const pendingActions = await descriptor.requiredActions(); //should be empty
			reporter.reportCurrentState(newState, pendingActions);
		} catch (error) {
			console.log(error);
		}
	}

	/**
	 * Syncs the current environemnt with the uploaded descriptor
	 */
	async deploy(config) {
		const reporter = this.reporterFactory(config);

		try {
			const control = this.controlFactory(config);
			reporter.greet();

			// Calculate required actions
			const descriptor = await this.descriptorFactory(config);
			const necessaryUpgrades = await descriptor.requiredActions();
			reporter.reportPendingActions(necessaryUpgrades);

			// Confirm and proceeed
			if (! necessaryUpgrades.length) return; //noop
			const proceed = await control.confirmInstall();
			if (! proceed) return;

			// Install upgrades
			reporter.reportInstallStart();
			await installPackages(necessaryUpgrades);
			reporter.reportInstallDone();

			// Reports new state
			const newState = await descriptor.inspectEnvironment();
			const pendingActions = await descriptor.requiredActions(); //should be empty
			reporter.reportActionsDone(newState, necessaryUpgrades, pendingActions);

			// Restart PM2s
			const necessaryRestarts = descriptor.requiredRestarts(necessaryUpgrades);
			const proceedRestart = await control.confirmRestart(necessaryRestarts);
			if (! proceedRestart) return;

			await restartServices(necessaryRestarts);
		} catch (error) {
			reporter.reportError(error);
		}
	}

}

module.exports = Carryall;
