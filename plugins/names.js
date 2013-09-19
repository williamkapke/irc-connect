function names(channel){
	this.send(channel? 'NAMES '+channel : 'NAMES');
}

function end(event) {
	if(!event)
		return this.emit('names', 'timeout', null, channel);

	var names = this.__names;
	delete this.__names;
	this.emit('names', null, names);
}

function reply(event){
	if(!this.__names) this.__names = {};
	var names = this.__names;
	var chan = event.params[2].toLowerCase();

	chan = names[chan] || (names[chan] = []);
	chan.push.apply(chan, event.params[3].split(' '));
}

exports = module.exports = {
	names: function(client, channel, cb) {
		names.call(client, channel, cb);
	},
	__irc: function(client){
		client.names = names.bind(client);
		client.on('RPL_NAMREPLY', reply);
		client.on('RPL_ENDOFNAMES', end);
	}
}
