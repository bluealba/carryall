#!/usr/bin/env node
"use strict";

// const { WebClient } = require("@slack/client");
const { RTMClient } = require("@slack/client");
const fs = require("fs");
const Carryall = require("./lib/Carryall");

// const web = new WebClient("xoxb-116831015569-493822481716-b2iWdHVRCOJ6N2NpctkblTJ4")
const rtm = new RTMClient("xoxb-116831015569-493822481716-b2iWdHVRCOJ6N2NpctkblTJ4")
rtm.start();

const parseConfig = () => {
	const config = JSON.parse(fs.readFileSync("./carryall.json", { "encoding": "UTF-8" }));
	config.reporter.mode = "slack";
	config.control = { silent: true, noRestart: false }
	return config;
}

rtm.on("message", message => {
	if (message.text.includes(`<@${rtm.activeUserId}>`)) {
		if (message.text.includes("list")) {
			const config = parseConfig();
			new Carryall().state(config)
		}
	}
})
