
module.exports = {
	__irc: function(client){
		client.on('PING', function(event){
			if(event.command==='PING'){
				this.send('PONG ' + event.params[0]);
			}
		});
	}
}