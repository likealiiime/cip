/*
	CIPaginator makes a lot of expectations. It expects:
		- an item count in CIPaginatorItemCount
		- the collection in CIPaginatorCollection
		- the page number in CIPaginatorPage, defaults to 1
	Properties:
		- page: Number, The current page
		- itemCount: Number, The total number of
	Options:
		+ paginates: The object to paginate. It looks for a data property
		- itemsPerPage: Number (Default 30)
*/
/*
	Class: CIPaginator
	A paginator component, usually added to a toolbar. When its element is added to the DOM, it adds a <CIEvent.GotData> handler to
	the target, paginates.
	
	Properties:
		id - String like CIPaginator_#
		page - Number. The current page. Default 1
		itemCount - Number. The total number of items being paginated
		*See configuration for others*
	
	Request Format:
		CIPaginator requests data for pages using the following params:
		CIPaginatorItemsPerPage - Number. The number of items to show on each page
		CIPaginatorPage - Number. The page to show
		
	Response Format:
		CIPaginator expects the get response to have the following format:
		CIPaginatorPage - Number. The page to show
		CIPaginatorItemCount - Number. The total number of items being paged
		CIPaginatorCollection - Array. The actual to show for this page
*/
// TODO better creation of paginator. Maybe CIPaginator.Attached event? CIPageable?
// TODO more event hooks
var CIPaginator = new Class({
	Extends: CIView,
	
	/*
		Constructor: initialize(configuration)
		
		Configuration:
			paginates - CIObject. The CIObject on which to call getData
			itemsPerPage - Number. The number of items to show per page. Default 30
			type - String. The type of paginator. Accepts 'alpha' or 'numeric'. Default 'numeric'
	*/
	initialize: function(options) {
		this.parent(options);
		this.isA('CIPaginator');
		this.paginates = options.paginates;
		this.itemsPerPage = options.itemsPerPage || 30;
		this.page = 1;
		this.itemCount = 0;
		this.type = options.type || 'numeric';
		this.filters = options.filters;
		if (this.filters) this.filters.paginator = this;
	},
	
	/* 	Function: _makeElement(parent)
		Parent adopts Element and listens for <CIEvent.GotData> on paginates
	*/
	_makeElement: function(parent) {
		var container = new Element('div', {
			id: this.id,
			'class': 'CIPaginator ' + this.cssClass,
			styles: {
				width: 400,
				height: 18,
				margin: '0 auto 0 auto'
			}
		});
		parent.adopt(container);
		// If this._onGotData is not explicitly bound to this, it will be bound to the parent object
		this.paginates.addEvent(CIEvent.GotData, this._onGotData.bind(this));
		
		if (this.filters) this.filters.element(this.paginates._title.contentElement());
		return container;
	},
	
	_onGotData: function(response, json) {
		if (!json) return;
		var container = this.element().empty();
		if (this.type == 'numeric') {
			this.page = (response.CIPaginatorPage || 1).toInt();
			this.itemCount = response.CIPaginatorItemCount.toInt();
			var pages = (this.itemCount / this.itemsPerPage).toInt();
			pages += this.itemCount / this.itemsPerPage - pages == 0 ? 0 : 2;
			
			if (pages < 10) {
				container.setStyle('width', pages * 30);
				pages.times(function(page) {
					if (page == 0) return;
					var link = new CIButton({
						label: page,
						style: this.page == page ? CIButton.SelectedPageStyle : CIButton.PageStyle,
						Clicked: function() { this.selectPage(page) }.bind(this)
					});
					link.element(container);
				}.bind(this));
			} else {
				if (pages <= 99)
					container.setStyle('width', 450);
				else if (pages <= 999)
					container.setStyle('width', 550);
				else
					container.setStyle('width', 650);
					
				var pagesets = [
					{ start: 1, end: 3 },
					{ start: this.page - 2, end: this.page + 2 },
					{ start: pages - 2, end: pages }
				];
				var cssClass, style;
				for (var setIndex = 0; setIndex < pagesets.length; setIndex++) {
					var set = pagesets[setIndex];
					for (var i = set.start; i <= set.end; i++) {
						if (i < 1 || i > pages) continue;
						style = setIndex  != 1 ? CIButton.PageStyle : (this.page == i ? CIButton.SelectedPageStyle : CIButton.PageStyle);
						var e = new CIButton({
							label: i,
							style: style,
							Clicked: this._selectPageUsingEvent.bind(this)
						}).element(container);
						e.store('CIPaginatorPage', i);
					}
					if (setIndex == 0) new CIElement('p', { styles: { 'float': 'left', margin: 0 }, html: '&nbsp;&laquo;&nbsp;&nbsp;'}).element(container);
					if (setIndex == 1) new CIElement('p', { styles: { 'float': 'left', margin: 0 }, html: '&nbsp;&raquo;&nbsp;&nbsp;'}).element(container);
				}
			} 
		} else if (this.type == 'alpha') {
			container.setStyle('width', CIPaginator.alphabet.length * 30);
			this.page = (response.CIPaginatorPage || 'A');
			CIPaginator.alphabet.each(function(letter) {
				var link = new CIButton({
					label: letter.toUpperCase(),
					style: this.page == letter ? CIButton.SelectedPageStyle : CIButton.PageStyle,
					Clicked: function() { this.selectPage(letter); }.bind(this)
				});
				link.element(container);
			}.bind(this));
		}
	},
	
	/*
		Function: selectPage(page)
		Sends a request to retrieve the data for the specified page
		
		Parameters:
			page - Number. The page to show
		
		Returns:
			This CIPaginator
	*/
	selectPage: function(page) {
		var params = {
			CIPaginatorItemsPerPage: this.itemsPerPage,
			CIPaginatorPage: page
		};
		if (this.filters) params[this.filters.name] = this.filters.toParam();
		this.paginates.getData(params);
		return this;
	},
	
	_selectPageUsingEvent: function(event) {
		this.selectPage(event.target.getParent().retrieve('CIPaginatorPage'));
	},
	
	reloadPage: function() {
		this.selectPage(this.page);
		return this;
	}
});
/*
	Constant: CIPaginator.alphabet
	An array of the characters to display for alpha-type paginators.
	First character is '#', then is 'a' through 'z', all lowercase.
*/
CIPaginator.alphabet = ['#', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z' ]
