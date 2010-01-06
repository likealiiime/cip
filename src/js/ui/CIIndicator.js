var CIIndicator = new Class({
	Extends: CIView,
	
	initialize: function(configuration) {
		configuration = configuration || {};
		this.parent(configuration);
		this.isA('CIIndicator');
		this.alt = configuration.alt || 'Working...';
		this.style = configuration.style || CIIndicator.Style;
	},
	
	_makeElement: function(parent) {
		var container = new Element('div', {
			id: this.id,
			'class': 'CIIndicator ' + this.cssClass,
			styles: this.cssStyles
		});
		container.setStyle('display', 'none');
		parent.adopt(container);
		this._imageElement = new Element('img', {
			src: this.style.get('image'),
			alt: this.alt,
			title: this.alt
		});
		container.adopt(this._imageElement);
		
		this._applyStyle();
		return container;
	},
	
	_applyStyle: function(newStyle) {
		if (!this.element()) return;
		var style = newStyle || this.style;
		this._imageElement.src = style.get('image');
		this.element().setStyles({
			width: style.get('width') || 'auto',
			height: style.get('height') || 'auto'
		});
		
		return this;
	}
});