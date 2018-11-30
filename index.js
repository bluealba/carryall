
const co = require("co");
const { console: reporter } = require("./lib/Reporter");
const { interactiveConsole: control } = require("./lib/Control");
const { fs: descriptorFactory } = require("./lib/Descriptor");

const installPackages = require("./lib/installPackages");

const work = co.wrap(function*() {
    reporter.greet();
    
    const descriptor = yield descriptorFactory();
    const necessaryUpgrades = yield descriptor.requiredActions();
    reporter.reportPendingActions(necessaryUpgrades);
    
    if (! necessaryUpgrades.length) return; //noop
    
    const proceed = yield control.confirmInstall();
    if (! proceed) return;
    
    reporter.reportInstallStart();
    yield installPackages(necessaryUpgrades);
    reporter.reportInstallDone();
    
    const newState = yield descriptor.inspectEnvironment();
    const pendingActions = yield descriptor.requiredActions(); //should be empty
    reporter.reportActionsDone(newState, necessaryUpgrades, pendingActions);
});


work();