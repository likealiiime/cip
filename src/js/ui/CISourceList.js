/*
	Class: CISourceList
	Represents a 1-column list of items. Commonly used to select source. Implements CIRequestable only for get.
	
	Properties:
		id - String like CISourceList_#
		collection - Array. The collection of objects in the CISourceList. Set on each get, but can be set in config
		selected - Object. The currently selected object
		selectedElement - Element. The Element representing the currently selected object in the CISourceList
		
		*See configuration for others*
	
	Events:
		- CIClicked
		- CISelected
*/
// TODO create a CICell class for CISourceList, CITable, CIMenu and CIAutocomplete
var CISourceList = new Class({
	Extends: CIView,
	Implements: CIRequestable,
	
	/*
		Constructor: initialize(options)
		
		Configuration:
			get - String or Hash. See <CIRequestable>
			title - String. The title for the CISourceList. Displayed above the toolbar
			toolbar - Hash. The configuration for the toolbar to appear below the title and above the list. Default {}
			labelProperty - String. The property on the received objects to display. Default 'label'
			collection - Array. The collection of objects in the CISourceList. Default []
			identifyBy - String. The property by which to _uniquely_ identify each object in the collection. Default 'id'
	*/
	initialize: function(options) {
		this.parent(options);
		this.isA('CISourceList');
		
		this._makeRequestable(options, 'get');
		this._request.addEvent(CIEvent.GotData, this._onGotData.bind(this));
		this.synthesize({
			noun: null,
			selected: null,
			selectedIndex: null,
			selectedElement: null,
			renderer: null,
			labelProperty: 'label',
			identifyBy: 'id',
			title: 'title',
			style: CISourceList.Style,
			collection: [],
			noDataText: '&nbsp;'
		}, options);
		
		this.toolbar = new CIToolbar(options.toolbar);
		this.subviews = [
			$type(this.title) == 'string' ? new CITitle({ title: this.title }) : this.title,
			this.toolbar
		];
		this.collection = $splat(options.collection);
		this.collectionLength = this.collection.length;
		
		this.addEvent(CIEvent.AddedToDom, this.render);
	},
	
	_makeElement: function(parent) {
		var sourceList = new Element('div', {
			id: this.id,
			'class': 'CISourceList ' + this.cssClass,
			styles: this.frame.toCssStylesObject()
		});
		parent.adopt(sourceList);
		
		var titleContainer = new Element('div', {
			id: this.id + '_CISourceListTitleContainer',
			'class': 'CISourceListTitleContainer'
		});
		sourceList.adopt(titleContainer);
		
		this.subviews[0].element(titleContainer);
		this._request.setIndicator(this.subviews[0].indicator);
		
		this.subviews[1].element(titleContainer);
		
		sourceList.adopt(new Element('div', {
			id: this.id + '_CISourceListCellContainer',
			'class': 'CISourceListCellContainer'
		}));
		
		this.applyStyle();
		return sourceList;
	},
	
	cellContainerElement: function() { return $(this.id + '_CISourceListCellContainer'); },
	titleContainerElement: function() { return $(this.id + '_CISourceListTitleContainer'); },
	titleView: function() { return this.subviews[0]; },
	
	setTitle: function(newTitle) { this.titleView().setTitle(newTitle); },
	
	applyStyle: function(newStyle) {
		var style = newStyle || this.style;
		var container = this.cellContainerElement();
		style.applyBordersOntoElement('solid', container);
	},
	
	removeCells: function() {
		var elems = this.element().getElements('.CISourceListCell');
		for (var i = 0; i < elems.length; i++) elems[i].destroy();
		return this;
	},
	
	setCollection: function(newCollection) {
		this.set('collection', $splat(newCollection));
		this.set('collectionLength', this.collection.length);
		this.render();
	},
	
	_onCellClick: function(event) {
		this.fireEvent(CIEvent.Clicked, [event]);
		var element = event.target.getParent('.CISourceListCell') || event.target;
		if (this.selectedElement) CISelectionStyle.unselect(this.selectedElement);
		this._selectElement(element);
	},
	
	_selectElement: function(element) {
		this.deselect();
		this.set('selectedElement', element);
		this.set('selectedIndex', element.retrieve('CISourceListIndex'));
		this.set('selected', this.collection[this.selectedIndex]);
		
		CISelectionStyle.select(this.selectedElement);
		this.fireEvent(CIEvent.Selected, [this.selected]);
		this.fireEvent(CIEvent.Changed);
	},
	
	_viewResized: function(superview) {
		if (!this.element()) return;
		var newSize = this.frame.toCssStylesObject({}, superview);
		
		this.cellContainerElement().setStyles({
			overflow: 'auto',
			height: newSize.height - this.titleContainerElement().getSize().y
		});
		this.parent(superview);
	},
	
	render: function() {
		var container = this.cellContainerElement();
		this.removeCells();
		
		if (this.collection.length == 0) {
			var cell = new Element('div', {
				'class': 'CISourceListEmptyListCell CISourceListCell',
				styles: { 'font-weight': 'bold', padding: 10, 'text-align': 'center' },
				html: this.noDataText
			});
			container.adopt(cell);
			return this;
		}
		
		for (var counter = 0; counter < this.collection.length; counter++) {
			var item = this.collection[counter];
			var backgroundColor = counter % 2 == 0 ? this.style.get('evenBackgroundColor') : this.style.get('oddBackgroundColor')
			var cell = new Element('div', {
				styles: { 'background-color': backgroundColor },
				'class': 'CISourceListCell'
			});
			cell.store('CISourceListIndex', counter);
			cell.addEvent('click', this._onCellClick.bind(this));
			container.adopt(cell);
			
			var value = $type(item) == 'string' ? item : item[this.labelProperty];
			if (this.renderer) {
				var view = this.renderer(value, item, this);
				view.element(cell);
			} else {
				cell.set('html', value);
			}
			if (this.selected && (this.selected[this.identifyBy] === item[this.identifyBy]))
				this._selectElement(cell);
		}
		this._viewResized(this.superview);
		this.fireEvent(CIEvent.Rendered);
		return this;
	},
	
	_onGotData: function(collection, json) {
		this.setCollection(collection);
	},
	
	reload: function(moreParams) {
		this._request.get();
	},
	
	getData: function(moreParams) { this.reload(moreParams); },
	
	deselect: function() {
		if (this.selectedElement) CISelectionStyle.unselect(this.selectedElement);
		this.selectedElement = null;
		this.selectedIndex = null;
		this.selected = null;
		this.fireEvent(CIEvent.Deselected);
	},
	
	hasObjectWithValue: function(value) {
		for (var i = 0; i < this.collection.length; i++)
			if (this.collection[i][this.identifyBy] == value) return true
			
		return false;
	},
	
	selectByProperty: function(value) {
		for (var i = 0; i < this.collection.length; i++) {
			if (this.collection[i][this.identifyBy] == value) {
				this._selectElement(this.element().getElements('.CISourceListCell')[i]);
				break;
			}
		}
		return this;
	},
	
	selectByIndex: function(index) {
		var elems = this.element().getElements('.CISourceListCell');
		if (elems[index]) this._selectElement(elems[index]);
		return this;
	}
});

CISourceList.Style = new CIStyle({
	evenBackgroundColor: '#FFFFFF',
	oddBackgroundColor: CIStyle.OddColor,
	solidBorders: CIStyle.Left | CIStyle.Right | CIStyle.Bottom,
	borderColor: CIStyle.BorderColor,
	borderSize: 1
});