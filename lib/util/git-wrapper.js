"use strict";

const { spawn } = require("child_process");
const fs = require("fs");

module.exports = (cwd, ...parameters) => {
	return new Promise((resolve, reject) => {
		const child = spawn(`git ${parameters.join(" ")}`, {
			cwd,
			stdio: ["inherit", "pipe", "pipe"],
			shell: true,
		});

		const stream = fs.createWriteStream(".carryall/git.log");
		child.stdout.pipe(stream);
		child.stderr.pipe(stream);

		child.on("exit", (code, signal) => {
			code ? reject(code) : resolve();
		})
	})

}
