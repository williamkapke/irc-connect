
var reply = require('irc-replies');
var eachline = require("eachline");
var net = require('net');
var Consumer = require("consumer");
var EventEmitter = require("events").EventEmitter;

var debug = require("debug")('irc:connect');
debug.out = require("debug")('irc:connect-out');
debug.raw = require("debug")('irc:connect-raw');
debug.parsed = require("debug")('irc:connect-parsed');

function send(){
	if(debug.out.enabled) debug.out(Array.prototype.join.call(arguments, ''));
	for(var i=0;i<arguments.length;i++)
		this.write(arguments[i]);
	this.write('\n');
}

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

	if(c.peek(1)===':')
		return c.advance(2).consume(/.+/g);
	if(length===14)
		return c.advance(1).consume(/.+/g);

	return c.advance(1).consume(/[^\0\r\n ][^\0\r\n :]*/g);
}


var irc = module.exports = {
	_temp:function () {
		return ('node'+ (+new Date+'').substr(-5));
	},
	connect: function(host, options){
		if(typeof options==='string')
			options = { name: options };
		else if(!options) options = {};

		if(!options.port) options.port = 6667;
		options.host = host;

		var client = new EventEmitter();
		client.support = {};

		client.use = function(){
			for(var i=0;i<arguments.length;i++)
				arguments[i].__irc(this);
			return this;
		}

		client.socket = net.connect(options, function() {
			client.send = send.bind(this);
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

		client.once('connect', function onconnect() {
			var temp = irc._temp();
			this.send('NICK ', temp);
			this.send('USER irc-connet 0 * :', options.name||'irc-connect user');
		});
		client.use(require('./nick'));


		eachline(client.socket, function(data){
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

			client.emit(event.command, event);
			client.emit('data', event, data);
		});
		return client;
	},
	parse: parse,
	get pong(){ return require('./plugins/pong') },
	get names(){ return require('./plugins/names') },
	get motd(){ return require('./plugins/motd') }
}
