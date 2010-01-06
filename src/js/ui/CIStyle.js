var CIStyle = new Class({
	Extends: CIObject,
	
	initialize: function(style) {
		this.parent();
		this.isA('CIStyle');
		this.synthesize(['style']);
		this.style = $H(style);
	},
	
	get: function(key) { return this.style.get(key); },
	
	override: function(newStyleObject) {
		var newStyle = new CIStyle();
		// Make a shallow copy of the base styles
		this.style.each(function(value, style) {
			newStyle.style.set(style, value);
		});
		newStyle.style.extend(newStyleObject);
		
		return newStyle;
	},
	
	applyBordersOntoElement: function(borderStyle, element) {
		element.setStyle('border-width', this.get('borderSize') || 0);
		element.setStyle('border-color', this.get('borderColor') || CIStyle.BorderColor);
		this.interpolateBorderStyleMaskOntoElement(borderStyle, element);
	},
	
	interpolateBorderStyleMaskOntoElement: function(borderStyle, element) {
		var mask = this.get(borderStyle+'Borders');
		['Top', 'Left', 'Right', 'Bottom'].each(function(side) {
			if ((mask & CIStyle[side]) != 0) element.setStyle('border-'+side.toLowerCase()+'-style', borderStyle);
		});
	},
	
	strokeElementSide: function(style, element, side) {
		var sideName = CIStyle.SideNames[side];
		var styles = {};
		// We still check against the mask because otherwise it would always override overridden styles
		if ((this.get(style+'Borders') & side) != 0) {
			styles['border-' + sideName + '-style'] = style;
			styles['border-' + sideName + '-width'] = this.getInt('borderSize');
			styles['border-' + sideName + '-color'] = this.get('borderColor');
			element.setStyles(styles);
		}
	},
	
	roundElementCorner: function(element, corner) {
		var radius = this.getInt('roundedCornerRadius').toString() + 'px';
		var cornerName = CIStyle.CornerNames[corner];
		if ((this.get('roundedCorners') & corner) != 0) {
			element.style['-webkit-border-' + cornerName + '-radius'] = radius;
			element.setStyle('-moz-border-radius-' + cornerName.replace('-',''), radius);
			element.style['border-' + cornerName.toLowerCase() + '-radius', radius];
		}
	},
	
	interpolateRoundedCornerMaskOntoElement: function(element) {
		var mask = this.get('roundedCorners');
		var radius = this.getInt('roundedCornerRadius').toString() + 'px';
		['Top-Left', 'Top-Right', 'Bottom-Left', 'Bottom-Right'].each(function(corner) {
			if ((mask & CIStyle[corner.replace('-', '')]) != 0) {
				element.style['-webkit-border-'+corner.toLowerCase()+'-radius'] = radius;
				element.setStyle('-moz-border-radius-'+corner.toLowerCase().replace('-',''), radius);
				element.style['border-'+corner.toLowerCase()+'-radius', radius];
			}
		});
	},
	
	getInt: function(key) {
		var value = this.get(key);
		return value ? value.toInt() : 0;
	}
});

/*
	Class: CISelectionStyle
	CISelectionStyle is a class of static functions that sets the background images of components, usually cells.
*/
// TODO Move into CIStyle
var CISelectionStyle = {
	determineBackgroundHeight: function(element) {
		var elemHeight = element.getSize().y;
		if (elemHeight > 19 && elemHeight <= 22)
			return 22;
		else if (elemHeight > 22 && elemHeight <= 25)
			return 25;
		else if (elemHeight > 25 && elemHeight <= 35)
			return 35;
		else
			return 150;
	},
	stashAndAddClasses: function(element, cssClass, auxClass) {
		auxClass = auxClass || cssClass.split('Skin')[0];
		element.addClass(auxClass);
		element.store('CISelectionStyleCssClass', cssClass);
		element.addClass(cssClass);
	},
	unstashAndRemoveClasses: function(element, auxClass) {
		element.removeClass(auxClass);
		element.removeClass(element.retrieve('CISelectionStyleCssClass'));
	},
	
	/*
		Function: select(element, options)
		Apply the CISelectedSkin style to the element. Remembers the element's style
		
		Parameters:
			element - Element. The element to which to apply the styles
			options - Hash. Specify inverse: true to apply the inversed style. Default {}
	*/
	select: function(element, options) {
		options = options || {};
		var bgHeight = CISelectionStyle.determineBackgroundHeight(element);
		
		if (options.inverse) { bgHeight += '_inverse'; }
		
		var selectedClass = 'CISelectedSkin_' + bgHeight;
		element.addClass('CISelected');
		element.store('CISelectionStyle_selectedClass', selectedClass);
		element.addClass(selectedClass);
	},
	
	/*
		Function: unselect(element)
		Remove the CISelectedSkin styles from the element
		
		Parameters:
			element - Element. The element from which to remove the styles
	*/
	unselect: function(element) {
		element.removeClass('CISelected');
		element.removeClass(element.retrieve('CISelectionStyle_selectedClass'));
	},
	
	/*
		Function: set(element, style)
		Apply the specified style to the element
		
		Parameters:
			element - Element. The element to which to apply the styles
			style - String. The name of the style to apply. So far, only 'selected' and 'editing' are supported
	*/
	set: function(element, style) {
		var auxClass = 'CI' + style.capitalize().camelCase();
		var bgHeight = CISelectionStyle.determineBackgroundHeight(element);
		CISelectionStyle.stashAndAddClasses(element, auxClass + 'Skin_' + bgHeight, auxClass);
	},
	
	/*
		Function: unset(element, style)
		Remove the specified style from the element
		
		Parameters:
			element - Element. The element from which to remove the styles
			style - String. The name of the style to remove. So far, only 'selected' and 'editing' are support
	*/
	unset: function(element, style) {
		var auxClass = 'CI' + style.capitalize().camelCase();
		CISelectionStyle.unstashAndRemoveClasses(element, auxClass);
	}
};

CIStyle.BorderColor = '#CCCCCC';
CIStyle.TextColor	= '#333333';
CIStyle.BackgroundColor = '#F9F9F9';
CIStyle.OddColor = '#F0F0F0';
CIStyle.SourceBackgroundColor = '#EBEFFC';
CIStyle.DividerColor = '#B0B7D4';

CIStyle.NoCorners = 0;
CIStyle.TopLeft = 1;
CIStyle.TopRight = CIStyle.TopLeft << 1;
CIStyle.BottomLeft = CIStyle.TopRight << 1;
CIStyle.BottomRight = CIStyle.BottomLeft << 1;
CIStyle.AllCorners = CIStyle.TopRight | CIStyle.BottomRight | CIStyle.BottomLeft | CIStyle.TopLeft;
CIStyle.CornerNames = ['none', 'top-left', 'top-right', 'none', 'bottom-left', 'none', 'none', 'none', 'bottom-right'];

CIStyle.NoSides = 0;
CIStyle.Top = 1;
CIStyle.Left = CIStyle.Top << 1;
CIStyle.Right = CIStyle.Left << 1;
CIStyle.Bottom = CIStyle.Right << 1;
CIStyle.AllSides = CIStyle.Top | CIStyle.Right | CIStyle.Bottom | CIStyle.Left;
CIStyle.SideNames = ['none', 'top', 'left', 'none', 'right', 'none', 'none', 'none', 'bottom'];

CIStyle.NoImage = null;

CIStyle.HiddenStyle = new CIStyle({ hidden: true });

CIView.Style = new CIStyle({});