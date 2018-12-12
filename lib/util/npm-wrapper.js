"use strict";

const { spawn } = require("child_process");

module.exports = () => (...parameters) => {
	return new Promise((resolve, reject) => {
		const child = spawn(`npm ${parameters.join(" ")}`, {
			shell: true,
			stdio: "inherit"
		});

		child.on("exit", (code, signal) => {
			code ? reject(`NPM exited with code ${code}`) : resolve();
		})
	})

}
