/*
	File: CIRequest.js
	The generic RESTful request object that can be modified using a <CIRequestController>.
*/

/*
	Class: CIRequest
	A generic RESTful JSON requester. It creates a number of verb-based convenience methods.
	Each verb's behavior can be modified using a <CIRequestController>. *Extends <CIObject>*. 
	
	Properties:
		requestor - *<CIObject>*. A target to pass onto the request controller. Usually not used.
		indicator - *<CIView>*. A view, usually a <CIIndicator> to hide and show based on request progress.
		forwarders - *Array*. Not synthesized. CIObjects on which to fire the request success methods by proxy.
		
	Convenience Methods:
		Substitute _verb_ for get, put, post, or delete for the following methods.
		
		verbURLFn - the URL-building function
		verbParamsFn - the parameter object-building function
		verb - shortcut for <CIRequest.send> using this verb
		canVerb - whether the verb is supported by this CIRequest
*/
var CIRequest = new Class({
	Extends: CIObject,
	
	/*
		Constructor: initialize(configuration)
		Creates the convenience methods and controllers for each verb specified.
		
		Configuration:
			requestor - *<CIObject>*. A target to pass onto the request controller. Usually not used.
			indicator - *<CIView>*. A view, usually a <CIIndicator> to hide and show based on request progress.
			verb - *String* or *Object*. Defines the url for the specified verb. If passed an Object,
			the url- and parameter-building functions, and the request controller can be specified.
			verb.controller - *<CIRequestController>*. The request controller to use for this verb. Defaults to <CIStandardRequestController>.
			verb.url or verb.urlFn - *String* or *Function*. The value or the function to use for the URL for this verb.
			If a function is provided, it should return a String.
			verb.params or verb.paramsFn - *Object* or *Function*. The object or function to use for the parameters for this
			verb's request. If a function is provided, it should return an Object.
	*/
	initialize: function(options) {
		this.parent(options);
		this.isA('CIRequest');
		this.synthesize(['requestor', 'indicator'], options);
		$H(options).each(function(config, method) {
			if (method == 'destroy') method = 'delete';
			if (!CIRequest.isValidHTTPMethod(method)) return;
			if ($type(config) == 'string')
				config = { url: config, params: {} };
			this[method+'URLFn'] = $lambda(config.urlFn || config.url);
			this[method+'ParamsFn'] = $lambda(config.params || config.paramsFn || {});
			this[method] = function(moreParams, argsObject) { this.send(method, moreParams, argsObject); }.bind(this);
			if (method == 'delete') this['destroy'] = this['delete'];
			this['can'+method.capitalize()] = true;
			
			var verbController = method + 'Controller';
			this.synthesize([verbController]);
			this[verbController] = config.controller || new CIStandardRequestController();
			if (this.requestor) this[verbController].target = this.requestor;
		}.bind(this));
		this.forwarders = [];
	},
	
	/*
		Function: forwardEventsTo(target)
		Add a target CIObject on which to fire the request success events by proxy. Does not allow duplicates or null.
	
		Parameters:
			target - *CIObject*. The target to add to forwarders
			
		Returns:
			This CIRequest
	*/
	forwardEventsTo: function(target) {
		if (!this.forwarders.contains(target)) this.forwarders.push(target);
		this.forwarders = this.forwarders.clean();
		return this;
	},
	
	/*
		Function: fireAndForward(event, args)
		Fire this specified <CIEvent> on this CIRequest and its forwarders array of CIObjects.
		
		Parameters:
			event - *<CIEvent>*. The event to fire.
			args - *Array*. Arguments to pass to Mootools.Event.fireEvent
		
		Returns:
			This CIRequest
	*/
	fireAndForward: function(event, args) {
		this.fireEvent(event, args);
		for (var i = 0; i < this.forwarders.length; i++)
			this.forwarders[i].fireEvent(event, args);
		return this;
	},
	
	/*
		Function: getControllerForMethod(method)
		Returns the <CIRequestController> for the specified method
		
		Parameters:
			method - *String*. The lowercase HTTP verb to lookup.
			
		Returns:
			<CIRequestController>
	*/
	getControllerForMethod: function(method) { return this[method + 'Controller']; },
	
	
	_requestSuccess: function(method, response, json) {
		this.getControllerForMethod(method).reset();
		if (method == 'get')
			this.fireAndForward(CIEvent.GotData, [response, json])
		else if (method == 'post')
			this.fireAndForward(CIEvent.PostedData, [response, json]);
		else if (method == 'delete')
			this.fireAndForward(CIEvent.DeletedData, [response, json]);
		else if (method == 'put')
			this.fireAndForward(CIEvent.PutData, [response, json]);
	},
	
	_send: function(method, params, moreParams, argsObject, successCallback) {
		this.fireEvent(CIEvent.RequestingData, [method, params, moreParams, argsObject]);
		new Request.JSON({
			method: method,
			url: this[method+'URLFn'](argsObject),
			data: params.set('_method', method).getClean(),
			link: this.getControllerForMethod(method).requestMode,
			onFailure: function(xhr) {
				if (this.indicator) this.indicator.hide();
				this.fireAndForward(CIEvent.RequestFailed, [xhr]);
			}.bind(this), 
			onSuccess: function(response, json) {
				successCallback(this, method, response, json);
			}.bind(this),
			onComplete: function(xhr) {
				if (this.indicator) this.indicator.hide();
				this.fireAndForward(CIEvent.RequestedData, [xhr])
			}.bind(this)
		}).send();
	},
	
	/*
		Function: send(method, moreParams, argsObject)
		Make the specified request and include more parameters if passed.
		<CIApplication.baseParams> overrides paramsFn which overrides moreParams.
		
		Parameters:
			method - *String*. The lowercase HTTP verb to use. Default is 'get'.
			moreParams - *Object* or *Hash*. The parameters to pass to the request. Is overriden by the verb's paramsFn. Default is {}.
			argsObject - *Anything*. The contextual object to pass to the verb's paramsFn and urlFn
			
		Events:
			- <CIEvent.RequestedData>
			- <CIEvent.GotData>
			- <CIEvent.PostedData>
			- <CIEvent.PutData>
			- <CIEvent.DeletedData>
			- <CIEvent.RequestFailed>
		
		Returns:
			This CIRequest
	*/
	send: function(method, moreParams, argsObject) {
		method = method || 'get';
		var params = $H(moreParams);
		params.extend(this[method+'ParamsFn'](argsObject)).extend(CIApplication.baseParams);
		if (this.indicator) this.indicator.show();
		
		var controller = this.getControllerForMethod(method);
		params.extend(controller.reset().getParams());
		controller.complete = this._requestSuccess.bind(this);
		controller.request = function(request) {
			params = this.updateParams(params);
			request._send(method, params, moreParams, argsObject, this.successCallback.bind(this));
		};
		controller.request(this);
		
		return this;
	}
});
/*
	Function: CIRequest.isValidHTTPMethod(method)
	Tests if the passed method is a valid HTTP method. get, post, put, delete.
	
	Parameters:
		method - *String*. A lowercase HTTP verb. Valid values are 'get', 'post', 'put', or 'delete'.
	
	Returns:
		true or false
*/
CIRequest.isValidHTTPMethod = function(method) {
	return ['get','post','put','delete'].contains(method);
};


