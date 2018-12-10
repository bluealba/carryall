"use strict";

const chalk = require("chalk");
const emoji = require("node-emoji");
const own = require("../package.json");
const ora = require("ora");
const Slack = require("slack");
const { toPairs, propEq } = require("ramda");

class Reporter {

	constructor(config) {
		this.environment = config.environment;
	}

	greet() {
		this.print(`${this.format.bold("Carryall")} ${emoji.get("truck")}  - version ${own.version}`);
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

	reportActionsDone(currentEnvironment, actionsDone, actionsNeeded) {
		this.print(`Deploy finished on ${this.format.bold(this.environment)}. New state:`)
		toPairs(currentEnvironment).forEach(([artifact, current]) => {
			const actionDone = actionsDone.find(propEq("artifact", artifact))
			const actionPending = actionsNeeded.find(propEq("artifact", artifact))
			this.printPackageState({ artifact, current, pending: !!actionPending, updated: !!actionDone})
		});
		this.print()
	}

	printPackageAction({artifact, current, required}) {
		this.print(` ${emoji.get("package")} ${this.format.bold(artifact)}: ${current || "missing"} -> ${required}`);
	}

	printPackageState({artifact, current, pending, updated}) {
		const pack = `${emoji.get("package")} ${this.format.bold(artifact)}: ${current || "missing"}`
		const updatedFlag = updated ? this.format.green(" (updated)") : "";
		const errorFlag = pending ? this.format.red(" (different version requested!)") : "";
		this.print(`${pack}${updatedFlag}${errorFlag}`);
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
		this.slack = new Slack({ token: config.reporter.slack.token });
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
		this.buffer = "";
	}

	flush() {
		this.slack.chat.postMessage({
			channel: this.channel,
			text: this.buffer,
			username: `Carryall - ${this.environment}`,
		})
	}

	reportInstallStart() {
		this.clear();
		this.print(`${this.format.bold("Carryall")} ${emoji.get("truck")}  - starting deploy`);
		this.flush();
	}

	reportActionsDone(currentEnvironment, actionsDone, actionsNeeded) {
		this.clear();
		super.reportActionsDone(currentEnvironment, actionsDone, actionsNeeded);
		this.flush();
	}

}

const forward = where => method => (...parameters) => {
	where.forEach(each => each[method].apply(each, parameters));
}

class CompositeReporter extends Reporter {
	constructor(...reporters) {
		super({});
		const forwardAll = forward(reporters);
		this.greet = forwardAll("greet");
		this.reportPendingActions = forwardAll("reportPendingActions");
		this.reportInstallStart = forwardAll("reportInstallStart");
		this.reportInstallDone = forwardAll("reportInstallDone");
		this.reportActionsDone = forwardAll("reportActionsDone");
	}
}

module.exports = {
	Reporter,
	consoleReporter: config => new ConsoleReporter(config),
	slackReporter: config => new SlackReporter(config),
	defaultReporter: config => {
		const consoleReporter = new ConsoleReporter(config);
		const slackReporter = new SlackReporter(config);
		return new CompositeReporter(consoleReporter, slackReporter);
	}
}
