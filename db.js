var mongoose = require('mongoose');
var card = require('./schemas/card.js');

db = function() {
	this.db;
	this.connected = false;
	this.connect();
}

db.prototype.connect = function() {
	var _self = this;
	mongoose.connect('mongodb://localhost:27017/yugioh');
	this.db = mongoose.connection;
	this.db.on('error', function() {
		console.error.bind(console, 'connection error: ');
		_self.connected = false;
		//_self.connect(cb);
	});
	this.db.on('open', function(_cb) {
		_self.connected = true;
	});
};

db.prototype.getCard = function(name,cb) {
	card.model.findOne({name: new RegExp(name, "i")}).exec(cb);
}

db.prototype.saveCard = function(name,data,cb) {
	var d = { name: data[0] };

	if (typeof data[1] === 'undefined') {
		d.rarity = 'C';
	} else {
		switch(data[1].toLowerCase()) {
			case 'rare':
				d.rarity = 'R';
				break;
			case 'superrare':
				d.rarity = 'S';
				break;
			default:
				d.rarity = 'C';
				break;
		}
	}

	d.source = name;
	card.model.update({ name: d.name }, {$set: { rarity: d.rarity, source: d.source, date: Date.now() }}, {upsert: true}, cb);
}

module.exports = new db();