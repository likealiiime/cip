var CIVerticalTabPanel = new Class({
	Extends: CIView,
	
	initialize: function(configuration) {
		this.parent(configuration);
		this.isA('CIVerticalTabPanel');
		this.synthesize({
			style: CIVerticalTabPanel.Style,
			tabs: [],
			content: [],
			selectedIndex: null,
			selectedContentElement: null
		}, configuration);
		this.tabs = $splat(this.tabs);
		this.content = $splat(this.content);
		if (configuration.selectTab != undefined) {
			this.addEvent(CIEvent.AddedToDom, function() {
				this.selectTab(configuration.selectTab);
			}.bind(this));
		}
	},
	
	_makeElement: function(parent) {
		var tabPanel = new Element('div', {
			id: this.id,
			'class': 'CIVerticalTabPanel'
		});
		parent.adopt(tabPanel);
		var table = new Element('table', {
			id: this.id + '_TableElement',
			cellpadding: 0,
			cellspacing: 0,
			border: 0
		});
		tabPanel.adopt(table);
		var tr = new Element('tr');
		table.adopt(tr);
		
		var tabColumn = new Element('td', {
			id: this.id + '_TabColumn',
			'class': 'CIVerticalTabPanelTabColumn',
			valign: 'top',
			styles: {'vertical-align': 'top'}
		});
		tr.adopt(tabColumn);
		var contentColumn = new Element('td', {
			id: this.id + '_ContentColumn',
			'class': 'CIVerticalTabPanelContentColumn',
			valign: 'top',
			styles: {'vertical-align': 'top'}
		});
		tr.adopt(contentColumn);
		
		this.render();
		this.applyStyle();
		return tabPanel
	},
	
	tabColumnElement: function() {
		return $(this.id + '_TabColumn');
	},
	
	contentColumnElement: function() {
		return $(this.id + '_ContentColumn');
	},
	
	applyStyle: function(newStyle) {
		var style = newStyle || this.style || CIVerticalTabPanel.Style;
		var panel = this.element();
		this.tabColumnElement().setStyles({
			'background-color': style.get('tabColumnBackgroundColor')
		});
		this.tabColumnElement().getChildren().each(function(e) {
			e.setStyle('cursor', 'pointer');
		});
		this.contentColumnElement().setStyles({
			'background-color': style.get('contentColumnBackgroundColor'),
			'border-left-style': 'solid',
			'border-left-width': style.get('dividerWidth'),
			'border-left-color': style.get('dividerColor')
		});
	},
	
	unrender: function() {
		this.tabColumnElement().empty();
		this.contentColumnElement().empty();
		this.fireEvent(CIEvent.Unrendered);
	},
	
	render: function() {
		this.unrender();
		var i = 0;
		for (; i < this.tabs.length; i++) {
			var container = new Element('div', {
				'class':'CIVerticalTabPanelTabContainer'
			});
			this.tabColumnElement().adopt(container);
			var e = this.tabs[i].element(container);
			container.store('CIVerticalTabPanelIndex', i);
			container.addEvent('click', this._tabClicked.bind(this));
		}
		for (i = 0; i < this.content.length; i++) {
			var e = this.content[i].element(this.contentColumnElement());
			e.store('CIVerticalTabPanelIndex', i);
			e.hide();
		}
		this.fireEvent(CIEvent.Rendered);
	},
	
	_tabClicked: function(event) {
		this.fireEvent(CIEvent.Clicked, [event]);
		var tab = event.target.getParent('.CIVerticalTabPanelTabContainer');
		var index = tab.retrieve('CIVerticalTabPanelIndex');
		if (this.selectedContentElement) {
			CISelectionStyle.unselect(this.tabs[this.selectedIndex].element());
			this.selectedContentElement.hide();
		}
		this.setSelectedIndex(index);
		CISelectionStyle.select(this.tabs[index].element());
		this.setSelectedContentElement(this.content[index].element());
		this.selectedContentElement.show();
		this.fireEvent(CIEvent.Selected, [this.selectedIndex, this.selectedContentElement]);
	},
	
	selectTab: function(index) {
		var tab = this.tabs[index].element();
		this._tabClicked({ target: tab });
	}
});

CIVerticalTabPanel.Style = new CIStyle({
	tabColumnBackgroundColor: CIStyle.SourceBackgroundColor,
	contentColumnBackgroundColor: '#FFFFFF',
	dividerWidth: 2,
	dividerColor: CIStyle.DividerColor
});