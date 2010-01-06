/*
	File: CIObject.js
*/

/*
	Class: CIObject
	The base class from which all CIP classes inherit. Handles key-value-coding, events, hierarchy, and property synthesis.
	
	Properties:
		isCIObject - Boolean. Should remain true
		objectId - Integer. The internal id number. Should not be modified
		id - String. Like "CIObject_42". Should be overwritten by subclasses by calling <CIObject.isA(newType)>
	
	Topic: Key-Value Coding
	Key-Value Coding (KVC) is a design pattern by which an object's properties can be accessed and mutated using methods based on a
	convention. Therefore, given the name of the property, any object can modify or retrieve any property on any other object
	simply by forming the correct method name. CIP uses camel case. Given the property *fullName*, the methods *setFullName(newName)* and
	*getFullName()* are created. KVC also provides the generic <CIObject.set(property, newValue)> method which accepts the property as the first argument.
	
	KVC is especially powerful because it enables binding -- whereby an object can be notified of a change on a property of another object.
	When a property is changing, an object will fire <CIEvent.PropertyChanging>, then <CIEvent.PropertyChanged> once the property has
	been changed.
	
	To take advantage of Key-Value Coding, simply call <CIObject.synthesize(properties, configuration)> in your Class' constructor.
*/
var CIObject = new Class({
	Implements: Events,
	
	/*
		Constructor: initialize
		Accepts a configuration Hash. All configurations are optional.
		
		Configuration:
			<CIEvent> - String. The constant name of the CIEvent for which to listen.
			
		Example:
		(start code)
		var o = new CIObject({
			Clicked: function(event) { ... }
		});
		(end)
	*/
	initialize: function(options) {
		this.isCIObject = true;
		this.objectId = CIObject.nextId();
		this.__family = [];
		this.__properties = [];
		this.isA('CIObject');
		
		if ($type(options) != 'object') options = null;
		options = options || {};
		$H(options).each(function(value, key) {
			if (CIEvent[key] && $type(value) == 'function')
				this.addEvent(key, value.bind(this));
		}.bind(this));
	},
	
	/*
		Function: element(parent)
		Returns the Element implementation for the CIObject. It operates in three modes, depending on the parameters.
		
		No parameters - looks for the Element in the DOM with id of CIObject.id using $(CIObject.id) and returns that Element or null
		String or Element - looks for the Element in the DOM using $(String/Element) and passes it to CIObject._makeElement() as the parent, returning an Element. Fires <CIEvent.AddedToDom>
		No parameters, no Element found - returns null
	*/
	element: function(parent) {
		//console.log('Looking for ' + this.id);
		var elem = $(this.id);
		if (elem != null) {
			//console.log ('  - Found ' + this.id);
			return elem;
		} else if (parent) {
			if (parent.isCIObject) parent = parent.element();
			//console.log('  - Could not find ' + this.id + ' in DOM, creating...')
			// _makeElement returns one element, therefore
			// all components must be contained within one element only!
			var e = this._makeElement($(parent));
			this.fireEvent(CIEvent.AddedToDom, [e, parent])
			return e;
		} else {
			//console.log("  - Could not find " + this.id + " in DOM and will not create");
			return null;
		}
	},
	
	/*
		Function: toObject()
		Returns a JavaScript-native Object of this CIObject's properties and their values. Only returns synthesized properties.
		
		Returns:
			Object
			
		Example:
		Assume class MyObject has synthesized properties name and age.
		(start code)
		new MyObject({
			name: 'My Name',
			age:  2
		}).toObject() => { name: 'My Name', age: 2 }
	*/
	toObject: function() {
		object = {};
		// TODO Make sure this doesn't cause any dependencies on
		// account of references. Deep copy?
		this.__properties.each(function(property) {
			object[property] = this[property];
		}.bind(this));
		return object;
	},
	
	/*
		Function: synthesize(properties, configuration)
		Creates the specified properties on this CIObject with defaults if provided using the configuration Object or Hash.
		synthesize can be called multiple times to synthesize more properties.
		Key-Value-compliant accessors will be created unless they already exist in the object.
		
		Parameters:
			properties - Array or Object or Hash. Specifies the properties to synthesize and defaults if passed an
			Object or Hash. If passed an Array, the properties will default to null.
			configuration - Object or Hash or null. The configuration to use to set the properties.
		
		Returns:
			This CIObject
		Example:
		(start code)
		Cat = new Class({
			Extends: CIObject,
			initialize: function(configuration) {
				this.parent(configuration);
				this.isA('MyClass');
				this.synthesize({
					name: 'A Cat',
					age: 1
				}, configuration);
			}
		});
		new Cat().name 								=> 'A Cat'
		var fluffy = new Cat({ name: 'Fluffy' });
		fluffy.getName() 							=> 'Fluffy'
		fluffy.getAge()								=> 1
		fluffy.name									=> 'Fluffy'
		(end)
	*/
	// TODO create Class.<Property>Changed events
	synthesize: function(theProperties, configuration) {
		var propertiesToSynthesize = new Hash();
		if ($type(theProperties) == 'array') {
			theProperties.each(function(p) { propertiesToSynthesize.set(p, null); });
		} else {
			propertiesToSynthesize = new Hash(theProperties);
		}
		configuration = configuration || {};
		if (configuration.isCIObject) configuration = configuration.toObject();
		propertiesToSynthesize.each(function(defaultValue, property) {
			if (!this.__properties.contains(property)) this.__properties.push(property);
			
			if (!$defined(configuration[property]))
				this[property] = defaultValue;
			else
				this[property] = configuration[property];
			
			// The descendent's accessors take precedence
			var setter = 'set' + property.capitalize();
			if (!this[setter]) this[setter] = function(newProperty) { return this.set(property, newProperty); }.bind(this);
			var getter = 'get' + property.capitalize();
			if (!this[getter]) this[getter] = function() { return this[property]; }.bind(this);
		}.bind(this));
		return this;
	},
	
	/*
		Function: isA(newType)
		*Only used in class constructors*. Establishes this new class' class name, id, and family tree.
		
		Parameters:
			newType - String. The name of this new class.
			
		Returns:
			This CIObject
	*/
	isA: function(type) {
		this.__className = type;
		this.id = this.__className + '_' + this.objectId;
		this.__family.push(this.__className);
		return this;
	},
	
	/*
		Function: isOfClass(type)
		Test if this class is of a specific type. The target class' constructor must have declared its type using <CIObject.isA>
		to query its name and ancestry.
		
		Parameters:
			type - String. The type to test.
			
		Returns:
			This CIObject
	*/
	isOfClass: function(type) {
		return this.__className == type;
	},
	
	/*
		Function: set(property, newValue)
		Key-Value mutator. Fires <CIEvent.PropertyChanging>, passing property, newValue, and oldValue. Next reassigns property.
		Finally fires <CIEvent.PropertyChanged> with the same parameters
		
		Parameters:
			property - String. The property to set
			newValue - Anything. The new value
		
		Returns:
			This CIObject
	*/
	set: function(property, newValue) {
		var oldValue = CIObject.duplicate(this[property]);
		this.fireEvent(CIEvent.PropertyChanging, [property, newValue, oldValue]);
		this[property] = newValue;
		this.fireEvent(CIEvent.PropertyChanged, [property, newValue, oldValue]);
		return this;
	}
});

