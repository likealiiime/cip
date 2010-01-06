/* CIMenu is a dumb container. It needs its subviews to tell it which of them was clicked */
var CIMenu = new Class({
	Extends: CIVFlow,
	
	initialize: function(configuration) {
		this.parent(configuration);
		this.isA('CIMenu');
		this.synthesize({
			style: CIMenu.Style,
			selectedIndex: null
		}, configuration);
		this.setSubviews(this.subviews);
		/*this._responderField = new Element('input', {
			type: 'text',
			id: this.id + '_CIMenuResponderField',
			styles: { visibility: 'hidden', width: 0, height: 0 }
		});
		this._responderField.addEvent('keydown', this.respondToKeydownEvent.bind(this));
		this.addEvent(CIEvent.Shown, this._shown);
		this.addEvent(CIEvent.Hidden, this._hidden);*/
	},
	
	_shown: function() {
		this._responderField.focus();
		//console.log('focused');
	},
	_hidden: function() {
		this._responderField.blur();
		//console.log('blurred');
	},
	
	_makeElement: function(parent) {
		var menu = this.parent(parent);
		menu.addClass('CIMenu');
		menu.setStyle('box-shadow', '0 3px 3px #333');
		return menu;
	},
	
	respondToKeydownEvent: function(event) {
		//console.log(event.key);
	},
	
	setSubviews: function(newSubviews) {
		for (var i = 0; i < this.subviews.length; i++)
			this.subviews[i].menu = undefined;
		for (var i = 0; i < newSubviews.length; i++)
			newSubviews[i].menu = this;
		newSubviews.unshift(this.spacerView(CIStyle.TopLeft | CIStyle.TopRight));
		newSubviews.push(this.spacerView(CIStyle.BottomLeft | CIStyle.BottomRight));
		return this.set('subviews', newSubviews);
	},
	
	spacerView: function(corners) {
		return new CIView({
			frame: {
				width: CIRect.WidthOfSuperview().minus(function() {
					return this.getInt('borderSize') * 2 - 1;
				}.bind(this.style)),
				height: 3
			},
			style: new CIStyle({
				roundedCorners: corners,
				backgroundColor: this.style.get('backgroundColor'),
				roundedCornerRadius: this.style.get('roundedCornerRadius')
			})
		});
	},
	
	applyStyle: function(newStyle) {
		var style = newStyle || this.style || CIMenu.Style;
		var menu = this.element();
		if (!menu) return;
		this.parent(style);
		
		menu.setStyle('background-color', style.get('backgroundColor'));
		style.applyBordersOntoElement('solid', menu);
		style.interpolateRoundedCornerMaskOntoElement(menu);
	},
	
	hide: function() {
		this.fireEvent(CIEvent.Hiding);
		if (!this.element()) return;
		new Fx.Tween(this.element(), { property: 'opacity', duration: 200 }).start(0).chain(function() {
			this.element().hide();
			this.fireEvent(CIEvent['Hidden']);
		}.bind(this));
		return this;
	},
	
	selectSubview: function(subview) {
		this.setSelectedIndex(this.subviews.indexOf(subview));
		this.fireEvent(CIEvent.Selected, [subview]);
	},
	
	selectedSubview: function() {
		return this.selectedIndex == null ? null : this.subviews[this.selectedIndex];
	}
});
CIMenu.Style = new CIStyle({
	spacing: 0,
	padding: 0,
	solidBorders: CIStyle.AllSides,
	borderColor: CIStyle.BorderColor,
	borderSize: 1,
	backgroundColor: 'white',
	roundedCorners: CIStyle.AllCorners,
	roundedCornerRadius: 3
});
/*
	Class: CIMenu
	Represents a vertical, single-level menu. More like a list. Only exists in the DOM as long as it is on-screen. Implements CIOffsettable
	Its element method should not be called directly. Instead, use toggle(parent), hide(), and show(parent)
	
	Properties:
		id - String like CIMenu_#
		selected - Object. The object representing the selected item
		selectedIndex - Number. The index of the selected item
		
		*See configuration for others*
	
	Events:
		- Clicked
		- Changed
		- Selected

// TODO implement Showing, Shown, Hiding, Hidden, RemovedFromDom
var CIMenu = new Class({
	Extends: CIView,
	Implements: CIOffsettable,
	
	/*
		Constructor: initialize(configuration)
		
		Configuration:
			items - Array. The items to display in the list. See <Item Configuration>. Default []
			offset - Object. The CIOffsettable configuration. See <CIOffsettable>
		
		Item Configuration:
			html - String. The HTML to display for each item
			value - Mixed. The value representing the object
			cssClass - String. The cssClass to apply to each item's Element
	
	initialize: function(options) {
		this.parent(options);
		this.offset = options.offset;
		this.isA('CIMenu');
		this.items = $splat(options.items);
		this.offset = options.offset;
		this.selected = null
		this.selectedIndex = null;
	},
	
	_makeElement: function(parent) {
		this._makeOffsettable();
		var menu = new Element('div', {
			id: this.id,
			'class': 'CIMenu',
			// cssStyles' positioning takes precedence over the offset
			styles: $extend(this.offsetStyles, this.cssStyles)
		});
		menu.inject(parent, 'top');
		
		var container = new Element('div', {
			'class': 'CIMenuContentContainer',
			styles: CIObject.interpretStyles({
				CIFirmHeight: menu.getStyle('height'),
				CIFirmWidth: menu.getStyle('width')
			})
		});
		menu.adopt(container);
		
		this.items.each(function(item, index) {
			var cssClass = index % 2 == 0 ? 'CIEvenSkin' : 'CIOddSkin'
			var itemElement = new Element('div', {
				id: this.id + '_CIMenuItem_' + index,
				html: item.html,
				'class': 'CIMenuItem CIHoverableSkin CIClickableSkin ' + cssClass 
			});
			
			itemElement.store('CIMenuItemIndex', index);
			itemElement.addEvent('click', this._onClick.bind(this));
			container.adopt(itemElement);
		}.bind(this));
		
		var closeContainer = new Element('div', {
			'class': 'CIMenuCloseContainer'
		});
		menu.adopt(closeContainer);
		closeContainer.adopt(new Element('span', {
			'class': 'CIMenuCloseContainerText',
			html: 'Close&nbsp;'
		}));
		var closeButton = new Element('img', {
			src: '/cip/images/close.png',
			alt: 'Close Menu'
		});
		closeContainer.adopt(closeButton);
		closeContainer.addEvent('click', this.hide.bind(this));
		
		return menu;
	},
	
	/*
		Function: toggle(parent)
		Toogles the display of the menu, showing it inside the parent element, or document.body if none is provided
		
		Parameters:
			parent - Element or null. The parent into which to create the menu. Default document.body
			
		Returns:
			Mootools.Fx.Morph element
	
	toggle: function(parent) {
		if (this.element())
			return this.hide();
		else
			return this.show(parent);
	},
	
	/*
		Function: show(parent)
		Display of the menu, showing it inside the parent element, or document.body if none is provided
		
		Parameters:
			parent - Element or null. The parent into which to create the menu. Default document.body
			
		Returns:
			Mootools.Fx.Morph element
	
	show: function(parent) {
		var elem = this.element(parent || document.body);
		elem.fade('hide');
		elem.setStyle('display', 'block');
		return new Fx.Morph(elem, { duration: 150 }).start({
			opacity: [0,1],
			top: [this.offsetStyles.top, this.offsetStyles.top + this.offsetStyles.dy]
		}).chain(function() {
			this.fireEvent(CIEvent.Shown);
			this.element().getChildren('.CIMenuContentContainer')[0].getChildren('.CIMenuItem').each(function(e, i) {
				if (i == this.selectedIndex) CISelectionStyle.select(e);
			}.bind(this));
		}.bind(this));
	},
	
	/*
		Function: hide()
		Hide the menu. This completely removes the element from the DOM
		
		Returns:
			Mootools.Fx.Morph element
	
	hide: function() {
		var elem = this.element();
		if (!elem) return;
		var top = elem.getStyle('top').toInt();
		return new Fx.Morph(elem, { duration: 150 }).start({
			opacity: [1,0],
			top: [top, top - 20]
		}).chain(function() {
			elem.destroy(); this.fireEvent(CIEvent.Hidden);
		}.bind(this));
	},
	
	_onClick: function(event) {
		var index;
		if ($type(event) == 'number')
			index = event;
		else
			index = event.target.retrieve('CIMenuItemIndex');
		this.selected = this.items[index];
		this.selectedIndex = index;
		this.fireEvent(CIEvent.Changed, [this.selected.value]);
		if ($type(event) != 'number') this.fireEvent(CIEvent.Clicked, [event, this.selected.value]);
		this.hide();
	},
	
	/*
		Function: getValue()
		Return the value property of the selected object
		
		Returns
			Mixed
	
	getValue: function() {
		return this.selected.value;
	},
	
	/*
		Function: select(index)
		Select the item at the specified index
		
		Returns:
			This CIMenu 
	
	select: function(i) {
		if (!this.items[i]) return;
		this._onClick(i);
		return this;
	}
});*/