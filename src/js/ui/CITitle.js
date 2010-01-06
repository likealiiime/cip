/*
	Class: CITitle
	A CITitle just encapsulates a textual title and an adjacent toolbar
*/
var CITitle = new Class({
	Extends: CIView,
	
	initialize: function(configuration) {
		this.parent(configuration);
		this.isA('CITitle');
		
		this.synthesize({
			style: CITitle.Style,
			title: '',
			subviews: [],
			alignment: 'right',
			indicator: new CIIndicator({ cssStyles: { 'float': 'left' }})
		}, configuration);
		this.setSubviews(this.subviews);
	},
	
	setSubviews: function(newSubviews) {
		return this.set('subviews', $splat(newSubviews));
	},
	
	setTitle: function(newTitle) {
		this.set('title', newTitle);
		if (this._text) this._text.setText(this.title);
	},
	
	subviewsElement: function() { return $(this.id + '_CITitleSubviewsElement'); },
	
	textViewElement: function() { return this._text.element(); },
	
	_makeElement: function(parent) {
		var container = new Element('div', {
			id: this.id,
			'class': 'CITitle',
			styles: this.frame.toCssStylesObject()
		});
		parent.adopt(container);
		
		this.indicator.element(container);
		
		this._text = new CIText({
			cssClass: 'CITitleText',
			text: this.title,
			cssStyles: { 'float': 'left' }
		});
		this._text.element(container);
		
		container.adopt(new Element('div', {
			id: this.id + '_CITitleSubviewsElement',
			'class': 'CITitleSubviewsElement'
		}));
		
		this.render();
		return container;
	},
	
	unrender: function() {
		if (!this.element()) return;
		this.subviewsElement().empty();
		this.fireEvent(CIEvent.Unrendered);
	},
	
	render: function() {
		if (!this.element()) return;
		this.unrender();
		
		this.subviewsElement().setStyle('float', this.alignment);
		this.subviews.each(function(subview) {
			var div = new Element('div', {
				'class': 'CITitleContentItemContainer',
				styles: { 'margin-left': this.style.getInt('gap'), 'float': 'left' }
			});
			this.subviewsElement().adopt(div);
			subview.element(div);
		}.bind(this));
		
		this._viewResized();
		this.applyStyle();
		this.fireEvent(CIEvent.Rendered);
	},
	
	applyStyle: function(newStyle) {
		var style = newStyle || this.style || CITitle.Style;
		var container = this.element();
		if (style.get('hidden')) container.setStyle('display', 'none');
		container.setStyles({
			//'min-height': 20,
			padding: style.get('padding'),
			'background-color': style.get('backgroundColor')
		});

		this.textViewElement().setStyle('font-size', style.get('textSize'));

		style.applyBordersOntoElement('solid', container);
		style.interpolateBorderStyleMaskOntoElement('dotted', container);
		style.interpolateRoundedCornerMaskOntoElement(container);
	}
});

CITitle.Style = new CIStyle({
	backgroundColor: CIStyle.BackgroundColor,
	roundedCornerRadius: 3,
	roundedCorners: CIStyle.TopLeft | CIStyle.TopRight,
	borderSize: 1,
	borderColor: CIStyle.BorderColor,
	solidBorders: CIStyle.Top | CIStyle.Left | CIStyle.Right,
	dottedBorders: CIStyle.Bottom,
	textSize: '1.2em',
	padding: 5,
	gap: 5
});
CITitle.OnlyBottomBorderStyle = CITitle.Style.override({
	backgroundColor: 'none',
	roundedCorners: CIStyle.NoCorners,
	solidBorders: CIStyle.Bottom,
	dottedBorders: CIStyle.NoSides
});
CITitle.NakedStyle = new CIStyle({
	textSize: '1.2em',
	padding: 5,
	gap: 5
});
CITitle.UnroundedStyle = CITitle.Style.override({
	roundedCorners: CIStyle.NoCorners
});

CITitle.CIVerticalTabPanelStyle = new CIStyle({
	backgroundColor: CIStyle.SourceBackgroundColor,
	borderColor: CIStyle.BorderColor,
	solidBorders: CIStyle.Bottom,
	borderSize: 1,
	padding: 5,
	gap: 0
});
CITitle.HudStyle = CITitle.Style.override({
	backgroundColor: 'black',
	roundedCornerRadius: 5,
	solidBorders: CIStyle.Bottom,
	dottedBorders: CIStyle.NoSides,
	textSize: '0.9em',
	padding: 3
});