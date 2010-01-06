/*
	Class: CIButton
	The button component of CIP. Implements CIRequestable. By default, makes a get request
	when clicked. If post is provided, will make a post request. 
	
	Properties:
		id - String like CILink_#
		
		*See configuration for others*
	
	Events:
		- Clicked
		- GotData
		- PostedData
		- RequestFailed
*/
var CIButton = new Class({
	Extends: CIView,
	Implements: CIRequestable,

	/*
		Constructor: initialize(configuration)
		
		Configuration:
			label - String. The text to display inside the button
			icon - String. The URL to an icon to display to the left of the label
			get - String or Hash. See <CIRequestable>
			post - String or Hash. See <CIRequestable>
			disabled - Boolean. Whether the button is clickable. Default false
			doNotRequestOnClick - Boolean. Whether the button will send get/post requests. Default false
	*/
	initialize: function(options) {
		this.parent(options);
		this.isA('CIButton');
		this._makeRequestable(options);
		
		this.synthesize({
			style: CIButton.Style,
			label: '',
			iconSrc: null,
			disabled: false,
			doNotRequestOnClick: false
		}, options);
		this.frame.height = this.frame.height || 18;
		return this;
	},
	
	_onClick: function(event) {
		if (this.disabled) return;
		
		this.fireEvent(CIEvent.Clicked, [event]);
		if (this.doNotRequestOnClick) {
			event.stop();
			return false;
		} else {
			this.requestData();
		}
	},
	
	/*
		Function: requestData()
		Fire the get or post request. Defaults to get unless a post is found.
		Fires GotData, PostedData, or RequestFailed
	*/
	requestData: function(moreParams) {
		if (this._request.canGet)
			this._request.get(moreParams);
		else if (this._request.canPost)
			this._request.post(moreParams);
		return this;
	},
	
	getData: function(moreParams) {
		if (this._request.canGet) this._request.get(moreParams);
		return this;
	},
	
	postData: function(moreParams) {
		if (this._request.canPost) this._request.post(moreParams);
		return this;
	},
	
	/*  Function: _makeElement(parent)
		Parent adopts Element */
	_makeElement: function(parent) {
		var button = this;
		
		var elem = new Element('div', {
			id: this.id,
			'class': 'CIButton ' + (this.disabled ? 'CIDisabledButton' : '') + ' ' + this.cssClass,
			styles: this.cssStyles
		});
		parent.adopt(elem);
		elem.adopt(new Element('div', {
			id: this.id + '_CIButtonLeftCap',
			'class': 'CIButtonLeftCap'
		})).adopt(new Element('div', {
			id: this.id + "_CIButtonTextElement",
			'class': 'CIButtonMiddle HasText',
			html: this.label
		})).adopt(new Element('div', {
			id: this.id + '_CIButtonRightCap',
			'class': 'CIButtonRightCap'
		}));
		
		if (this.iconSrc) {
			new Element('div', {
				id: this.id + '_CIButtonIconElement',
				'class': 'CIButtonMiddle',
				html: '<img src="' + this.iconSrc + '" alt="' + this.label + '" title="' + this.label + '"/>',
				styles: { 'padding-right': 5 }
			}).inject(elem.getFirst(), 'after');
		}
		
		elem.addEvent('mousedown', function() {
			if (!button.disabled && this.style.get('capsImage') && this.style.get('middleActiveImage')) {
				var style = this.style;
				var height = this.frame.getHeight() || 18;
				var capWidth = (style.get('capWidth') || 10).toInt();
				this.leftCapElement().setStyle('background-position', '0 ' + (height * -1) + 'px');
				this.rightCapElement().setStyle('background-position', (capWidth * -1).toString() + 'px ' + (height * -1) + 'px');
				this.middleElements().each(function(e) {
					e.setStyle('background-image', 'url(' + style.get('middleActiveImage') + ')');
				});
			}
		}.bind(this));
		elem.addEvent('mouseup', function() {
			if (!button.disabled) {
				var style = this.style;
				var height = this.frame.getHeight() || 18;
				var capWidth = (style.get('capWidth') || 10).toInt();
				this.leftCapElement().setStyle('background-position', '0 0');
				this.rightCapElement().setStyle('background-position', (capWidth * -1).toString() + 'px 0');
				this.middleElements().each(function(e) {
					e.setStyle('background-image', 'url(' + style.get('middleImage') + ')');
				});
			}
		}.bind(this));
		elem.addEvent('click', this._onClick.bind(this));
		
		this._viewResized();
		this.applyStyle();
		return elem;
	},
	
	leftCapElement: function() 	{ return $(this.id + '_CIButtonLeftCap'); },
	rightCapElement: function() { return $(this.id + '_CIButtonRightCap'); },
	middleElements: function() 	{ return this.element() ? this.element().getChildren('.CIButtonMiddle') : null; },
	iconElement: function() 	{ return $(this.id + '_CIButtonIconElement'); },
	textElement: function() 	{ return $(this.id + "_CIButtonTextElement"); },
	
	_viewResized: function(superview) {
		if (!this.element()) return;
		var newSize = this.frame.toCssStylesObject({}, superview);
		this.element().setStyles(newSize);
		
		var iconElemWidth = this.iconElement() ? this.iconElement().getWidth() : 0;
		var width = this.frame.getWidth() - (this.style.getInt('capWidth') * 2) - iconElemWidth;
		this.textElement().setStyle('width', width);
	},
	
	applyStyle: function(newStyle) {
		var elem = this.element();
		if (!elem) return;
		
		var style = newStyle || this.style || CIButton.Style;
		var height = this.frame.getHeight() || 18;
		var capWidth = (style.get('capWidth') || 10).toInt();
		
		elem.setStyles({
			height: style.get('height') || height,
			color: style.get('textColor') || CIStyle.TextColor
		});
		this.leftCapElement().setStyles({
			height: style.get('height') || height,
			width: style.get('capWidth') || capWidth
		});
		elem.getChildren('.CIButtonMiddle').each(function(e) { e.setStyle('height', height); });
		this.rightCapElement().setStyles({
			height: style.get('height') || height,
			width: style.get('capWidth') || capWidth
		});
		if (style.get('capsImage')) {
			this.leftCapElement().setStyles({
				'background-image': 'url(' + style.get('capsImage') + ')',
				'background-position': '0 0'
			});
			this.rightCapElement().setStyles({
				'background-image': 'url(' + style.get('capsImage') + ')',
				'background-position': (capWidth * -1).toString() + 'px 0'
			});
		}
		if (style.get('middleImage')) {
			this.middleElements().each(function(e) {
				e.setStyles({
					'background-image': 'url(' + style.get('middleImage') + ')',
					'background-repeat': 'repeat-x'
				});
			});
		}
	},
	
	/*
		Function: setLabel(newLabel)
		Set the text label
		
		Paramters:
			newLabel - String. The new label
		
		Returns:
			This CILink
	*/
	setLabel: function(newLabel) {
		this.set('label', newLabel);
		if (this.element()) this.element().getChildren('.HasText').set('html', this.label);
		return this;
	},
	
	/*
		Function: enable()
		Enables the CILink to clicking
		
		Returns:
			This CILink
	*/
	enable: function(newLabel) {
		this.setDisabled(false);
		if (newLabel) this.setLabel(newLabel);
		return this;
	},
	
	/*
		Function: disable()
		Disables the CILink to clicking
		
		Returns:
			This CILink
	*/
	disable: function(newLabel) {
		this.setDisabled(true);
		if (newLabel) this.setLabel(newLabel);
		return this;
	},
	
	setDisabled: function(isDisabled) {
		this.set('disabled', isDisabled);
		if (this.disabled)
			this.element().addClass('CIDisabledButton');
		else
			this.element().removeClass('CIDisabledButton');
		return this;
	}
});
var CILink = CIButton;
CIButton.Style = new CIStyle({
	capWidth: 10,
	capsImage: '/cip/images/widgets/CIButton_caps.png',
	middleImage: '/cip/images/widgets/CIButton_mid.png',
	middleActiveImage: '/cip/images/widgets/CIButton_mid_active.png',
	textColor: CIStyle.TextColor
});
CIButton.PageStyle = new CIStyle({
	height: 18,
	textColor: '#AAA'
});

/*
	Class: CIImageLink
	Represents a clickable image. *Incomplete implementation*
*/
var CIImageButton = new Class({
	Extends: CIButton,
	
	initialize: function(options) {
		this.parent(options);
		this.isA('CIImageButton');
		this.setSrc(options.src);
		this.alt = options.alt;
	},
	setSrc: function(newSrc) {
		this.set('src', newSrc);
		if (this.imageElement()) this.imageElement().src = this.src;
	},
	
	imageElement: function() { return this.element(); },
	
	_makeElement: function(parent) {
		var img = new Element('img', {
			id: this.id,
			src: this.src,
			alt: this.alt,
			title: this.alt,
			styles: this.cssStyles,
			'class': 'CIImageButton ' + this.cssClass
		});
		img.addEvent('click', this._onClick.bind(this));
		
		parent.adopt(img);
		return img;
	},
	
	_viewResized: function(superview) {

	},
});
var CIImageLink = CIImageButton;