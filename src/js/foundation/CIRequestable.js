/*
	File: CIRequestable.js
	A mixin that allows any <CIObject> to be configured with HTTP verbs and retrofitted with a <CIRequest> object.
*/

/*
	Interface: CIRequestable
	CIRequestable allows any <CIObject> to be configured using HTTP verbs in the same manner as a <CIRequest> object,
	then creates a hidden <CIRequest> object inside the host with the complete configuration.
	The six request-related <CIEvent>s are fired on the host object when fired by the internal <CIRequest>.
	
	Properties:
		_request - *<CIRequest>*. The hidden request object to configure
		
	See Also:
		<CIRequest>
		Mootools.Class.implement
		
	Example:
	(start code)
	var SmartCat = new Class({
		Extends: CIObject,
		Implements: CIRequestable,
		
		initialize: function(configuration) {
			...
			this._makeRequestable(configuration);
		},
		download: function() { this._request.get() }
	});
	var cat = new SmartCat({
		get: '/url',
		post: {
			url: '/url',
			params: function() { return { foo: 'bar' }; }
		}
	});
	cat.download();
*/
var CIRequestable = new Class({
	/*
		Function: _makeRequestable(configuration, allowedMethods)
		Parse configuration for the allowed HTTP verbs then retrofit the <CIRequest> into this object.
		
		Parameters:
			configuration - *Object*. the configuration of the host CIObject.
			allowedMethods - *Array*. The allowed HTTP verbs as lowercase Strings. Defaults to ['get', 'post', 'delete', 'put', 'destroy']
	*/
	_makeRequestable: function(configuration, allowedMethods) {
		allowedMethods = $splat(allowedMethods);
		if (allowedMethods.length == 0) allowedMethods = ['get', 'post', 'delete', 'put', 'destroy'];
		
		var config = { requestor: this };
		allowedMethods.each(function(method) {
			if (!$defined(configuration[method])) {
				return;
			} else if (configuration[method].isCIObject && configuration[method].isOfType('CIRequest')) {
				this._request = configuration[method];
			} else {
				config[method] = configuration[method];
			}
		}.bind(this));
		if (!$defined(this._request)) this._request = new CIRequest(config);

		// Fire-by-proxy the events on the implementing object
		this._request.addEvent(CIEvent.RequestedData, function(xhr) { this.fireEvent(CIEvent.RequestedData, [xhr]); }.bind(this));
		this._request.addEvent(CIEvent.RequestFailed, function(xhr) { this.fireEvent(CIEvent.RequestFailed, [xhr]); }.bind(this));
		[CIEvent.GotData, CIEvent.PostedData, CIEvent.DeletedData, CIEvent.PutData].each(function(event) {
			this._request.addEvent(event, function(o,j) { this.fireEvent(event, [o,j]); }.bind(this));
		}.bind(this))
	}
});