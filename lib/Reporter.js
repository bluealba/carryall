const chalk = require("chalk");
const emoji = require("node-emoji");
const own = require("../package.json");
const { toPairs, propEq } = require("ramda");

class Reporter {
    greet() {};    
    reportPendingActions() {};
    reportInstallStart() {};
    reportInstallDone() {};
    
    print(...parameters) {};
}

class ConsoleReporter extends Reporter {
    print(...parameters) {
        console.log(...parameters);
    }
    
    greet() {
        this.print(chalk`{bold Carryall} ${emoji.get("truck")}  - version ${own.version}`);
        this.print(`Starting deployment. Calculating required actions...`);
        this.print();
    }
    
    reportPendingActions(actions) {
        if (actions.length) {
            this.print("Will modify the following packages:")
            actions.forEach(each => this.printPackageAction(each));
        } else {
            this.print(chalk`{yellow No action needed}`);
        }
        this.print();
    }
    
    reportInstallStart() {
        this.print();
        this.print(chalk`{cyan Spawning npm to perform install}`);
    }
    
    reportInstallDone() {
        this.print(chalk`{cyan npm is done}`);
        this.print();
    }
    
    reportActionsDone(currentEnvironment, actionsDone, actionsNeeded) {
        this.print(chalk`Deploy finished. Current state:`)
        toPairs(currentEnvironment).forEach(([artifact, current]) => {
            const actionDone = actionsDone.find(propEq("artifact", artifact)) 
            const actionPending = actionsNeeded.find(propEq("artifact", artifact)) 
            this.printPackageState({ artifact, current, pending: !!actionPending, updated: !!actionDone})
        });
        this.print()
    }
    
    printPackageAction({artifact, current, required}) {
        this.print(chalk` ${emoji.get("package")} {bold ${artifact}}: ${current || "missing"} -> ${required}`);
    } 
    
    printPackageState({artifact, current, pending, updated}) {
        const pack = chalk`${emoji.get("package")} {bold ${artifact}}: ${current || "missing"}`
        const updatedFlag = updated ? chalk` {green (updated)}` : "";
        const errorFlag = pending ? chalk` {red (different version requested!)}` : "";
        this.print(`${pack}${updatedFlag}${errorFlag}`);
    } 
    
} 

module.exports = {
    Reporter,
    console: new ConsoleReporter(),
}