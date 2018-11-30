const npm = require("./npm-wrapper");

module.exports = necessaryUpgrades => {
    const artifictsWithVersion = necessaryUpgrades.map(each => `${each.artifact}@${each.required}`);
    return npm("install", "--save-exact", "--global-style", "--no-package-lock", ...artifictsWithVersion);
}