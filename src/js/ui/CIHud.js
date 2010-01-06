/*
	Class: CIHud
	Represents a floating panel, a _H_eads _U_p _D_isplay. Implements CIOffsettable.
	Tts element(parent) should not be called directly, instead call show(). It exists in the DOM
	only as long as it is visible
	
	Properties:
		id - String like CIHud_#
		dragHandler - Mootools.Drag.Move. The object that allows CIHuds to be freely positionable.
		
		*See configuration for others*
	
	Events:
		- <CIEvent.Shown>
		- <CIEvent.Hiding>
		- <CIEvent.RemovingFromDom>
		- <CIEvent.RemovedFromDom>
		- <CIEvent.Hidden>
*/
var CIHud = new Class({
	Extends: CIView,
	Implements: CIOffsettable,
	
	/*
		Constructor: initialize(configuration)
		
		Configuration:
			offset - Hash. How to offset the CIHud when shown. See <CIOffsettable>
			title - String. The title of the CIHud. Default ''
			content - Array. The content inside the hud, displayed vertically, top to bottom. Default []
			padding - Number. The padding inside the body of the hud. Default 5
			hideCloseButton - Boolean. Whether to hide the close button. Default false
	*/
	initialize: function(options) {
		this.parent(options);
		this.offset = options.offset;
		this.isA('CIHud');
		this.title = options.title || options.label || '';
		this.content = $splat(options.content);
		this.hideCloseButton = options.hideCloseButton;
		this.padding = options.padding; // 0 || 5 == 5
		if (this.padding == null) this.padding = 5;
		this.dragHandler = null;
	},
	
	_makeElement: function(parent) {
		this._makeOffsettable(this.offset);
		
		var hud = new Element('div', {
			id: this.id,
			'class': 'CIHud',
			styles: this.offsetStyles
		});
		hud.inject(document.body, 'top');
		hud.setStyle('z-index', hud.getStyle('z-index').toInt() + CIModalLayer.nextZIndex());
		
		this._title = $type(this.title) == 'string' ? new CITitle({ title: this.title, style: CITitle.HudStyle }) : this.title;
		this._title.addSubview(new CIImageButton({
			src: '/cip/images/icons/close_white.png',
			Clicked: function() { this.hide(); }.bind(this)
		}));
		this._title.element(hud);
		
		var titleContainer = new Element('table', {
			'class': 'CIHudTitleContainer',
			styles: { width: '100%' },
			cellpadding: 0, cellspacing: 0
		});
		//hud.adopt(titleContainer);
		
		this.dragHandler = new Drag.Move(hud, {
			onStart: function(elem) {
				this.fireEvent(CIEvent.DragStarted, [elem]);
			}.bind(this),
			handle: this._title.element()
		});
		
		var container = new Element('div', {
			'class': 'CIHudContentContainer',
			styles: { padding: this.padding }
		});
		hud.adopt(container);
		
		this.subviews.each(function(subview) { subview.element(container); });
		
		this.fireEvent(CIEvent.Rendered);
		return hud;
	},
	
	/*
		Function: show()
		Show the CIHud. Fires <CIEvent.Shown>
		
		Returns:
			Mootools.Fx.Morph
	*/
	show: function(offset) {
		if (this.element()) return;
		var hud = this.element(document.body);
		hud.setStyle('display', 'block');
		return new Fx.Morph(hud, { duration: 200 }).start({
			top: this.offsetStyles.top + this.offsetStyles.dy,
			left: this.offsetStyles.left + this.offsetStyles.dx,
			opacity: [0, 1]
		}).chain(function() { this.fireEvent(CIEvent.Shown); }.bind(this));
	},
	
	/*
		Function: hide()
		Hide the CIHud and remove its element from the DOM. Fires the following events in order:
		<CIEvent.Hiding> -> <CIEvent.RemovingFromDom> -> (element destroyed) -> <CIEvent.RemovedFromDom> -> <CIEvent.Hidden>
		
		Returns:
			Mootools.Fx.Morph
	*/
	hide: function() {
		var hud = this.element();
		if (!hud) return;
		return new Fx.Morph(hud, { duration: 200 }).start({
			top: this.offsetStyles.top,
			left: this.offsetStyles.left,
			opacity: 0
		}).chain(function() {
			this.fireEvent(CIEvent.Hiding, [hud]);
			this.fireEvent(CIEvent.RemovingFromDom, [hud]);
			hud.destroy();
			this.fireEvent(CIEvent.Unrendered);
			this.fireEvent(CIEvent.RemovedFromDom);
			this.fireEvent(CIEvent.Hidden);
		}.bind(this));
	}
});

/*
	Class: CIHUD
	An alternate name for CIHud
*/
var CIHUD = CIHud;