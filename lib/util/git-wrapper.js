"use strict";

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

module.exports = ({ password, cwd }) => (...parameters) => {
	return new Promise((resolve, reject) => {
		const child = spawn(`git ${parameters.join(" ")}`, {
			cwd,
			stdio: ["inherit", "pipe", "pipe"],
			shell: true,
			env: {
				GIT_ASKPASS: path.resolve(__dirname, "echo-password.sh"),
				ECHO_PASSWORD: password
			}
		});

		const stream = fs.createWriteStream(".carryall/git.log");
		child.stdout.pipe(stream);
		child.stderr.pipe(stream);

		child.on("exit", (code, signal) => {
			code ? reject(code) : resolve();
		})
	});

}
