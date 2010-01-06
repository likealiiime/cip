var CIPopupButton = new Class({
	Extends: CIButton,
	
	initialize: function(configuration) {
		this.parent(configuration);
		this.isA('CIPopupButton');
		this.synthesize({
			style: CIPopupButton.Style
		}, configuration);
		this._boundSubviewHiddenHandler = this._subviewHidden.bind(this);
		this.setSubviews(this.subviews);
		this.addEvent(CIEvent.Clicked, this._clicked);
	},
	
	setSubviews: function(newSubviews) {
		this.subviews[0].removeEvent(CIEvent.Hidden, this._boundSubviewHiddenHandler);
		this.set('subviews', new Array($splat(newSubviews)[0]));
		this.subviews[0].frame.positioning = CIRect.FlowPositioning;
		this.subviews[0].addEvent(CIEvent.Hidden, this._boundSubviewHiddenHandler);
		return this;
	},
	
	_subviewHidden: function() {
		this.hideSubview();
	},
	
	_viewResized: function(superview) {
		this.parent(superview);
		this.subviews[0]._viewResized(this);
	},
	
	_makeElement: function(parent) {
		var button = this.parent(parent);
		var layer = new Element('div', {
			id: this.id + '_CIPopupButtonSubviewContainer',
			'class': 'CIPopupButtonSubviewContainer',
			styles: { position: 'absolute' }
		});
		layer.hide();
		layer.inject(document.body, 'top');
		this.subviews[0].element(layer);
		return button;
	},
	subviewContainerElement: function() { return $(this.id + '_CIPopupButtonSubviewContainer'); },
	
	_clicked: function(event) {
		if (this.subviewIsHidden())
			this.showSubview();
		else
			this.hideSubview();
	},
	
	subviewIsHidden: function() {
		return this.subviewContainerElement().getStyle('display') == 'none';
	},
	
	hideSubview: function() {
		if (this.subviewContainerElement()) {
			//this.subviews[0].hide();
			this.subviewContainerElement().hide();
		}
	},
	
	showSubview: function() {
		if (!this.subviewIsHidden()) return;
		var buttonPos = this.element().getPosition();
		var subviewSize = this.subviews[0].frame.toCssStylesObject({}, this);
		subviewSize.top += buttonPos.y;
		subviewSize.left += buttonPos.x;
		subviewSize['z-index'] = CIModalLayer.nextZIndex();
		this._viewResized(this);
		this.subviews[0].fireEvent(CIEvent.Showing);
		this.subviews[0].element().show().setStyles({
			opacity: 1.0, visibility: 'visible'
		});
		subviewSize.position = 'absolute';
		
		this.subviewContainerElement().setStyles(subviewSize).show();
		this.subviews[0].fireEvent(CIEvent.Shown);
	}
});

CIPopupButton.Style = new CIStyle({
	capWidth: 12,
	capsImage: '/cip/images/widgets/CIPopupButton_caps.png',
	middleImage: '/cip/images/widgets/CIButton_mid.png',
	middleActiveImage: '/cip/images/widgets/CIButton_mid_active.png',
	textColor: CIStyle.TextColor
});