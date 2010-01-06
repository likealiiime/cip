/*
	File: CIRect.js
	Defines CIRect and its convenience functions
*/

/*
	Class: CIRect
	A CIRect defines the size, origin, clipping and positioning for an object, usually a CIView. CIRect provides several
	convenience methods for building <CIResizeBehavior>s. *Extends <CIObject>*. 
*/
var CIRect = new Class({
	Extends: CIObject,
	
	/*
		Constructor: initialize(configuration)
		
		Configuration:
			minWidth - *Integer or <CIResizeBehavior>*. The minimum width of the CIRect.
			width - *Integer or <CIResizeBehavior>*. The width of the CIRect.
			height - *Integer or <CIResizeBehavior>*. The height of the CIRect.
			x - *Integer or <CIResizeBehavior>*. The horizontal position of the CIRect.
			y - *Integer or <CIResizeBehavior>*. The vertical position of the CIRect.
			clipping - *String*. The <CIClippingBehavior> of the CIRect. Defaults to <CIClippingBehavior.Clip>.
			position - *String*. The <CIPositioningBehavior> of the CIRect.
	*/
	initialize: function(configuration) {
		this.parent(configuration);
		this.isA('CIRect');
		this.synthesize(['minWidth','width', 'height', 'x','y',], configuration);
		this.synthesize({
			clipping: CIClippingBehavior.Clip,
			positioning: null
		}, configuration);
	},
	
	/*
		Function: toCssStylesObject(css, superview)
		Convert this CIRect to an Object defining CSS Styles
		
		Parameters:
			css - *Object*. Optional CSS styles to override or extend the generated styles
			superview - *CIView*. Optional superview the CIRect will use when resolving <CIResizeBehavior>s
		
		Returns:
			Object
		
		Example:
		(start code)
		new CIRect({
			width: 100, height: 150, y: 20
		}).toCssStylesObject({
			color: 'red', width: 150
		}) => {
			width: 150,
			height: 150,
			y: 20,
			color: 'red'
		}
		(end)
	*/
	toCssStylesObject: function(css, superview) {
		this.superview = superview;
		css = $pick(css, {});
		
		var styles = new Hash();
		if ($defined(this.minWidth)) {
			styles.set('min-width', this.getMinWidth());
		}
		if ($defined(this.width)) {
			//styles.set('max-width', this.getWidth());
			styles.set('width',		this.getWidth());
		}
		if ($defined(this.height)) {
			//styles.set('min-height', this.getHeight());
			//styles.set('max-height', this.getHeight());
			styles.set('height',	 this.getHeight());
		}
		
		if (CIClippingBehavior.clippingBehaviors.contains(this.clipping)) styles.set('overflow', this.clipping);
		
		styles.set('top',  this.getY());
		styles.set('left', this.getX());
		if (this.hasOrigin()) styles.set('position', 'absolute');
		
		if (CIPositioningBehavior.positioningBehaviors.contains(this.positioning)) styles.set('position', this.positioning);
		
		styles.extend(css);

		return styles.getClean();
	},
	
	/*
		Function: isEmpty()
		Tests if this CIRect is of an empty size and does not have an origin
		
		Returns:
			true or false
	*/
	isEmpty: function() { return this.isEmptySize() && this.isEmptyPoint(); },
	
	/*
		Function: isEmptySize()
		Tests if this CIRect is of an empty size (no width nor height)
		
		Returns:
			true or false
	*/
	isEmptySize: function() { return !this.hasSize(); },
	
	/*
		Function: isEmptyPoint()
		Tests if this CIRect does not have an origin (no x nor y)
		
		Returns:
			true or false
	*/
	isEmptyPoint: function() { return !this.hasOrigin(); },
	
	
	/*
		Function: hasSize()
		Tests if this CIRect has a size (width and height)
		
		Returns:
			true or false
	*/
	hasSize: function() { return $defined(this.width) && $defined(this.height); },
	
	/*
		Function: hasOrigin()
		Tests if this CIRect has an origin (x and y)
		
		Returns:
			true or false
	*/
	hasOrigin: function() { return $defined(this.x) && $defined(this.y) },
	
	/*
		Function: getHeight()
		*Accessor Override*. Returns the height of this CIRect, resolving its <CIResizeBehavior> if necessary
		
		Returns:
			Number
	*/
	getHeight: function() { return $defined(this.height) ? this.height.toInteger(this.superview) : 0; },
	
	/*
		Function: getMinWidth()
		*Accessor Override*. Returns the minimum width of this CIRect, resolving its <CIResizeBehavior> if necessary
		
		Returns:
			Number
	*/
	getMinWidth: function() { return $pick(this.minWidth, this.getWidth()); },
	/*
		Function: getWidth()
		*Accessor Override*. Returns the width of this CIRect, resolving its <CIResizeBehavior> if necessary
		
		Returns:
			Number
	*/
	getWidth: function() { return this.width != null ? this.width.toInteger(this.superview) : 0; },
	
	/*
		Function: getX()
		*Accessor Override*. Returns the horizontal position of this CIRect, resolving its <CIResizeBehavior> if necessary
		
		Returns:
			Number
	*/
	getX: function() { return this.x != null ? this.x.toInteger(this.superview) : 0; },
	/*
		Function: getY()
		*Accessor Override*. Returns the vertical position of this CIRect, resolving its <CIResizeBehavior> if necessary
		
		Returns:
			Number
	*/
	getY: function() { return this.y != null ? this.y.toInteger(this.superview) : 0; }
});

