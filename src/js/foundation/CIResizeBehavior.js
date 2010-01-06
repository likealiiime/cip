/*
	File: CIResizeBehavior.js
	CIResizeBehavior delegates the computation of a <CIRect>'s dimensions
*/

/*
	Class: CIResizeBehavior
	CIResizeBehavior allows a <CIRect> to calculate the *integer* value of a target variable at any given time
	by delegating the retrieval of the variable to a function. Though CIResizeBehavior can be used
	with any object, it has special logic for the delayed receipt of a <CIView> as a target.
	*Extends <CIObject>*.
	
	Properties:
		target - *<CIObject>*. The target is the object on which to call _action_.
		action - *String*. The function or property to call on _target_.
		additions - *Array*. Integer additions to perform on the target value (target.action). See <plus>.
		subtractions - *Array*. Integer subtractions to perform on the target value (target.action). See <minus>.
		willReceiveView - *Boolean*. Set to true to indicate this CIResizeBehavior will receive a view as a target later on, when <toInteger> is called. Defaults to false.
	
	Example:
		The following is the definition for <CIRect.WidthOfView>
	(start code)
	CIRect.WidthOfView = function(view) {
		return new CIResizeBehavior({
			action: 'getWidth',
			target: view
		});
	};
	(end)
*/	
var CIResizeBehavior = new Class({
	Extends: CIObject,
	
	/*
		Constructor: initialize(configuration)
		
		Configuration:
			target - *<CIObject>*. The target is the object on which to call _action_.
			action - *String*. The function or property to call on _target_.
			additions - *Array*. Integer additions to perform on the target value (target.action). See <plus>.
			subtractions - *Array*. Integer subtractions to perform on the target value (target.action). See <minus>.
			willReceiveView - *Boolean*. Set to true to indicate this CIResizeBehavior will receive a view as a target later on, when <toInteger> is called. Defaults to false.
	*/
	initialize: function(configuration) {
		this.parent(configuration);
		this.isA('CIResizeBehavior');
		this.synthesize(['action', 'target'], configuration);
		//this.target = this._lambdaCreator(this.target);
		this.synthesize({
			additions: [],
			subtractions: [],
			willReceiveView: false
		}, configuration);
		this.additions = $splat(this.additions).map(this._lambdaCreator);
		this.subtractions = $splat(this.subtractions).map(this._lambdaCreator);
	},
	
	_lambdaCreator: function(y) {
		// Can't use $lambda on functions because it breaks the this reference, even if you re-bind it
		return $type(y) == 'function' ? y : $lambda(y);
	},
	
	/*
		Function: targetValue()
		Call _action_ on _target_ regardless of it being a function or property. CIResizeBehavior is intended to work with *Numbers*.
		
		Returns:
			*Number*
	*/
	targetValue: function() {
		if (this.target == null) return null;
		if ($type(this.target[this.action]) == 'function')
			return this.target[this.action]();
		else
			return this.target[this.action];
	},
	
	/*
		Function: plus(x)
		Enqueue an addition to perform on the target value.
		
		Parameters:
			x - *Number* or *Function*. The value to add to the target value. A function may be passed in order to create a closure, but it must return a *Number*.
		
		Returns:
			This CIResizeBehavior
			
		Example:
		(start code)
		var rubberBand = new CIResizeBehavior({
			action: 'getWidth', target: aView
		}).plus(20).plus(function () { return anotherView.getWidth() / 2; });
		(end)
	*/
	plus: function(x) { this.additions.push(this._lambdaCreator(x)); return this; },
	/*
		Function: minus(x)
		Enqueue a subtraction to perform on the target value.
		
		Parameters:
			x - *Number* or *Function*. The value to subtract from the target value. A function may be passed in order to create a closure, but it must return a *Number*.
		
		Returns:
			This CIResizeBehavior
		
		Example:
		(start code)
		var rubberBand = new CIResizeBehavior({
			action: 'getHeight', target: aView
		}).minus(function() { return window.getHeight() / 2; });
		(end)
	*/
	minus: function(x) { this.subtractions.push(this._lambdaCreator(x)); return this; },
	
	/*
		Function: toInteger(view)
		This retrieves the target value then performs additions and subtractions.
		If willReceiveView is true and a <CIView> is passed, the view is assigned to target.
		This delayed assignment is used for calculating super and subview dimensions.
	*/
	toInteger: function(view) {
		if (this.willReceiveView && view) this.target = view;
		var x = this.targetValue();
		if (x == null) return null;
		
		this.additions.each(function(addition) { x += addition().toInt(); });
		this.subtractions.each(function(subtraction) { x -= subtraction().toInt(); });
		return x;
	}
});