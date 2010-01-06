/*
	File: CIEvent.js
	Event Definitions
*/

/*
	Class: CIEvent
	CIEvent is an Object of String constants that define the events used in CIP.

	Constants: Events
	ApplicationReady - When the CIApplication has completed initializing
	RequestingData - When data is about to be requested via XHR. Passes method, params, moreParams, argsObject
	RequestedData - When any data is requested via XHR
	GotData - When data is received using GET XHR
	PostedData - When data is received using POST XHR
	DeletedData - When data is received using DELETE XHR
	PutData - When data is received using PUT XHR
	RequestFailed - When an XHR request for data fails, regardless of method
	Clicked - When an object is clicked
	DoubleClicked - When an object is double-clicked
	MousedOver - When the mouse passes over an object
	MousedOut - When the mouse leaves an object
	AddedToDom - When a view's structure is added to the DOM. Automatically fired after CIObject.element
	EnterPressed - When the enter/return key is pressed in/on an object
	EscapePressed - When the escape key is pressed in/on an object
	Showing - When an object is about to become visible. Fired before Shown
	Shown - When an object becomes visible
	Hiding - When an object begins to hide. Fired before Hidden
	Hidden - When an object is hidden from the user
	PropertyChanging - When an object's property is about to change
	PropertyChanged - When an object's property has changed: property, newValue[, oldValue]
	Changed - When an object's state has changed
	Selected - When an object's state has changed and a new item is selcted. Usually fired after Clicked
	Deselected - When an object's state has changed and a new item is selected. Fired before Selected
	RemovingFromDom - When an object's element is about to be removed from the DOM
	RemovedFromDom - When an object's element is removed from the DOM
	DragEntered - When a dragged object enters an object
	DragStarted - When an object is dragged
	Rendered - When a view has laid its content (not structure) out. Usually fired after AddedToDom
	Unrendered - When a view has removed its content. Ususally fired before Rendered.
	Resizing - When a view is about to be resized
	Resized - When a view has been resized
	
	Example:
	(start code)
	var CatView = new Class({ Extends: CIView,
		initialize: function(config) {
			...
			this.synthesize(['name', 'age'], config);
			this.addEvent(CIEvent.PropertyChanged, function(property, newValue) {
				if (property == 'age') alert('Happy Birthday!');
			});
		}
	});
	var cat = new CatView();
	cat.setAge(1);	// will alert "Happy Birthday!"
	cat.fireEvent(CIEvent.Rendered);
	(end)
	
	See Also:
		Mootools.Event.fireEvent
*/
var CIEvent = {
	'ApplicationReady': 'ApplicationReady',
	'RequestingData': 'RequestingData',
	'RequestedData': 'RequestedData',
	'GotData': 'GotData',
	'PostedData': 'PostedData',
	'DeletedData': 'DeletedData',
	'PutData': 'PutData',
	'RequestFailed': 'RequestFailed',
	'Clicked': 'Clicked',
	'DoubleClicked': 'DoubleClicked',
	'MousedOver': 'MousedOver',
	'MousedOut': 'MousedOut',
	'AddedToDom': 'AddedToDom',
	'EnterPressed': 'EnterPressed',
	'EscapePressed': 'EscapePressed',
	'Showing': 'Showing',
	'Shown': 'Shown',
	'Hiding': 'Hiding',
	'Hidden': 'Hidden',	// TextMate indicates Hidden may be a keyword
	'PropertyChanging': 'PropertyChanging',
	'PropertyChanged': 'PropertyChanged',
	'Changed': 'Changed',
	'Selected': 'Selected',
	'Deselected': 'Deselected',
	'Unselected': 'Deselected',
	'RemovingFromDom': 'RemovingFromDom',
	'RemovedFromDom': 'RemovedFromDom',
	'DragEntered': 'DragEntered',
	'DragStarted': 'DragStarted',
	'Rendered': 'Rendered',
	'Unrendered': 'Unrendered',
	'Resizing': 'Resizing',
	'Resized': 'Resized'
};