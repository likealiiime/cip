CIApplication.addEvent(CIEvent.ApplicationReady, function() {
	var button0 = new EXButton({
		frame: { width: 75 },
		label: 'Button',
		description: "Don't bother clicking me",
		Clicked: function() { alert('I don\'t do anything'); }
	});
	button0.element('button0');
	
	var button1 = new EXButton({
		frame: { width: 150 },
		label: 'Hola, Mundo!',
		description: "Ver la información de mi tamaño",
		subviews: [ new EXIcon({ src: 'images/spanish.png', description: 'Español' }) ],
		Clicked: function() { alert('I am 150 pixels wide.'); }
	});
	button1.element('button1');
	
	var button3 = new EXButton({
		frame: { width: CIRect.WidthOfView(button2).plus(150) },
		label: 'Hallo, Welt!',
		description: "Siehe meine Größe Informationen",
		subviews: [ new EXIcon({ src: 'images/german.png', description: 'Deutsch' }) ],
		Clicked: function() { alert('I am the width of the second button plus 150 pixels.') },
		resizable: true
	});
	button3.element('button3');
	
	var button2 = new EXButton({
		frame: { width: CIRect.WidthOfWindow().dividedBy(2) },
		label: 'Bonjour, le monde!',
		description: "Voir mes informations de taille",
		subviews: [ new EXIcon({ src: 'images/french.png', description: 'Français' }) ],
		Clicked: function() { alert('I am the width of the window divided by 2.'); },
		resizable: true
	});
	button2.element('button2');
	
	var button4 = new EXButton({
		frame: { width: CIRect.WidthOfWindow().minus(209) },
		label: 'Hola, Mundo &mdash; Bonjour, le monde &mdash; Hallo, Welt &mdash; Hello, World!',
		description: "See my size information",
		subviews: [
			new EXIcon({ src: 'images/spanish.png', description: 'Español' }),
			new EXIcon({ src: 'images/french.png', description: 'Français' }),
			new EXIcon({ src: 'images/german.png', description: 'Deutsch' }),
			new EXIcon({ src: 'images/american.png', description: 'English' })
		],
		Clicked: function() { alert(' I am the width of the window minus 209 pixels for the margin, padding, and border.') },
		resizable: true
	});
	button4.element('button4');
});

var EXButton = new Class({
	Extends: CIView,
	
	initialize: function(configuration) {
		this.parent(configuration);
		this.isA('EXButton');
		this.synthesize([
			'label', 'description'
		], configuration);
	},
	_makeElement: function(parent) {
		var button = new Element('div',
			this._objectForViewBaseElement()
		);
		parent.adopt(button);
		var div = new Element('div')
		button.adopt(div);
		this.subviews.each(function(v) { console.log(v.element(div)); });
		button.adopt(new Element('span'));
		button.addEvent('click',
			this._clicked.bind(this)
		);
		this.render();
		return button;
	},
	unrender: function() {
		this.subviews.each(function(v) { v.unrender(); });
		this.element().set('title', '');
		this.element().getFirst('span').set('html', '');
		this.fireEvent(CIEvent.Unrendered);
	},
	render: function() {
		this.unrender();
		this.subviews.each(function(v) { v.render(); });
		this.element().set('title', this.description);
		this.element().getFirst('span').set(
			'html', this.label
		);
		this.fireEvent(CIEvent.Rendered);
	},
	_clicked: function(event) {
		this.fireEvent(CIEvent.Clicked, event);
	}
});

var EXIcon = new Class({
	Extends: CIView,
	
	initialize: function(configuration) {
		this.parent(configuration);
		this.isA('EXButton');
		this.synthesize(['src', 'description'], configuration);
	},
	_makeElement: function(parent) {
		var icon = new Element('img', {
			'class': 'EXIcon',
			'id': this.id
		});
		parent.adopt(icon);
		this.render();
		return icon;
	},
	unrender: function() {
		this.element().set({
			src: '',
			title: '',
			alt: ''
		});
		this.fireEvent(CIEvent.Unrendered);
	},
	render: function() {
		this.element().set({
			src: this.src,
			title: this.description,
			alt: this.description
		});
		this.fireEvent(CIEvent.Rendered);
	}
});