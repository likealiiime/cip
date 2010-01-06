var CIMenuItem = new Class({
	Extends: CITitle,
	
	initialize: function(configuration) {
		this.parent(configuration);
		this.isA('CIMenuItem');
		this.synthesize({
			style: CIMenuItem.Style,
			menu: null,
			value: null
		}, configuration);
	},
	
	_makeElement: function(parent) {
		var title = this.parent(parent);
		title.addEvent('mouseenter', this._mouseEntered.bind(this));
		title.addEvent('mouseleave', this._mouseLeft.bind(this));
		title.addEvent('click', this._clicked.bind(this));
		return title;
	},
	
	_mouseEntered: function(event) {
		this.fireEvent(CIEvent.MousedOver, [event]);
		CISelectionStyle.select(this.element());
	},
	
	_mouseLeft: function(event) {
		this.fireEvent(CIEvent.MousedOut, [event]);
		CISelectionStyle.unselect(this.element());
	},
	
	_clicked: function(event) {
		this.fireEvent(CIEvent.Clicked, [event]);
		CISelectionStyle.unselect(this.element());
		(function() { CISelectionStyle.select(this);   }).delay(50, this.element());
		(function() { CISelectionStyle.unselect(this); }).delay(150, this.element());
		if (this.menu) (function() {
			this.menu.selectSubview(this);
			this.menu.hide();
		}).delay(150, this);
	}
});
CIMenuItem.Style = new CIStyle({
	borderSize: 0,
	textSize: '0.9em',
	padding: 3,
	gap: 0
});