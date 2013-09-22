
var debug = require("debug")('irc:names');

exports = module.exports = {
	names: function(client, channel, cb) {
		names.call(client, channel, cb);
	},
	__irc: function(client){
		client.names = names.bind(client);
		client
			.on('QUIT', onquit)
			.on('JOIN', onjoin)
			.on('PART', onpart)
			.on('NICK', onnick)
			.on('RPL_NAMREPLY', reply)
			.on('RPL_ENDOFNAMES', end)
		;
	}
}

function names(channel){
	this.send(channel? 'NAMES '+channel : 'NAMES');
}

function end(event) {
	var cname = event.params[1].toLowerCase();
	var names = this.__names[cname];
	debug('end', cname, names.length);
	delete this.__names[cname];
	var old = this.names[cname];
	if(old)
		names.forEach(function (name) {
			if(!~old.indexOf(name))
				console.log('############################################ phantom: ', name);
		});
	this.names[cname] = names;
	this.emit('names', cname, names);
}

function reply(event){
	if(!this.__names) this.__names = {};
	var cname = event.params[2].toLowerCase();
	var names = this.__names[cname];
	if(!names){
		debug('new list', cname);
		names = this.__names[cname] = [];
	}
	var param = event.params[3];
	names.push.apply(names, param.split(' '));
	debug('added', cname, param, names.length);
}

function onpart(event) {
	var who = event.nick;
	var cname = event.params[0].toLowerCase();
	var names = this.names[cname];
	debug('PART', cname, who);
	removeName(who, names);
}

function onnick(event) {
	var who = event.nick;
	var new_nick = event.params[0];
	var names = this.names;
	debug('NICK', who, new_nick);

	Object.keys(names).forEach(function (cname) {
		removeName(who, names[cname], new_nick);
	});
}

function onquit(event){
	var who = event.nick;
	var names = this.names;
	debug('QUIT', who);

	Object.keys(names).forEach(function (cname) {
		removeName(who, names[cname]);
	});
}

function removeName(old_nick, names, new_nick) {
	var idx = names.indexOf(old_nick);
	if(~idx) {
		if(new_nick)
			names[idx] = new_nick;
		else names.splice(idx, 1);
	}
}

function onjoin(event){
	var who = event.nick;
	var isYou = who===this.nick();
	var cname = event.params[0].toLowerCase();
	debug('JOIN', cname, who);
	if(isYou) return;

	var names = this.names[cname];
	if(names[who])
		channel.debug('attempt to add duplicate name: ' + who);
	else
		names.push(who);
}
