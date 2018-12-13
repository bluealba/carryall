"use strict";

const pm2 = require("../util/pm2-wrapper");

module.exports = restarts => pm2()("restart", ...restarts);
