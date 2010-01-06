/* 
	Class: CITabPanel
	Represents tabs that hide and show content. The tab labels can be toggled in response to events

	Properties:
		id - String like CITabPanel_#
		_tabs - Array. An array of tab objects. Properties are: item, element, label
		selectedTabItem - Object. The selected item
		selectedTabElement - Object. The Element containing the selected item
		
		*See configuration for others*
	
	Events:
*/
// TODO fire Clicked, Changed, Selected
// TODO create CITab to encapsulate each tab
// TODO create tabForIndex(Number)
var CITabPanel = new Class({
	Extends: CIView,
	
	/*
		Constructor: initialize(configuration)
		
		Configuration:
			selectedTab - Number. The index of the tab to select upon creation
			tabs - Hash. The hash of tab labels as keys, and content as values
			tabBodyStyles - Hash. The CSS styles to apply to the container of the tab items
	*/
	initialize: function(options) {
		this.parent(options);
		this.isA('CITabPanel');
		this.synthesize({
			subviews: {},
			style: CITabPanel.Style,
			selectedIndex: null,
			selectedSubviewElement: null,
		}, options);
		this.selectedTab = options.selectedTab;
		// Hopefully this isn't a circular dependency
		this.setSubviews(this.subviews);
		
		if (options.selectTab != undefined) {
			this.addEvent(CIEvent.AddedToDom, function() {
				this.selectTab(options.selectTab);
			}.bind(this));
		}
	},
	
	setSubviews: function(tabs) {
		return this.set('subviews', new Hash(tabs));
	},
	
	/*	Function: _makeElement(parent)
		Parent adopts Element
	*/
	_makeElement: function(parent) {
		var tabPanel = new Element('div', {
			id: this.id,
			'class': 'CITabPanel',
			styles: this.frame.toCssStylesObject()
		});
		parent.adopt(tabPanel);
		var table = new Element('table', {
			id: this.id + '_TableElement',
			cellspacing: 0,
			cellpadding: 0,
			border: 0,
			'class': 'CITabPanelTableElement',
			styles: this.frame.toCssStylesObject()
		});
		tabPanel.adopt(table);
		var tabsTr = new Element('tr', { id: this.id + '_TabRowElement' });
		table.adopt(tabsTr);
		
		var bodyTr = new Element('tr', { id: this.id + '_SubviewsRowElement' });
		table.adopt(bodyTr);
		
		this.render();
		return tabPanel;
	},
	
	tableElement: function() { return $(this.id + '_TableElement'); },
	tabRowElement: function() { return $(this.id + '_TabRowElement'); },
	subviewsRowElement: function() { return $(this.id + '_SubviewsRowElement'); },
	subviewsContainerElement: function() { return $(this.id + '_SubviewsContainerElement'); },
	
	unrender: function() {
		if (!this.element()) return;
		this.tabRowElement().empty();
		this.subviewsRowElement().empty();
		this.fireEvent(CIEvent.Unrendered);
	},
	
	render: function() {
		this.unrender();
		
		var subviewsContainer = new Element('td', {
			id: this.id + '_SubviewsContainerElement',
			'class': 'CITabPanelSubviewsContainerElement',
			colspan: this.subviews.getLength(),
			valign: 'top', styles: { 'vertical-align': 'top' }
		});
		this.subviewsRowElement().adopt(subviewsContainer);
		// Render the tabs
		var width = 100.0 / this.subviews.getLength().toFloat();
		var i = 0;
		this.subviews.each(function(subview, label) {
			var styles = { width: width + '%' };
			if (i > 0) styles['border-left'] = '1px solid white';
			if (i < this.subviews.getLength() - 1) styles['border-right'] = '1px solid #AAA';
			
			var tab = new Element('td', {
				'class': 'CITabPanelTab', html: label, styles: styles
			});
			tab.store('CITabPanelTabIndex', i);
			this.tabRowElement().adopt(tab);
			tab.addEvent('click', this._tabClicked.bind(this));
			
			subview.element(subviewsContainer).hide();
			i++;
		}.bind(this));
		
		this._viewResized();
		this.applyStyle();
		this.fireEvent(CIEvent.Rendered);
	},
	
	_viewResized: function(superview) {
		if (!this.element()) return;
		this.tableElement().setStyles(this.frame.toCssStylesObject({}, superview));
		this.parent(superview);
		return this;
	},
	
	_tabClicked: function(event) {
		this.fireEvent(CIEvent.Clicked, [event]);
		var index = 0;
		if ($type(event.target) == 'number') {
			index = event.target;
		} else {
			index = (event.target.hasClass('CITabPanelTab') ? event.target : event.target.getParent('.CITabPanelTab')).retrieve('CITabPanelTabIndex');
		}
		
		if (this.selectedSubviewElement) {
			CISelectionStyle.unselect(this.selectedTabElement());
			this.selectedSubviewElement.hide();
		}
		this.setSelectedIndex(index);
		CISelectionStyle.select(this.selectedTabElement(), { inverse: true });
		this.setSelectedSubviewElement(this.subviewForIndex(index).element());
		this.selectedSubviewElement.show();
		this.fireEvent(CIEvent.Selected, [this.selectedIndex, this.selectedSubviewElement]);
	},
	
	selectedTabElement: function() { return this.tabRowElement().getChildren()[this.selectedIndex]; },
	subviewForIndex: function(index) { return this.subviews.get(this.subviews.getKeys()[index]); },
	
	applyStyle: function(newStyle) {
		var style = newStyle || this.style || CITabPanel.Style;
		var tabs = this.tabRowElement().getChildren();
		tabs.each(function(td, index) {
			if (index == 0) {
				style.strokeElementSide('solid', td, CIStyle.Top);
				style.strokeElementSide('solid', td, CIStyle.Left);
				style.strokeElementSide('solid', td, CIStyle.Bottom);
				style.roundElementCorner(td, CIStyle.TopLeft);
				style.roundElementCorner(td, CIStyle.BottomLeft);
			} else if (index == tabs.length - 1) {
				style.strokeElementSide('solid', td, CIStyle.Top);
				style.strokeElementSide('solid', td, CIStyle.Right);
				style.strokeElementSide('solid', td, CIStyle.Bottom);
				style.roundElementCorner(td, CIStyle.TopRight);
				style.roundElementCorner(td, CIStyle.BottomRight);
			} else {
				style.strokeElementSide('solid', td, CIStyle.Top);
				style.strokeElementSide('solid', td, CIStyle.Bottom);
			}
		});
	},
	
	/*
		Function: selectTab(tab)
		Select and show the specified tab
		
		Parameters:
			tab - Number or tab Object. If a Number, the index of the tab in _tabs, otherwise the tab object to choose
	
		Returns:
			This CITabPanel
	*/
	selectTab: function(index) {
		this._tabClicked({ target: index });
	}
});

CITabPanel.Style = new CIStyle({
	padding: 10,
	roundedCorners: CIStyle.AllCorners,
	solidBorders: CIStyle.AllSides,
	borderColor: CIStyle.BorderColor,
	borderSize: 1,
	roundedCornerRadius: 3
});