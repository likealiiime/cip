var DogWalker = new Class({
	Extends: CIObject,
	initialize: function(name) {
		this.parent();
		this.isA('DogWalker');
		this.synthesize({ name: name, paces: 0 });
		this.addEvent(CIEvent.PropertyChanged, this._pacesChanged);
	},
	_pacesChanged: function(property, newValue, oldValue) {
		if (property == 'paces')
			console.log(this.name + ' is now at ' + this.paces + ' paces');
	},
	step: function() { this.setPaces(this.paces + 1); return this; }
});
var Dog = new Class({
	Extends: CIObject,
	initialize: function(name) {
		this.parent();
		this.isA('Dog');
		this.synthesize({ name: name, paces: 0, walker: null });
		this._boundEventHandler = this._walkerChanged.bind(this);
	},
	setWalker: function(newWalker) {
		if (this.walker) {
			this.walker.removeEvent(CIEvent.PropertyChanged, this._boundEventHandler);
			console.log(this.name + ' will no longer be walked by ' + this.walker.getName());
		}
		this.set('walker', newWalker);
		console.log(this.name + ' will now be walked by ' + this.walker.name);
		this.walker.addEvent(CIEvent.PropertyChanged, this._boundEventHandler);
		this.setPaces(this.walker.getPaces() + 5);
	},
	setPaces: function(newPaces) {
		this.set('paces', newPaces);
		console.log(this.name + ' is now at ' + this.paces + ' paces');
	},
	_walkerChanged: function(property, newValue, oldValue) {
		if (property == 'paces') this.setPaces(newValue + 5);
	}
});

var joe = new DogWalker('Joe');
var kathy = new DogWalker('Kathy');
joe.setPaces(5);
kathy.setPaces(15);
var fido = new Dog('Fido');

fido.setWalker(joe);
joe.step().step();
fido.setWalker(kathy);
joe.step();