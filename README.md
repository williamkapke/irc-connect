irc-connect
===========

Ok, enough with the giant modules that provide more features than you need for
a simple bot.

This module gives you the minimal IRC connection and simply emits event objects.
It only includes what it takes to connect and stay connected.

Plugin modules can (and should) do the rest.

  Now you can whip up a lightweight bot without all the baggage.


#### Install it
```
npm install irc-connect
```

#### Use it
```javascript
var irc = require("./connect");

var freenode = irc.connect('irc.freenode.net');
freenode.on('', );
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

#### irc.authenticate(nick, password, fullname)
A simple helper to set the `nick` and optionally authenticate with a `password`
and set the full name.

```javascript
var irc = require("./connect");

var freenode = irc.connect('irc.freenode.net')
	.use(irc.pong)
	.use(irc.authenticate('pokey', '123456789', 'Hokey Pokey'))
;

freenode.once('authenticated', function (result, name) {
	if(result===true){
		console.log('You are authenticated', name);
	}
	else {
		console.log('Authentication failed', name);
	}
});
```

##### Event:'authenticated'
Emitted after an authentication response is received (both success & failure).

On success: The callback's first argument will be `true` and the second
argument will be the authenticated `nick`.

On failure: The callback's first argument will be one of the failure errors.
`ERR_NONICKNAMEGIVEN`, `ERR_ERRONEUSNICKNAME`, `ERR_NICKNAMEINUSE`, `ERR_NICKCOLLISION`

<br>
<br>
<br>

### license
MIT
