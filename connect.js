var reply = require('irc-replies');
var eachline = require("eachline");
var net = require('net');
var Consumer = require("consumer");
var EventEmitter = require("events").EventEmitter;

var debug = require("debug")('irc:connect');
debug.out = require("debug")('irc:connect-out');
debug.raw = require("debug")('irc:connect-raw');
debug.parsed = require("debug")('irc:connect-parsed');

function prefix(c){
	if(c.current!==':') return;

	var p = {
		nick: c.advance(1).consume(/[^ !]+/g)[0]
	}
	if(c.current==='!'){
		p.user = c.advance(1).consume(/[^ @]+/g)[0];
		if(c.current==='@'){
			p.host = c.advance(1).consume(/[^ ]+/g)[0];
		}
	}
	c.consume(/ +/g);
	return p;
}

function parse(line){
	var c = new Consumer(line);

	//prefix
	var event = prefix(c) || {};

	//command
	event.command = c.consume(/\d{3}|[a-zA-Z]+/g)[0];

	//params
	var p, params = event.params = [];
	while(p = getParam(c, params.length)){
		params.push(p[0]);
	}

	return event;
}

function getParam(c, length){
	if(c.current!==' ') return;
	c.advance(1);

	if(c.current===':')
		return c.advance(1).done? [''] : c.consume(/.+/g);
	if(length===14)
		return c.consume(/.+/g);

	return c.consume(/[^ ]*/g);
}

function Client(){
	EventEmitter.call(this);

	this.connected = false;
	this.support = {};
	this.use(require('./nick'));
}
Client.prototype = {
	constructor: Client,
	use: function(){
		for(var i=0;i<arguments.length;i++)
			arguments[i].__irc(this);
		return this;
	},
	connect: function(host, options){
		if(typeof options==='string')
			options = { name: options };
		else if(!options) options = {};

		if(!options.port) options.port = 6667;
		options.host = host;

		var client = this;
		client.socket = net.connect(options, function() {
			client.connected = true;
			client.write = this.write.bind(this);
			debug('Client connected');

			var temp = irc._temp();
			client.send('NICK ', temp);
			client.send('USER irc-cnct 0 * :', options.name||'irc-connect user');

			client.emit('connect');
		})
		.on('close', function (data) {
			client.connected = false;
			debug('Disconnected from server');
			client.emit('close');
		})
		.on('error', function (err) {
			debug(err);
			client.emit('error', err);
		});

		client.once('RPL_WELCOME', function(event) {
			this.emit('welcome', event.params[1]);
		});

		eachline(client.socket, client.ondata.bind(client));
		return client;
	},
	send: function send(){
		if(!this.connected) return;
		if(debug.out.enabled) debug.out(Array.prototype.join.call(arguments, ''));
		for(var i=0;i<arguments.length;i++)
			this.write(arguments[i]);
		this.write('\n');
	},
	quit: function(msg){
		this.send('QUIT :' + (msg||''));
	},
	ondata: function(data){
		if(!data.length) return;
		debug.raw(data);
		var event = parse(data);

		if(!event){
			return console.error('unmatched data:\n'+data);
		}

		var code = reply[event.command];
		if(code) event.command = code;

		if(debug.parsed.enabled)
			debug.parsed(JSON.stringify(event));

		this.emit(event.command, event);
		this.emit('data', event, data);
	}
}
Client.prototype.__proto__ = EventEmitter.prototype;

var irc = module.exports = {
	_temp:function () {
		return ('node'+ (+new Date+'').substr(-5));
	},
	Client: Client,
	connect: function(host, options){
		var client = new Client();
		client.connect(host, options);
		return client;
	},
	parse: parse,
	get pong(){ return require('./plugins/pong') },
	get names(){ return require('./plugins/names') },
	get motd(){ return require('./plugins/motd') }
}
