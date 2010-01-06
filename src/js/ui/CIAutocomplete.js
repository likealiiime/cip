/*
	Class: CIAutocomplete
	An basic but efficient textual autocomplete widget applied to a text CIFormField. Implements CIRequestable's get to retrieve the set of data to filter, and post to submit the selected item.
	Note that the get request is only called once, to retrieve the set of data to filter, making it very efficient. Its element(parent) should not be called directly.
	It will be shown when its target fires a <CIEvent.Changed> event
	
	Properties:
		id - String like CIAutocomplete_#
		target - CIObject. The target field to autocomplete. Usually CIFormField. Do not set directly, instead use <CIAutocomplete#bindTo(target)>
		selected - Object. The selected object
		
		*See configuration for others*
		
	Events:
		- <CIEvent.Clicked>
		- <CIEvent.Changed>
		- <CIEvent.Selected>
		- <CIEvent.GotData>
		- <CIEvent.PostedData>
		- <CIEvent.Hiding>
		- <CIEvent.RemovingFromDom>
		- <CIEvent.RemovedFromDom>
		- <CIEvent.Hidden>
*/
// TODO split into CIAutocomplete (being a logic-only controller), and CIAutocompleter which creates the bindings and uses CIMenu
var CIAutocomplete = new Class({
	Extends: CIView,
	Implements: CIRequestable,
	
	/*
		Constructor: initialize(configuration)
		
		Configuration:
			get - String or Hash. The get request to retrieve the set of data to filter. See <CIRequestable>
			post - String or Hash. The post request made when an item is clicked. See <CIRequestable>
			property - String. The textual property on the filtered objects by which to filter results. Default 'label'
			collection - Array. The array of objects to filter
			targetValueFn - Function. A function that returns the value of the target field. Default target.getValue()
			caseSensitive - Boolean. Whether the filter is case sensitive. Default false
	*/
	initialize: function(options) {
		this.parent(options);
		this.isA('CIAutocomplete');
		this._makeRequestable(options);
		this._request.addEvent(CIEvent.GotData, this._gotData.bind(this));
		this._request.addEvent(CIEvent.PostedData, this.hide.bind(this));
		this.property = options.property || 'label';
		this.collection = $splat(options.collection);
		this.target = null;
		this.targetValueFn = options.targetValueFn || function(target) { return target.getValue(); };
		this.caseSensitive = options.caseSensitive;
		this.addEvent(CIEvent.Selected, this.postData);
	},
	
	/*
		Function: bindTo(target)
		Bind this CIAutocomplete to the target and make the get request. When the target fires a <CIEvent.Changed>, it will invoke the autocompleter
		
		Returns:
			This CIAutocomplete
	*/
	// TODO remove the Changed event if already bound
	bindTo: function(target) {
		this.getData();
		this.target = target;
		this.target.addEvent(CIEvent.Changed, this._autocomplete.bind(this));
		return this;
	},
	
	/*
		Function: getData()
		HTTP get the set of data to filter
		
		Returns:
			This CIAutocomplete
	*/
	getData: function(moreParams) {
		this._request.get(moreParams);
		return this;
	},
	_gotData: function(collection, json) {
		this.set('collection', $splat(collection));
	},
	
	/*
		Function: postData()
		HTTP post something. The post paramsFn is passed this.selected
		
		Returns:
			This CIAutocomplete
	*/
	postData: function(moreParams) {
		if (this._request.canPost) {
			this._request.post(moreParams, this.selected);
		}
	},
	
	/*
		Function: hide()
		Hide the autocompleter. Useful when the autocompleter's parent has changed position since autocompleters cannot move.
		Fires the following events in order:
		<CIEvent.Hiding> -> <CIEvent.RemovingFromDom> -> (element destroyed) -> <CIEvent.RemovedFromDom> -> <CIEvent.Hidden>
	
		Returns:
			Mootools.Fx.Tween
	*/
	hide: function() {
		var elem = this.element();
		if (!elem) return;
		return new Fx.Tween(elem, {
			property: 'opacity', duration: 150
		}).start(0).chain(function() {
			this.fireEvent(CIEvent.Hiding, [elem]);
			this.fireEvent(CIEvent.RemovingFromDom, [elem]);
			elem.destroy();
			this.fireEvent(CIEvent.RemovedFromDom);
			this.fireEvent(CIEvent.Hidden);
		}.bind(this));
	},
	
	_autocomplete: function() {
		var overlay = this.element(document.body).empty();
		
		var query = this.targetValueFn(this.target);
		if (!this.caseSensitive) query = query.toLowerCase();
		// Pre-cache for performance
		var i = 0, s = '', index = -1;
		var item = {}, cssClass = '', div = {}, html = '';
		for (i; i < this.collection.length; i++) {
			item = this.collection[i];
			s = item[this.property];
			s = s ? s.toString() : '';
			index = (!this.caseSensitive ? s.toLowerCase() : s).indexOf(query);
			
			if (index > -1) {
				html = s.substring(0, index) + '<span class="CIAutoCompleteHighlight">';
				html += s.substr(index, query.length) + '</span>';
				html += s.substring(index+query.length);
				cssClass = i % 2 == 0 ? 'CIEvenSkin' : 'CIOddSkin';
				div = new Element('div', {
					'class': 'CIAutocompleteResult CIHoverableSkin ' + cssClass,
					html: html
				});
				div.store('CIAutocompleteRecord', item);
				div.addEvent('click', function(event) {
					this.fireEvent(CIEvent.Clicked, [event]);
					this.selected = div.retrieve('CIAutocompleteRecord');
					this.fireEvent(CIEvent.Changed, [this.selected])
					this.fireEvent(CIEvent.Selected);
				}.bind(this));
				overlay.adopt(div);
			}
		}
	},
	
	_makeElement: function(parent) {
		// Setting targetElement needs to be delayed until it's time to
		// show the overlay because we need the target to be in the DOM
		this.targetElement = this.target.isCIObject ? this.target.element() : this.target;
		var dimensions = this.targetElement.getCoordinates();
		var overlay = new Element('div', {
			'class': 'CIAutocomplete',
			id: this.id,
			styles: {
				width: dimensions.width,
				top: dimensions.top + dimensions.height,
				left: dimensions.left
			}
		});
		overlay.inject(document.body, 'top');
		
		return overlay;
	}
});