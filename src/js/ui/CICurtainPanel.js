/*
	Class: CICurtainPanel
	A sliding panel with a 'curtain' and a 'drawer.' The drawer slides under the curtain.
	
	Properties:
		id - String like CICurtainPanel_#
		_contentEl - Element. The drawer Element
		
		*See configuration for others*
		
	Events:
		
*/
// TODO rename to CIDrawerPanel?
// TODO support Clicked, Showing, Shown, Hiding, Hidden, Changed
// TODO refactor 'content' concept to 'drawer'
var CICurtainPanel = new Class({
	Extends: CIView,
	
	/*
		Constructor: initialize(configuration)
		
		label - String. The HTML to show on the curtain. Default 'Click to reveal.'
		content - CIObject. The content of the drawer
		contentClass - String. The CSS class to apply to the drawer container
		contentStyles - Hash. The CSS styles to apply to the drawer container
		openState - String. How the curtain should start out. Accepts 'reveal' or 'conceal'. Default 'conceal'
	*/
	initialize: function(options) {
		this.parent(options);
		this.isA('CICurtainPanel');
		this.label = options.label || 'Click to reveal.';
		this.content = options.content;
		this.aggressive = options.aggressive || false;
		this.contentClass = options.contentClass || '';
		this.contentStyles = CIObject.interpretStyles(options.contentStyles);
		this.openState = options.openState;
		this.addEvent(CIEvent.AddedToDom, function(element) {
			if (this.openState) this[this.openState]();
		}.bind(this));
	},
	
	/*	Function: _makeElement(parent)
		Parent adopts Element
	*/
	_makeElement: function(parent) {
		var panel = new Element('div', {
			id: this.id,
			'class': 'CICurtainPanel ' + this.cssClass,
			// panelStyles override styles set here
			styles: new Hash({
				width: this.width || 150
			}).extend(this.cssStyles).getClean()
		});
		
		parent.adopt(panel);
		// Create the curtain
		var text = new Element('p', {
			html: this.label,
			'class': 'CICurtainPanelLabel'
		});
		text.addEvent('click', function() {
			this.toggle();
		}.bind(this));
		panel.adopt(text);
		
		// Add the content, which must be a single CIObject
		this._contentEl = new Element('div', {
			'class': 'CICurtainPanelBody ' + this.contentClass,
			styles: this.contentStyles
		});
		panel.adopt(this._contentEl);
		this.content.element(this._contentEl);
		this._contentEl.set('slide', { duration: 300, transition: Fx.Transitions.Back.easeOut });
		this._contentEl.slide('hide');
		
		return panel;
	},
	
	/*
		Function: reveal()
		Reveal the drawer
		
		Returns:
			This CICurtainPanel
	*/
	reveal: function() {
		this._contentEl.slide('in');
		return this;
	},
	
	/*
		Function: conceal()
		Conceal the drawer
		
		Returns:
			This CICurtainPanel
	*/
	conceal: function() {
		this._contentEl.slide('out');
		return this;
	},
	
	/*
		Function: toggle()
		Toggle the drawer
		
		Returns:
			This CICurtainPanel
	*/
	toggle: function() {
		this._contentEl.slide('toggle');
		return this;
	},
	
	/*
		Funtion: setLabel(newLabel)
		Set the curtain's label
		
		Returns:
			This CICurtainPanel
	*/
	setLabel: function(newLabel) {
		this.label = newLabel;
		var p = this.element().getChildren('.CICurtainPanelLabel')[0];
		p.set('html', this.label);
	},
	
	/*
		Function: contentElement()
		Retrieve the drawer container element
		
		Returns:
			Element
	*/
	contentElement: function() {
		return this._contentEl;
	}
});