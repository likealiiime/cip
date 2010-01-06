/* Options:
	- cssStyles: (See CIObject)
	- cssClass: String
	+ get: { url: String, paramsFn: Mixed or Function } or String
	- post: { url: String, paramsFn: Mixed or Function } or String
		When called for params for submitting editor data for
			a default editor renderer, the paramsFn is called
			with the signature: function(value, record, data)
	- data: Array
	+ columns: { "Header": { property: String, }, ... }
		+ property: String
		- cssStyles: { }
		- renderer: function(propertyValue, record, taffyDB, table) => String, CIObject, or Element
			The html property of the returned data will be used for the default editor's value
		- editor: Object
			+ fieldName: String
			- renderer: Function
	- padding: Number (Default 5)
	- toolbar: { CIToolbar config (See CIToolbar) }
	- tableHeight: Mixed (Default "auto")
	- label: String
*/ 

var CIColumn = new Class({
	Extends: CIView,
	
	initialize: function(configuration) {
		this.parent(configuration);
		this.isA('CIColumn');
		this.synthesize({
			header: '',
			property: 'id',
			width: null,
			renderer: null,
			editor: null,
			dontEncodeEntitiyChars: false,
			truncateAfter: null
		}, configuration);
	},
	
	getHeader: function() { return (this.header || '').toString(); }
});
/*
	Class: CITable
	Represents a table of information. Implements CIRequestable. It uses get to retreive the data
	for the cells, and post to send updated data back. Capable of custom renderes and editors. The editor
	is shown in a <CIHud> and the 'editing' style is applied to the cell
	
	Properties:
		id - String like CITable_#
		selected - Object. The currently selected row's object
		selectedRowElement - Element. The currently selected row's Element
		
		*See configuration for others*
		
	Events:
		- GotData
		- DragEntered
		- DragLeft
		- Clicked
		- Selected
		- Changed
*/
var CITable = new Class({
	Extends: CIView,
	Implements: CIRequestable,

	/*
		Constructor: initialize(configuration)
		
		Configuration:
			get - String or Hash. The configuration to use when requesting data to populate the table. See <CIRequestable>
			post - String or Hash. The configuration to user when requesting a change to data. *The request must respond with the newly updated record.* If using the Hash form, the params function provides the currently editing record as a parameter. See <CIRequestable>
			label - String. The title of the table
			columns - Hash. The columns that make up the table. The keys become the header labels and must be unique. Default {}
			data - Array. An array of objects representing the rows of data in the table. The objects' properties represent possible columns. See <Column Configuration>. Default []
			padding - Number. The amount of padding inside each cell. Default 5
			paginator - Hash. Configuration for the paginator to use on this table
			toolbar - Array. Items to display in this table's toolbar
			selectable - Boolean. Enable row selection. Default false
			useArray - Boolean. Whether to back the table with an Array instead of TaffyDB object. Default false
			hideHeader - Boolean. Whether to hide the header row. Default false
			acceptsDrop - Boolean. Whether this table acceptsDrops. Default false
			
		Column Configuration:
			property - String. The property on the object to use that represents the column. Need not be unique across columns
			dontEncodeEntityChars - Boolean. Whether to skip encoding HTML entity character codes when not using a renderer. Default false
			editor - Hash. The configuration for the column editor. See <Editor Configuration>
			renderer - Function. A function that returns the appropriate CIObject for the cell.
			Has a method signature of: *propertyValue, recordObject, ciTable, dataArray, tdElement, trElement*.
			If the renderer returns a string, it becomes a <span>. Otherwise, the renderer may return an Element or CIObject
			
		Editor Configuration:
			value - String or Number. The value to which to set the editor's field. Default the innerHTML of the first child in the <td>
			padding - Number. The padding between the editor field and button. Default 0
			spacing - Number. The spacing around the editor field and button. Default 0
			type - String. The type of editor. Accepts 'textarea' or 'text.' Default 'text'

			*The editor configuration is used to create a <CIFormField>. See <CIFormField.initialize> for the full configuration*
	*/
	// TODO change label to title
	// TODO use array instead of hash for columns
	// TODO create CITableColumn
	// TODO rename data collection
	initialize: function(options) {
		this.parent(options);
		this.isA('CITable');
		this._makeRequestable(options);
		
		this.synthesize({
			title: '',
			selectable: false,
			selected: null,
			deletePrompt: null,
			getAfterResourceChange: false,
			noDataText: 'No data to display',
			doNotSetDataAfterGet: false,
			style: CITable.Style
		}, options);
		
		this._title = null;
		this.setCollection(options.collection);
		this.columns = $splat(options.columns);
		this.paginator = options.paginator ? new CIPaginator($extend(options.paginator, {paginates: this})) : null;
		this.toolbar = new CIToolbar(options.toolbar);
		
		this.addEvent(CIEvent.PropertyChanged, function(property,newValue, oldValue) {
			if (property == 'collection') this.render();
		}.bind(this));
		if (this._request.canPut)
			this.addEvent(CIEvent.PutData, this._onPostedData);
		else
			this.addEvent(CIEvent.PostedData, this._onPostedData);
		this.addEvent(CIEvent.GotData, function(newCollection) { if (!this.doNotSetDataAfterGet) this.setCollection(newCollection); }.bind(this));
		if (this.getAfterResourceChange) {
			this.addEvent(CIEvent.DeletedData, this._onGetAfterResourceChange);
			this.addEvent(CIEvent.PostedData, this._onGetAfterResourceChange);
			this.addEvent(CIEvent.PutData, this._onGetAfterResourceChange);
		}
	},
	
	_onGetAfterResourceChange: function() { this.getData(); },
	
	/*	Function: _makeElement(parent)
		Parent adopts Element
	*/
	_makeElement: function(parent) {
		var container = new Element('div', {
			id: this.id,
			'class': 'CITableContainer ' + this.cssClass,
			styles: this.cssStyles
		});
		parent.adopt(container);

		// Make title
		this._title = $type(this.title) == 'string' ? new CITitle({ title: this.title }) : this.title;
		this._title.element(container);
		this._request.setIndicator(this._title.indicator);
		
		// Make CIToolbar
		this.toolbar.element(container);
		
		// Make table
		var innerHeight = 'auto';
		// If the height is explicitly set in cssStyles, do some math to figure out what the container size should be
		if ($H(this.cssStyles).some(function(value, key) { return key.contains('eight'); })) {
			innerHeight = container.getStyle('height').toInt() -
						  this._title.element().getStyle('height').toInt() -
						  this.toolbar.element().getStyle('height').toInt();
		}
		
		var innerContainer = new Element('div', {
			'class': 'CITableInnerContainer',
			id: this.id + '_innerContainer',
			styles: { height: innerHeight }
		});
		container.adopt(innerContainer);
		var table = new Element('table', {
			id: this.id + '_table',
			cellpadding: this.style.get('cellPadding'),
			cellspacing: 0,
			styles: { width: '100%' }
		});
		table.store('CITable', this);
		container.adopt(innerContainer.adopt(table));
		
		// Make Header Row
		this._makeHeader();
		this.setCollection(this.collection);
		
		this._applyStyle();
		this._viewResized();
		return container;
	},
	
	_applyStyle: function(newStyle) {
		var style = newStyle || this.style;
		var container = this.element();
		if (style.get('hidden')) container.setStyle('display', 'none');
		// Background Color
		container.setStyle('background-color', style.get('backgroundColor'));
		// TODO Need to hide header row here
		if (style.get('hideHeaderRow') && this.headerRowElement())
			this.headerRowElement().setStyle('display', 'none');
		// Borders
		style.applyBordersOntoElement('solid', container.getChildren('.CITableInnerContainer')[0]);
		style.interpolateRoundedCornerMaskOntoElement(container.getChildren('.CITableInnerContainer')[0]);
	},
	
	/*
		Function: tableElement()
		Returns the Element representing the body of the table
		
		Returns:
			Element
	*/
	tableElement: function() {
		return $(this.id + '_table');
	},
	
	/*
		Function: getData(moreParams)
		Makes the get request to retreive table data, using moreParams which are overridden by getParams(), which are overriden by CIApplication.baseParams
		Fires <CIEvent.GotData> or <CIEvent.RequestFailed>
		
		Returns:
			This CITable
	*/
	getData: function(moreParams) {
		this._request.get(moreParams);
		return this;
	},
	
	getRecords: function(record, moreParams) {
		this._request.get(moreParams, record);
		return this;
	},
	
	postRecord: function(record, moreParams) {
		this._request.post(moreParams, record);
		return this;
	},
	
	putRecord: function(record, moreParams) {
		this._request.put(moreParams, record);
		return this;
	},
	
	deleteRecord: function(record, moreParams) {
		if (this.deletePrompt) {
			var sheet = CISheet.prompt(
				'Confirm Delete', this.deletePrompt,
				{ label: 'Delete', Clicked: function() {
					sheet.hide();
					this._request.destroy(moreParams || {}, record);
				}.bind(this) },
				{ label: 'Don&rsquo;t Delete' }
			);
		} else {
			this._request.destroy(moreParams || {}, record);
		}
		
		return this;
	},
	_makeHeader: function() {
		var headerTr = new Element('tr', { 'class': 'CITableHeaderRow', id: this.id + '_tableHeaderRow' });
		this.tableElement().adopt(headerTr);
		
		for (var columnCounter = 0; columnCounter < this.columns.length; columnCounter++) {
			var column = this.columns[columnCounter];
			var classes = ' ';
			if (columnCounter > 0) classes += 'CITableHeaderColumnLeftBorder';
			if (columnCounter < this.columns.length - 1) classes += ' CITableHeaderColumnRightBorder';
			
			var td = new Element('td', {
				html: column.header || '',
				'class': 'CITableHeaderColumn' + classes
			});
			headerTr.adopt(td);
		}
	},
	headerRowElement: function() {
		return $(this.id + '_tableHeaderRow');
	},
	/*
		Function: clear()
		Removes all rows and cells from the table. Does not clear the data
		
		Returns:
			This CITable
	*/
	clear: function() {
		$$('table#'+this.tableElement().id+' tr.CITableRow').each(function(row) {
			row.destroy();
		});
		return this;
	},
	
	innerContainerElement: function() {
		return $(this.id + '_innerContainer');
	},
	
	setCollection: function(newCollection) {
		if (this.paginator) newCollection = newCollection['CIPaginatorCollection'];
		this.set('collection', $splat(newCollection).clean());
	},
	
	getCollection: function() { return this.collection; },
		
	render: function() {
		if (!this.element()) return;
		
		this.clear();
		this.data = new TAFFY(this.collection);
		this.data.onUpdate = this._onTaffyUpdate.bind(this);
		
		if (this.collection.length == 0) {
			this.clear();
			var td = new Element('td', {
				colspan: this.columns.length,
				'class': 'CITableNoDataColumn',
				html: this.noDataText || 'No data to display.'
			});
			this.tableElement().adopt(new Element('tr', {'class':'CITableRow'}).adopt(td));
		}

		this.data.forEach(function(record, index) {
			record.__rowIndex = index;
			var paritySkin = (index % 2) == 0 ? 'CIEvenSkin' : 'CIOddSkin';
			var tr = new Element('tr', {
				id: this.id + '_row_' + index,
				'class': 'CITableRow CIHoverableSkin ' + paritySkin
			});
			tr.store('CITableRowIndex', index);
			this.tableElement().adopt(tr);
			this._makeCellsInRowUsingRecord(tr, record, index);
		}.bind(this));
		this.fireEvent(CIEvent.Rendered);
	},
	
	/*
		Function: removeSelection()
		Removes the selection and selected row. Fires <CIEvent.Changed>
		
		Returns:
			This CITable
	*/
	removeSelection: function() {
		if (this.selectedRowElement) CISelectionStyle.unselect(this.selectedRowElement);
		this.set('selectedRowElement', null);
		this.set('selectedRowIndex', null);
		this.set('selected', null);
		this.fireEvent(CIEvent.Changed);
		return this;
	},
	
	selectRow: function(indexOrTR, suppressSelectedEvent) {
		this.removeSelection();
		
		var tr = indexOrTR;
		if ($type(indexOrTR) == 'number') tr = $(this.id + '_row_' + indexOrTR);
		this.set('selectedRowElement', tr);
		this.set('selectedRowIndex', this.selectedRowElement.retrieve('CITableRowIndex'));
		this.set('selected', this.data.get(this.selectedRowIndex)[0]);
		this.fireEvent(CIEvent.Changed);
		
		CISelectionStyle.select(this.selectedRowElement);
		//var container = $(this.id + '_innerContainer');
		//container.scrollTo(this.selectedRowElement.getPosition(container).x, this.selectedRowElement.getPosition(container).y);
		if (!suppressSelectedEvent) this.fireEvent(CIEvent.Selected, [this.selected]);
		
		return this;
	},
	
	_onSelectRow: function(event) {
		this.fireEvent(CIEvent.Clicked, [event]);
		this.selectRow(event.target.getParent('.CITableRow'));
	},
	
	_makeColumnsHashIntoArray: function(hash) {
		var columns = [];
		hash.each(function(col, header) {
			col.header = col.header || header;
			columns.push(col)
		});
		return columns;
	},
	
	_viewResized: function(superview) {
		if (!this.element()) return;
		var newSize = this.frame.toCssStylesObject({}, superview);
		//console.log(this.id, 'has been told to resize to width of', newSize.width);
		
		this.element().setStyles(newSize);
		//this.subviews.each(function(view) { view._viewResized(this); }.bind(this));
	},
	
	_makeCellsInRowUsingRecord: function(tr, record, index) {
		for (var columnCounter = 0; columnCounter < this.columns.length; columnCounter++) {
			var column = this.columns[columnCounter];
			
			var styles = column.cssStyles;
			if (column.width) styles['CIFirmWidth'] = column.width;
			
			if (columnCounter < this.columns.length - 1) styles['border-right'] = '1px solid #CCC';
			
			var editable = column.editor != null && !this.useArray;
			if (editable) {
				column.editor.editableIf = column.editor.editableIf || $lambda(true);
				editable = editable && column.editor.editableIf(record[column.property], record);
			}
			var cssClass = column.cssClass || '';
			if (editable) {
				cssClass += ' CITableEditableCell';
				if (index < this.collection.length - 1) styles['border-bottom'] = '1px dotted #CCC';
			}
			
			var td = new Element('td', {
				styles: CIObject.interpretStyles(styles),
				'class': 'CITableCell ' + cssClass
			});
			if (this.selectable && !editable) {
				tr.addClass('CISelectableTableRow');
				td.addEvent('click', this._onSelectRow.bind(this));
			}
			if (editable) {
				column.editor.type = column.editor.type || 'text';
				td.addEvent('click', this._onEditCell.bind(this));
				td.store('CITableColumnEditorConfig', column.editor);
			}
			
			td.store('CITableColumnProperty', column.property);
			td.store('CITableRowIndex', index);
			
			tr.adopt(td);
			if (column.renderer) {
				var content = column.renderer(record[column.property], record, this, this.data, td, tr);
				if (content != null) {
					if ($type(content) == 'string')
						// Wrapped in a <span> because Element.getChildren will not return text nodes
						td.adopt(new Element('span', { html: content }));
					else if (content.objectId)	// CIObject
						content.element(td);
					else					// Element
						td.adopt(content);
				}
			} else {
				var value = (record[column.property] || '').toString();
				var html = column.dontEncodeEntityChars ? value : value.withEntityCharsEncoded();
				html = column.truncateAfter && html.length > column.truncateAfter.toInt() ? html.substr(0, column.truncateAfter.toInt()) + '...' : html;
				td.adopt(new Element('span', { html: html }));
			}
		}
	},
	
	_onTaffyUpdate: function(newRecord, oldRecord) {
		newRecord.__rowIndex = oldRecord.__rowIndex;
		var tr = $(this.id+'_row_'+oldRecord.__rowIndex);
		this._makeCellsInRowUsingRecord(tr.empty(), newRecord, newRecord.__rowIndex);
	},
	
	_onEditCell: function(event) {
		var td = event.target;
		if (td.get('tag') != 'td') td = event.target.getParent('td');
		 
		var config 	= td.retrieve('CITableColumnEditorConfig');
		var content = $splat(td.getChildren());
		var value 	=  '';
		var input, field, editingHudContent;
		var buttonHPanel = new CIHPanel({
			spacing: 5, valign: 'middle',
			cssStyles: { CIFirmWidth: 140 },
			content: [
				new CILink({
					label: 'Cancel',
					Clicked: this.stopEditing.bind(this)
				}),
				new CILink({
					label: 'Save',
					Clicked: this.commitChanges.bind(this)
				})
			]
		});
		
		if (config.useRecordProperty) {
			var property = td.retrieve('CITableColumnProperty');
			var index = td.retrieve('CITableRowIndex');
			value = this.collection[index][property];
			// Catch null values
			value = value ? value.toString() : '';
		} else {
			value = content.length > 0 ? content[0].get('html') : '';
		}
		if ($type(value) == 'string') config.value = value.withEntityCharsDecoded();
		config.labelStyles = { display: 'none' };
		config.padding = config.padding || 0;
		config.spacing = config.spacing || 0;
		
		if (config.type == 'textarea') {
			config.value = value.replace(/<br\/?>/g, '\n');
			config.cssStyles = config.cssStyles || {};
			config.cols = 32;
			config.rows = 6;
			field = new CIFormField(config);
			editingHudContent = new CIVPanel({
				spacing: 5,
				content: [ field, buttonHPanel ]
			});
		} else {
			field = new CIFormField(config);
			field.addEvent(CIEvent.EnterPressed, this.commitChanges.bind(this));
			field.addEvent(CIEvent.EscapePressed, this.stopEditing.bind(this));
			editingHudContent = new CIHPanel({
				spacing: 5, valign: 'middle',
				content: [ field, buttonHPanel ]
			});
		}
		
		if (this.editingHud) {
			if (this.editingHud._td != td)
				this.stopEditing();
			else
				return;
		}
		
		this.editingHud = new CIHud({
			title: "Editing Cell",
			subviews: editingHudContent,
			offset: { from: td, dx: 10, dy: 10 },
			hideCloseButton: true,
			firstResponder: field,
			Shown: function() { field.setValue(config.value); }
		});
		this.editingHud._td = td;
		CISelectionStyle.set(this.editingHud._td, 'editing');
		this.editingHud.show();
	},
	
	/*
		Function: stopEditing()
		Hides the editor <CIHud> and removes the 'editing' <CISelectionStyle>
	
		Returns:
			This CITable
	*/
	stopEditing: function() {
		if (!this.editingHud) return;
		CISelectionStyle.unset(this.editingHud._td, 'editing');
		this.editingHud.hide();
		this.editingHud = null;
		return this;
	},
	
	_onPostedData: function(newRecord, json) {
		if (!this.editingHud) return;
		
		var index = this.editingHud._td.getParent().retrieve('CITableRowIndex');
		if (this.responseWrapsObject) newRecord = newRecord[this.responseWrapsObject];
		this.stopEditing();
		this.data.update(newRecord, index);
	},
	
	/*
		Function: commitChanges()
		Make the request using the CITable's post. If succesful, the editing HUD is hidden and just the table row is updated using TaffyDB
		
		Returns:
			This CITable
	*/
	commitChanges: function() {
		if (!this.editingHud) return;

		var index = this.editingHud._td.getParent().retrieve('CITableRowIndex');
		var oldRecord = this.data.get(index)[0];
		var field = this.editingHud.content[0].children[0];
		var params = {}; params[field.name] = field.getValue();
		
		if (this._request.canPut)
			this._request.put(params, oldRecord);
		else
			this._request.post(params, oldRecord);
		return this;
	}
});