"use strict";
const { Descriptor } = require("./Descriptor");
const inspectEnvironment = require("./util/inspectEnvironment");

jest.mock("./util/inspectEnvironment");

const packageJson = {
	"dependencies": {
		"master-loader": "4.2.42-develop",
		"tearsheet": "1.0.41-develop",
		"tearsheet-loader": "1.0.70-develop"
	}
}

describe("Descriptor", () => {
	let descriptor;

	beforeEach(() => {
		descriptor = new Descriptor(packageJson);
	});

	it("artifacts should list all desired artifacts", () => {
		expect(descriptor.artifacts).toEqual(["master-loader", "tearsheet", "tearsheet-loader"]);
	});

	it("requiredVersions should list required versions for all artifacts", () => {
		expect(descriptor.requiredVersion("master-loader")).toEqual("4.2.42-develop");
		expect(descriptor.requiredVersion("tearsheet")).toEqual("1.0.41-develop");
		expect(descriptor.requiredVersion("tearsheet-loader")).toEqual("1.0.70-develop");

		expect(descriptor.requiredVersion("unknown")).toBeUndefined();
	});

	it("requiredActions should list artifacts with different installed versions", () => {
		inspectEnvironment.mockResolvedValue({
			"master-loader": undefined, //no version installed
			"tearsheet": "1.0.41-develop", //this is ok, no action needed
			"tearsheet-loader": "1.0.69-develop" //this is out of date
		});

		return descriptor.requiredActions().then(actions => {
			expect(actions).toEqual([
				{ artifact: "master-loader", current: undefined, required: "4.2.42-develop" },
				{ artifact: "tearsheet-loader", current: "1.0.69-develop", required: "1.0.70-develop" },
			])
		})
	});
});
