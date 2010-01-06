/*
	Class: CIPanelBase
	The abstract base for CIVPanel and CIHPanel
	
	Properties:
		id - String like CIPanelBase_#. Should be overwritten by subclass
		children - Array. The content of the panel. See content configuration
		*See configuration for others*
*/
// TODO rename children to content
// TODO add cssClass to inner childrenn
var CIPanelBase = new Class({
	Extends: CIView,
	
	/*
		Constructor: initialize(configuration)
		May be an Array of content, nothing, or a Hash
		
		Configuration:
			content - Array. The content of the panel. Each item in the array may be the CIObject to add, or a Hash with keys: cssStyles, cssClass, valign, and content, with content being the CIObject. Default []
			padding - Number. The padding inside each child. Default 0
			spacing - Number. The spacing between each child. Default 0
	*/
	initialize: function(options) {
		this.parent(options);
		this.isA('CIPanelBase');
		
		if ($type(options) == 'object') {
			this.children = options.children || options.content || [];
			this.padding = options.padding || 0;
			this.spacing = options.spacing || 0;
			return this;
		} else if ($type(options) == 'array')
			this.children = $splat(options);
		else
			this.children = [];
			
		this.padding = 0;
		this.spacing = 0;
	},
	_makeElement: function(parent) {
		console.error('Cannot add a CIPanelBase to the DOM; it is abstract.');
		return null;
	}
});

/*
	Class: CIHPanel
	A panel with content oriented horizontally, right to left. Extends CIPanelBase
	
	Properties:
		id - String like CIHPanel_#
		
		*See <CIPanelBase.initialize()> and configuration below for others*
*/
var CIHPanel = new Class({
	Extends: CIPanelBase,
	
	/*
		Constructor: initialize(configuration)
		
		Configuration:
			valign - String. The vertical alignment of the content: 'top', 'middle', or 'bottom'. Default 'top'
			
		See:
			<CIPanelBase.initialize()>
	*/
	initialize: function(options) {
		this.parent(options);
		this.isA('CIHPanel');
		this.valign = options ? options.valign : 'top';
	},
	
	_makeElement: function(parent) {
		var table = new Element('table', {
			id: this.id,
			'class': 'CIPanelBase CIHBox ' + this.cssClass,
			cellpadding: this.padding,
			cellspacing: this.spacing,
			styles: this.frame.toCssStylesObject()
		});
		parent.adopt(table);
		var tr = new Element('tr');
		table.adopt(tr);
		this.children.each(function(child) {
			if (child.objectId) child = { content: child };
			var td = new Element('td', {
				valign: child.valign || this.valign || 'top',
				styles: CIObject.interpretStyles(child.cssStyles)
			});
			tr.adopt(td);
			child.content.superview = this;
			child.content.element(td);
		}.bind(this));
		
		return table;
	}
});

/*
	Class: CIVPanel
	A panel with content oriented vertically, top to bottom. Extends CIPanelBase
	
	Properties:
		id - String like CIVPanel_#
		
		*See <CIPanelBase.initialize()> and configuration below for others*
*/
var CIVPanel = new Class({
	Extends: CIPanelBase,
	
	/*
		Constructor: initialize(configuration)
		
		See:
			<CIPanelBase.initialize()>
	*/
	initialize: function(options) {
		this.parent(options);
		this.isA('CIVPanel');
	},
	
	_makeElement: function(parent) {
		var table = new Element('table', {
			id: this.id,
			'class': 'CIPanelBase CIVBox ' + this.cssClass,
			cellpadding: this.padding,
			cellspacing: this.spacing,
			styles: this.cssStyles
		});
		parent.adopt(table);
		this.children.each(function(child) {
			if (child.objectId) child = { content: child };
			var tr = new Element('tr');
			table.adopt(tr);
			var td = new Element('td', {
				valign: child.valign || 'top',
				styles: CIObject.interpretStyles(child.cssStyles)
			});
			tr.adopt(td);
			child.content.element(td);
		});
		
		return table;
	}
});

var CIVFlow = new Class({
	Extends: CIView,
	
	initialize: function(options) {
		this.parent(options);
		this.isA('CIVFlow');
		this.synthesize({
			style: CIVFlow.Style,
			subviews: []
		}, options);
		this.setSubviews(this.subviews);
	},
	
	_makeElement: function(parent) {
		/*var table = new Element('table', {
			id: this.id,
			'class': 'CIVFlow',
			styles: this.frame.toCssStylesObject()
		});*/
		var flow = new Element('div', {
			id: this.id,
			'class': 'CIVFlow',
			styles: this.frame.toCssStylesObject()
		})
		parent.adopt(flow);

		this.render();
		return flow;
	},
	
	applyStyle: function(newStyle) {
		var style = newStyle || this.style || CIVFlow.Style;
		var flow = this.element();
		if (!flow) return;
		flow.setStyles({
			padding: style.getInt('padding'),
			margin: style.getInt('margin')
		});
	},
	
	unrender: function() {
		if (!this.element()) return null;
		this.element().empty();
		this.fireEvent(CIEvent.Unrendered);
		return this;
	},
	
	render: function() {
		if (!this.element()) return null;
		this.unrender();
		
		var flow = this.element();
		this.subviews.each(function(view) {
			//view.superview = this;
			view.element(flow);
		}.bind(this));
		/*
		var table = this.element();
		this.applyStyle();
		this.subviews.each(function(view) {
			var tr = new Element('tr');
			table.adopt(tr);
			var td = new Element('td', {
				valign: (this.style || CIVFlow.Style).get('valign')
			});
			tr.adopt(td);
			view.superview = this;
			view.element(td);
		}.bind(this));*/
		
		this.applyStyle();
		this.fireEvent(CIEvent.Rendered);
		return this;
	}
});
CIVFlow.Style = new CIStyle({
	padding: 0,
	spacing: 0,
	margin: 0,
	valign: 'top'
});