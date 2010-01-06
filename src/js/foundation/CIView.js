/*
	File: CIView.js
	A CIView is a generic visual component
*/

/*
	Class: CIView
	CIView is CIP's generic visual component. It combines almost every other foundation class. *Extends <CIObject>*.
	
	Properties:
		frame - *<CIRect>*. The dimensions of the view.
		subviews - *<Array>*. Other CIViews inside of this view that are updated by this view (their superview).
		style - *CIStyle*. The style rules for this view.
		resizable - *Boolean*. Whether this view is affected when the window is resized. Use with caution as resizing is an expensive operation!
*/
var CIView = new Class({
	Extends: CIObject,
	
	/*
		Constructor: initialize(configuration)
		
		Configuration:
			frame - *<CIRect>*. The dimensions of the view. Defaults to new CIRect().
			subviews - *<Array>*. Other CIViews inside of this view that are updated by this view (their superview). Defaults to empty Array [].
			style - *CIStyle*. The style rules for this view. Defaults to CIView.Style.
			resizable - *Boolean*. Whether this view is affected when the window is resized. Use with caution as resizing is an expensive operation! Defaults to false.
	*/
	initialize: function(configuration) {
		configuration = configuration || {}
		this.parent(configuration);
		this.isA('CIView');
		this.synthesize({
			frame: new CIRect(),
			subviews: [],
			style: CIView.Style,
			resizable: false,
			firstResponder: null
		}, configuration);
		this.setResizable(this.resizable);
		this.frame = new CIRect(configuration.frame);
		this.subviews = $splat(configuration.subviews);
		this.cssClass = configuration.cssClass || '';
		this.cssStyles = CIObject.interpretStyles(configuration.cssStyles);
		this.addEvent(CIEvent.Shown, function() {
			if (this.firstResponder && this.firstResponder.giveFocus) this.firstResponder.giveFocus();
		}.bind(this));
	},
	
	/*
		Function: setSubviews(newSubviews)
		This accessor override ensures subviews is an Array.
		
		Parameters:
			newSubviews - *Array*. The replacement subviews.
		
		Returns:
			This CIView
	*/
	setSubviews: function(newSubviews) {
		return this.set('subviews', $splat(newSubviews).clean());
	},
	
	/*
		Function: addSubview(newSubview)
		Add newSubview to the end of subviews (push)
		
		Parameters:
			newSubview - *<CIView>*. The subview to add to subviews.
			
		Returns:
			This CIView
	*/
	addSubview: function(newSubview) {
		this.subviews.push(newSubview);
		this.subviews = this.subviews.clean();
		return this;
	},
	
	/*
		Function: addSubviewToBeginning(newSubview)
		Push newSubview into the beginning of subviews (unshift).
		
		Parameters:
			newSubview - *<CIView>*. The subview to add to subviews.
			
		Returns:
			This CIView
	*/
	addSubviewToBeginning: function(newSubview) {
		this.subviews.unshift(newSubview);
		this.subviews = this.subviews.clean();
		return this;
	},
	
	/*
		Function: setResizable(isResizable)
		This accessor override manages the attachment of the resize event on the window.
		
		Parameters:
			isResizable - *Boolean*. Whether this view is affected by window resizing.
			
		Returns:
			This CIView
	*/
	setResizable: function(isResizable) {
		// this._windowResized is not defined at construction
		if (!this._boundWindowResizedFunction) this._boundWindowResizedFunction = this._windowResized.bind(this)
		this.set('resizable', isResizable);
		// We manage the event for performance
		if (this.resizable) {
			window.addEvent('resize', this._boundWindowResizedFunction);
		} else {
			window.removeEvent('resize', this._boundWindowResizedFunction);
		}
		return this;
	},
	
	
	_windowResized: function(event) {
		this.fireEvent(CIEvent.Resizing, [event]);
		this._viewResized();
		this.fireEvent(CIEvent.Resized, [event]);
	},
	
	/*
		Function: _viewResized(superview)
		This method may be overriden in CIView subclasses to implement custom resizing logic, though it usually does not need to be.
		It calculates the new view size by calling <CIRect.toCssStylesObject> on this view's frame, updates its Element, then
		calls _viewResized on its subviews, passing itself as the superview.
		
		Parameters:
			superview - *<CIView>*. This view's superview. The most ancestral view will not receive a superview.
	*/
	_viewResized: function(superview) {
		if (!$defined(this.element())) return;
		var newSize = this.frame.toCssStylesObject({}, superview);
		//console.log('Called ancestor _viewResized on ', this.id);

		this.element().setStyles(newSize);
		// subviews can be any subclass of Enumerable. Loop needs to be optimized
		if ($defined(this.subviews)) this.subviews.each(function(view) { view._viewResized(this); }.bind(this));
	},
	
	/* 
		Function: show()
		Show the CIView's Element in the window.
		
		Fires:
			- <CIEvent.Showing>
			- <CIEvent.Shown>
			
		Returns:
			This CIView
	*/
	show: function() {
		var elem = $(this.id);
		if (elem) {
			this.fireEvent(CIEvent.Showing);
			elem.show();
			this.fireEvent(CIEvent.Shown);
		}
		return this;
	},
	
	/* 
		Function: hide()
		Hide the CIView's Element in the window
		
		Fires:
			- <CIEvent.Hiding>
			- <CIEvent.Hidden>
			
		Returns:
			This CIView
	*/
	hide: function() {
		var elem = $(this.id);
		if (elem) {
			this.fireEvent(CIEvent.Hiding);
			elem.hide();
			this.fireEvent(CIEvent.Hidden);
		}
		return this;
	},
	
	/* 
		Function: toggle()
		Toggle the display of the CIView's Element using <CIView.show> and <CIView.hide>
		
		Returns:
			This CIView
	*/
	toggle: function() {
		var elem = $(this.id);
		if (elem && (elem.getStyle('display') == 'none'))
			return this.show();
		else if (elem)
			return this.hide();
	},
	
	_makeElement: function(parent) {
		styles = this.frame.toCssStylesObject();
		styles.position = 'relative';
		
		var view = new Element('div', {
			id: this.id,
			'class': 'CIView',
			'styles': styles
		});
		parent.adopt(view);
		
		this.render();
		return view;
	},
	
	/*
		Function: unrender()
		Remove this view's content from the window.
		
		Fires:
			<CIEvent.Unrendered>
		
		Returns:
			This CIVIew
	*/
	unrender: function() {
		if (!this.element()) return null;
		this.element().empty();
		this.fireEvent(CIEvent.Unrendered);
		return this;
	},
	
	/*
		Function: unrender()
		First calls unrender, then draws this view's content in the window by calling <CIObject.element> on its superviews,
		passing this view's Element as the parent Element.
		
		Fires:
			<CIEvent.Unrendered>
			<CIEvent.Rendered>
			
		Returns:
			This CIVIew
	*/
	render: function(newViews) {
		this.unrender();
		if (!this.element()) return null;
		this.subviews.each(function(view) {
			view.superview = this;
			view.element(this.element());
		}.bind(this));
		this._viewResized();
		this.fireEvent(CIEvent.Rendered);
	},
	
	getWidth: function() {
		if (this.frame.width) {
			return this.frame.getWidth();
		} else {
			return this.element() ? this.element.getWidth() : 0;
		}
	},
	getHeight: function() {
		if (this.frame.height) {
			return this.frame.getHeight();
		} else {
			return this.element() ? this.element().getHeight() : 0;
		}
	},
	
	/*
		Function: _objectForViewBaseElement: function(additional)
		Get an Object you can use as the HTML attributes Object for the base
		Element of a <CIView>. Includes id, class and styles. Pass an Object
		for additional attributes or to override the defaults. This is a
		convenience method so you don't forget to set these attributes when
		subclassing <CIView>.
		
		Parameters:
			additional - *Object*. Additional attributes with which to extend the attributes Object. You can also override the attributes Object using this Object.
		
		Returns:
			Object
	*/
	_objectForViewBaseElement: function(additional) {
		var o = {
			'id': this.id,
			'class': this.__className,
			'styles': this.frame.toCssStylesObject()
		};
		return $extend(o, $pick(additional, {}));
	}
});