/*
	Topic: <CIResizeBehavior> Convenience Methods
	CIRect provides several methods for the most common resizing behaviors for both width and height.
	
	Function: CIRect.WidthOfWindow()
	Resize width to the width of the window
	
	Function: CIRect.HeightOfWindow()
	Resize height to the height of the window
	
	Function: CIRect.WidthOfSuperview()
	Resize width to the width of the view's parent view (superview)
	
	Function: CIRect.HeightOfSuperview()
	Resize height to the height of the view's parent view (superview)
	
	Function: CIRect.WidthOfView(view)
	Resize width to the width of the specified view
	
	Function: CIRect.HeightOfView(view)
	Resize height to the height of the specified view
	
	Function: CIRect.TallestSubviewOfView(view)
	Resize height to the height of the tallest subview of the specified view.
	*Note:* This does not return a CIResizeBehavior, but an anonymous object that responds to toInteger() and compares the subviews' heights.
*/
CIRect.WidthOfWindow = function() { return new CIResizeBehavior({ action: 'getWidth', target: window }) };
CIRect.HeightOfWindow = function() { return new CIResizeBehavior({ action: 'getHeight', target: window }) };
CIRect.WidthOfSuperview = function() { return new CIResizeBehavior({ action: 'getWidth', willReceiveView: true }); };
CIRect.HeightOfSuperview = function() { return new CIResizeBehavior({ action: 'getHeight', willReceiveView: true }); };
CIRect.WidthOfView = function(view) { return new CIResizeBehavior({ action: 'getWidth', target: view }) };
CIRect.HeightOfView = function(view) { return new CIResizeBehavior({ action: 'getHeight', target: view }) };
CIRect.TallestSubviewOfView = function(superview) {
	// Construct an anonymous object to do the comparison and implement toInteger
	var comparator = function(theView) {
		this.view = theView;
		this.compare = function() {
			var tallest = 0;
			if (this.view) this.view.subviews.each(function(subview) {
				var h = subview.getHeight().toInteger();
				if (h > tallest) tallest = h;
			});
			return tallest;
		};
		// This is the key -- CIRect#toCssStylesObject will call toInteger on the value of TallestSubviewOf, no matter what the value is
		this.toInteger = function() { return this.compare(); }
	};
	return new comparator(superview);
};


/*
	Class: CIClippingBehavior
	CIClippingBehavior is an Object of String constants that define the available behaviors
	when a <CIView>'s content exceeds the boundaries defined by its <CIRect>.
	
	Constants: Clipping Behaviors
	<CIRect.clipping> determines what happens when the content exceeds the boundaries of the CIRect.
	
	CIClippingBehavior.AutoScroll 	- Use scrollbars, but only show them when scrolling is necessary
	CIClippingBehavior.Clip			- Clip the excess content at the boundaries of the CIRect. This is CIRect's default.
	CIClippingBehavior.Scroll		- Use scrollbars
	CIClippingBehavior.DoNotClip	- Do not clip the excess content
*/
CIClippingBehavior = {
	'AutoScroll': 'auto',
	'Clip': 'hidden',
	'Scroll': 'scroll',
	'DoNotClip': 'visible'
};
CIClippingBehavior.clippingBehaviors = $H(CIClippingBehavior).getValues();

/*
	Class: CIPositioningBehavior
	CIPositioningBehavior is an Object of String constants that define how a <CIView> can be positioned in the page.
	
	Constants: Positioning Behaviors
	<CIRect.positioning> determines how the <CIView> will be positioned.
	
	CIPositioningBehavior.Flow 		- Flow from left to right, top to bottom and ignore the CIRect's X and Y. This is CIRect's default when <CIRect.isEmptyPoint> is true.
	CIPositioningBehavior.Absolute	- Position the view from the top-left corner of the page. This is CIRect's default when <CIRect.hasOrigin> is true.
	CIPositioningBehavior.Relative	- Position the view from the top-left corner of the view's superview.
	CIPositioningBehavior.Fixed		- Position the view from the top-left corner of the page and do not scroll it within the browser window.
*/
CIPositioningBehavior = {
	'Flow': 'static',
	'Absolute': 'absolute',
	'Relative': 'relative',
	'Fixed': 'fixed'
}
CIPositioningBehavior.positioningBehaviors = $H(CIPositioningBehavior).getValues();