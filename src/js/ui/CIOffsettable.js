/*
	Interface: CIOffsettable
	Provides functions and variables to define how an object is to be offset from a point or an element
	
	Function: _makeOffsettable()
	Called in the object's constructor. It looks for the offset property, which may be defined as:
	
	Variable: offset
	dx - The relative horizontal distance to offset
	dy - The relative vertical distance to offset
	left - The origin horizontal position
	top - The origin vertical position
	from - An <Element> that defines the origin left and top from which to offset
*/
// TODO store offset in _offset
// TODO use implementor's Offset config
var CIOffsettable = new Class({
	_makeOffsettable: function() {
		this.offsetStyles = { dx: 20, dy: 20, left: 0, top: 0 };
		if (this.offset) {
			$extend(this.offsetStyles, this.offset);
			if (this.offset.from) {
				this.offsetStyles.left = $(this.offset.from).getPosition().x;
				this.offsetStyles.top  = $(this.offset.from).getPosition().y;
			}
		}
	}
});