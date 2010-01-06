/*
	Class: CIToolbar
	Represents a toolbar attached to another component
	
	Properties
	 	id - String like CIToolbar_#
		content - Array. The CIObjects in the toolbar
*/
var CIToolbar = new Class({
	Extends: CIView,
	
	/*
		Constructor: initialize(configuration)
		Accepts an array of items to render inside the toolbar
	*/
	initialize: function(configuration) {
		this.parent(configuration);
		this.isA('CIToolbar');
		this.synthesize(['style', 'content']);
		if ($type(configuration) == 'array') {
			this.style = CIToolbar.Style;
			this.setSubviews(configuration);
		} else {
			this.synthesize({
				style: CIToolbar.Style,
				subviews: []
			}, configuration);
		}
		this.frame.width = CIRect.WidthOfSuperview().minus(function() { return this.style.getInt('padding') * 2; }.bind(this));
		this.frame.height = this.frame.height || 18;
	},
	
	/*
		Function: isEmpty()
		Returns whether this toolbar contains any items or not
		
		Returns:
			Boolean
	*/
	isEmpty: function() { return this.subviews.length == 0; },
	
	/*	Function: _makeElement(parent)
		Parent adopts Element
	*/
	_makeElement: function(parent) {
		var toolbar = new Element('div', {
			id: this.id,
			'class': 'CIToolbar'
		});
		parent.adopt(toolbar);
		
		this.render();
		return toolbar;
	},
	
	render: function() {
		if (!this.element()) return;
		this.unrender();
		
		var container = this.element();
		if (this.isEmpty())
			container.hide();
		else
			container.show();
		this.subviews.each(function(view, index) {
			var e = view.element(container);
			e.setStyle('float', 'left');
			if (index != 0) e.setStyle('margin-left', this.style.getInt('gap'));
		}.bind(this));
		
		this._viewResized();
		this.applyStyle();
		this.fireEvent(CIEvent.Rendered);
	},
	
	applyStyle: function(style) {
		var style = style || this.style || CIToolbar.Style;
		var elem = this.element();
		if (!elem) return;
		elem.setStyles({
			'background-color': style.get('backgroundColor'),
			'padding': style.getInt('padding')
		});
		style.applyBordersOntoElement('solid', elem);
		style.applyBordersOntoElement('dotted', elem);
	},
	
	/*
		Function: addItemToLeft(item)
		Adds item as the first index to CIToolbar's content array and renders it
		
		Returns:
			This CIToolbar
	*/
	addItemToLeft: function(view) {
		this.subviews.unshift(view);
		view.element(this.element());
		return this;
	}
});

CIToolbar.Style = new CIStyle({
	backgroundColor: CIStyle.BackgroundColor,
	padding: 5,
	solidBorders: CIStyle.Left | CIStyle.Right | CIStyle.Bottom,
	borderColor: CIStyle.BorderColor,
	borderSize: 1,
	gap: 10
});