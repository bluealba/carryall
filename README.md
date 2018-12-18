@bluealba/carryall
===
A easy way to keep your environments in sync

![Atreides Carryall](carryall.jpg)

## Intent
The main intent of Carryall is to ease the deployment tasks performend into a single server environment (although technically speaking it can be extended to suppert any mechanism of provisioning).

Caryall relies on a single source of truth to describe a what is expected from an environment.

Yet, carryall is only a glorified script. Don't expect it to cook breakfast for you!

### Install
We recommend to install carryall globally in each server to be provisioned.

```
$ npm instal --global @bluealba/carryall
```

You will need to create a configuration file. The default name is `carryall.json`. It should look something like this:

```
{
	"environment": "<environment name>",
	"descriptor": {
		"repository": "<your git repo url, without protocol and username please>,
		"username": "<your username>",
		"password": "<your password>"
		"branch": "<the branch to checkout>",
	},
	"reporter": {
		"slack": {
			"token": "<your bot token secret>",
			"channel": "<the channel to push notifications>"
		}
	},
	"workdir": ".carryall"
}
```

### Run
Execute the following command to perfomr an deploy

```
$ carryall deploy
```
And follow the instruction on screen. You can also run `carryall help` to see a list of available commands
.
