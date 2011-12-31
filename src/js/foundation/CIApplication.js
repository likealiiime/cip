/*
	File: CIApplication.js
	The global application representation
*/

/*
	Topic: CIApplication
	The global application instance
*/

/*
	Class: CIApplicationInstance
	CIApplicationInstance represents the application being used. It is instantiated in a global
	variable CIApplication. *Extends <CIObject>*.
	
	Properties:
		baseParams - *Object*. The master parameters to include with every <CIRequest>.
		
	Events:
		- <CIEvent.ApplicationReady>
*/
var CIApplicationInstance = new Class({
	Extends: CIObject,
	
	initialize: function(configuration) {
		this.parent(configuration);
		this.isA('CIApplication');
		this.synthesize({
			baseParams: {}
		}, configuration);
		// this.registeredClasses = new Hash(); // className => Class
	},
	
	/*
		Function: __main__()
		Called when the DOM is loaded, this sets up the environment for CIP.
		Fires <CIEvent.ApplicationReady> when finished.
		This should never be run manually
	*/
	'__main__': function() {
		CIObject.implement(Chain);
		Element.implement(Chain);
		$$('body')[0].addClass(Browser.Engine.name);

		if (!$defined(console)) {
			console = {};
		} else if (!$defined(console.log)) {
			console.log = function() { }
		}

		CIApplication.fireEvent(CIEvent.ApplicationReady);
	}
	
	// registerClass(Class or Object)
	// classNamed(String)
});

CIApplication = new CIApplicationInstance();