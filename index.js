#!/usr/bin/env node
"use strict";

const Carryall = require("./lib/Carryall");
const fs = require("fs");
const program = require("commander");
const ownVersion = require("./package.json");

const parseConfig = (program, defaultReporter) => {
	const config = JSON.parse(fs.readFileSync(program.config || "./carryall.json", { "encoding": "UTF-8" }));
	config.reporter.mode = program.reporter || defaultReporter;
	config.control = { silent: !!program.silent, noRestart: !program.restart }
	return config;
}

program
	.version(ownVersion.version)
	.option("-c", "--config <path>", "Change the configuration file. Defaults to carryall.json");

program
	.command("deploy")
	.description("Updates the environment installation to match versions in the descriptor")
	.option("--reporter <reporter>", "Which reporter to use [cli|slack|combined]. Defaults to combined")
	.option("-s, --silent", "Silent mode, will not prompt for any action")
	.option("-R, --no-restart", "Do not perform a service restart")
	.action(program => {
		const config = parseConfig(program, "combined");
		new Carryall().deploy(config)
	});

program
	.command("list")
	.description("Query the current state of the environment")
	.option("--reporter <reporter>", "Which reporter to use [cli|slack|combined]. Defaults to cli")
	.action(program => {
		const config = parseConfig(program, "cli");
		new Carryall().state(config)
	});

program.parse(process.argv)




