/*
	Class: CIModalLayer
	Represents a modal layer above the window. Content may still be added above the modal layer.
	Its element(parent) should never be called directly, instead use show(). It only exists in the DOM as long as it is visible
	
	Properties:
		id - String like CIModalLayer_#
*/
// TODO fire Showing, Shown, Hiding, Hidden, RemovedFromDom
var CIModalLayer = new Class({
	Extends: CIView,
	
	initialize: function() {
		this.parent();
		this.isA('CIModalLayer');
	},
	
	_makeElement: function(parent) {
		var layer = new Element('div', {
			id: this.id,
			'class': 'CIModalLayer'
		});
		layer.inject($$('body')[0], 'top');
		return layer;
	},
	
	/*
		Function: show()
		Show the modal layer above all other content
		
		Returns:
			Mootools.Fx.Tween
	*/
	show: function() {
		var e = this.element('CIModalLayer'); // This parent is just a dummy -- CIModalLayer always inserts at the top of the body
		e.setStyle('z-index', e.getStyle('z-index').toInt() + CIModalLayer._zIndexCounter++);
		e.fade('hide');
		e.setStyle('display', 'block');
		return new Fx.Tween(e, {
			property: 'opacity',
			duration: 200
		}).start(1.0);
	},
	
	/*
		Function: hide()
		Hide the modal layer
		
		Returns:
			Mootools.Fx.Tween
	*/
	hide: function() {
		var e = this.element();
		return new Fx.Tween(e, {
			property: 'opacity',
			duration: 200
		}).start(0).chain(function() {
			e.destroy();
		});
	}
});
CIModalLayer._zIndexCounter = 1;
CIModalLayer.nextZIndex = function() { return CIModalLayer._zIndexCounter++; }

