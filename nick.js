function sendNick(nick,cb,authd){
	var auth_errors = [
		'ERR_NONICKNAMEGIVEN',
		'ERR_ERRONEUSNICKNAME',
		'ERR_NICKNAMEINUSE',
		'ERR_NICKCOLLISION',
		'ERR_UNAVAILRESOURCE',
		'ERR_ALREADYREGISTRED' //not a typo
	];

	function error(data){
		if(cb) cb.call(this, data.command, nick);
		removeListeners.call(this);
	}

	function removeListeners() {
		for(var i=0;i<auth_errors.length;i++)
			this.removeListener(auth_errors[i], error);
		if('function' === typeof authd) this.removeListener('NOTICE', authd);
	}

	//attach error listeners
	for(var i=0;i<auth_errors.length;i++)
		this.once(auth_errors[i], error);

	this.send('NICK ', nick);
}

function auth(nick, pass, cb) {
	if(typeof pass === 'function')
		cb = pass, pass=null;

	function authd(data) {
		var target = data.params[0];
		var msg = data.params[1];
		if(target===nick){
			if(/^Invalid password/i.test(msg)){
				removeListeners.call(this);
				if(cb) cb.call(this, 'invalid password', nick);
			}
			else if(/^You are now identified/i.test(msg)){
				removeListeners.call(this);
			}
			else if(/^This nickname is registered/i.test(msg) && pass){
				this.send('PRIVMSG NickServ :IDENTIFY ', nick, ' ', pass);
			}
		}
	}

	this.on('NOTICE', authd);

	sendNick(nick,cb,authd);
}

module.exports = {
	timeout: 10000,
	__irc: function(client){
		var nick;
		var setNick = (function(n){
			if(n==nick) return;
			nick=n;
			this.emit('nick', nick);
		})
		.bind(client);

		client.identify = function (new_nick, pass, cb) {
			if(!(new_nick && pass)) return;
			auth.call(this, new_nick, pass, cb);
		}

		client.nick = function (new_nick, pass, cb) {
			if(!new_nick) return nick;
			if(pass) client.identify(new_nick, pass, cb);
			else sendNick.call(this, new_nick, cb);
		}

		client.on('NICK', function (event) {
			if(event.nick===nick)
				setNick(event.params[0]);
		});

		client.once('RPL_WELCOME', function(event) {
			setNick(event.params[0]);
		});

		client.on('NOTICE', function (event) {
			var nick = event.params[0];
			if(/^You are now identified/i.test(event.params[1])){
				setNick(nick);
				this.emit('identified', nick);
			}
		});
	}
}
