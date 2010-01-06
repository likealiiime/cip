var CIFilter = new Class({
	Extends: CIView,
	
	initialize: function(configuration) {
		this.parent(configuration);
		this.isA('CIFilter');
		this.name = configuration.name;
		this.label = configuration.label || this.name;
		this.setSrc(configuration.src);
		this.setActive(configuration.active);
		this.setFilterSet(configuration.filterSet);
	},
	setSrc: function(newSrc) {
		this.src = newSrc;
		var match = this.src.match(/(.+?)\.(\w{3,4})$/);
		this.activeSrc = match[1] + '_active.' + match[2];
	},
	setActive: function(newActive) {
		this.set('active', newActive);
		if (!this._button) return;
		this._button.setSrc(this.active ? this.activeSrc : this.src);
		this.filterSet.reload();
	},
	setFilterSet: function(newFilterSet) {
		this.set('filterSet', newFilterSet);
	},
	toggleActive: function() {
		this.setActive(!this.active);
	},
	_makeElement: function(parent) {
		this._button = new CIImageLink({
			src: this.active ? this.activeSrc : this.src,
			alt: this.label,
			cssStyles: { 'margin-left': 8 },
			Clicked: this.toggleActive.bind(this)
		});
		return this._button.element(parent);
	}
});

var CIFilterSet = new Class({
	Extends: CIView,
	
	initialize: function(configuration) {
		this.parent(configuration);
		this.isA('CIFilterSet');
		this.name = configuration.name || 'CIFilterActiveFilters';
		this.filters = $splat(configuration.filters);
		this.toParam = configuration.toParam ? configuration.toParam.bind(this) : this.defaultToParam;
		this.filters.each(function(filter) { filter.setFilterSet(this); }.bind(this));
		this.paginator = configuration.paginator;
	},
	defaultToParam: function() {
		return this.filters.map(function(filter) { return filter.active ? filter.name : null; }).clean().join(',');
	},
	reload: function() {
		this.paginator.reloadPage();
	},
	_makeElement: function(parent) {
		var container = new Element('div', {
			id: this.id,
			'class': 'CIFilterSet',
			styles: this.cssStyles
		});
		parent.adopt(container);
		for (var i = 0; i < this.filters.length; i++)
			this.filters[i].element(container);
		
		return container;
	}
});