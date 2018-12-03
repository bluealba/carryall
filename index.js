"use strict";

const Carryall = require("./lib/Carryall");
const fs = require("fs");

const config = JSON.parse(fs.readFileSync("./carryall.json", { "encoding": "UTF-8" }));
new Carryall().deploy(config)
