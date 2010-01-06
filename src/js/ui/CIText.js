/*
	Class: CIText
	A simple wrapper class. It wraps a <p> Element
	
	Properties:
		id - String like CIText_#
		html - String. The innerHTML of the Element
*/
var CIText = new Class({
	Extends: CIView,
	
	/*
		Constructor: initialize(configuration)
		
		Configuration:
			CIText may be configured with just a string of the innerHTML or a Hash:
			html - String. The innerHTML to store
	*/
	initialize: function(options) {
		this.parent(options);
		this.isA('CIText');
		
		if ($type(options) == 'string' || ($type(options) == false))
			this.text = options
		else
			this.text = options.html || options.text || '';
	},
	
	setText: function(newText) {
		this.set('text', newText);
		if (this.element()) this.element().set('html', this.text);
	},
	
	/*	Function: _makeElement(parent)
		Parent adopts Element */
	_makeElement: function(parent) {
		var p = new Element('p', {
			id: this.id,
			styles: this.cssStyles,
			'class': 'CIText ' + this.cssClass,
			html: this.text
		});
		parent.adopt(p);
		return p;
	}
});