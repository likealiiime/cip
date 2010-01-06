CITable.Style = new CIStyle({
	width: '100%',
	backgroundColor: '#FFFFFF',
	evenRowBackgroundColor: '#FFFFFF',
	oddRowBackgroundColor: '#F0F0F0',
	borderSize: 1,
	solidBorders: CIStyle.Left | CIStyle.Right | CIStyle.Bottom,
	borderColor: CIStyle.BorderColor,
	cellPadding: 5
});

CISheet.TitleStyle = CITitle.NakedStyle.override({});

CIIndicator.Style = new CIStyle({
	image: '/cip/images/widgets/CIIndicator.gif',
	width: 20, height: 16,
});