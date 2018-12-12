"use strict";

const { spawn } = require("child_process");

module.exports = () => (...parameters) => {
	return new Promise((resolve, reject) => {
		const child = spawn(`pm2 ${parameters.join(" ")}`, {
			shell: true,
			stdio: "inherit"
		});

		child.on("exit", (code, signal) => {
			code ? reject(`PM2 exited with code ${code}`) : resolve();
		})
	})

}
