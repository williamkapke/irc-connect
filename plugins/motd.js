
module.exports = {
	__irc: function(client){
		client.on('RPL_ISUPPORT', function (event) {
			event.params.forEach(function (param, i) {
				if(!i) return;
				param = param.split('=');
				client.support[param[0]] = param[1]||true;
			});
		});

		client.once('RPL_MOTDSTART', function (event) {
			this.motd = event.params[1];
		});
		function motd(event) {
			this.motd += event.params[1] + '\n';
		}
		client.on('RPL_MOTD', motd);
		client.once('RPL_ENDOFMOTD', function (event) {
			client.removeListener('RPL_MOTD', motd);
			this.emit('motd', this.motd);
		});
	}
}