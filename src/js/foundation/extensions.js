/*
	File: extensions.js
	Extensions to Javascript natives and utility functions
*/

/*
	Class: Global Extensions
	Extensions and methods that reside in the global namespace
	
	Function $evaluate(value)
	Evaluate and return value if it is a Function, otherwise just return it.
*/
function $evaluate(value) {
	return $type(value) == 'function' ? value() : value;
}

/*
	Class: Number
	Javascript's native numerical type
	
	Function: toInteger()
	CIP's integer parsing function. Used by <CIResizeBehavior> and <CIRect>.
	
	Returns:
		the Number or null if not a number (NaN)
*/
Number.implement({
	toInteger: function() { x = parseInt(this); return (x == NaN || !$defined(x)) ? null : x; }
});

/*
	Class: String
	Javascript's native String type

	Function: $S(string)
	Tests to see if the object (usually a String) is not null and is not empty
	
	Parameters:
		string - String to test
		
	Returns:
		true or false
*/
function $S(s) { return $defined(s) && s.toString().length > 0 }

/*
	Function: toInteger()
	CIP's integer parsing function. Used by <CIResizeBehavior> and <CIRect>.
	
	Returns:
		the Number or null if not a number (NaN)
*/
String.implement({
	toInteger: function() { return parseInt(this).toInteger(); }
});

/*
	Function: withEntityCharsDecoded()
	Resolves HTML entity characters in a string

	Returns:
		the decoded string


	Function: withEntityCharsEncoded()
	Converts &, ", <, > to HTML entity characters in a string

	Returns:
		the encoded string
*/
String.implement({
	
	withEntityCharsDecoded: function() {
		var s = this.toString();
		if (!$S(s)) return '';
		s = s.replace(/&amp;/g, '&');
		s = s.replace(/&lt;/g, '<');
		s = s.replace(/&gt;/g, '>');
		s = s.replace(/&quot;/g, '"');
		return s;
	},
	withEntityCharsEncoded: function() {
		var s = this.toString();
		if (!$S(s)) return '';
		s = s.toString();
		s = s.replace(/&/g, '&amp;');
		s = s.replace(/"/g, '&quot;');
		s = s.replace(/</g, '&lt;');
		s = s.replace(/>/g, '&gt;');
		return s;
	}
});