/* The internal counter used to number CIObjects uniquely */
CIObject._idCounter = 0;

/*
 	Function: CIObject.nextId()
	Increment and return the internal id counter. Should not be called directly, use <CIObject.isA> instead.
	
	Returns:
		Number
 */
CIObject.nextId = function() { return ++CIObject._idCounter };

/*	
	Function: CIObject.interpretStyles(styles)
	*Deprecated*. Process special CIP styles to CSS styles. Called automatically by CIObject on its cssStyles config option
	
	Deprecated: *Use <CIRect> to define a <CIView>'s dimensions and <CIStyle> to define a <CIView>'s appearance.*
	
	CIP Styles:
		CIFirmWidth - Value/Percentage. Sets min-, max- and width to the specified value.
		CIFirmHeight - Value/Percentage. Sets min-, max- and height to the specified value.
	
	Returns:
		Hash
*/
CIObject.interpretStyles = function(styles) {
	styles = styles || {};
	if (styles.getKeys) styles = styles.getClean();
	var firmWidth = styles['CIFirmWidth'];
	if (firmWidth) {
		delete styles['CIFirmWidth'];
		styles['min-width'] = firmWidth;
		styles['max-width'] = firmWidth;
		styles['width'] = firmWidth;
	}
	var firmHeight = styles['CIFirmHeight'];
	if (firmHeight) {
		delete styles['CIFirmHeight'];
		styles['min-height'] = firmHeight;
		styles['max-height'] = firmHeight;
		styles['height'] = firmHeight;
	}
	var scrollAtHeight = styles['CIScrollAtHeight'];
	if (scrollAtHeight) {
		delete styles['CIScrollAtHeight'];
		styles['max-height'] = scrollAtHeight;
		styles['overflow'] = 'auto';
	}
	return styles;
};

/*
	Function: CIObject.duplicate(value)
	Attempt to duplicate the passed value
	
	Returns:
		A duplicate of value or value
*/
CIObject.duplicate = function(value) {
	switch ($type(value)) {
	case 'number':
		return new Number(value);
		break;
	default:
		return value;
	}
}