CIView._zIndexCounter = 100;
/*
	Function: CIView.nextZIndex()
	Get the next highest z-index.
	
	Returns:
		Number
*/
CIView.nextZIndex = function() { return CIView._zIndexCounter++; }

/*
	Class: CIElement
	A wrapper around Mootools' Element that extends <CIView> for use within CIP. Has exact
	same constructor as Mootools.Element. *Extends <CIView>*.
	
	Properties (none are synthesized):
		tag - *String*. The HTML tag to create.
		config - *Object* or *Hash*. The HTML configuration.
*/
var CIElement = new Class({
	Extends: CIView,
	
	/*
		Constructor: initialize
		
		Parameters:
			tag - String. The HTML tag.
			config - Hash. The HTML configuration passed to Element
	*/
	initialize: function(tag, config) {
		this.parent(config);
		this.isA('CIElement');
		this.tag = tag;
		this.config = $extend({ id: this.id }, $pick(config, {}));
	},
	
	_makeElement: function(parent) {
		var elem = $H(this.config).getLength() > 0 ? new Element(this.tag, this.config) : new Element(this.tag);
		parent.adopt(elem);
		return elem;
	}
});

// Do a check for html here because if the html property is defined,
// the resulting HTML will be <tag></tag> instead of just <tag/> which
// will create DOM errors for elements like <br/> which cannot have even
// null children/innerHTML
/*
	Function: CIElement.make(tag, html)
	A shortcut function. The same as instantiating a new CIElement with its html property set to _html_.
	
	Returns:
		CIElement
		
	Example:
	(start code)
	new CIElement('p', { html: "Hello World" }) => <p>Hello World</p>
	CIElement.make('p', "Hello World") => <p>Hello World</p>
	CIElement.make('br') => <br/>
*/
CIElement.make = function(tag, html) { return new CIElement(tag, html ? { html: html } : {}); };

/*
	Function: $E(tag, html)
	A legacy shortcut for the shortcut function CIElement.make
*/
function $E(tag, html) { return CIElement.make(tag, html); }