/*
	Class: CIForm
	Represents a form that can make requests and set itself from those requests. Extends CIFormBase
	
	Properties:
		id - String like CIForm_#
		object - Object. The source object. Default null
		submitButton - Element. The 
		*See configuration for others*
		
	Events:
		- GotData
		- PostedData
*/
// TODO rename object to source
// TODO fire Changed
var CIForm = new Class({
	Extends: CIView,
	Implements: CIRequestable,
	
	/*
		Constructor: initialize(configuration)
		
		Configuration:
			submittingLabel - String. The label of the submit button while submitting data. Default 'Saving...'
			title - String. The title at the top of the form
			padding - Number. The padding inside each cell. Default 0
			spacing - Number. The spacing between each cell. Default 5
	*/
	initialize: function(options) {
		this.parent(options);
		this.isA('CIForm');
		this._makeRequestable(options);
		this.indicator = new CIIndicator({ cssStyles: { 'float': 'right' }});
		this._request.setIndicator(this.indicator);
		this.addEvent(CIEvent.GotData, function(o,j) { this.use(o); });
		this.addEvent(CIEvent.RequestedData, function() { this.submitButton.setLabel(this.submitLabel); });
		
		this.synthesize({
			object: {},
			hideSubmitButton: false,
			submitLabel: 'Save',
			submittingLabel: 'Saving...',
			title: null,
			padding: 0,
			spacing: 5,
		}, options);
		this.fields = $splat(options.fields);
		this.labelStyles = CIObject.interpretStyles(options.labelStyles || {});
		this._fieldsTable = new Hash();
	},
	
	/*
		Function: setTitle(newTitle)
		Set the first title on the form
		
		Parameters:
			newTitle - String. The new title
		
		Returns:
			This CIForm
	*/
	setTitle: function(newTitle) {
		this.set('title', newTitle);
		if (this.element()) $splat(this.element().getChildren('tr'))[0].getChildren('.CIFormTitle').set('html', this.title);
		return this;
	},
	
	/*
		Function: toObject()
		Outputs this form's fields and values as an Object. Uses <CIFormField.name> as keys. Excludes fields without name set and fields of type label
	
		Returns:
			Object
	*/
	toObject: function() {
		var params = {};
		this._fieldsTable.each(function(field, property) {
			if (property && field.name && field.type != 'label') params[field.name] = field.getValue();
		});
		return params;
	},
	
	/*
		Function: getData()
		Makes an HTTP request using its get parameters, then populates the form fields using the result
		
		Returns:
			This CIForm
	*/
	getData: function(moreParams) {
		this._request.get(moreParams);
		return this;
	},
	
	_onGotData: function(object, json) {
		this.use(object);
	},
	
	use: function(object) {
		this.setObject(object);
		this.populate();
	},
	
	/*
		Function: populate(object)
		Populate this form's fields using object and <CIFormField.setValue>.
		If object is not provided, use <CIForm.object>. The keys of object must correspond to
		each field's property, not its name
		
		Returns:
			This CIForm
	*/
	populate: function(object) {
		object = object || this.object || {};
		if (this.responseWrapsObject) object = object[this.responseWrapsObject];
		this._fieldsTable.each(function(field, property) {
			if (field.type == 'select') {
				var newElem = field._makeField();
				newElem.replaces(field.field);
				field.field = newElem;
			}
			field.setValue(object[property], object);
		});
		return this;
	},
	
	/*
		Function: clear()
		Clear all of this form's fields
		
		Returns:
			This CIForm
	*/
	clear: function() {
		this._fieldsTable.each(function(field, property) {
			switch (field.type) {
				case 'checkbox':
					field.checked = false;
					field.setValue('value', field.values.unchecked);
				break;
				
				default:
					field.setValue('');
				break;
			}
		});
		return this;
	},
	
	/*
		Function: submit()
		Submit this form's fields via the post configuration.
		Changes the submit button's label to submittingLabel, then back to submitLabel when finished. Fires <CIEvent.PostedData>
	
		Returns:
			This CIForm
	*/
	submit: function() {
		if (!this._request.canPost) return;
		if (this.submitButton) this.submitButton.setLabel(this.submittingLabel);
		this._request.post(this.toObject());
		return this;
	},
	
	/*
		Function: removeField(property)
		Remove the CIFormField relating to the specified property from the DOM and the CIForm
		
		Parameters:
			property - String. The property relating to the CIFormField
		
		Returns:
			The removed CIFormField or null if no field found
	*/
	removeField: function(property) {
		var field = this.getField(property);
		if (field) {
			field.element().destroy();
			this._fieldsTable.erase(property);
		}
		return field;
	},
	
	/*
		Function: getField(property)
		Retrieve the CIFormField relating to the specified property
		
		Parameters:
			property - String. The property relating to the CIFormField
		
		Returns:
			The CIFormField or null if no field found
	*/
	getField: function(property) {
		return this._fieldsTable.get(property);
	},
	
	/*
		Function: getValue(property)
		Retrieve the value from the CIFormField relating to the specified property
		
		Parameters:
			property - String. The property relating to the CIFormField
		
		Returns:
			The CIFormField's value or null if no field found
	*/
	getValue: function(property) {
		var field = this.getField(property);
		return field ? field.getValue() : null;
	},

	// TODO rename render()
	_adoptFieldsInto: function(parent) {
		this.fields.each(function(fieldObject) {
			/*
				This is a dirty little secret for when dynamically populating a page using Rails
				or something, and you are building a form in a loop. Consider the fields:
					fields: [...
					<% @coverage_options.each do |cvg| %>
					{ label: "<%=cvg%>", type: 'checkbox', fieldName: 'coverages[<%=cvg.id%>]' },
					<% end %>
					null]
				Without the null, you would have to figure out which item is the last one and remove the
				comma from the end of the line so the parser doesn't complain. By null-terminating the array,
				you can be saved a headache.
			*/
			if (fieldObject == null) return;
			
			fieldObject.form = this;
			var field = fieldObject.isCIObject ? fieldObject : new CIFormField(fieldObject);
			field.element(parent);
			
			// In the internal table, each key is the name of the field as it is going to be
			// received from the server. They correspond to the <input> objects they represent.
			this._fieldsTable.set(field.property || field.name, field);
		}.bind(this));

		// Append the dangling submit button
		if (!this.hideSubmitButton) {
			var labelTd = new Element('td', { html: '', styles: { 'text-align': 'right' } })
			var tr = new Element('tr');
			var td = new Element('td');
			this.submitButton = new CIButton({
				label: this.submitLabel,
				Clicked: this.submit.bind(this),
				cssClass: 'CIFormSubmitButton'
			});
			parent.adopt(tr.adopt(labelTd).adopt(td));
			this.indicator.element(labelTd);
			this.submitButton.element(td);
		}
		return parent;
	},
	
	/*	Function: _makeElement(parent)
		Parent adopts Element
	*/
	_makeElement: function(parent) {
		var table = new Element('table', {
			id: this.id,
			'class': 'CIForm',
			cellpadding: this.padding,
			cellspacing: this.spacing,
			styles: this.cssStyles
		});
		parent.adopt(table);
		if (this.title) {
			var tr = new Element('tr');
			table.adopt(tr);
			tr.adopt(new Element('td', { html: '&nbsp;' }));
			tr.adopt(new Element('td', {
				'class': 'CIFormTitle',
				html: this.title
			}))
		}
		this._adoptFieldsInto(table);
		
		return table;
	}
});