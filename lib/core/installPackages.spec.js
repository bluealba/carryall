"use strict";
const installPackages = require("./installPackages");
const npm = require("../util/npm-wrapper");

jest.mock("../util/npm-wrapper");

describe("installPackages", () => {

	it("installPackages should invoke npm with the required packages", () => {
		const mock = jest.fn(() => Promise.resolve({}));
		npm.mockReturnValue(mock);

		const actions = [
			{ artifact: "master-loader", current: undefined, required: "4.2.42-develop" },
			{ artifact: "tearsheet-loader", current: "1.0.69-develop", required: "1.0.70-develop" },
		];

		return installPackages(actions).then(() => {
			expect(mock.mock.calls[0]).toEqual([
				"install",
				"--save-exact",
				"--global-style",
				"--no-package-lock",
				"master-loader@4.2.42-develop",
				"tearsheet-loader@1.0.70-develop",
			])
		});
	});

});
