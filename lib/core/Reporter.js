"use strict";

const chalk = require("chalk");
const emoji = require("node-emoji");
const ora = require("ora");
const { WebClient } = require("@slack/client");
const { toPairs, propEq } = require("ramda");

class Reporter {

	constructor(config) {
		this.environment = config.environment;
	}

	greet() {
		this.print(`${this.format.bold("Carryall")} ${emoji.get("truck")}`);
	}

	reportPendingActions(actions) {
		if (actions.length) {
			this.print();
			this.print("Will modify the following packages:")
			actions.forEach(each => this.printPackageAction(each));
		} else {
			this.print(this.format.yellow("No action needed!"));
		}
		this.print();
	}

	reportInstallStart() {
		this.print();
		this.print(this.format.cyan("Spawning npm to perform install"));
	}

	reportInstallDone() {
		this.print(this.format.cyan("npm is done"));
		this.print();
	}

	reportCurrentState(currentEnvironment, actionsNeeded) {
		this.print("Current state:")
		this.reportEnvironment(currentEnvironment, [], actionsNeeded, true);
		this.print()
	}

	reportActionsDone(currentEnvironment, actionsDone, actionsNeeded) {
		this.print("Deploy finished. Actions done:");
		this.reportEnvironment(currentEnvironment, actionsDone, actionsNeeded, false);
		this.print()
	}

	reportError(error) {
		this.print("Error");
		this.print(error);
	}


	reportEnvironment(currentEnvironment, actionsDone, actionsNeeded, printAll) {
		toPairs(currentEnvironment).forEach(([artifact, current]) => {
			const actionDone = actionsDone.find(propEq("artifact", artifact))
			const actionPending = actionsNeeded.find(propEq("artifact", artifact))
			if (printAll || actionPending || actionDone) {
				this.printPackageState({
					artifact,
					before: actionDone && actionDone.current,
					current,
					pending: !!actionPending,
					updated: !!actionDone
				})
			}
		});
	}

	printPackageAction({artifact, current, required}) {
		this.print(` ${emoji.get("package")} ${this.format.bold(artifact)}: ${current || "missing"} -> ${required}`);
	}

	printPackageState({artifact, before, current, pending, updated}) {
		const action = updated ? `${before || "missing"} -> ${current || "missing"}` : `${current || "missing"}`;
		const pack = `${emoji.get("package")} ${this.format.bold(artifact)}`;
		const updatedFlag = updated ? this.format.green(" (updated)") : "";
		const errorFlag = pending ? this.format.red(" (different version requested!)") : "";
		this.print(`${pack}: ${action}${updatedFlag}${errorFlag}`);
	}
}

class ConsoleReporter extends Reporter {
	constructor(config) {
		super(config);
		this.spinner = null;
		this.format = chalk;
	}

	print(...parameters) {
		console.log(...parameters); //eslint-disable-line no-console
	}

	greet() {
		super.greet();
		this.spinner = ora("Starting deployment. Calculating required actions").start();
	}

	reportPendingActions(actions) {
		this.spinner.succeed();
		super.reportPendingActions(actions);
	}

}

class SlackReporter extends Reporter {
	constructor(config) {
		super(config);
		this.slack = new WebClient(config.reporter.slack.token);
		this.channel = config.reporter.slack.channel;
		this.format = {
			bold: x => `*${x}*`,
			yellow: x => x,
			red: x => x,
			cyan: x => x,
			green: x => x
		}
	}

	print(line = "") {
		this.buffer = this.buffer + line + "\n";
	}

	clear() {
		const text = this.buffer;
		this.buffer = "";
		return text;
	}

	async flush(options = {}) {
		let updateMessage;
		if (options.followUp) {
			updateMessage = await options.followUp;
		}

		const message = {
			channel: updateMessage ? updateMessage.channel : this.channel,
			text: this.buffer,
			ts: updateMessage && updateMessage.ts
		}
		if (options.attachment) {
			message.attachments = [options.attachment];
		}

		return updateMessage ? this.slack.chat.update(message) : this.slack.chat.postMessage(message);
	}

	reportInstallStart() {
		this.clear();
		this.print(`${this.format.bold(this.environment)} ${emoji.get("construction")}  - deploy starting`);
		this.startMessage = this.flush();
	}

	reportActionsDone(currentEnvironment, actionsDone, actionsNeeded) {
		this.clear();
		this.reportEnvironment(currentEnvironment, actionsDone, actionsNeeded, false);
		const status = this.clear(); //do not flush it to slack, keep it and send it as an attachment

		this.print(`${this.format.bold(this.environment)} ${emoji.get("truck")}  - deploy finished`);
		this.flush({
			followUp: this.startMessage,
			attachment: { text: status, color: "#36a64f" }
		});
	}

	reportCurrentState(currentEnvironment, actionsNeeded) {
		this.clear();
		this.reportEnvironment(currentEnvironment, [], actionsNeeded, true);
		const status = this.clear(); //do not flush it to slack, keep it and send it as an attachment

		this.print(`${this.format.bold(this.environment)} ${emoji.get("truck")}  - current state`);
		this.flush({
			followUp: this.startMessage,
			attachment: { text: status }
		});
	}

	reportError(error) {
		this.clear();
		this.print(`${this.format.bold(this.environment)} ${emoji.get("fire")}  - deploy failed`);
		this.flush({
			followUp: this.startMeyssage,
			attachment: { text: error.message || error, color: "#EB7170" }
		});
	}

}

const forward = where => method => (...parameters) => {
	where.forEach(each => each[method].apply(each, parameters));
}

/**
 * Combines several reporter all together
 */
class CompositeReporter extends Reporter {
	constructor(...reporters) {
		super({});
		const forwardAll = forward(reporters);
		this.greet = forwardAll("greet");
		this.reportPendingActions = forwardAll("reportPendingActions");
		this.reportInstallStart = forwardAll("reportInstallStart");
		this.reportInstallDone = forwardAll("reportInstallDone");
		this.reportActionsDone = forwardAll("reportActionsDone");
		this.reportCurrentState = forwardAll("reportCurrentState");
		this.reportError = forwardAll("reportError");
	}
}

module.exports = {
	consoleReporter: config => new ConsoleReporter(config),
	slackReporter: config => new SlackReporter(config),
	defaultReporter: config => {
		const consoleReporter = new ConsoleReporter(config);
		const slackReporter = new SlackReporter(config);
		const combinedReporter = new CompositeReporter(consoleReporter, slackReporter);

		if (config.reporter.mode === "cli") {
			return consoleReporter;
		} else if (config.reporter.mode === "slack") {
			return slackReporter;
		} else {
			return combinedReporter;
		}
	}
}
