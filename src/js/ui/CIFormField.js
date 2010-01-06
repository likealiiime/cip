/*
	Class: CIFormField
	Represents a form field. Usually used inside a CIForm, but works just as well alone. It can show a label, padding or spacing, and text before, after and below the field.
	
	Properties:
		id - String like CIFormField_#
		options - The options for type select.
		field - The HTML <input>, <textarea>, or <select> Element
		
		*See configuration for others*
	
	Events:
		- Changed
		- EnterPressed
		- EscapePressed
*/
// TODO Better coverage of Changed
// TODO fire Clicked and GotFocus and LostFocus
var CIFormField = new Class({
	Extends: CIView,
	
	/*
		Constructor: initialize(configuration)
		
		Configuration:
			name - String. The HTTP parameter name to be sent for this field. Default property
			size - Number. The number of characters to show. Only affects types text and password. Default unknown
			property - String. The property on the source object corresponding to this field. Each field must represent a different property.
			type - String. The type of field. Possible values are 'text', 'file', 'password', 'textarea', 'select', 'label', 'checkbox'. Default 'text'
			label - String. The label to display to the left of the field
			value - Mixed. The value to which to set the field
			values - Hash. The values for type checkbox. Default { checked: 'true', unchecked: 'false' }
			form - CIForm. The parent form
			note - String. The text to display underneath the field
			noteBeforeField - String. The text to display to the left of the field, to the right of the label
			noteAfterField - String. The text to display to the right of the field
			options - Hash or Function. The options for type select. Pass a Function to dynamically change the options. Default {}. Specified like: { labelHTML: value }
			rows - Number. The rows attribute for type textarea
			cols - Number. The cols attribute for type textarea
			labelStyles - Hash. The CSS styles to apply to the label. If this CIFormField is a child of a CIForm, the CIForm's labelStyles override. Interpreted by <CIObject.interpretStyles>
			padding - Number. The padding inside each cell. Default 0
			spacing - Number. The spacing inside each cell. Default 5
			autocomplete - CIAutocomplete. The configuration, or CIAutocomplete to use on this text field
	*/
	// TODO implement title type
	initialize: function(options) {
		this.parent(options);
		this.isA('CIFormField');
		
		this.synthesize([
			'name', 'size', 'property', 'label', 'value', 'form', 'note', 'noteBeforeField',
			'noteAfterField', 'field', 'rows', 'cols', 'autocomplete', 'renderer', 'labelStyles',
			'placeholderText'
			], options
		);
		this.synthesize({
			type: 'text',
			values: { checked: 'true', unchecked: 'false' },
			'options': {},
			padding: 0,
			spacing: 5
		}, options);
		this.labelStyles = CIObject.interpretStyles(options.labelStyles);
	},
	/*
		Function: giveFocus()
		Place cursor focus inside this field's field
		
		Returns:
			This CIFormField
	*/
	giveFocus: function() { if (this.field && (this.type != 'custom')) this.field.focus(); return this; },
	
	/*
		Function: setValue(newValue)
		Set the value of this CIFormField, depending on type. Fires <CIEvent.Changed>
		
		Parameters:
			newValue - Mixed. The new value
		
		Returns:
			This CIFormField
	*/
	setValue: function(newValue, object) {
		if (this.type == 'custom') {
			this.field.empty();
			var result = this.renderer(newValue, object);
			if ($type(result) == 'string') result = new CIText(result);
			result.element(this.field);
			return this;
		}
		var htmlValue = this.type == 'label' ? 'html' : 'value';
		var oldValue = this.field.get(htmlValue); // Hopefully this returns a clone
		if (this.type == 'checkbox') {
			this.field.checked = (newValue || '').toString() == this.values.checked;
		} else {
			this.field.set(htmlValue, newValue);
		}
		this.fireEvent(CIEvent.Changed, [newValue, oldValue]);
		return this;
	},
	
	/*
		Function: getValue()
		Retrieves the value of this CIFormField, depending on type.
		
		Returns:
			Mixed, usually String
	*/
	getValue: function() {
		if (this.type == 'checkbox') {
			if (this.field.checked)
				return this.values['checked'];
			else
				return this.values['unchecked'];
		} else if (this.type == 'label') {
			return this.field.get('html');
		} else if (this.type == 'custom') {
			return null;
		} else {
			return this.field.get('value');
		}
	},
	
	/*	Function: _makeElement(parent)
		Parent adopts Element
	*/
	// TODO return <tr> if parent is <table>, otherwise return <div>
	_makeElement: function(parent) {
		this.field = this._makeField();
		
		var tr = new Element('tr', { id: this.id });
		var labelTd = new Element('td', {
			'class': 'CIFormLabel',
			html: this.label || '&nbsp;',
			styles: this.form ? $extend(this.form.labelStyles, this.labelStyles) : this.labelStyles,
			valign: this.note || this.type == 'textarea' ? 'top' : ''
		});
		var fieldTd = new Element('td');
		
		// Add the note before the field element in the field TD
		if (this.noteBeforeField) {
			fieldTd.adopt(new Element('span', {
				'class': 'CIFormFieldNote',
				html: this.noteBeforeField + '&nbsp;'
			}));
		}
		// Add the field
		fieldTd.adopt(this.field);
		if (this.type == 'custom') {
			var result = this.renderer(this.form ? this.form.object : null);
			if ($type(result) == 'string') result = new CIText(result);
			result.element(this.field);
		}
		
		// Add the note after the field
		if (this.noteAfterField) {
			fieldTd.adopt(new Element('span', {
				'class': 'CIFormFieldNote',
				html: '&nbsp;' + this.noteAfterField
			}));
		}
		// Add the note after a line break
		if (this.note) {
			labelTd.setStyle('padding-top', 8);
			fieldTd.adopt(new Element('br')).adopt(new Element('span', {
				'class': 'CIFormFieldNote',
				html: this.note
			}));
		}
		// Adopt both <td>s into the <tr>, then the <tr> into the parent
		tr.adopt(labelTd).adopt(fieldTd);
		if (parent.get('tag') == 'table')
			parent.adopt(tr);
		else {
			var table = new Element('table', {
				cellpadding: this.padding,
				cellspacing: this.spacing,
				styles: { border: 'none' }
			});
			parent.adopt(table.adopt(tr));
		}
		
		return tr;
	},
	
	_makeField: function() {
		var field = null;
		
		switch (this.type) {
		case 'custom':
			field = new Element('div');
		break;
		
		case 'text':
			field = new Element('input', {
				type: 'text',
				'class': 'CIFormField',
				name: this.name,
				size: this.size,
				value: this.value || this.placeholderText
			});
			// Text field specific events:
			field.addEvent('keypress', function(event) {
				//this.fireEvent(CIEvent.KeyPressed, [event]);
				this.fireEvent(CIEvent.Changed);
				if (event.key == 'enter') {
					this.fireEvent(CIEvent.EnterPressed, [event]);
				} else if (event.key == 'esc') {
					this.fireEvent(CIEvent.EscapePressed, [event]);
				}
			}.bind(this));
			if (this.autocomplete) {
				this.autocomplete = this.autocomplete.isCIObject ? this.autocomplete : new CIAutocomplete(this.autocomplete);
				this.autocomplete.bindTo(this);
			}
		break;
		
		case 'textarea':
			field = new Element('textarea', {
				'class': 'CIFormField',
				name: this.name,
				rows: this.rows,
				cols: this.cols,
				value: this.value
			});
		break;
		
		case 'file':
			field = new Element('input', {
				type: 'file',
				'class': 'CIFormField',
				name: this.name,
				size: this.size
			});
		break;

		case 'password':
			field = new Element('input', {
				type: 'password',
				'class': 'CIFormField',
				name: this.name,
				size: this.size,
				value: this.value
			});
		break;

		case 'select':
			field = new Element('select', {
				name: this.name,
				size: this.size,
				'class': 'CIFormField'
			});
			if ($type(this.options) == 'object') this.options = $lambda(this.options);
			new Hash(this.options()).each(function(value, html) {
				field.adopt(new Element('option', { value: value, html: html }));
			}.bind(this));
			field.addEvent('change', function() { this.fireEvent(CIEvent.Changed); }.bind(this));
		break;

		case 'label':
			field = new Element('span', {
				'class': 'CIFormLabelField',
				html: this.value
			});
		break;

		case 'checkbox':
			field = new Element('input', {
				type: 'checkbox',
				name: this.name,
				'class': 'CIFormField'
			});
		break;
		}; // end switch
		
		return field;
	} // end function
});