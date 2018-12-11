#!/usr/bin/env node
"use strict";

const Carryall = require("./lib/Carryall");
const fs = require("fs");
const program = require("commander");
const ownVersion = require("./package.json");

program
	.version(ownVersion.version)
	.option("-c", "--config <path>", "Change the configuration file. Defaults to carryall.json")
	.option("-s, --silent", "Silent mode, will not prompt for any action")
	.option("-R, --no-restart", "Do not perform a service restart")
	.parse(process.argv);

const config = JSON.parse(fs.readFileSync(program.config || "./carryall.json", { "encoding": "UTF-8" }));
config.control = {
	silent: program.silent,
	noRestart: program.noRestart,
}

new Carryall().deploy(config)
