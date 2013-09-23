irc-connect
===========

Ok, enough with the giant modules that provide more features than you need for
a simple bot.

This module gives you the minimal IRC connection and simply emits event objects.
It only includes what it takes to connect and stay connected.

Plugin modules can (and should) do the rest.

  Now you can whip up a lightweight bot without all the baggage.

Channel support can be added with the [irc-channels](https://github.com/williamwicks/irc-channels) module!

#### Install it
```
npm install irc-connect
```

#### Use it
```javascript
var irc = require("irc-connect");
var freenode = irc.connect('irc.freenode.net', 'Blurp')
	//include some plugins
	.use(irc.pong, irc.names, irc.motd)
	//fires when the servers sends the welcome message (RPL_WELCOME)
	.on('welcome', function (msg) {
		console.log(msg);
		this.nick('pokey', 'pa$$word', function(err){
			console.log('There was a problem setting your NICK:', err);
		});
	})
	//fires after the server confirms password
	.on('identified', function (nick) {
		this.send('JOIN #node.js');
	})
	//fires only when YOUR nick changes
	.on('nick', function (nick) {
		console.log('Your nick is now:', nick);
	})
	.on('NOTICE', function (event) {
		console.log('NOTICE:', event.params[1]);
	})
	.on('JOIN', function (event) {
		console.log(event.nick, 'joined');
	})
	.on('PRIVMSG', function (event) {
		var params = event.params;
		console.log('message from: '+event.nick, 'to: '+params[0], params[1]);
	})
	//from the `names` plugin.
	.on('names', function (cname, names) {
		console.log(cname, names);
	})
	//from the `motd` plugin.
	.on('motd', function (event) {
		console.log(this.motd);
		console.log(this.support);
	})
;
```
<br>
<br>
<br>

### Events
All data from the server is parsed and emitted using the data's `command` as the
event name. Numeric events (as defined by [RFC 1459](https://tools.ietf.org/html/rfc1459#section-6))
are converted to their string codes. The full list can be viewed in the
[irc-replies](https://github.com/williamwicks/irc-replies/blob/master/replies.json)
module.

All events follow this distinct pattern:
* UPPERCASE events are direct IRC events. They are always passed the parsed `event` object.
* lowercase events are custom events from `irc-connect` or a pluggin.


#### Event:'connect'
#### Event:'close'
#### Event:'error'
These are directly from the underlying `socket` connection.

<br>
<br>
<br>

### Debug
This module uses Visionmedia's [debug](https://github.com/visionmedia/debug) module.

Show everything:
```
$ DEBUG=irc:connect* node app.js
```

Show only connect/disconnect messages
```
$ DEBUG=irc:connect node app.js
```

Show raw incoming data:
```
$ DEBUG=irc:connect-raw node app.js
```

Show parsed incoming data as JSON:
```
$ DEBUG=irc:connect-parsed node app.js
```

Show outgoing data:
```
$ DEBUG=irc:connect-out node app.js
```

<br>
<br>
<br>

### Plugins
As mentioned above, this module's goal is to allow plugins to be added that
provide richer features.

#### connection.use(handler)
Plugins can export a `__irc` function for `use` to call. The function will be
passed a reference to the `connection`. The plugin should wire any listeners
needed and augment it with helper functions/properties needed.

#### irc.pong
IRC does a `PING` - `PONG` game to verify the client is still alive. Use this
plugin to automatically reply to the server's `PING`s and stay connected.

#### irc.names
Parses replies from a `NAMES` command and emits a `names` event with the
results as an object.

#### irc.motd
Parses replies from a `NAMES` command and emits a `names` event with the
results as an object.

#### irc.nick(nick [,password [,onerror]])
Sets a `NICK` with an optional password and a error callback.


##### Event:'nick'
Emitted anytime your nick is changed.

<br>
<br>
<br>

### license
MIT
