"use strict";

const Carryall = require("./lib/Carryall");
const fs = require("fs");

const Slack = require("slack");
const token = "SQm9TXBTZRkdrk0LX6fFS9Tu"

const slack = new Slack({ token });
slack.chat.postMessage({
	channel: "@cf",
	text: "hola"
})

// const config = JSON.parse(fs.readFileSync("./carryall.json", { "encoding": "UTF-8" }));
// new Carryall().deploy(config)
