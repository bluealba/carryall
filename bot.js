#!/usr/bin/env node
"use strict";

const { WebClient } = require("@slack/client");
const { RTMClient } = require("@slack/client");
const fs = require("fs");
const Carryall = require("./lib/core/Carryall");
const { tail, anyPass } = require("ramda");

const parseConfig = () => {
	const config = JSON.parse(fs.readFileSync("./carryall.json", { "encoding": "UTF-8" }));
	config.reporter.mode = "slack";
	config.control = { silent: true, noRestart: false }
	return config;
}

const config = parseConfig();
const web = new WebClient(config.reporter.slack.token);
const rtm = new RTMClient(config.reporter.slack.token);
rtm.start();

/**
 * If the regular expression matches, then the action function is invoked
 * @return true if there was a match, false otherwhise
 */
const match = (regexp, action) => message => {
	const match = message.text.match(regexp);
	if (match) {
		action(message,...tail(match));
		return true;
	} else {
		return false;
	}
}

const reply = message => original => {
	web.chat.postMessage(Object.assign({ channel: original.channel }, message))
}

const handleMessage = anyPass([
	match(/list\s+(\w+)/i, (message, environment) => {
		const config = parseConfig();
		if (environment.toUpperCase() === config.environment) {
			config.reporter.slack.channel = message.channel;
			new Carryall().state(config)
		}
	}),
	match(/list/i, reply({ text: "Please specify an environment for listing" })),
	match(/i\s+love*\s+[you|u]/i, reply({ text: "Me too" })),
]);

rtm.on("message", message => {
	if (message.text && message.text.includes(`<@${rtm.activeUserId}>`)) {
		handleMessage(message);
	}
})