/*
	Class: CIRequestController
	A request controller is a simple state machine that controls the behavior of a <CIRequest>'s request.
	For instance, a request controller might update a specific component when a certain amount of data has been received.
	CIRequestController should never be instantiated, only subclassed. *Extends <CIObject>*.
	
	Properties:
		requestMode - *String*. What to do with subsequent requests. See Mootools.Request. Default is 'ignore'.
		
	Topic: States
	- Inactive - no request is in progress. Call request to initiate a request.
	- Active - a request is in progress or has finished. Call complete to return to inactive state.
	
	Topic: Subclassing
	All CIRequestController subclasses must respond to six methods, four of which 
	the subclass is responsible for if the CIRequestController is being used by a <CIRequest>.
	
	getParams - called by <CIRequest> immediately before the first request to retrieve the Object of parameters the controller needs to send. Cannot be overriden by any other set of parameters.
	updateParams - called by <CIRequest> each time a request is issued so the controller has a chance to update its required parameters accordingly.
	reset - to reset the controller to its inactive state. If overriding, subclasses should reset any relevant properties and call this.parent() to delete the other activation functions. Must be idempotent.
	request - to initiate an HTTP request and move the controller to its active state. If the subclasse is used by <CIRequest>, it should not be defined.
	successCallback - called by <CIRequest> whenever a request successfully completes. Subclasses must respond to it until it calls complete. Beware of inifinite loops here!
	complete - called only by successCallback when no more requests should be issued. It should call reset. If the subclass is used by <CIRequest>, it should not be defined.
*/
var CIRequestController = new Class({
	Extends: CIObject,
	
	/*
		Constructor: initialize(configuration)
		
		Configuration:
			requestMode - *String*. What to do with subsequent requests. See Mootools.Request. Default is 'ignore'.
	*/
	initialize: function(configuration) {
		this.parent({});
		this.isA('CIRequestController');
		this.synthesize({
			requestMode: 'ignore'
		}, configuration);
		this.reset();
	},
	
	/*
		Function: reset()
		Returns the controller to its inactive state from any state by deleting its request and complete functions.
		
		Returns:
			This CIRequestController
	*/
	reset: function() {
		delete this.request;
		delete this.complete;
		this.complete = function() {
			throw new ReferenceError('Called an undefined complete method on ' + this.id);
		};
		this.request = function() {
			throw new ReferenceError('Called an undefined request method on ' + this.id);
		};
		return this;
	},
	
	/*
		Function: getParams()
		Returns an Object of the additional parameters needed by this controller.
		
		Returns:
			An empty Object {}.
	*/
	getParams: function() { return {}; },
	
	/*
		Function: updateParams(hash)
		Updates the parameters Hash passed to it and returns it.
		
		Parameters:
			hash - *Hash*. The Hash of parameters for this request.
			
		Returns:
			The unmodified Hash
	*/
	updateParams: function(hash) { return hash; }
});

