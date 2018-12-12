"use strict";

const { WebClient } = require("@slack/client");
const { RTMClient } = require("@slack/client");
const { find, propEq, prop } = require("ramda");

const web = new WebClient("xoxb-116831015569-493822481716-b2iWdHVRCOJ6N2NpctkblTJ4")
const rtm = new RTMClient("xoxb-116831015569-493822481716-b2iWdHVRCOJ6N2NpctkblTJ4")
rtm.start();

web.channels.list()
	.then(prop("channels"))
	.then(find(propEq("name", "test")))
	.then(channel => rtm.sendMessage("Hello there", channel.id))
	.then(response => console.log("message sent", response.ts));

rtm.on("message", message => {
	console.log(message);
})
