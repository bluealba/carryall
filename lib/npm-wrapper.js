"use strict";

const { spawn } = require("child_process");

module.exports = (...parameters) => {
	return new Promise((resolve, reject) => {
		const child = spawn(`npm ${parameters.join(" ")}`, {
			stdio: "inherit",
			shell: true,
		});

		child.on("exit", (code, signal) => {
			code ? reject(code) : resolve();
		})
	})

}
