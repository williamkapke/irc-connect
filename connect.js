
var reply = require('irc-replies');
var eachline = require("eachline");
var net = require('net');
var EventEmitter = require("events").EventEmitter;
var debug = require("debug")('irc:connect');
debug.out = require("debug")('irc:connect-out');
debug.raw = require("debug")('irc:connect-raw');
debug.parsed = require("debug")('irc:connect-parsed');

function writeline(){
	if(debug.out.enabled) debug.out(Array.prototype.join.call(arguments, ''));
	for(var i=0;i<arguments.length;i++)
		this.write(arguments[i]);
	this.write('\n');
}

function name(m) {
	if(!m) return m;
	var msg = {};
	for(var i=1;i<arguments.length;i++){
		if(m[i]) msg[arguments[i]] = m[i];
	}
	return msg;
}

var irc = module.exports = {
	connect: function(host, options){
		if(!options) options = {};
		if(!options.port) options.port = 6667;
		options.host = host;

		var client = new EventEmitter();
		client.use = function(handler){
			handler.__irc(this);
			return this;
		}

		client.socket = net.connect(options, function() {
			client.writeline = writeline.bind(this);
			debug('Client connected');
			client.emit('connect');
		})
		.on('close', function (data) {
			debug('Disconnected from server');
			client.emit('close');
		})
		.on('error', function (err) {
			debug(err);
			client.emit('error', err);
		});

		eachline(client.socket, function(data){
			debug.raw(data);
			//http://mybuddymichael.com/writings/a-regular-expression-for-irc-messages.html
			var m = /^(?:[:](\S+) )?(\S+)(?: (?!:)(.+?))?(?: [:](.+))?$/.exec(data);

			if(!m){
				return console.error('unmatched data:\n'+data);
			}

			var event = name(m, 'prefix', 'command', 'target', 'data');
			var code = reply.number[event.command];
			if(code) event.command = code;

			if(debug.parsed.enabled)
				debug.parsed(JSON.stringify(event));

			client.emit(event.command, event);
			client.emit('*', event);
		});
		return client;
	},
	pong: function(event){
		if(event.command==='PING'){
			this.writeline('PONG ' + event.data);
		}
	},
	authenticate: function(nick, pass, name){
		var fn = function () {
			if(nick) {
				function authd(data) {
					if(data.target===nick && /^You are now identified/i.test(data.data)){
						this.removeListener('NOTICE', authd);
						this.emit('authenticated', true, data.target);
					}
				}
				this.on('NOTICE', authd);

				function error(data){
					this.removeListener('ERR_NONICKNAMEGIVEN', error);
					this.removeListener('ERR_ERRONEUSNICKNAME', error);
					this.removeListener('ERR_NICKNAMEINUSE', error);
					this.removeListener('ERR_NICKCOLLISION', error);
					this.emit('authenticated', data.command);
				}
				this.once('ERR_NONICKNAMEGIVEN', error);
				this.once('ERR_ERRONEUSNICKNAME', error);
				this.once('ERR_NICKNAMEINUSE', error);
				this.once('ERR_NICKCOLLISION', error);

				if(pass) this.writeline('PASS ',pass);
				this.writeline('NICK ',nick);
				if(name) this.writeline('USER ', nick, ' 0 * :', name);
			}
		};
		fn.__irc = function(client){
			client.on('connect', fn)
		};
		return fn;
	}
}
irc.pong.__irc = function(client){
	client.on('PING', irc.pong)
};