/*
	Class: CIStandardRequestController
	The default request controller. It retains all defaults of <CIRequestController> except for
	the addition of successCallback. *Extends <CIRequestController>*.
*/
var CIStandardRequestController = new Class({
	Extends: CIRequestController,
	
	/*
		Constructor: initialize()
	*/
	initialize: function() {
		this.parent({});
		this.isA('CIStandardController');
		this.reset();
	},
	
	/*
		Function: successCallback(request, method, response, json)
		The success callback for a standard request. It just calls <CIRequestController.complete>, passing method, response and json.
		
		Parameters:
			request - *<CIRequest>*. The <CIRequest> object that is using this controller
			method - *String*. The lowercase HTTP verb of this request
			response - *Object*. The JSON object returned by the request
			json - *String*. The JSON string returned by the request
	*/
	successCallback: function(request, method, response, json) {
		this.complete(method, response, json);
	}
});

/*
	Class: CIChunkRequestController
	A more complex request controller that loads data in discrete chunks. Once data is loaded,
	it updates its target with its current buffer. It continues to request data by calling request until the server indicates
	there is no more data. The server is told the chunk position and size and must respond with a specific JSON object.
	*Extends <CIRequestController>.
	
	Topic: Request Parameters
	The request provided with two parameters that track the controller's position in the data set.
	
	CIChunkRequestControllerPosition - *Number*. The position property of the CIChunkRequestController. This is updated in updateParams.
	CIChunkRequestControllerChunkSize - *Number*. The size property of the CIChunkRequestController. 
	
	Topic: Response
	The request is expected to respond with a JSON Object containing two properties.
	
	CIChunkRequestControllerChunkTotal - *Number*. The total number of records transferred so far. The server is expected to keep up with this number.
	CIChunkRequestControllerCollection - *Array*. The data of this chunk in an Array.
	
	Properties:
		requestMode - *String*. See <CIRequestController.requestMode>. Default is 'chain'.
		size - *Number*. The number of items expected from in each chunk. Default is 10.
		target - *<CIObject>*. The target object to update with the buffer after each chunk. It can be usefully omitted for a request that simply loads a large amount of data incrementally.
		property - *String*. The key-value-compliant property on target to update. Default is 'collection'.
	
*/
// TODO Create CIProgressRequestController, which also chunks but indicates numerical progress instead of chunks of data
var CIChunkRequestController = new Class({
	Extends: CIRequestController,
	
	/*
		Constructor: initialize(configuration)
		
		Configuration:
			requestMode - *String*. See <CIRequestController.requestMode>. Default is 'chain'.
			size - *Number*. The number of items expected from in each chunk. Default is 10.
			target - *<CIObject>*. The target object to update with the buffer after each chunk.
			property - *String*. The key-value-compliant property on target to update. Default is 'collection'.
			position - *Number*. The current position in the sequence of requests. Used with the request's response to determine the chunks remaining. Reset to 1 when reset is called.
			buffer - *Array*. The data returned from the request so far. Reset to [] when reset is called.
	*/
	initialize: function(configuration) {
		this.parent(configuration);
		this.isA('CIChunkController');
		this.synthesize({
			size: 10,
			requestMode: 'chain',
			target: null,
			property: 'collection'
		}, configuration);
		this.reset();
	},
	
	/*
		Function: reset()
		Resets the request controller to its inactive state. Its position and buffer are reset to 1 and [], respectively.
		
		See Also: <CIRequestController>
	*/
	reset: function() {
		delete this.buffer;
		this.synthesize({ position: 1, buffer: [] });
		return this.parent();
	},
	
	/*
		Function getParams()
		Returns a parameters Object containing CIChunkRequestControllerPosition and CIChunkRequestControllerChunkSize.
		
		Returns:
			Object
	*/
	getParams: function() {
		return {
			'CIChunkRequestControllerPosition': this.position,
			'CIChunkRequestControllerChunkSize': this.size
		};
	},
	
	/*
		Function: updateParams(params)
		Updates the CIChunkRequestControllerPosition key in the parameters hash with the current position.
		
		Returns:
			Hash
	*/
	updateParams: function(params) {
		return params.set('CIChunkRequestControllerPosition', this.position);
	},
	
	/*
		Function: successCallback(request, method, response, json)
		Called after each successful request. It gives the next chunk of data to the target if necessary and checks to see if
		all the data has been loaded. If not, it updates its position and calls request again. If all data has been loaded, it
		calls complete with the method and the buffer. If the request's response is malformed, it will fire <CIEvent.RequestFailed>
		and throw an error.
		
		Throws:
			ReferenceError - if the response is not an Object with CIChunkRequestControllerChunkTotal and CIChunkRequestControllerCollection properties.
	*/
	successCallback: function(request, method, response, json) {
		var total = response['CIChunkRequestControllerChunkTotal'];
		if (!$defined(total)) {
			request.fireEvent(CIEvent.RequestFailed);
			throw new ReferenceError(this.id + ' could not access response.CIChunkRequestControllerChunkTotal. ' + request.id + ' has failed.');
		}
		if (!$defined(response['CIChunkRequestControllerCollection'])) {
			request.fireEvent(CIEvent.RequestFailed);
			throw new ReferenceError(this.id + ' could not access response.CIChunkRequestControllerCollection. ' + request.id + ' has failed.');
		}
		total = total.toInt();
		var chunks = (total / this.size).floor();
		if ((total % this.size) != 0) chunks++;
		this.buffer.extend($splat(response['CIChunkRequestControllerCollection']));
		
		if (this.target) this.target.set(property, this.buffer);
		
		if (chunks == this.position) {
			this.complete(method, this.buffer, null);
		} else {
			this.position++;
			this.request(request);
		}
	}
});