/*
	Class: CISheet
	Represents a modal dialog component that slides from the top of the window, similar to Mac OS X's sheets. It only exists in the DOM when it is visible.
	Its element(parent) should not be called directly. Instead, call show() and hide()
	
	Properties:
		id - String like CISheet_#
		
		*See configuration for others*
	
	Events:
		- <CIEvent.Hidden>
		- <CIEvent.Shown>
*/
// TODO fire Showing, Hiding, and RemovedFromDom
var CISheet = new Class({
	Extends: CIView,
	
	/*
		Constructor: initialize(configuration)
		
		Configuration:
			title - String. The title of the sheet
			content - Array or CIObject. The content to show inside the sheet. If an array is provided, content is arranged vertically, top to bottom
			buttons - Array of Hashes or CILinks. The configurations for, or the CILinks to show in the button area beneath the content.
			The buttons are added in the order they are provided. If the buttons do not have an inline <CIEvent.Clicked> handler,
			they will automatically close the sheet when clicked. Default [{label:'OK'}]
			keepInDom - Boolean. Whether to retain the Element in the DOM after hiding. Use if you see positioning or size problems. Default false
	*/
	initialize: function(options) {
		this.parent(options);
		this.isA('CISheet');
		this.title = options.title || options.label;
		this.content = options.content;
		this.buttons = options.buttons || { 'default': { label: 'OK' } };
		this.keepInDom = options.keepInDom;
	},
	
	_makeElement: function(parent) {
		var sheet = new Element('div', {
			id: this.id,
			'class': 'CISheet ' + this.cssClass,
			styles: this.cssStyles
		});
		parent.adopt(sheet);
		
		new CITitle({
			title: this.title,
			style: CITitle.Style
		}).element(sheet);
		
		var contentDiv = new Element('div', { 'class': 'CISheetContentContainer' });
		sheet.adopt(contentDiv);
		if ($type(this.content) == 'array') this.content = new CIVPanel(this.content);
		this.content.element(contentDiv);
		
		var buttonsDiv = new Element('div', { 'class': 'CISheetButtonsContainer' });
		sheet.adopt(buttonsDiv);
		
		var destructiveButtons = new Element('div', { 'class': 'CISheetDestructiveButtonsContainer' });
		var otherButtons = new Element('div', { 'class': 'CISheetOtherButtonsContainer' });
		buttonsDiv.adopt(destructiveButtons);
		buttonsDiv.adopt(otherButtons);
		
		if (this.buttons.label) {
			if (!this.buttons.isCIObject) {
				this.buttons[CIEvent.Clicked] = this.buttons[CIEvent.Clicked] || this.hide.bind(this);
				this.buttons = new CIButton(this.buttons);
			}
			var wrapper = new Element('div', { 'class': 'CISheetButtonWrapper' });
			otherButtons.adopt(wrapper);
			this.buttons.element(wrapper);
		} else if ($type(this.buttons) == 'array') {
			this.buttons = { other: this.buttons };
		}

		$splat(this.buttons.destructive).each(function(button) {
			if (!button.isCIObject) {
				button[CIEvent.Clicked] = button[CIEvent.Clicked] || this.hide.bind(this);
				button = new CIButton(button);
			}
			var wrapper = new Element('div', { 'class': 'CISheetButtonWrapper' });
			destructiveButtons.adopt(wrapper);
			button.element(wrapper);
		}.bind(this));
		
		this.buttons.other = $splat(this.buttons.other);
		this.buttons.other.each(function(b, index) {
			if (!this.buttons.other[index].isCIObject) {
				this.buttons.other[index][CIEvent.Clicked] = this.buttons.other[index][CIEvent.Clicked] || this.hide.bind(this);
				this.buttons.other[index] = new CIButton(this.buttons.other[index]);
			}
			var wrapper = new Element('div', { 'class': 'CISheetButtonWrapper' });
			otherButtons.adopt(wrapper);
			this.buttons.other[index].element(wrapper);
		}.bind(this));
		
		if (this.buttons['default'] && !this.buttons['default'].isCIObject) {
			this.buttons['default'][CIEvent.Clicked] = this.buttons['default'][CIEvent.Clicked] || this.hide.bind(this);
			this.buttons['default'] = new CIButton(this.buttons['default']);
		}
		if (this.buttons['default']) {
			var wrapper = new Element('div', { 'class': 'CISheetButtonWrapper CISheetDefaultButton' });
			otherButtons.adopt(wrapper);
			this.buttons['default'].element(wrapper);
		}
		
		sheet.setStyle('top', sheet.getSize().y * -1);
		
		return sheet;
	},
	
	buttonsArray: function() {
		if (this.buttons.label) return $splat(this.buttons);
		console.log($splat(this.buttons.other));
		return $splat(this.buttons.destructive).extend($splat(this.buttons.other).extend($splat(this.buttons['default'])));
	},
	
	disable: function() {
		this.buttonsArray().each(function(button) { if (button.disable) button.disable(); });
	},
	
	enable: function() {
		this.buttonsArray().each(function(button) { if (button.enable) button.enable(); });
	},
	
	/*
		Function: hide()
		Hide the sheet, removing it from the DOM unless keepInDom is true. Fires <CIEvent.Hidden>
		
		Returns:
			Mootools.Fx.Tween
	*/
	hide: function() {
		var sheet = this.element();
		if (sheet == null) return;
		var dimensions = sheet.getSize();
		return new Fx.Tween(sheet, {
			property: 'top',
			duration: 300
		}).start(dimensions.y * -1).chain(function() {
			sheet.setStyle('top', dimensions.y * -1);
			if (this.keepInDom)
				sheet.setStyle('display', 'none');
			else
				sheet.destroy();
			this._modalLayer.hide();
			this.fireEvent(CIEvent['Hidden']);
		}.bind(this));
	},
	
	/*
		Function: show()
		Shows a <CIModalLayer>, then the sheet, automatically adding it to the DOM. Fires <CIEvent.Shown>
		
		Returns:
			Mootools.Fx.Tween
	*/
	show: function() {
		var tween;
		this._modalLayer = new CIModalLayer();
		this._modalLayer.show().chain(function() {
			var sheet = this.element(this._modalLayer.element());
			var dimensions = sheet.getSize();
			sheet.setStyle('left', (window.getSize().x / 2) - (dimensions.x / 2));
			sheet.setStyle('display', 'block');
			tween = new Fx.Tween(sheet, {
				property: 'top',
				duration: 200
			}).start(0).chain(function() { this.fireEvent(CIEvent.Shown); }.bind(this));
		}.bind(this));
		return tween;
	}
});

CISheet.TitleStyle = new CIStyle({
	textSize: '1.2em',
	padding: 5,
	gap: 5,
	backgroundColor: 'CCC',
	solidBorders: CIStyle.Bottom,
	borderSize: 1,
	borderColor: '#AAA',
	padding: 8
});

/*
	Function: CISheet.prompt(title, message, affirm, cancel)
	A shortcut to create and show a sheet that displays a message and prompts for a response. The configs for the buttons follow the same rules as buttons for the regular CISheet.
	
	Parameters:
		title - String. The title of the seet
		message - String. The message to display
		affirm - Hash or CILink. The affirmative button. Always on the right
		cancel - Hash or CILink. The cancel button. Always on the left. Default {label:'Cancel'}
	
	Returns:
		The CISheet shown
*/
CISheet.prompt = function(title, message, affirm, cancel) {
	cancel = cancel || { label: 'Cancel' };
	var _sheet = new CISheet({
		title: title,
		buttons: { 'other': cancel, 'default': affirm },
		content: new CIText(message),
		cssStyles: { CIFirmWidth: 500 }
	});
	_sheet.show(); return _sheet;
};
/*
	Function: CISheet.alert(title, message)
	A shortcut to create and show a sheet that displays a message with only an OK button.
	
	Parameters:
		title - String. The title of the seet
		message - String. The message to display
	
	Returns:
		The CISheet shown
*/
CISheet.alert = function(title, message) {
	var _sheet = new CISheet({
		title: title,
		buttons: { 'default': { label: 'OK' } },
		content: new CIText(message),
		cssStyles: { CIFirmWidth: 450 }
	});
	_sheet.show(); return _sheet;
};