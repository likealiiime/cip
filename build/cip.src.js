/*! 0.4.90 */
/*
---

script: Core.js

description: The core of MooTools, contains all the base functions and the Native and Hash implementations. Required by all the other scripts.

license: MIT-style license.

copyright: Copyright (c) 2006-2008 [Valerio Proietti](http://mad4milk.net/).

authors: The MooTools production team (http://mootools.net/developers/)

inspiration:
- Class implementation inspired by [Base.js](http://dean.edwards.name/weblog/2006/03/base/) Copyright (c) 2006 Dean Edwards, [GNU Lesser General Public License](http://opensource.org/licenses/lgpl-license.php)
- Some functionality inspired by [Prototype.js](http://prototypejs.org) Copyright (c) 2005-2007 Sam Stephenson, [MIT License](http://opensource.org/licenses/mit-license.php)

provides: [Mootools, Native, Hash.base, Array.each, $util]

...
*/

var MooTools = {
	'version': '1.2.4',
	'build': '0d9113241a90b9cd5643b926795852a2026710d4'
};

var Native = function(options){
	options = options || {};
	var name = options.name;
	var legacy = options.legacy;
	var protect = options.protect;
	var methods = options.implement;
	var generics = options.generics;
	var initialize = options.initialize;
	var afterImplement = options.afterImplement || function(){};
	var object = initialize || legacy;
	generics = generics !== false;

	object.constructor = Native;
	object.$family = {name: 'native'};
	if (legacy && initialize) object.prototype = legacy.prototype;
	object.prototype.constructor = object;

	if (name){
		var family = name.toLowerCase();
		object.prototype.$family = {name: family};
		Native.typize(object, family);
	}

	var add = function(obj, name, method, force){
		if (!protect || force || !obj.prototype[name]) obj.prototype[name] = method;
		if (generics) Native.genericize(obj, name, protect);
		afterImplement.call(obj, name, method);
		return obj;
	};

	object.alias = function(a1, a2, a3){
		if (typeof a1 == 'string'){
			var pa1 = this.prototype[a1];
			if ((a1 = pa1)) return add(this, a2, a1, a3);
		}
		for (var a in a1) this.alias(a, a1[a], a2);
		return this;
	};

	object.implement = function(a1, a2, a3){
		if (typeof a1 == 'string') return add(this, a1, a2, a3);
		for (var p in a1) add(this, p, a1[p], a2);
		return this;
	};

	if (methods) object.implement(methods);

	return object;
};

Native.genericize = function(object, property, check){
	if ((!check || !object[property]) && typeof object.prototype[property] == 'function') object[property] = function(){
		var args = Array.prototype.slice.call(arguments);
		return object.prototype[property].apply(args.shift(), args);
	};
};

Native.implement = function(objects, properties){
	for (var i = 0, l = objects.length; i < l; i++) objects[i].implement(properties);
};

Native.typize = function(object, family){
	if (!object.type) object.type = function(item){
		return ($type(item) === family);
	};
};

(function(){
	var natives = {'Array': Array, 'Date': Date, 'Function': Function, 'Number': Number, 'RegExp': RegExp, 'String': String};
	for (var n in natives) new Native({name: n, initialize: natives[n], protect: true});

	var types = {'boolean': Boolean, 'native': Native, 'object': Object};
	for (var t in types) Native.typize(types[t], t);

	var generics = {
		'Array': ["concat", "indexOf", "join", "lastIndexOf", "pop", "push", "reverse", "shift", "slice", "sort", "splice", "toString", "unshift", "valueOf"],
		'String': ["charAt", "charCodeAt", "concat", "indexOf", "lastIndexOf", "match", "replace", "search", "slice", "split", "substr", "substring", "toLowerCase", "toUpperCase", "valueOf"]
	};
	for (var g in generics){
		for (var i = generics[g].length; i--;) Native.genericize(natives[g], generics[g][i], true);
	}
})();

var Hash = new Native({

	name: 'Hash',

	initialize: function(object){
		if ($type(object) == 'hash') object = $unlink(object.getClean());
		for (var key in object) this[key] = object[key];
		return this;
	}

});

Hash.implement({

	forEach: function(fn, bind){
		for (var key in this){
			if (this.hasOwnProperty(key)) fn.call(bind, this[key], key, this);
		}
	},

	getClean: function(){
		var clean = {};
		for (var key in this){
			if (this.hasOwnProperty(key)) clean[key] = this[key];
		}
		return clean;
	},

	getLength: function(){
		var length = 0;
		for (var key in this){
			if (this.hasOwnProperty(key)) length++;
		}
		return length;
	}

});

Hash.alias('forEach', 'each');

Array.implement({

	forEach: function(fn, bind){
		for (var i = 0, l = this.length; i < l; i++) fn.call(bind, this[i], i, this);
	}

});

Array.alias('forEach', 'each');

function $A(iterable){
	if (iterable.item){
		var l = iterable.length, array = new Array(l);
		while (l--) array[l] = iterable[l];
		return array;
	}
	return Array.prototype.slice.call(iterable);
};

function $arguments(i){
	return function(){
		return arguments[i];
	};
};

function $chk(obj){
	return !!(obj || obj === 0);
};

function $clear(timer){
	clearTimeout(timer);
	clearInterval(timer);
	return null;
};

function $defined(obj){
	return (obj != undefined);
};

function $each(iterable, fn, bind){
	var type = $type(iterable);
	((type == 'arguments' || type == 'collection' || type == 'array') ? Array : Hash).each(iterable, fn, bind);
};

function $empty(){};

function $extend(original, extended){
	for (var key in (extended || {})) original[key] = extended[key];
	return original;
};

function $H(object){
	return new Hash(object);
};

function $lambda(value){
	return ($type(value) == 'function') ? value : function(){
		return value;
	};
};

function $merge(){
	var args = Array.slice(arguments);
	args.unshift({});
	return $mixin.apply(null, args);
};

function $mixin(mix){
	for (var i = 1, l = arguments.length; i < l; i++){
		var object = arguments[i];
		if ($type(object) != 'object') continue;
		for (var key in object){
			var op = object[key], mp = mix[key];
			mix[key] = (mp && $type(op) == 'object' && $type(mp) == 'object') ? $mixin(mp, op) : $unlink(op);
		}
	}
	return mix;
};

function $pick(){
	for (var i = 0, l = arguments.length; i < l; i++){
		if (arguments[i] != undefined) return arguments[i];
	}
	return null;
};

function $random(min, max){
	return Math.floor(Math.random() * (max - min + 1) + min);
};

function $splat(obj){
	var type = $type(obj);
	return (type) ? ((type != 'array' && type != 'arguments') ? [obj] : obj) : [];
};

var $time = Date.now || function(){
	return +new Date;
};

function $try(){
	for (var i = 0, l = arguments.length; i < l; i++){
		try {
			return arguments[i]();
		} catch(e){}
	}
	return null;
};

function $type(obj){
	if (obj == undefined) return false;
	if (obj.$family) return (obj.$family.name == 'number' && !isFinite(obj)) ? false : obj.$family.name;
	if (obj.nodeName){
		switch (obj.nodeType){
			case 1: return 'element';
			case 3: return (/\S/).test(obj.nodeValue) ? 'textnode' : 'whitespace';
		}
	} else if (typeof obj.length == 'number'){
		if (obj.callee) return 'arguments';
		else if (obj.item) return 'collection';
	}
	return typeof obj;
};

function $unlink(object){
	var unlinked;
	switch ($type(object)){
		case 'object':
			unlinked = {};
			for (var p in object) unlinked[p] = $unlink(object[p]);
		break;
		case 'hash':
			unlinked = new Hash(object);
		break;
		case 'array':
			unlinked = [];
			for (var i = 0, l = object.length; i < l; i++) unlinked[i] = $unlink(object[i]);
		break;
		default: return object;
	}
	return unlinked;
};


/*
---

script: Browser.js

description: The Browser Core. Contains Browser initialization, Window and Document, and the Browser Hash.

license: MIT-style license.

requires: 
- /Native
- /$util

provides: [Browser, Window, Document, $exec]

...
*/

var Browser = $merge({

	Engine: {name: 'unknown', version: 0},

	Platform: {name: (window.orientation != undefined) ? 'ipod' : (navigator.platform.match(/mac|win|linux/i) || ['other'])[0].toLowerCase()},

	Features: {xpath: !!(document.evaluate), air: !!(window.runtime), query: !!(document.querySelector)},

	Plugins: {},

	Engines: {

		presto: function(){
			return (!window.opera) ? false : ((arguments.callee.caller) ? 960 : ((document.getElementsByClassName) ? 950 : 925));
		},

		trident: function(){
			return (!window.ActiveXObject) ? false : ((window.XMLHttpRequest) ? ((document.querySelectorAll) ? 6 : 5) : 4);
		},

		webkit: function(){
			return (navigator.taintEnabled) ? false : ((Browser.Features.xpath) ? ((Browser.Features.query) ? 525 : 420) : 419);
		},

		gecko: function(){
			return (!document.getBoxObjectFor && window.mozInnerScreenX == null) ? false : ((document.getElementsByClassName) ? 19 : 18);
		}

	}

}, Browser || {});

Browser.Platform[Browser.Platform.name] = true;

Browser.detect = function(){

	for (var engine in this.Engines){
		var version = this.Engines[engine]();
		if (version){
			this.Engine = {name: engine, version: version};
			this.Engine[engine] = this.Engine[engine + version] = true;
			break;
		}
	}

	return {name: engine, version: version};

};

Browser.detect();

Browser.Request = function(){
	return $try(function(){
		return new XMLHttpRequest();
	}, function(){
		return new ActiveXObject('MSXML2.XMLHTTP');
	}, function(){
		return new ActiveXObject('Microsoft.XMLHTTP');
	});
};

Browser.Features.xhr = !!(Browser.Request());

Browser.Plugins.Flash = (function(){
	var version = ($try(function(){
		return navigator.plugins['Shockwave Flash'].description;
	}, function(){
		return new ActiveXObject('ShockwaveFlash.ShockwaveFlash').GetVariable('$version');
	}) || '0 r0').match(/\d+/g);
	return {version: parseInt(version[0] || 0 + '.' + version[1], 10) || 0, build: parseInt(version[2], 10) || 0};
})();

function $exec(text){
	if (!text) return text;
	if (window.execScript){
		window.execScript(text);
	} else {
		var script = document.createElement('script');
		script.setAttribute('type', 'text/javascript');
		script[(Browser.Engine.webkit && Browser.Engine.version < 420) ? 'innerText' : 'text'] = text;
		document.head.appendChild(script);
		document.head.removeChild(script);
	}
	return text;
};

Native.UID = 1;

var $uid = (Browser.Engine.trident) ? function(item){
	return (item.uid || (item.uid = [Native.UID++]))[0];
} : function(item){
	return item.uid || (item.uid = Native.UID++);
};

var Window = new Native({

	name: 'Window',

	legacy: (Browser.Engine.trident) ? null: window.Window,

	initialize: function(win){
		$uid(win);
		if (!win.Element){
			win.Element = $empty;
			if (Browser.Engine.webkit) win.document.createElement("iframe"); //fixes safari 2
			win.Element.prototype = (Browser.Engine.webkit) ? window["[[DOMElement.prototype]]"] : {};
		}
		win.document.window = win;
		return $extend(win, Window.Prototype);
	},

	afterImplement: function(property, value){
		window[property] = Window.Prototype[property] = value;
	}

});

Window.Prototype = {$family: {name: 'window'}};

new Window(window);

var Document = new Native({

	name: 'Document',

	legacy: (Browser.Engine.trident) ? null: window.Document,

	initialize: function(doc){
		$uid(doc);
		doc.head = doc.getElementsByTagName('head')[0];
		doc.html = doc.getElementsByTagName('html')[0];
		if (Browser.Engine.trident && Browser.Engine.version <= 4) $try(function(){
			doc.execCommand("BackgroundImageCache", false, true);
		});
		if (Browser.Engine.trident) doc.window.attachEvent('onunload', function(){
			doc.window.detachEvent('onunload', arguments.callee);
			doc.head = doc.html = doc.window = null;
		});
		return $extend(doc, Document.Prototype);
	},

	afterImplement: function(property, value){
		document[property] = Document.Prototype[property] = value;
	}

});

Document.Prototype = {$family: {name: 'document'}};

new Document(document);


/*
---

script: Array.js

description: Contains Array Prototypes like each, contains, and erase.

license: MIT-style license.

requires:
- /$util
- /Array.each

provides: [Array]

...
*/

Array.implement({

	every: function(fn, bind){
		for (var i = 0, l = this.length; i < l; i++){
			if (!fn.call(bind, this[i], i, this)) return false;
		}
		return true;
	},

	filter: function(fn, bind){
		var results = [];
		for (var i = 0, l = this.length; i < l; i++){
			if (fn.call(bind, this[i], i, this)) results.push(this[i]);
		}
		return results;
	},

	clean: function(){
		return this.filter($defined);
	},

	indexOf: function(item, from){
		var len = this.length;
		for (var i = (from < 0) ? Math.max(0, len + from) : from || 0; i < len; i++){
			if (this[i] === item) return i;
		}
		return -1;
	},

	map: function(fn, bind){
		var results = [];
		for (var i = 0, l = this.length; i < l; i++) results[i] = fn.call(bind, this[i], i, this);
		return results;
	},

	some: function(fn, bind){
		for (var i = 0, l = this.length; i < l; i++){
			if (fn.call(bind, this[i], i, this)) return true;
		}
		return false;
	},

	associate: function(keys){
		var obj = {}, length = Math.min(this.length, keys.length);
		for (var i = 0; i < length; i++) obj[keys[i]] = this[i];
		return obj;
	},

	link: function(object){
		var result = {};
		for (var i = 0, l = this.length; i < l; i++){
			for (var key in object){
				if (object[key](this[i])){
					result[key] = this[i];
					delete object[key];
					break;
				}
			}
		}
		return result;
	},

	contains: function(item, from){
		return this.indexOf(item, from) != -1;
	},

	extend: function(array){
		for (var i = 0, j = array.length; i < j; i++) this.push(array[i]);
		return this;
	},
	
	getLast: function(){
		return (this.length) ? this[this.length - 1] : null;
	},

	getRandom: function(){
		return (this.length) ? this[$random(0, this.length - 1)] : null;
	},

	include: function(item){
		if (!this.contains(item)) this.push(item);
		return this;
	},

	combine: function(array){
		for (var i = 0, l = array.length; i < l; i++) this.include(array[i]);
		return this;
	},

	erase: function(item){
		for (var i = this.length; i--; i){
			if (this[i] === item) this.splice(i, 1);
		}
		return this;
	},

	empty: function(){
		this.length = 0;
		return this;
	},

	flatten: function(){
		var array = [];
		for (var i = 0, l = this.length; i < l; i++){
			var type = $type(this[i]);
			if (!type) continue;
			array = array.concat((type == 'array' || type == 'collection' || type == 'arguments') ? Array.flatten(this[i]) : this[i]);
		}
		return array;
	},

	hexToRgb: function(array){
		if (this.length != 3) return null;
		var rgb = this.map(function(value){
			if (value.length == 1) value += value;
			return value.toInt(16);
		});
		return (array) ? rgb : 'rgb(' + rgb + ')';
	},

	rgbToHex: function(array){
		if (this.length < 3) return null;
		if (this.length == 4 && this[3] == 0 && !array) return 'transparent';
		var hex = [];
		for (var i = 0; i < 3; i++){
			var bit = (this[i] - 0).toString(16);
			hex.push((bit.length == 1) ? '0' + bit : bit);
		}
		return (array) ? hex : '#' + hex.join('');
	}

});


/*
---

script: Function.js

description: Contains Function Prototypes like create, bind, pass, and delay.

license: MIT-style license.

requires:
- /Native
- /$util

provides: [Function]

...
*/

Function.implement({

	extend: function(properties){
		for (var property in properties) this[property] = properties[property];
		return this;
	},

	create: function(options){
		var self = this;
		options = options || {};
		return function(event){
			var args = options.arguments;
			args = (args != undefined) ? $splat(args) : Array.slice(arguments, (options.event) ? 1 : 0);
			if (options.event) args = [event || window.event].extend(args);
			var returns = function(){
				return self.apply(options.bind || null, args);
			};
			if (options.delay) return setTimeout(returns, options.delay);
			if (options.periodical) return setInterval(returns, options.periodical);
			if (options.attempt) return $try(returns);
			return returns();
		};
	},

	run: function(args, bind){
		return this.apply(bind, $splat(args));
	},

	pass: function(args, bind){
		return this.create({bind: bind, arguments: args});
	},

	bind: function(bind, args){
		return this.create({bind: bind, arguments: args});
	},

	bindWithEvent: function(bind, args){
		return this.create({bind: bind, arguments: args, event: true});
	},

	attempt: function(args, bind){
		return this.create({bind: bind, arguments: args, attempt: true})();
	},

	delay: function(delay, bind, args){
		return this.create({bind: bind, arguments: args, delay: delay})();
	},

	periodical: function(periodical, bind, args){
		return this.create({bind: bind, arguments: args, periodical: periodical})();
	}

});


/*
---

script: Number.js

description: Contains Number Prototypes like limit, round, times, and ceil.

license: MIT-style license.

requires:
- /Native
- /$util

provides: [Number]

...
*/

Number.implement({

	limit: function(min, max){
		return Math.min(max, Math.max(min, this));
	},

	round: function(precision){
		precision = Math.pow(10, precision || 0);
		return Math.round(this * precision) / precision;
	},

	times: function(fn, bind){
		for (var i = 0; i < this; i++) fn.call(bind, i, this);
	},

	toFloat: function(){
		return parseFloat(this);
	},

	toInt: function(base){
		return parseInt(this, base || 10);
	}

});

Number.alias('times', 'each');

(function(math){
	var methods = {};
	math.each(function(name){
		if (!Number[name]) methods[name] = function(){
			return Math[name].apply(null, [this].concat($A(arguments)));
		};
	});
	Number.implement(methods);
})(['abs', 'acos', 'asin', 'atan', 'atan2', 'ceil', 'cos', 'exp', 'floor', 'log', 'max', 'min', 'pow', 'sin', 'sqrt', 'tan']);


/*
---

script: String.js

description: Contains String Prototypes like camelCase, capitalize, test, and toInt.

license: MIT-style license.

requires:
- /Native

provides: [String]

...
*/

String.implement({

	test: function(regex, params){
		return ((typeof regex == 'string') ? new RegExp(regex, params) : regex).test(this);
	},

	contains: function(string, separator){
		return (separator) ? (separator + this + separator).indexOf(separator + string + separator) > -1 : this.indexOf(string) > -1;
	},

	trim: function(){
		return this.replace(/^\s+|\s+$/g, '');
	},

	clean: function(){
		return this.replace(/\s+/g, ' ').trim();
	},

	camelCase: function(){
		return this.replace(/-\D/g, function(match){
			return match.charAt(1).toUpperCase();
		});
	},

	hyphenate: function(){
		return this.replace(/[A-Z]/g, function(match){
			return ('-' + match.charAt(0).toLowerCase());
		});
	},

	capitalize: function(){
		return this.replace(/\b[a-z]/g, function(match){
			return match.toUpperCase();
		});
	},

	escapeRegExp: function(){
		return this.replace(/([-.*+?^${}()|[\]\/\\])/g, '\\$1');
	},

	toInt: function(base){
		return parseInt(this, base || 10);
	},

	toFloat: function(){
		return parseFloat(this);
	},

	hexToRgb: function(array){
		var hex = this.match(/^#?(\w{1,2})(\w{1,2})(\w{1,2})$/);
		return (hex) ? hex.slice(1).hexToRgb(array) : null;
	},

	rgbToHex: function(array){
		var rgb = this.match(/\d{1,3}/g);
		return (rgb) ? rgb.rgbToHex(array) : null;
	},

	stripScripts: function(option){
		var scripts = '';
		var text = this.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, function(){
			scripts += arguments[1] + '\n';
			return '';
		});
		if (option === true) $exec(scripts);
		else if ($type(option) == 'function') option(scripts, text);
		return text;
	},

	substitute: function(object, regexp){
		return this.replace(regexp || (/\\?\{([^{}]+)\}/g), function(match, name){
			if (match.charAt(0) == '\\') return match.slice(1);
			return (object[name] != undefined) ? object[name] : '';
		});
	}

});


/*
---

script: Hash.js

description: Contains Hash Prototypes. Provides a means for overcoming the JavaScript practical impossibility of extending native Objects.

license: MIT-style license.

requires:
- /Hash.base

provides: [Hash]

...
*/

Hash.implement({

	has: Object.prototype.hasOwnProperty,

	keyOf: function(value){
		for (var key in this){
			if (this.hasOwnProperty(key) && this[key] === value) return key;
		}
		return null;
	},

	hasValue: function(value){
		return (Hash.keyOf(this, value) !== null);
	},

	extend: function(properties){
		Hash.each(properties || {}, function(value, key){
			Hash.set(this, key, value);
		}, this);
		return this;
	},

	combine: function(properties){
		Hash.each(properties || {}, function(value, key){
			Hash.include(this, key, value);
		}, this);
		return this;
	},

	erase: function(key){
		if (this.hasOwnProperty(key)) delete this[key];
		return this;
	},

	get: function(key){
		return (this.hasOwnProperty(key)) ? this[key] : null;
	},

	set: function(key, value){
		if (!this[key] || this.hasOwnProperty(key)) this[key] = value;
		return this;
	},

	empty: function(){
		Hash.each(this, function(value, key){
			delete this[key];
		}, this);
		return this;
	},

	include: function(key, value){
		if (this[key] == undefined) this[key] = value;
		return this;
	},

	map: function(fn, bind){
		var results = new Hash;
		Hash.each(this, function(value, key){
			results.set(key, fn.call(bind, value, key, this));
		}, this);
		return results;
	},

	filter: function(fn, bind){
		var results = new Hash;
		Hash.each(this, function(value, key){
			if (fn.call(bind, value, key, this)) results.set(key, value);
		}, this);
		return results;
	},

	every: function(fn, bind){
		for (var key in this){
			if (this.hasOwnProperty(key) && !fn.call(bind, this[key], key)) return false;
		}
		return true;
	},

	some: function(fn, bind){
		for (var key in this){
			if (this.hasOwnProperty(key) && fn.call(bind, this[key], key)) return true;
		}
		return false;
	},

	getKeys: function(){
		var keys = [];
		Hash.each(this, function(value, key){
			keys.push(key);
		});
		return keys;
	},

	getValues: function(){
		var values = [];
		Hash.each(this, function(value){
			values.push(value);
		});
		return values;
	},

	toQueryString: function(base){
		var queryString = [];
		Hash.each(this, function(value, key){
			if (base) key = base + '[' + key + ']';
			var result;
			switch ($type(value)){
				case 'object': result = Hash.toQueryString(value, key); break;
				case 'array':
					var qs = {};
					value.each(function(val, i){
						qs[i] = val;
					});
					result = Hash.toQueryString(qs, key);
				break;
				default: result = key + '=' + encodeURIComponent(value);
			}
			if (value != undefined) queryString.push(result);
		});

		return queryString.join('&');
	}

});

Hash.alias({keyOf: 'indexOf', hasValue: 'contains'});


/*
---

script: Event.js

description: Contains the Event Class, to make the event object cross-browser.

license: MIT-style license.

requires:
- /Window
- /Document
- /Hash
- /Array
- /Function
- /String

provides: [Event]

...
*/

var Event = new Native({

	name: 'Event',

	initialize: function(event, win){
		win = win || window;
		var doc = win.document;
		event = event || win.event;
		if (event.$extended) return event;
		this.$extended = true;
		var type = event.type;
		var target = event.target || event.srcElement;
		while (target && target.nodeType == 3) target = target.parentNode;

		if (type.test(/key/)){
			var code = event.which || event.keyCode;
			var key = Event.Keys.keyOf(code);
			if (type == 'keydown'){
				var fKey = code - 111;
				if (fKey > 0 && fKey < 13) key = 'f' + fKey;
			}
			key = key || String.fromCharCode(code).toLowerCase();
		} else if (type.match(/(click|mouse|menu)/i)){
			doc = (!doc.compatMode || doc.compatMode == 'CSS1Compat') ? doc.html : doc.body;
			var page = {
				x: event.pageX || event.clientX + doc.scrollLeft,
				y: event.pageY || event.clientY + doc.scrollTop
			};
			var client = {
				x: (event.pageX) ? event.pageX - win.pageXOffset : event.clientX,
				y: (event.pageY) ? event.pageY - win.pageYOffset : event.clientY
			};
			if (type.match(/DOMMouseScroll|mousewheel/)){
				var wheel = (event.wheelDelta) ? event.wheelDelta / 120 : -(event.detail || 0) / 3;
			}
			var rightClick = (event.which == 3) || (event.button == 2);
			var related = null;
			if (type.match(/over|out/)){
				switch (type){
					case 'mouseover': related = event.relatedTarget || event.fromElement; break;
					case 'mouseout': related = event.relatedTarget || event.toElement;
				}
				if (!(function(){
					while (related && related.nodeType == 3) related = related.parentNode;
					return true;
				}).create({attempt: Browser.Engine.gecko})()) related = false;
			}
		}

		return $extend(this, {
			event: event,
			type: type,

			page: page,
			client: client,
			rightClick: rightClick,

			wheel: wheel,

			relatedTarget: related,
			target: target,

			code: code,
			key: key,

			shift: event.shiftKey,
			control: event.ctrlKey,
			alt: event.altKey,
			meta: event.metaKey
		});
	}

});

Event.Keys = new Hash({
	'enter': 13,
	'up': 38,
	'down': 40,
	'left': 37,
	'right': 39,
	'esc': 27,
	'space': 32,
	'backspace': 8,
	'tab': 9,
	'delete': 46
});

Event.implement({

	stop: function(){
		return this.stopPropagation().preventDefault();
	},

	stopPropagation: function(){
		if (this.event.stopPropagation) this.event.stopPropagation();
		else this.event.cancelBubble = true;
		return this;
	},

	preventDefault: function(){
		if (this.event.preventDefault) this.event.preventDefault();
		else this.event.returnValue = false;
		return this;
	}

});


/*
---

script: Class.js

description: Contains the Class Function for easily creating, extending, and implementing reusable Classes.

license: MIT-style license.

requires:
- /$util
- /Native
- /Array
- /String
- /Function
- /Number
- /Hash

provides: [Class]

...
*/

function Class(params){
	
	if (params instanceof Function) params = {initialize: params};
	
	var newClass = function(){
		Object.reset(this);
		if (newClass._prototyping) return this;
		this._current = $empty;
		var value = (this.initialize) ? this.initialize.apply(this, arguments) : this;
		delete this._current; delete this.caller;
		return value;
	}.extend(this);
	
	newClass.implement(params);
	
	newClass.constructor = Class;
	newClass.prototype.constructor = newClass;

	return newClass;

};

Function.prototype.protect = function(){
	this._protected = true;
	return this;
};

Object.reset = function(object, key){
		
	if (key == null){
		for (var p in object) Object.reset(object, p);
		return object;
	}
	
	delete object[key];
	
	switch ($type(object[key])){
		case 'object':
			var F = function(){};
			F.prototype = object[key];
			var i = new F;
			object[key] = Object.reset(i);
		break;
		case 'array': object[key] = $unlink(object[key]); break;
	}
	
	return object;
	
};

new Native({name: 'Class', initialize: Class}).extend({

	instantiate: function(F){
		F._prototyping = true;
		var proto = new F;
		delete F._prototyping;
		return proto;
	},
	
	wrap: function(self, key, method){
		if (method._origin) method = method._origin;
		
		return function(){
			if (method._protected && this._current == null) throw new Error('The method "' + key + '" cannot be called.');
			var caller = this.caller, current = this._current;
			this.caller = current; this._current = arguments.callee;
			var result = method.apply(this, arguments);
			this._current = current; this.caller = caller;
			return result;
		}.extend({_owner: self, _origin: method, _name: key});

	}
	
});

Class.implement({
	
	implement: function(key, value){
		
		if ($type(key) == 'object'){
			for (var p in key) this.implement(p, key[p]);
			return this;
		}
		
		var mutator = Class.Mutators[key];
		
		if (mutator){
			value = mutator.call(this, value);
			if (value == null) return this;
		}
		
		var proto = this.prototype;

		switch ($type(value)){
			
			case 'function':
				if (value._hidden) return this;
				proto[key] = Class.wrap(this, key, value);
			break;
			
			case 'object':
				var previous = proto[key];
				if ($type(previous) == 'object') $mixin(previous, value);
				else proto[key] = $unlink(value);
			break;
			
			case 'array':
				proto[key] = $unlink(value);
			break;
			
			default: proto[key] = value;

		}
		
		return this;

	}
	
});

Class.Mutators = {
	
	Extends: function(parent){

		this.parent = parent;
		this.prototype = Class.instantiate(parent);

		this.implement('parent', function(){
			var name = this.caller._name, previous = this.caller._owner.parent.prototype[name];
			if (!previous) throw new Error('The method "' + name + '" has no parent.');
			return previous.apply(this, arguments);
		}.protect());

	},

	Implements: function(items){
		$splat(items).each(function(item){
			if (item instanceof Function) item = Class.instantiate(item);
			this.implement(item);
		}, this);

	}
	
};


/*
---

script: Class.Extras.js

description: Contains Utility Classes that can be implemented into your own Classes to ease the execution of many common tasks.

license: MIT-style license.

requires:
- /Class

provides: [Chain, Events, Options]

...
*/

var Chain = new Class({

	$chain: [],

	chain: function(){
		this.$chain.extend(Array.flatten(arguments));
		return this;
	},

	callChain: function(){
		return (this.$chain.length) ? this.$chain.shift().apply(this, arguments) : false;
	},

	clearChain: function(){
		this.$chain.empty();
		return this;
	}

});

var Events = new Class({

	$events: {},

	addEvent: function(type, fn, internal){
		type = Events.removeOn(type);
		if (fn != $empty){
			this.$events[type] = this.$events[type] || [];
			this.$events[type].include(fn);
			if (internal) fn.internal = true;
		}
		return this;
	},

	addEvents: function(events){
		for (var type in events) this.addEvent(type, events[type]);
		return this;
	},

	fireEvent: function(type, args, delay){
		type = Events.removeOn(type);
		if (!this.$events || !this.$events[type]) return this;
		this.$events[type].each(function(fn){
			fn.create({'bind': this, 'delay': delay, 'arguments': args})();
		}, this);
		return this;
	},

	removeEvent: function(type, fn){
		type = Events.removeOn(type);
		if (!this.$events[type]) return this;
		if (!fn.internal) this.$events[type].erase(fn);
		return this;
	},

	removeEvents: function(events){
		var type;
		if ($type(events) == 'object'){
			for (type in events) this.removeEvent(type, events[type]);
			return this;
		}
		if (events) events = Events.removeOn(events);
		for (type in this.$events){
			if (events && events != type) continue;
			var fns = this.$events[type];
			for (var i = fns.length; i--; i) this.removeEvent(type, fns[i]);
		}
		return this;
	}

});

Events.removeOn = function(string){
	return string.replace(/^on([A-Z])/, function(full, first){
		return first.toLowerCase();
	});
};

var Options = new Class({

	setOptions: function(){
		this.options = $merge.run([this.options].extend(arguments));
		if (!this.addEvent) return this;
		for (var option in this.options){
			if ($type(this.options[option]) != 'function' || !(/^on[A-Z]/).test(option)) continue;
			this.addEvent(option, this.options[option]);
			delete this.options[option];
		}
		return this;
	}

});


/*
---

script: Element.js

description: One of the most important items in MooTools. Contains the dollar function, the dollars function, and an handful of cross-browser, time-saver methods to let you easily work with HTML Elements.

license: MIT-style license.

requires:
- /Window
- /Document
- /Array
- /String
- /Function
- /Number
- /Hash

provides: [Element, Elements, $, $$, Iframe]

...
*/

var Element = new Native({

	name: 'Element',

	legacy: window.Element,

	initialize: function(tag, props){
		var konstructor = Element.Constructors.get(tag);
		if (konstructor) return konstructor(props);
		if (typeof tag == 'string') return document.newElement(tag, props);
		return document.id(tag).set(props);
	},

	afterImplement: function(key, value){
		Element.Prototype[key] = value;
		if (Array[key]) return;
		Elements.implement(key, function(){
			var items = [], elements = true;
			for (var i = 0, j = this.length; i < j; i++){
				var returns = this[i][key].apply(this[i], arguments);
				items.push(returns);
				if (elements) elements = ($type(returns) == 'element');
			}
			return (elements) ? new Elements(items) : items;
		});
	}

});

Element.Prototype = {$family: {name: 'element'}};

Element.Constructors = new Hash;

var IFrame = new Native({

	name: 'IFrame',

	generics: false,

	initialize: function(){
		var params = Array.link(arguments, {properties: Object.type, iframe: $defined});
		var props = params.properties || {};
		var iframe = document.id(params.iframe);
		var onload = props.onload || $empty;
		delete props.onload;
		props.id = props.name = $pick(props.id, props.name, iframe ? (iframe.id || iframe.name) : 'IFrame_' + $time());
		iframe = new Element(iframe || 'iframe', props);
		var onFrameLoad = function(){
			var host = $try(function(){
				return iframe.contentWindow.location.host;
			});
			if (!host || host == window.location.host){
				var win = new Window(iframe.contentWindow);
				new Document(iframe.contentWindow.document);
				$extend(win.Element.prototype, Element.Prototype);
			}
			onload.call(iframe.contentWindow, iframe.contentWindow.document);
		};
		var contentWindow = $try(function(){
			return iframe.contentWindow;
		});
		((contentWindow && contentWindow.document.body) || window.frames[props.id]) ? onFrameLoad() : iframe.addListener('load', onFrameLoad);
		return iframe;
	}

});

var Elements = new Native({

	initialize: function(elements, options){
		options = $extend({ddup: true, cash: true}, options);
		elements = elements || [];
		if (options.ddup || options.cash){
			var uniques = {}, returned = [];
			for (var i = 0, l = elements.length; i < l; i++){
				var el = document.id(elements[i], !options.cash);
				if (options.ddup){
					if (uniques[el.uid]) continue;
					uniques[el.uid] = true;
				}
				if (el) returned.push(el);
			}
			elements = returned;
		}
		return (options.cash) ? $extend(elements, this) : elements;
	}

});

Elements.implement({

	filter: function(filter, bind){
		if (!filter) return this;
		return new Elements(Array.filter(this, (typeof filter == 'string') ? function(item){
			return item.match(filter);
		} : filter, bind));
	}

});

Document.implement({

	newElement: function(tag, props){
		if (Browser.Engine.trident && props){
			['name', 'type', 'checked'].each(function(attribute){
				if (!props[attribute]) return;
				tag += ' ' + attribute + '="' + props[attribute] + '"';
				if (attribute != 'checked') delete props[attribute];
			});
			tag = '<' + tag + '>';
		}
		return document.id(this.createElement(tag)).set(props);
	},

	newTextNode: function(text){
		return this.createTextNode(text);
	},

	getDocument: function(){
		return this;
	},

	getWindow: function(){
		return this.window;
	},
	
	id: (function(){
		
		var types = {

			string: function(id, nocash, doc){
				id = doc.getElementById(id);
				return (id) ? types.element(id, nocash) : null;
			},
			
			element: function(el, nocash){
				$uid(el);
				if (!nocash && !el.$family && !(/^object|embed$/i).test(el.tagName)){
					var proto = Element.Prototype;
					for (var p in proto) el[p] = proto[p];
				};
				return el;
			},
			
			object: function(obj, nocash, doc){
				if (obj.toElement) return types.element(obj.toElement(doc), nocash);
				return null;
			}
			
		};
		
		types['class'] = types.element;
		types.textnode = types.whitespace = types.window = types.document = $arguments(0);
		
		return function(el, nocash, doc){
			if (el && el.$family && el.uid) return el;
			var type = $type(el);
			return (types[type]) ? types[type](el, nocash, doc || document) : null;
		};

	})()

});

if (window.$ == null) Window.implement({
	$: function(el, nc){
		return document.id(el, nc, this.document);
	}
});

Window.implement({

	$$: function(selector){
		if (arguments.length == 1 && typeof selector == 'string') return this.document.getElements(selector);
		var elements = [];
		var args = Array.flatten(arguments);
		for (var i = 0, l = args.length; i < l; i++){
			var item = args[i];
			switch ($type(item)){
				case 'element': elements.push(item); break;
				case 'string': elements.extend(this.document.getElements(item, true));
			}
		}
		return new Elements(elements);
	},

	getDocument: function(){
		return this.document;
	},

	getWindow: function(){
		return this;
	}

});

Native.implement([Element, Document], {

	getElement: function(selector, nocash){
		return document.id(this.getElements(selector, true)[0] || null, nocash);
	},

	getElements: function(tags, nocash){
		tags = tags.split(',');
		var elements = [];
		var ddup = (tags.length > 1);
		tags.each(function(tag){
			var partial = this.getElementsByTagName(tag.trim());
			(ddup) ? elements.extend(partial) : elements = partial;
		}, this);
		return new Elements(elements, {ddup: ddup, cash: !nocash});
	}

});

(function(){

var collected = {}, storage = {};
var props = {input: 'checked', option: 'selected', textarea: (Browser.Engine.webkit && Browser.Engine.version < 420) ? 'innerHTML' : 'value'};

var get = function(uid){
	return (storage[uid] || (storage[uid] = {}));
};

var clean = function(item, retain){
	if (!item) return;
	var uid = item.uid;
	if (Browser.Engine.trident){
		if (item.clearAttributes){
			var clone = retain && item.cloneNode(false);
			item.clearAttributes();
			if (clone) item.mergeAttributes(clone);
		} else if (item.removeEvents){
			item.removeEvents();
		}
		if ((/object/i).test(item.tagName)){
			for (var p in item){
				if (typeof item[p] == 'function') item[p] = $empty;
			}
			Element.dispose(item);
		}
	}	
	if (!uid) return;
	collected[uid] = storage[uid] = null;
};

var purge = function(){
	Hash.each(collected, clean);
	if (Browser.Engine.trident) $A(document.getElementsByTagName('object')).each(clean);
	if (window.CollectGarbage) CollectGarbage();
	collected = storage = null;
};

var walk = function(element, walk, start, match, all, nocash){
	var el = element[start || walk];
	var elements = [];
	while (el){
		if (el.nodeType == 1 && (!match || Element.match(el, match))){
			if (!all) return document.id(el, nocash);
			elements.push(el);
		}
		el = el[walk];
	}
	return (all) ? new Elements(elements, {ddup: false, cash: !nocash}) : null;
};

var attributes = {
	'html': 'innerHTML',
	'class': 'className',
	'for': 'htmlFor',
	'defaultValue': 'defaultValue',
	'text': (Browser.Engine.trident || (Browser.Engine.webkit && Browser.Engine.version < 420)) ? 'innerText' : 'textContent'
};
var bools = ['compact', 'nowrap', 'ismap', 'declare', 'noshade', 'checked', 'disabled', 'readonly', 'multiple', 'selected', 'noresize', 'defer'];
var camels = ['value', 'type', 'defaultValue', 'accessKey', 'cellPadding', 'cellSpacing', 'colSpan', 'frameBorder', 'maxLength', 'readOnly', 'rowSpan', 'tabIndex', 'useMap'];

bools = bools.associate(bools);

Hash.extend(attributes, bools);
Hash.extend(attributes, camels.associate(camels.map(String.toLowerCase)));

var inserters = {

	before: function(context, element){
		if (element.parentNode) element.parentNode.insertBefore(context, element);
	},

	after: function(context, element){
		if (!element.parentNode) return;
		var next = element.nextSibling;
		(next) ? element.parentNode.insertBefore(context, next) : element.parentNode.appendChild(context);
	},

	bottom: function(context, element){
		element.appendChild(context);
	},

	top: function(context, element){
		var first = element.firstChild;
		(first) ? element.insertBefore(context, first) : element.appendChild(context);
	}

};

inserters.inside = inserters.bottom;

Hash.each(inserters, function(inserter, where){

	where = where.capitalize();

	Element.implement('inject' + where, function(el){
		inserter(this, document.id(el, true));
		return this;
	});

	Element.implement('grab' + where, function(el){
		inserter(document.id(el, true), this);
		return this;
	});

});

Element.implement({

	set: function(prop, value){
		switch ($type(prop)){
			case 'object':
				for (var p in prop) this.set(p, prop[p]);
				break;
			case 'string':
				var property = Element.Properties.get(prop);
				(property && property.set) ? property.set.apply(this, Array.slice(arguments, 1)) : this.setProperty(prop, value);
		}
		return this;
	},

	get: function(prop){
		var property = Element.Properties.get(prop);
		return (property && property.get) ? property.get.apply(this, Array.slice(arguments, 1)) : this.getProperty(prop);
	},

	erase: function(prop){
		var property = Element.Properties.get(prop);
		(property && property.erase) ? property.erase.apply(this) : this.removeProperty(prop);
		return this;
	},

	setProperty: function(attribute, value){
		var key = attributes[attribute];
		if (value == undefined) return this.removeProperty(attribute);
		if (key && bools[attribute]) value = !!value;
		(key) ? this[key] = value : this.setAttribute(attribute, '' + value);
		return this;
	},

	setProperties: function(attributes){
		for (var attribute in attributes) this.setProperty(attribute, attributes[attribute]);
		return this;
	},

	getProperty: function(attribute){
		var key = attributes[attribute];
		var value = (key) ? this[key] : this.getAttribute(attribute, 2);
		return (bools[attribute]) ? !!value : (key) ? value : value || null;
	},

	getProperties: function(){
		var args = $A(arguments);
		return args.map(this.getProperty, this).associate(args);
	},

	removeProperty: function(attribute){
		var key = attributes[attribute];
		(key) ? this[key] = (key && bools[attribute]) ? false : '' : this.removeAttribute(attribute);
		return this;
	},

	removeProperties: function(){
		Array.each(arguments, this.removeProperty, this);
		return this;
	},

	hasClass: function(className){
		return this.className.contains(className, ' ');
	},

	addClass: function(className){
		if (!this.hasClass(className)) this.className = (this.className + ' ' + className).clean();
		return this;
	},

	removeClass: function(className){
		this.className = this.className.replace(new RegExp('(^|\\s)' + className + '(?:\\s|$)'), '$1');
		return this;
	},

	toggleClass: function(className){
		return this.hasClass(className) ? this.removeClass(className) : this.addClass(className);
	},

	adopt: function(){
		Array.flatten(arguments).each(function(element){
			element = document.id(element, true);
			if (element) this.appendChild(element);
		}, this);
		return this;
	},

	appendText: function(text, where){
		return this.grab(this.getDocument().newTextNode(text), where);
	},

	grab: function(el, where){
		inserters[where || 'bottom'](document.id(el, true), this);
		return this;
	},

	inject: function(el, where){
		inserters[where || 'bottom'](this, document.id(el, true));
		return this;
	},

	replaces: function(el){
		el = document.id(el, true);
		el.parentNode.replaceChild(this, el);
		return this;
	},

	wraps: function(el, where){
		el = document.id(el, true);
		return this.replaces(el).grab(el, where);
	},

	getPrevious: function(match, nocash){
		return walk(this, 'previousSibling', null, match, false, nocash);
	},

	getAllPrevious: function(match, nocash){
		return walk(this, 'previousSibling', null, match, true, nocash);
	},

	getNext: function(match, nocash){
		return walk(this, 'nextSibling', null, match, false, nocash);
	},

	getAllNext: function(match, nocash){
		return walk(this, 'nextSibling', null, match, true, nocash);
	},

	getFirst: function(match, nocash){
		return walk(this, 'nextSibling', 'firstChild', match, false, nocash);
	},

	getLast: function(match, nocash){
		return walk(this, 'previousSibling', 'lastChild', match, false, nocash);
	},

	getParent: function(match, nocash){
		return walk(this, 'parentNode', null, match, false, nocash);
	},

	getParents: function(match, nocash){
		return walk(this, 'parentNode', null, match, true, nocash);
	},
	
	getSiblings: function(match, nocash){
		return this.getParent().getChildren(match, nocash).erase(this);
	},

	getChildren: function(match, nocash){
		return walk(this, 'nextSibling', 'firstChild', match, true, nocash);
	},

	getWindow: function(){
		return this.ownerDocument.window;
	},

	getDocument: function(){
		return this.ownerDocument;
	},

	getElementById: function(id, nocash){
		var el = this.ownerDocument.getElementById(id);
		if (!el) return null;
		for (var parent = el.parentNode; parent != this; parent = parent.parentNode){
			if (!parent) return null;
		}
		return document.id(el, nocash);
	},

	getSelected: function(){
		return new Elements($A(this.options).filter(function(option){
			return option.selected;
		}));
	},

	getComputedStyle: function(property){
		if (this.currentStyle) return this.currentStyle[property.camelCase()];
		var computed = this.getDocument().defaultView.getComputedStyle(this, null);
		return (computed) ? computed.getPropertyValue([property.hyphenate()]) : null;
	},

	toQueryString: function(){
		var queryString = [];
		this.getElements('input, select, textarea', true).each(function(el){
			if (!el.name || el.disabled || el.type == 'submit' || el.type == 'reset' || el.type == 'file') return;
			var value = (el.tagName.toLowerCase() == 'select') ? Element.getSelected(el).map(function(opt){
				return opt.value;
			}) : ((el.type == 'radio' || el.type == 'checkbox') && !el.checked) ? null : el.value;
			$splat(value).each(function(val){
				if (typeof val != 'undefined') queryString.push(el.name + '=' + encodeURIComponent(val));
			});
		});
		return queryString.join('&');
	},

	clone: function(contents, keepid){
		contents = contents !== false;
		var clone = this.cloneNode(contents);
		var clean = function(node, element){
			if (!keepid) node.removeAttribute('id');
			if (Browser.Engine.trident){
				node.clearAttributes();
				node.mergeAttributes(element);
				node.removeAttribute('uid');
				if (node.options){
					var no = node.options, eo = element.options;
					for (var j = no.length; j--;) no[j].selected = eo[j].selected;
				}
			}
			var prop = props[element.tagName.toLowerCase()];
			if (prop && element[prop]) node[prop] = element[prop];
		};

		if (contents){
			var ce = clone.getElementsByTagName('*'), te = this.getElementsByTagName('*');
			for (var i = ce.length; i--;) clean(ce[i], te[i]);
		}

		clean(clone, this);
		return document.id(clone);
	},

	destroy: function(){
		Element.empty(this);
		Element.dispose(this);
		clean(this, true);
		return null;
	},

	empty: function(){
		$A(this.childNodes).each(function(node){
			Element.destroy(node);
		});
		return this;
	},

	dispose: function(){
		return (this.parentNode) ? this.parentNode.removeChild(this) : this;
	},

	hasChild: function(el){
		el = document.id(el, true);
		if (!el) return false;
		if (Browser.Engine.webkit && Browser.Engine.version < 420) return $A(this.getElementsByTagName(el.tagName)).contains(el);
		return (this.contains) ? (this != el && this.contains(el)) : !!(this.compareDocumentPosition(el) & 16);
	},

	match: function(tag){
		return (!tag || (tag == this) || (Element.get(this, 'tag') == tag));
	}

});

Native.implement([Element, Window, Document], {

	addListener: function(type, fn){
		if (type == 'unload'){
			var old = fn, self = this;
			fn = function(){
				self.removeListener('unload', fn);
				old();
			};
		} else {
			collected[this.uid] = this;
		}
		if (this.addEventListener) this.addEventListener(type, fn, false);
		else this.attachEvent('on' + type, fn);
		return this;
	},

	removeListener: function(type, fn){
		if (this.removeEventListener) this.removeEventListener(type, fn, false);
		else this.detachEvent('on' + type, fn);
		return this;
	},

	retrieve: function(property, dflt){
		var storage = get(this.uid), prop = storage[property];
		if (dflt != undefined && prop == undefined) prop = storage[property] = dflt;
		return $pick(prop);
	},

	store: function(property, value){
		var storage = get(this.uid);
		storage[property] = value;
		return this;
	},

	eliminate: function(property){
		var storage = get(this.uid);
		delete storage[property];
		return this;
	}

});

window.addListener('unload', purge);

})();

Element.Properties = new Hash;

Element.Properties.style = {

	set: function(style){
		this.style.cssText = style;
	},

	get: function(){
		return this.style.cssText;
	},

	erase: function(){
		this.style.cssText = '';
	}

};

Element.Properties.tag = {

	get: function(){
		return this.tagName.toLowerCase();
	}

};

Element.Properties.html = (function(){
	var wrapper = document.createElement('div');

	var translations = {
		table: [1, '<table>', '</table>'],
		select: [1, '<select>', '</select>'],
		tbody: [2, '<table><tbody>', '</tbody></table>'],
		tr: [3, '<table><tbody><tr>', '</tr></tbody></table>']
	};
	translations.thead = translations.tfoot = translations.tbody;

	var html = {
		set: function(){
			var html = Array.flatten(arguments).join('');
			var wrap = Browser.Engine.trident && translations[this.get('tag')];
			if (wrap){
				var first = wrapper;
				first.innerHTML = wrap[1] + html + wrap[2];
				for (var i = wrap[0]; i--;) first = first.firstChild;
				this.empty().adopt(first.childNodes);
			} else {
				this.innerHTML = html;
			}
		}
	};

	html.erase = html.set;

	return html;
})();

if (Browser.Engine.webkit && Browser.Engine.version < 420) Element.Properties.text = {
	get: function(){
		if (this.innerText) return this.innerText;
		var temp = this.ownerDocument.newElement('div', {html: this.innerHTML}).inject(this.ownerDocument.body);
		var text = temp.innerText;
		temp.destroy();
		return text;
	}
};


/*
---

script: Element.Event.js

description: Contains Element methods for dealing with events. This file also includes mouseenter and mouseleave custom Element Events.

license: MIT-style license.

requires: 
- /Element
- /Event

provides: [Element.Event]

...
*/

Element.Properties.events = {set: function(events){
	this.addEvents(events);
}};

Native.implement([Element, Window, Document], {

	addEvent: function(type, fn){
		var events = this.retrieve('events', {});
		events[type] = events[type] || {'keys': [], 'values': []};
		if (events[type].keys.contains(fn)) return this;
		events[type].keys.push(fn);
		var realType = type, custom = Element.Events.get(type), condition = fn, self = this;
		if (custom){
			if (custom.onAdd) custom.onAdd.call(this, fn);
			if (custom.condition){
				condition = function(event){
					if (custom.condition.call(this, event)) return fn.call(this, event);
					return true;
				};
			}
			realType = custom.base || realType;
		}
		var defn = function(){
			return fn.call(self);
		};
		var nativeEvent = Element.NativeEvents[realType];
		if (nativeEvent){
			if (nativeEvent == 2){
				defn = function(event){
					event = new Event(event, self.getWindow());
					if (condition.call(self, event) === false) event.stop();
				};
			}
			this.addListener(realType, defn);
		}
		events[type].values.push(defn);
		return this;
	},

	removeEvent: function(type, fn){
		var events = this.retrieve('events');
		if (!events || !events[type]) return this;
		var pos = events[type].keys.indexOf(fn);
		if (pos == -1) return this;
		events[type].keys.splice(pos, 1);
		var value = events[type].values.splice(pos, 1)[0];
		var custom = Element.Events.get(type);
		if (custom){
			if (custom.onRemove) custom.onRemove.call(this, fn);
			type = custom.base || type;
		}
		return (Element.NativeEvents[type]) ? this.removeListener(type, value) : this;
	},

	addEvents: function(events){
		for (var event in events) this.addEvent(event, events[event]);
		return this;
	},

	removeEvents: function(events){
		var type;
		if ($type(events) == 'object'){
			for (type in events) this.removeEvent(type, events[type]);
			return this;
		}
		var attached = this.retrieve('events');
		if (!attached) return this;
		if (!events){
			for (type in attached) this.removeEvents(type);
			this.eliminate('events');
		} else if (attached[events]){
			while (attached[events].keys[0]) this.removeEvent(events, attached[events].keys[0]);
			attached[events] = null;
		}
		return this;
	},

	fireEvent: function(type, args, delay){
		var events = this.retrieve('events');
		if (!events || !events[type]) return this;
		events[type].keys.each(function(fn){
			fn.create({'bind': this, 'delay': delay, 'arguments': args})();
		}, this);
		return this;
	},

	cloneEvents: function(from, type){
		from = document.id(from);
		var fevents = from.retrieve('events');
		if (!fevents) return this;
		if (!type){
			for (var evType in fevents) this.cloneEvents(from, evType);
		} else if (fevents[type]){
			fevents[type].keys.each(function(fn){
				this.addEvent(type, fn);
			}, this);
		}
		return this;
	}

});

Element.NativeEvents = {
	click: 2, dblclick: 2, mouseup: 2, mousedown: 2, contextmenu: 2, //mouse buttons
	mousewheel: 2, DOMMouseScroll: 2, //mouse wheel
	mouseover: 2, mouseout: 2, mousemove: 2, selectstart: 2, selectend: 2, //mouse movement
	keydown: 2, keypress: 2, keyup: 2, //keyboard
	focus: 2, blur: 2, change: 2, reset: 2, select: 2, submit: 2, //form elements
	load: 1, unload: 1, beforeunload: 2, resize: 1, move: 1, DOMContentLoaded: 1, readystatechange: 1, //window
	error: 1, abort: 1, scroll: 1 //misc
};

(function(){

var $check = function(event){
	var related = event.relatedTarget;
	if (related == undefined) return true;
	if (related === false) return false;
	return ($type(this) != 'document' && related != this && related.prefix != 'xul' && !this.hasChild(related));
};

Element.Events = new Hash({

	mouseenter: {
		base: 'mouseover',
		condition: $check
	},

	mouseleave: {
		base: 'mouseout',
		condition: $check
	},

	mousewheel: {
		base: (Browser.Engine.gecko) ? 'DOMMouseScroll' : 'mousewheel'
	}

});

})();


/*
---

script: Element.Style.js

description: Contains methods for interacting with the styles of Elements in a fashionable way.

license: MIT-style license.

requires:
- /Element

provides: [Element.Style]

...
*/

Element.Properties.styles = {set: function(styles){
	this.setStyles(styles);
}};

Element.Properties.opacity = {

	set: function(opacity, novisibility){
		if (!novisibility){
			if (opacity == 0){
				if (this.style.visibility != 'hidden') this.style.visibility = 'hidden';
			} else {
				if (this.style.visibility != 'visible') this.style.visibility = 'visible';
			}
		}
		if (!this.currentStyle || !this.currentStyle.hasLayout) this.style.zoom = 1;
		if (Browser.Engine.trident) this.style.filter = (opacity == 1) ? '' : 'alpha(opacity=' + opacity * 100 + ')';
		this.style.opacity = opacity;
		this.store('opacity', opacity);
	},

	get: function(){
		return this.retrieve('opacity', 1);
	}

};

Element.implement({

	setOpacity: function(value){
		return this.set('opacity', value, true);
	},

	getOpacity: function(){
		return this.get('opacity');
	},

	setStyle: function(property, value){
		switch (property){
			case 'opacity': return this.set('opacity', parseFloat(value));
			case 'float': property = (Browser.Engine.trident) ? 'styleFloat' : 'cssFloat';
		}
		property = property.camelCase();
		if ($type(value) != 'string'){
			var map = (Element.Styles.get(property) || '@').split(' ');
			value = $splat(value).map(function(val, i){
				if (!map[i]) return '';
				return ($type(val) == 'number') ? map[i].replace('@', Math.round(val)) : val;
			}).join(' ');
		} else if (value == String(Number(value))){
			value = Math.round(value);
		}
		this.style[property] = value;
		return this;
	},

	getStyle: function(property){
		switch (property){
			case 'opacity': return this.get('opacity');
			case 'float': property = (Browser.Engine.trident) ? 'styleFloat' : 'cssFloat';
		}
		property = property.camelCase();
		var result = this.style[property];
		if (!$chk(result)){
			result = [];
			for (var style in Element.ShortStyles){
				if (property != style) continue;
				for (var s in Element.ShortStyles[style]) result.push(this.getStyle(s));
				return result.join(' ');
			}
			result = this.getComputedStyle(property);
		}
		if (result){
			result = String(result);
			var color = result.match(/rgba?\([\d\s,]+\)/);
			if (color) result = result.replace(color[0], color[0].rgbToHex());
		}
		if (Browser.Engine.presto || (Browser.Engine.trident && !$chk(parseInt(result, 10)))){
			if (property.test(/^(height|width)$/)){
				var values = (property == 'width') ? ['left', 'right'] : ['top', 'bottom'], size = 0;
				values.each(function(value){
					size += this.getStyle('border-' + value + '-width').toInt() + this.getStyle('padding-' + value).toInt();
				}, this);
				return this['offset' + property.capitalize()] - size + 'px';
			}
			if ((Browser.Engine.presto) && String(result).test('px')) return result;
			if (property.test(/(border(.+)Width|margin|padding)/)) return '0px';
		}
		return result;
	},

	setStyles: function(styles){
		for (var style in styles) this.setStyle(style, styles[style]);
		return this;
	},

	getStyles: function(){
		var result = {};
		Array.flatten(arguments).each(function(key){
			result[key] = this.getStyle(key);
		}, this);
		return result;
	}

});

Element.Styles = new Hash({
	left: '@px', top: '@px', bottom: '@px', right: '@px',
	width: '@px', height: '@px', maxWidth: '@px', maxHeight: '@px', minWidth: '@px', minHeight: '@px',
	backgroundColor: 'rgb(@, @, @)', backgroundPosition: '@px @px', color: 'rgb(@, @, @)',
	fontSize: '@px', letterSpacing: '@px', lineHeight: '@px', clip: 'rect(@px @px @px @px)',
	margin: '@px @px @px @px', padding: '@px @px @px @px', border: '@px @ rgb(@, @, @) @px @ rgb(@, @, @) @px @ rgb(@, @, @)',
	borderWidth: '@px @px @px @px', borderStyle: '@ @ @ @', borderColor: 'rgb(@, @, @) rgb(@, @, @) rgb(@, @, @) rgb(@, @, @)',
	zIndex: '@', 'zoom': '@', fontWeight: '@', textIndent: '@px', opacity: '@'
});

Element.ShortStyles = {margin: {}, padding: {}, border: {}, borderWidth: {}, borderStyle: {}, borderColor: {}};

['Top', 'Right', 'Bottom', 'Left'].each(function(direction){
	var Short = Element.ShortStyles;
	var All = Element.Styles;
	['margin', 'padding'].each(function(style){
		var sd = style + direction;
		Short[style][sd] = All[sd] = '@px';
	});
	var bd = 'border' + direction;
	Short.border[bd] = All[bd] = '@px @ rgb(@, @, @)';
	var bdw = bd + 'Width', bds = bd + 'Style', bdc = bd + 'Color';
	Short[bd] = {};
	Short.borderWidth[bdw] = Short[bd][bdw] = All[bdw] = '@px';
	Short.borderStyle[bds] = Short[bd][bds] = All[bds] = '@';
	Short.borderColor[bdc] = Short[bd][bdc] = All[bdc] = 'rgb(@, @, @)';
});


/*
---

script: Element.Dimensions.js

description: Contains methods to work with size, scroll, or positioning of Elements and the window object.

license: MIT-style license.

credits:
- Element positioning based on the [qooxdoo](http://qooxdoo.org/) code and smart browser fixes, [LGPL License](http://www.gnu.org/licenses/lgpl.html).
- Viewport dimensions based on [YUI](http://developer.yahoo.com/yui/) code, [BSD License](http://developer.yahoo.com/yui/license.html).

requires:
- /Element

provides: [Element.Dimensions]

...
*/

(function(){

Element.implement({

	scrollTo: function(x, y){
		if (isBody(this)){
			this.getWindow().scrollTo(x, y);
		} else {
			this.scrollLeft = x;
			this.scrollTop = y;
		}
		return this;
	},

	getSize: function(){
		if (isBody(this)) return this.getWindow().getSize();
		return {x: this.offsetWidth, y: this.offsetHeight};
	},

	getScrollSize: function(){
		if (isBody(this)) return this.getWindow().getScrollSize();
		return {x: this.scrollWidth, y: this.scrollHeight};
	},

	getScroll: function(){
		if (isBody(this)) return this.getWindow().getScroll();
		return {x: this.scrollLeft, y: this.scrollTop};
	},

	getScrolls: function(){
		var element = this, position = {x: 0, y: 0};
		while (element && !isBody(element)){
			position.x += element.scrollLeft;
			position.y += element.scrollTop;
			element = element.parentNode;
		}
		return position;
	},

	getOffsetParent: function(){
		var element = this;
		if (isBody(element)) return null;
		if (!Browser.Engine.trident) return element.offsetParent;
		while ((element = element.parentNode) && !isBody(element)){
			if (styleString(element, 'position') != 'static') return element;
		}
		return null;
	},

	getOffsets: function(){
		if (this.getBoundingClientRect){
			var bound = this.getBoundingClientRect(),
				html = document.id(this.getDocument().documentElement),
				htmlScroll = html.getScroll(),
				elemScrolls = this.getScrolls(),
				elemScroll = this.getScroll(),
				isFixed = (styleString(this, 'position') == 'fixed');

			return {
				x: bound.left.toInt() + elemScrolls.x - elemScroll.x + ((isFixed) ? 0 : htmlScroll.x) - html.clientLeft,
				y: bound.top.toInt()  + elemScrolls.y - elemScroll.y + ((isFixed) ? 0 : htmlScroll.y) - html.clientTop
			};
		}

		var element = this, position = {x: 0, y: 0};
		if (isBody(this)) return position;

		while (element && !isBody(element)){
			position.x += element.offsetLeft;
			position.y += element.offsetTop;

			if (Browser.Engine.gecko){
				if (!borderBox(element)){
					position.x += leftBorder(element);
					position.y += topBorder(element);
				}
				var parent = element.parentNode;
				if (parent && styleString(parent, 'overflow') != 'visible'){
					position.x += leftBorder(parent);
					position.y += topBorder(parent);
				}
			} else if (element != this && Browser.Engine.webkit){
				position.x += leftBorder(element);
				position.y += topBorder(element);
			}

			element = element.offsetParent;
		}
		if (Browser.Engine.gecko && !borderBox(this)){
			position.x -= leftBorder(this);
			position.y -= topBorder(this);
		}
		return position;
	},

	getPosition: function(relative){
		if (isBody(this)) return {x: 0, y: 0};
		var offset = this.getOffsets(),
				scroll = this.getScrolls();
		var position = {
			x: offset.x - scroll.x,
			y: offset.y - scroll.y
		};
		var relativePosition = (relative && (relative = document.id(relative))) ? relative.getPosition() : {x: 0, y: 0};
		return {x: position.x - relativePosition.x, y: position.y - relativePosition.y};
	},

	getCoordinates: function(element){
		if (isBody(this)) return this.getWindow().getCoordinates();
		var position = this.getPosition(element),
				size = this.getSize();
		var obj = {
			left: position.x,
			top: position.y,
			width: size.x,
			height: size.y
		};
		obj.right = obj.left + obj.width;
		obj.bottom = obj.top + obj.height;
		return obj;
	},

	computePosition: function(obj){
		return {
			left: obj.x - styleNumber(this, 'margin-left'),
			top: obj.y - styleNumber(this, 'margin-top')
		};
	},

	setPosition: function(obj){
		return this.setStyles(this.computePosition(obj));
	}

});


Native.implement([Document, Window], {

	getSize: function(){
		if (Browser.Engine.presto || Browser.Engine.webkit){
			var win = this.getWindow();
			return {x: win.innerWidth, y: win.innerHeight};
		}
		var doc = getCompatElement(this);
		return {x: doc.clientWidth, y: doc.clientHeight};
	},

	getScroll: function(){
		var win = this.getWindow(), doc = getCompatElement(this);
		return {x: win.pageXOffset || doc.scrollLeft, y: win.pageYOffset || doc.scrollTop};
	},

	getScrollSize: function(){
		var doc = getCompatElement(this), min = this.getSize();
		return {x: Math.max(doc.scrollWidth, min.x), y: Math.max(doc.scrollHeight, min.y)};
	},

	getPosition: function(){
		return {x: 0, y: 0};
	},

	getCoordinates: function(){
		var size = this.getSize();
		return {top: 0, left: 0, bottom: size.y, right: size.x, height: size.y, width: size.x};
	}

});

// private methods

var styleString = Element.getComputedStyle;

function styleNumber(element, style){
	return styleString(element, style).toInt() || 0;
};

function borderBox(element){
	return styleString(element, '-moz-box-sizing') == 'border-box';
};

function topBorder(element){
	return styleNumber(element, 'border-top-width');
};

function leftBorder(element){
	return styleNumber(element, 'border-left-width');
};

function isBody(element){
	return (/^(?:body|html)$/i).test(element.tagName);
};

function getCompatElement(element){
	var doc = element.getDocument();
	return (!doc.compatMode || doc.compatMode == 'CSS1Compat') ? doc.html : doc.body;
};

})();

//aliases
Element.alias('setPosition', 'position'); //compatability

Native.implement([Window, Document, Element], {

	getHeight: function(){
		return this.getSize().y;
	},

	getWidth: function(){
		return this.getSize().x;
	},

	getScrollTop: function(){
		return this.getScroll().y;
	},

	getScrollLeft: function(){
		return this.getScroll().x;
	},

	getScrollHeight: function(){
		return this.getScrollSize().y;
	},

	getScrollWidth: function(){
		return this.getScrollSize().x;
	},

	getTop: function(){
		return this.getPosition().y;
	},

	getLeft: function(){
		return this.getPosition().x;
	}

});


/*
---

script: Selectors.js

description: Adds advanced CSS-style querying capabilities for targeting HTML Elements. Includes pseudo selectors.

license: MIT-style license.

requires:
- /Element

provides: [Selectors]

...
*/

Native.implement([Document, Element], {

	getElements: function(expression, nocash){
		expression = expression.split(',');
		var items, local = {};
		for (var i = 0, l = expression.length; i < l; i++){
			var selector = expression[i], elements = Selectors.Utils.search(this, selector, local);
			if (i != 0 && elements.item) elements = $A(elements);
			items = (i == 0) ? elements : (items.item) ? $A(items).concat(elements) : items.concat(elements);
		}
		return new Elements(items, {ddup: (expression.length > 1), cash: !nocash});
	}

});

Element.implement({

	match: function(selector){
		if (!selector || (selector == this)) return true;
		var tagid = Selectors.Utils.parseTagAndID(selector);
		var tag = tagid[0], id = tagid[1];
		if (!Selectors.Filters.byID(this, id) || !Selectors.Filters.byTag(this, tag)) return false;
		var parsed = Selectors.Utils.parseSelector(selector);
		return (parsed) ? Selectors.Utils.filter(this, parsed, {}) : true;
	}

});

var Selectors = {Cache: {nth: {}, parsed: {}}};

Selectors.RegExps = {
	id: (/#([\w-]+)/),
	tag: (/^(\w+|\*)/),
	quick: (/^(\w+|\*)$/),
	splitter: (/\s*([+>~\s])\s*([a-zA-Z#.*:\[])/g),
	combined: (/\.([\w-]+)|\[(\w+)(?:([!*^$~|]?=)(["']?)([^\4]*?)\4)?\]|:([\w-]+)(?:\(["']?(.*?)?["']?\)|$)/g)
};

Selectors.Utils = {

	chk: function(item, uniques){
		if (!uniques) return true;
		var uid = $uid(item);
		if (!uniques[uid]) return uniques[uid] = true;
		return false;
	},

	parseNthArgument: function(argument){
		if (Selectors.Cache.nth[argument]) return Selectors.Cache.nth[argument];
		var parsed = argument.match(/^([+-]?\d*)?([a-z]+)?([+-]?\d*)?$/);
		if (!parsed) return false;
		var inta = parseInt(parsed[1], 10);
		var a = (inta || inta === 0) ? inta : 1;
		var special = parsed[2] || false;
		var b = parseInt(parsed[3], 10) || 0;
		if (a != 0){
			b--;
			while (b < 1) b += a;
			while (b >= a) b -= a;
		} else {
			a = b;
			special = 'index';
		}
		switch (special){
			case 'n': parsed = {a: a, b: b, special: 'n'}; break;
			case 'odd': parsed = {a: 2, b: 0, special: 'n'}; break;
			case 'even': parsed = {a: 2, b: 1, special: 'n'}; break;
			case 'first': parsed = {a: 0, special: 'index'}; break;
			case 'last': parsed = {special: 'last-child'}; break;
			case 'only': parsed = {special: 'only-child'}; break;
			default: parsed = {a: (a - 1), special: 'index'};
		}

		return Selectors.Cache.nth[argument] = parsed;
	},

	parseSelector: function(selector){
		if (Selectors.Cache.parsed[selector]) return Selectors.Cache.parsed[selector];
		var m, parsed = {classes: [], pseudos: [], attributes: []};
		while ((m = Selectors.RegExps.combined.exec(selector))){
			var cn = m[1], an = m[2], ao = m[3], av = m[5], pn = m[6], pa = m[7];
			if (cn){
				parsed.classes.push(cn);
			} else if (pn){
				var parser = Selectors.Pseudo.get(pn);
				if (parser) parsed.pseudos.push({parser: parser, argument: pa});
				else parsed.attributes.push({name: pn, operator: '=', value: pa});
			} else if (an){
				parsed.attributes.push({name: an, operator: ao, value: av});
			}
		}
		if (!parsed.classes.length) delete parsed.classes;
		if (!parsed.attributes.length) delete parsed.attributes;
		if (!parsed.pseudos.length) delete parsed.pseudos;
		if (!parsed.classes && !parsed.attributes && !parsed.pseudos) parsed = null;
		return Selectors.Cache.parsed[selector] = parsed;
	},

	parseTagAndID: function(selector){
		var tag = selector.match(Selectors.RegExps.tag);
		var id = selector.match(Selectors.RegExps.id);
		return [(tag) ? tag[1] : '*', (id) ? id[1] : false];
	},

	filter: function(item, parsed, local){
		var i;
		if (parsed.classes){
			for (i = parsed.classes.length; i--; i){
				var cn = parsed.classes[i];
				if (!Selectors.Filters.byClass(item, cn)) return false;
			}
		}
		if (parsed.attributes){
			for (i = parsed.attributes.length; i--; i){
				var att = parsed.attributes[i];
				if (!Selectors.Filters.byAttribute(item, att.name, att.operator, att.value)) return false;
			}
		}
		if (parsed.pseudos){
			for (i = parsed.pseudos.length; i--; i){
				var psd = parsed.pseudos[i];
				if (!Selectors.Filters.byPseudo(item, psd.parser, psd.argument, local)) return false;
			}
		}
		return true;
	},

	getByTagAndID: function(ctx, tag, id){
		if (id){
			var item = (ctx.getElementById) ? ctx.getElementById(id, true) : Element.getElementById(ctx, id, true);
			return (item && Selectors.Filters.byTag(item, tag)) ? [item] : [];
		} else {
			return ctx.getElementsByTagName(tag);
		}
	},

	search: function(self, expression, local){
		var splitters = [];

		var selectors = expression.trim().replace(Selectors.RegExps.splitter, function(m0, m1, m2){
			splitters.push(m1);
			return ':)' + m2;
		}).split(':)');

		var items, filtered, item;

		for (var i = 0, l = selectors.length; i < l; i++){

			var selector = selectors[i];

			if (i == 0 && Selectors.RegExps.quick.test(selector)){
				items = self.getElementsByTagName(selector);
				continue;
			}

			var splitter = splitters[i - 1];

			var tagid = Selectors.Utils.parseTagAndID(selector);
			var tag = tagid[0], id = tagid[1];

			if (i == 0){
				items = Selectors.Utils.getByTagAndID(self, tag, id);
			} else {
				var uniques = {}, found = [];
				for (var j = 0, k = items.length; j < k; j++) found = Selectors.Getters[splitter](found, items[j], tag, id, uniques);
				items = found;
			}

			var parsed = Selectors.Utils.parseSelector(selector);

			if (parsed){
				filtered = [];
				for (var m = 0, n = items.length; m < n; m++){
					item = items[m];
					if (Selectors.Utils.filter(item, parsed, local)) filtered.push(item);
				}
				items = filtered;
			}

		}

		return items;

	}

};

Selectors.Getters = {

	' ': function(found, self, tag, id, uniques){
		var items = Selectors.Utils.getByTagAndID(self, tag, id);
		for (var i = 0, l = items.length; i < l; i++){
			var item = items[i];
			if (Selectors.Utils.chk(item, uniques)) found.push(item);
		}
		return found;
	},

	'>': function(found, self, tag, id, uniques){
		var children = Selectors.Utils.getByTagAndID(self, tag, id);
		for (var i = 0, l = children.length; i < l; i++){
			var child = children[i];
			if (child.parentNode == self && Selectors.Utils.chk(child, uniques)) found.push(child);
		}
		return found;
	},

	'+': function(found, self, tag, id, uniques){
		while ((self = self.nextSibling)){
			if (self.nodeType == 1){
				if (Selectors.Utils.chk(self, uniques) && Selectors.Filters.byTag(self, tag) && Selectors.Filters.byID(self, id)) found.push(self);
				break;
			}
		}
		return found;
	},

	'~': function(found, self, tag, id, uniques){
		while ((self = self.nextSibling)){
			if (self.nodeType == 1){
				if (!Selectors.Utils.chk(self, uniques)) break;
				if (Selectors.Filters.byTag(self, tag) && Selectors.Filters.byID(self, id)) found.push(self);
			}
		}
		return found;
	}

};

Selectors.Filters = {

	byTag: function(self, tag){
		return (tag == '*' || (self.tagName && self.tagName.toLowerCase() == tag));
	},

	byID: function(self, id){
		return (!id || (self.id && self.id == id));
	},

	byClass: function(self, klass){
		return (self.className && self.className.contains && self.className.contains(klass, ' '));
	},

	byPseudo: function(self, parser, argument, local){
		return parser.call(self, argument, local);
	},

	byAttribute: function(self, name, operator, value){
		var result = Element.prototype.getProperty.call(self, name);
		if (!result) return (operator == '!=');
		if (!operator || value == undefined) return true;
		switch (operator){
			case '=': return (result == value);
			case '*=': return (result.contains(value));
			case '^=': return (result.substr(0, value.length) == value);
			case '$=': return (result.substr(result.length - value.length) == value);
			case '!=': return (result != value);
			case '~=': return result.contains(value, ' ');
			case '|=': return result.contains(value, '-');
		}
		return false;
	}

};

Selectors.Pseudo = new Hash({

	// w3c pseudo selectors

	checked: function(){
		return this.checked;
	},
	
	empty: function(){
		return !(this.innerText || this.textContent || '').length;
	},

	not: function(selector){
		return !Element.match(this, selector);
	},

	contains: function(text){
		return (this.innerText || this.textContent || '').contains(text);
	},

	'first-child': function(){
		return Selectors.Pseudo.index.call(this, 0);
	},

	'last-child': function(){
		var element = this;
		while ((element = element.nextSibling)){
			if (element.nodeType == 1) return false;
		}
		return true;
	},

	'only-child': function(){
		var prev = this;
		while ((prev = prev.previousSibling)){
			if (prev.nodeType == 1) return false;
		}
		var next = this;
		while ((next = next.nextSibling)){
			if (next.nodeType == 1) return false;
		}
		return true;
	},

	'nth-child': function(argument, local){
		argument = (argument == undefined) ? 'n' : argument;
		var parsed = Selectors.Utils.parseNthArgument(argument);
		if (parsed.special != 'n') return Selectors.Pseudo[parsed.special].call(this, parsed.a, local);
		var count = 0;
		local.positions = local.positions || {};
		var uid = $uid(this);
		if (!local.positions[uid]){
			var self = this;
			while ((self = self.previousSibling)){
				if (self.nodeType != 1) continue;
				count ++;
				var position = local.positions[$uid(self)];
				if (position != undefined){
					count = position + count;
					break;
				}
			}
			local.positions[uid] = count;
		}
		return (local.positions[uid] % parsed.a == parsed.b);
	},

	// custom pseudo selectors

	index: function(index){
		var element = this, count = 0;
		while ((element = element.previousSibling)){
			if (element.nodeType == 1 && ++count > index) return false;
		}
		return (count == index);
	},

	even: function(argument, local){
		return Selectors.Pseudo['nth-child'].call(this, '2n+1', local);
	},

	odd: function(argument, local){
		return Selectors.Pseudo['nth-child'].call(this, '2n', local);
	},
	
	selected: function(){
		return this.selected;
	},
	
	enabled: function(){
		return (this.disabled === false);
	}

});


/*
---

script: DomReady.js

description: Contains the custom event domready.

license: MIT-style license.

requires:
- /Element.Event

provides: [DomReady]

...
*/

Element.Events.domready = {

	onAdd: function(fn){
		if (Browser.loaded) fn.call(this);
	}

};

(function(){

	var domready = function(){
		if (Browser.loaded) return;
		Browser.loaded = true;
		window.fireEvent('domready');
		document.fireEvent('domready');
	};
	
	window.addEvent('load', domready);

	if (Browser.Engine.trident){
		var temp = document.createElement('div');
		(function(){
			($try(function(){
				temp.doScroll(); // Technique by Diego Perini
				return document.id(temp).inject(document.body).set('html', 'temp').dispose();
			})) ? domready() : arguments.callee.delay(50);
		})();
	} else if (Browser.Engine.webkit && Browser.Engine.version < 525){
		(function(){
			(['loaded', 'complete'].contains(document.readyState)) ? domready() : arguments.callee.delay(50);
		})();
	} else {
		document.addEvent('DOMContentLoaded', domready);
	}

})();


/*
---

script: JSON.js

description: JSON encoder and decoder.

license: MIT-style license.

See Also: <http://www.json.org/>

requires:
- /Array
- /String
- /Number
- /Function
- /Hash

provides: [JSON]

...
*/

var JSON = new Hash(this.JSON && {
	stringify: JSON.stringify,
	parse: JSON.parse
}).extend({
	
	$specialChars: {'\b': '\\b', '\t': '\\t', '\n': '\\n', '\f': '\\f', '\r': '\\r', '"' : '\\"', '\\': '\\\\'},

	$replaceChars: function(chr){
		return JSON.$specialChars[chr] || '\\u00' + Math.floor(chr.charCodeAt() / 16).toString(16) + (chr.charCodeAt() % 16).toString(16);
	},

	encode: function(obj){
		switch ($type(obj)){
			case 'string':
				return '"' + obj.replace(/[\x00-\x1f\\"]/g, JSON.$replaceChars) + '"';
			case 'array':
				return '[' + String(obj.map(JSON.encode).clean()) + ']';
			case 'object': case 'hash':
				var string = [];
				Hash.each(obj, function(value, key){
					var json = JSON.encode(value);
					if (json) string.push(JSON.encode(key) + ':' + json);
				});
				return '{' + string + '}';
			case 'number': case 'boolean': return String(obj);
			case false: return 'null';
		}
		return null;
	},

	decode: function(string, secure){
		if ($type(string) != 'string' || !string.length) return null;
		if (secure && !(/^[,:{}\[\]0-9.\-+Eaeflnr-u \n\r\t]*$/).test(string.replace(/\\./g, '@').replace(/"[^"\\\n\r]*"/g, ''))) return null;
		return eval('(' + string + ')');
	}

});

Native.implement([Hash, Array, String, Number], {

	toJSON: function(){
		return JSON.encode(this);
	}

});


/*
---

script: Cookie.js

description: Class for creating, reading, and deleting browser Cookies.

license: MIT-style license.

credits:
- Based on the functions by Peter-Paul Koch (http://quirksmode.org).

requires:
- /Options

provides: [Cookie]

...
*/

var Cookie = new Class({

	Implements: Options,

	options: {
		path: false,
		domain: false,
		duration: false,
		secure: false,
		document: document
	},

	initialize: function(key, options){
		this.key = key;
		this.setOptions(options);
	},

	write: function(value){
		value = encodeURIComponent(value);
		if (this.options.domain) value += '; domain=' + this.options.domain;
		if (this.options.path) value += '; path=' + this.options.path;
		if (this.options.duration){
			var date = new Date();
			date.setTime(date.getTime() + this.options.duration * 24 * 60 * 60 * 1000);
			value += '; expires=' + date.toGMTString();
		}
		if (this.options.secure) value += '; secure';
		this.options.document.cookie = this.key + '=' + value;
		return this;
	},

	read: function(){
		var value = this.options.document.cookie.match('(?:^|;)\\s*' + this.key.escapeRegExp() + '=([^;]*)');
		return (value) ? decodeURIComponent(value[1]) : null;
	},

	dispose: function(){
		new Cookie(this.key, $merge(this.options, {duration: -1})).write('');
		return this;
	}

});

Cookie.write = function(key, value, options){
	return new Cookie(key, options).write(value);
};

Cookie.read = function(key){
	return new Cookie(key).read();
};

Cookie.dispose = function(key, options){
	return new Cookie(key, options).dispose();
};


/*
---

script: Swiff.js

description: Wrapper for embedding SWF movies. Supports External Interface Communication.

license: MIT-style license.

credits: 
- Flash detection & Internet Explorer + Flash Player 9 fix inspired by SWFObject.

requires:
- /Options
- /$util

provides: [Swiff]

...
*/

var Swiff = new Class({

	Implements: [Options],

	options: {
		id: null,
		height: 1,
		width: 1,
		container: null,
		properties: {},
		params: {
			quality: 'high',
			allowScriptAccess: 'always',
			wMode: 'transparent',
			swLiveConnect: true
		},
		callBacks: {},
		vars: {}
	},

	toElement: function(){
		return this.object;
	},

	initialize: function(path, options){
		this.instance = 'Swiff_' + $time();

		this.setOptions(options);
		options = this.options;
		var id = this.id = options.id || this.instance;
		var container = document.id(options.container);

		Swiff.CallBacks[this.instance] = {};

		var params = options.params, vars = options.vars, callBacks = options.callBacks;
		var properties = $extend({height: options.height, width: options.width}, options.properties);

		var self = this;

		for (var callBack in callBacks){
			Swiff.CallBacks[this.instance][callBack] = (function(option){
				return function(){
					return option.apply(self.object, arguments);
				};
			})(callBacks[callBack]);
			vars[callBack] = 'Swiff.CallBacks.' + this.instance + '.' + callBack;
		}

		params.flashVars = Hash.toQueryString(vars);
		if (Browser.Engine.trident){
			properties.classid = 'clsid:D27CDB6E-AE6D-11cf-96B8-444553540000';
			params.movie = path;
		} else {
			properties.type = 'application/x-shockwave-flash';
			properties.data = path;
		}
		var build = '<object id="' + id + '"';
		for (var property in properties) build += ' ' + property + '="' + properties[property] + '"';
		build += '>';
		for (var param in params){
			if (params[param]) build += '<param name="' + param + '" value="' + params[param] + '" />';
		}
		build += '</object>';
		this.object = ((container) ? container.empty() : new Element('div')).set('html', build).firstChild;
	},

	replaces: function(element){
		element = document.id(element, true);
		element.parentNode.replaceChild(this.toElement(), element);
		return this;
	},

	inject: function(element){
		document.id(element, true).appendChild(this.toElement());
		return this;
	},

	remote: function(){
		return Swiff.remote.apply(Swiff, [this.toElement()].extend(arguments));
	}

});

Swiff.CallBacks = {};

Swiff.remote = function(obj, fn){
	var rs = obj.CallFunction('<invoke name="' + fn + '" returntype="javascript">' + __flash__argumentsToXML(arguments, 2) + '</invoke>');
	return eval(rs);
};


/*
---

script: Fx.js

description: Contains the basic animation logic to be extended by all other Fx Classes.

license: MIT-style license.

requires:
- /Chain
- /Events
- /Options

provides: [Fx]

...
*/

var Fx = new Class({

	Implements: [Chain, Events, Options],

	options: {
		/*
		onStart: $empty,
		onCancel: $empty,
		onComplete: $empty,
		*/
		fps: 50,
		unit: false,
		duration: 500,
		link: 'ignore'
	},

	initialize: function(options){
		this.subject = this.subject || this;
		this.setOptions(options);
		this.options.duration = Fx.Durations[this.options.duration] || this.options.duration.toInt();
		var wait = this.options.wait;
		if (wait === false) this.options.link = 'cancel';
	},

	getTransition: function(){
		return function(p){
			return -(Math.cos(Math.PI * p) - 1) / 2;
		};
	},

	step: function(){
		var time = $time();
		if (time < this.time + this.options.duration){
			var delta = this.transition((time - this.time) / this.options.duration);
			this.set(this.compute(this.from, this.to, delta));
		} else {
			this.set(this.compute(this.from, this.to, 1));
			this.complete();
		}
	},

	set: function(now){
		return now;
	},

	compute: function(from, to, delta){
		return Fx.compute(from, to, delta);
	},

	check: function(){
		if (!this.timer) return true;
		switch (this.options.link){
			case 'cancel': this.cancel(); return true;
			case 'chain': this.chain(this.caller.bind(this, arguments)); return false;
		}
		return false;
	},

	start: function(from, to){
		if (!this.check(from, to)) return this;
		this.from = from;
		this.to = to;
		this.time = 0;
		this.transition = this.getTransition();
		this.startTimer();
		this.onStart();
		return this;
	},

	complete: function(){
		if (this.stopTimer()) this.onComplete();
		return this;
	},

	cancel: function(){
		if (this.stopTimer()) this.onCancel();
		return this;
	},

	onStart: function(){
		this.fireEvent('start', this.subject);
	},

	onComplete: function(){
		this.fireEvent('complete', this.subject);
		if (!this.callChain()) this.fireEvent('chainComplete', this.subject);
	},

	onCancel: function(){
		this.fireEvent('cancel', this.subject).clearChain();
	},

	pause: function(){
		this.stopTimer();
		return this;
	},

	resume: function(){
		this.startTimer();
		return this;
	},

	stopTimer: function(){
		if (!this.timer) return false;
		this.time = $time() - this.time;
		this.timer = $clear(this.timer);
		return true;
	},

	startTimer: function(){
		if (this.timer) return false;
		this.time = $time() - this.time;
		this.timer = this.step.periodical(Math.round(1000 / this.options.fps), this);
		return true;
	}

});

Fx.compute = function(from, to, delta){
	return (to - from) * delta + from;
};

Fx.Durations = {'short': 250, 'normal': 500, 'long': 1000};


/*
---

script: Fx.CSS.js

description: Contains the CSS animation logic. Used by Fx.Tween, Fx.Morph, Fx.Elements.

license: MIT-style license.

requires:
- /Fx
- /Element.Style

provides: [Fx.CSS]

...
*/

Fx.CSS = new Class({

	Extends: Fx,

	//prepares the base from/to object

	prepare: function(element, property, values){
		values = $splat(values);
		var values1 = values[1];
		if (!$chk(values1)){
			values[1] = values[0];
			values[0] = element.getStyle(property);
		}
		var parsed = values.map(this.parse);
		return {from: parsed[0], to: parsed[1]};
	},

	//parses a value into an array

	parse: function(value){
		value = $lambda(value)();
		value = (typeof value == 'string') ? value.split(' ') : $splat(value);
		return value.map(function(val){
			val = String(val);
			var found = false;
			Fx.CSS.Parsers.each(function(parser, key){
				if (found) return;
				var parsed = parser.parse(val);
				if ($chk(parsed)) found = {value: parsed, parser: parser};
			});
			found = found || {value: val, parser: Fx.CSS.Parsers.String};
			return found;
		});
	},

	//computes by a from and to prepared objects, using their parsers.

	compute: function(from, to, delta){
		var computed = [];
		(Math.min(from.length, to.length)).times(function(i){
			computed.push({value: from[i].parser.compute(from[i].value, to[i].value, delta), parser: from[i].parser});
		});
		computed.$family = {name: 'fx:css:value'};
		return computed;
	},

	//serves the value as settable

	serve: function(value, unit){
		if ($type(value) != 'fx:css:value') value = this.parse(value);
		var returned = [];
		value.each(function(bit){
			returned = returned.concat(bit.parser.serve(bit.value, unit));
		});
		return returned;
	},

	//renders the change to an element

	render: function(element, property, value, unit){
		element.setStyle(property, this.serve(value, unit));
	},

	//searches inside the page css to find the values for a selector

	search: function(selector){
		if (Fx.CSS.Cache[selector]) return Fx.CSS.Cache[selector];
		var to = {};
		Array.each(document.styleSheets, function(sheet, j){
			var href = sheet.href;
			if (href && href.contains('://') && !href.contains(document.domain)) return;
			var rules = sheet.rules || sheet.cssRules;
			Array.each(rules, function(rule, i){
				if (!rule.style) return;
				var selectorText = (rule.selectorText) ? rule.selectorText.replace(/^\w+/, function(m){
					return m.toLowerCase();
				}) : null;
				if (!selectorText || !selectorText.test('^' + selector + '$')) return;
				Element.Styles.each(function(value, style){
					if (!rule.style[style] || Element.ShortStyles[style]) return;
					value = String(rule.style[style]);
					to[style] = (value.test(/^rgb/)) ? value.rgbToHex() : value;
				});
			});
		});
		return Fx.CSS.Cache[selector] = to;
	}

});

Fx.CSS.Cache = {};

Fx.CSS.Parsers = new Hash({

	Color: {
		parse: function(value){
			if (value.match(/^#[0-9a-f]{3,6}$/i)) return value.hexToRgb(true);
			return ((value = value.match(/(\d+),\s*(\d+),\s*(\d+)/))) ? [value[1], value[2], value[3]] : false;
		},
		compute: function(from, to, delta){
			return from.map(function(value, i){
				return Math.round(Fx.compute(from[i], to[i], delta));
			});
		},
		serve: function(value){
			return value.map(Number);
		}
	},

	Number: {
		parse: parseFloat,
		compute: Fx.compute,
		serve: function(value, unit){
			return (unit) ? value + unit : value;
		}
	},

	String: {
		parse: $lambda(false),
		compute: $arguments(1),
		serve: $arguments(0)
	}

});


/*
---

script: Fx.Tween.js

description: Formerly Fx.Style, effect to transition any CSS property for an element.

license: MIT-style license.

requires: 
- /Fx.CSS

provides: [Fx.Tween, Element.fade, Element.highlight]

...
*/

Fx.Tween = new Class({

	Extends: Fx.CSS,

	initialize: function(element, options){
		this.element = this.subject = document.id(element);
		this.parent(options);
	},

	set: function(property, now){
		if (arguments.length == 1){
			now = property;
			property = this.property || this.options.property;
		}
		this.render(this.element, property, now, this.options.unit);
		return this;
	},

	start: function(property, from, to){
		if (!this.check(property, from, to)) return this;
		var args = Array.flatten(arguments);
		this.property = this.options.property || args.shift();
		var parsed = this.prepare(this.element, this.property, args);
		return this.parent(parsed.from, parsed.to);
	}

});

Element.Properties.tween = {

	set: function(options){
		var tween = this.retrieve('tween');
		if (tween) tween.cancel();
		return this.eliminate('tween').store('tween:options', $extend({link: 'cancel'}, options));
	},

	get: function(options){
		if (options || !this.retrieve('tween')){
			if (options || !this.retrieve('tween:options')) this.set('tween', options);
			this.store('tween', new Fx.Tween(this, this.retrieve('tween:options')));
		}
		return this.retrieve('tween');
	}

};

Element.implement({

	tween: function(property, from, to){
		this.get('tween').start(arguments);
		return this;
	},

	fade: function(how){
		var fade = this.get('tween'), o = 'opacity', toggle;
		how = $pick(how, 'toggle');
		switch (how){
			case 'in': fade.start(o, 1); break;
			case 'out': fade.start(o, 0); break;
			case 'show': fade.set(o, 1); break;
			case 'hide': fade.set(o, 0); break;
			case 'toggle':
				var flag = this.retrieve('fade:flag', this.get('opacity') == 1);
				fade.start(o, (flag) ? 0 : 1);
				this.store('fade:flag', !flag);
				toggle = true;
			break;
			default: fade.start(o, arguments);
		}
		if (!toggle) this.eliminate('fade:flag');
		return this;
	},

	highlight: function(start, end){
		if (!end){
			end = this.retrieve('highlight:original', this.getStyle('background-color'));
			end = (end == 'transparent') ? '#fff' : end;
		}
		var tween = this.get('tween');
		tween.start('background-color', start || '#ffff88', end).chain(function(){
			this.setStyle('background-color', this.retrieve('highlight:original'));
			tween.callChain();
		}.bind(this));
		return this;
	}

});


/*
---

script: Fx.Morph.js

description: Formerly Fx.Styles, effect to transition any number of CSS properties for an element using an object of rules, or CSS based selector rules.

license: MIT-style license.

requires:
- /Fx.CSS

provides: [Fx.Morph]

...
*/

Fx.Morph = new Class({

	Extends: Fx.CSS,

	initialize: function(element, options){
		this.element = this.subject = document.id(element);
		this.parent(options);
	},

	set: function(now){
		if (typeof now == 'string') now = this.search(now);
		for (var p in now) this.render(this.element, p, now[p], this.options.unit);
		return this;
	},

	compute: function(from, to, delta){
		var now = {};
		for (var p in from) now[p] = this.parent(from[p], to[p], delta);
		return now;
	},

	start: function(properties){
		if (!this.check(properties)) return this;
		if (typeof properties == 'string') properties = this.search(properties);
		var from = {}, to = {};
		for (var p in properties){
			var parsed = this.prepare(this.element, p, properties[p]);
			from[p] = parsed.from;
			to[p] = parsed.to;
		}
		return this.parent(from, to);
	}

});

Element.Properties.morph = {

	set: function(options){
		var morph = this.retrieve('morph');
		if (morph) morph.cancel();
		return this.eliminate('morph').store('morph:options', $extend({link: 'cancel'}, options));
	},

	get: function(options){
		if (options || !this.retrieve('morph')){
			if (options || !this.retrieve('morph:options')) this.set('morph', options);
			this.store('morph', new Fx.Morph(this, this.retrieve('morph:options')));
		}
		return this.retrieve('morph');
	}

};

Element.implement({

	morph: function(props){
		this.get('morph').start(props);
		return this;
	}

});


/*
---

script: Fx.Transitions.js

description: Contains a set of advanced transitions to be used with any of the Fx Classes.

license: MIT-style license.

credits:
- Easing Equations by Robert Penner, <http://www.robertpenner.com/easing/>, modified and optimized to be used with MooTools.

requires:
- /Fx

provides: [Fx.Transitions]

...
*/

Fx.implement({

	getTransition: function(){
		var trans = this.options.transition || Fx.Transitions.Sine.easeInOut;
		if (typeof trans == 'string'){
			var data = trans.split(':');
			trans = Fx.Transitions;
			trans = trans[data[0]] || trans[data[0].capitalize()];
			if (data[1]) trans = trans['ease' + data[1].capitalize() + (data[2] ? data[2].capitalize() : '')];
		}
		return trans;
	}

});

Fx.Transition = function(transition, params){
	params = $splat(params);
	return $extend(transition, {
		easeIn: function(pos){
			return transition(pos, params);
		},
		easeOut: function(pos){
			return 1 - transition(1 - pos, params);
		},
		easeInOut: function(pos){
			return (pos <= 0.5) ? transition(2 * pos, params) / 2 : (2 - transition(2 * (1 - pos), params)) / 2;
		}
	});
};

Fx.Transitions = new Hash({

	linear: $arguments(0)

});

Fx.Transitions.extend = function(transitions){
	for (var transition in transitions) Fx.Transitions[transition] = new Fx.Transition(transitions[transition]);
};

Fx.Transitions.extend({

	Pow: function(p, x){
		return Math.pow(p, x[0] || 6);
	},

	Expo: function(p){
		return Math.pow(2, 8 * (p - 1));
	},

	Circ: function(p){
		return 1 - Math.sin(Math.acos(p));
	},

	Sine: function(p){
		return 1 - Math.sin((1 - p) * Math.PI / 2);
	},

	Back: function(p, x){
		x = x[0] || 1.618;
		return Math.pow(p, 2) * ((x + 1) * p - x);
	},

	Bounce: function(p){
		var value;
		for (var a = 0, b = 1; 1; a += b, b /= 2){
			if (p >= (7 - 4 * a) / 11){
				value = b * b - Math.pow((11 - 6 * a - 11 * p) / 4, 2);
				break;
			}
		}
		return value;
	},

	Elastic: function(p, x){
		return Math.pow(2, 10 * --p) * Math.cos(20 * p * Math.PI * (x[0] || 1) / 3);
	}

});

['Quad', 'Cubic', 'Quart', 'Quint'].each(function(transition, i){
	Fx.Transitions[transition] = new Fx.Transition(function(p){
		return Math.pow(p, [i + 2]);
	});
});


/*
---

script: Request.js

description: Powerful all purpose Request Class. Uses XMLHTTPRequest.

license: MIT-style license.

requires:
- /Element
- /Chain
- /Events
- /Options
- /Browser

provides: [Request]

...
*/

var Request = new Class({

	Implements: [Chain, Events, Options],

	options: {/*
		onRequest: $empty,
		onComplete: $empty,
		onCancel: $empty,
		onSuccess: $empty,
		onFailure: $empty,
		onException: $empty,*/
		url: '',
		data: '',
		headers: {
			'X-Requested-With': 'XMLHttpRequest',
			'Accept': 'text/javascript, text/html, application/xml, text/xml, */*'
		},
		async: true,
		format: false,
		method: 'post',
		link: 'ignore',
		isSuccess: null,
		emulation: true,
		urlEncoded: true,
		encoding: 'utf-8',
		evalScripts: false,
		evalResponse: false,
		noCache: false
	},

	initialize: function(options){
		this.xhr = new Browser.Request();
		this.setOptions(options);
		this.options.isSuccess = this.options.isSuccess || this.isSuccess;
		this.headers = new Hash(this.options.headers);
	},

	onStateChange: function(){
		if (this.xhr.readyState != 4 || !this.running) return;
		this.running = false;
		this.status = 0;
		$try(function(){
			this.status = this.xhr.status;
		}.bind(this));
		this.xhr.onreadystatechange = $empty;
		if (this.options.isSuccess.call(this, this.status)){
			this.response = {text: this.xhr.responseText, xml: this.xhr.responseXML};
			this.success(this.response.text, this.response.xml);
		} else {
			this.response = {text: null, xml: null};
			this.failure();
		}
	},

	isSuccess: function(){
		return ((this.status >= 200) && (this.status < 300));
	},

	processScripts: function(text){
		if (this.options.evalResponse || (/(ecma|java)script/).test(this.getHeader('Content-type'))) return $exec(text);
		return text.stripScripts(this.options.evalScripts);
	},

	success: function(text, xml){
		this.onSuccess(this.processScripts(text), xml);
	},

	onSuccess: function(){
		this.fireEvent('complete', arguments).fireEvent('success', arguments).callChain();
	},

	failure: function(){
		this.onFailure();
	},

	onFailure: function(){
		this.fireEvent('complete').fireEvent('failure', this.xhr);
	},

	setHeader: function(name, value){
		this.headers.set(name, value);
		return this;
	},

	getHeader: function(name){
		return $try(function(){
			return this.xhr.getResponseHeader(name);
		}.bind(this));
	},

	check: function(){
		if (!this.running) return true;
		switch (this.options.link){
			case 'cancel': this.cancel(); return true;
			case 'chain': this.chain(this.caller.bind(this, arguments)); return false;
		}
		return false;
	},

	send: function(options){
		if (!this.check(options)) return this;
		this.running = true;

		var type = $type(options);
		if (type == 'string' || type == 'element') options = {data: options};

		var old = this.options;
		options = $extend({data: old.data, url: old.url, method: old.method}, options);
		var data = options.data, url = String(options.url), method = options.method.toLowerCase();

		switch ($type(data)){
			case 'element': data = document.id(data).toQueryString(); break;
			case 'object': case 'hash': data = Hash.toQueryString(data);
		}

		if (this.options.format){
			var format = 'format=' + this.options.format;
			data = (data) ? format + '&' + data : format;
		}

		if (this.options.emulation && !['get', 'post'].contains(method)){
			var _method = '_method=' + method;
			data = (data) ? _method + '&' + data : _method;
			method = 'post';
		}

		if (this.options.urlEncoded && method == 'post'){
			var encoding = (this.options.encoding) ? '; charset=' + this.options.encoding : '';
			this.headers.set('Content-type', 'application/x-www-form-urlencoded' + encoding);
		}

		if (this.options.noCache){
			var noCache = 'noCache=' + new Date().getTime();
			data = (data) ? noCache + '&' + data : noCache;
		}

		var trimPosition = url.lastIndexOf('/');
		if (trimPosition > -1 && (trimPosition = url.indexOf('#')) > -1) url = url.substr(0, trimPosition);

		if (data && method == 'get'){
			url = url + (url.contains('?') ? '&' : '?') + data;
			data = null;
		}

		this.xhr.open(method.toUpperCase(), url, this.options.async);

		this.xhr.onreadystatechange = this.onStateChange.bind(this);

		this.headers.each(function(value, key){
			try {
				this.xhr.setRequestHeader(key, value);
			} catch (e){
				this.fireEvent('exception', [key, value]);
			}
		}, this);

		this.fireEvent('request');
		this.xhr.send(data);
		if (!this.options.async) this.onStateChange();
		return this;
	},

	cancel: function(){
		if (!this.running) return this;
		this.running = false;
		this.xhr.abort();
		this.xhr.onreadystatechange = $empty;
		this.xhr = new Browser.Request();
		this.fireEvent('cancel');
		return this;
	}

});

(function(){

var methods = {};
['get', 'post', 'put', 'delete', 'GET', 'POST', 'PUT', 'DELETE'].each(function(method){
	methods[method] = function(){
		var params = Array.link(arguments, {url: String.type, data: $defined});
		return this.send($extend(params, {method: method}));
	};
});

Request.implement(methods);

})();

Element.Properties.send = {

	set: function(options){
		var send = this.retrieve('send');
		if (send) send.cancel();
		return this.eliminate('send').store('send:options', $extend({
			data: this, link: 'cancel', method: this.get('method') || 'post', url: this.get('action')
		}, options));
	},

	get: function(options){
		if (options || !this.retrieve('send')){
			if (options || !this.retrieve('send:options')) this.set('send', options);
			this.store('send', new Request(this.retrieve('send:options')));
		}
		return this.retrieve('send');
	}

};

Element.implement({

	send: function(url){
		var sender = this.get('send');
		sender.send({data: this, url: url || sender.options.url});
		return this;
	}

});


/*
---

script: Request.HTML.js

description: Extends the basic Request Class with additional methods for interacting with HTML responses.

license: MIT-style license.

requires:
- /Request
- /Element

provides: [Request.HTML]

...
*/

Request.HTML = new Class({

	Extends: Request,

	options: {
		update: false,
		append: false,
		evalScripts: true,
		filter: false
	},

	processHTML: function(text){
		var match = text.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
		text = (match) ? match[1] : text;

		var container = new Element('div');

		return $try(function(){
			var root = '<root>' + text + '</root>', doc;
			if (Browser.Engine.trident){
				doc = new ActiveXObject('Microsoft.XMLDOM');
				doc.async = false;
				doc.loadXML(root);
			} else {
				doc = new DOMParser().parseFromString(root, 'text/xml');
			}
			root = doc.getElementsByTagName('root')[0];
			if (!root) return null;
			for (var i = 0, k = root.childNodes.length; i < k; i++){
				var child = Element.clone(root.childNodes[i], true, true);
				if (child) container.grab(child);
			}
			return container;
		}) || container.set('html', text);
	},

	success: function(text){
		var options = this.options, response = this.response;

		response.html = text.stripScripts(function(script){
			response.javascript = script;
		});

		var temp = this.processHTML(response.html);

		response.tree = temp.childNodes;
		response.elements = temp.getElements('*');

		if (options.filter) response.tree = response.elements.filter(options.filter);
		if (options.update) document.id(options.update).empty().set('html', response.html);
		else if (options.append) document.id(options.append).adopt(temp.getChildren());
		if (options.evalScripts) $exec(response.javascript);

		this.onSuccess(response.tree, response.elements, response.html, response.javascript);
	}

});

Element.Properties.load = {

	set: function(options){
		var load = this.retrieve('load');
		if (load) load.cancel();
		return this.eliminate('load').store('load:options', $extend({data: this, link: 'cancel', update: this, method: 'get'}, options));
	},

	get: function(options){
		if (options || ! this.retrieve('load')){
			if (options || !this.retrieve('load:options')) this.set('load', options);
			this.store('load', new Request.HTML(this.retrieve('load:options')));
		}
		return this.retrieve('load');
	}

};

Element.implement({

	load: function(){
		this.get('load').send(Array.link(arguments, {data: Object.type, url: String.type}));
		return this;
	}

});


/*
---

script: Request.JSON.js

description: Extends the basic Request Class with additional methods for sending and receiving JSON data.

license: MIT-style license.

requires:
- /Request JSON

provides: [Request.HTML]

...
*/

Request.JSON = new Class({

	Extends: Request,

	options: {
		secure: true
	},

	initialize: function(options){
		this.parent(options);
		this.headers.extend({'Accept': 'application/json', 'X-Request': 'JSON'});
	},

	success: function(text){
		this.response.json = JSON.decode(text, this.options.secure);
		this.onSuccess(this.response.json, text);
	}

});
//MooTools More, <http://mootools.net/more>. Copyright (c) 2006-2009 Aaron Newton <http://clientcide.com/>, Valerio Proietti <http://mad4milk.net> & the MooTools team <http://mootools.net/developers>, MIT Style License.

/*
---

script: More.js

description: MooTools More

license: MIT-style license

authors:
- Guillermo Rauch
- Thomas Aylott
- Scott Kyle

requires:
- core:1.2.4/MooTools

provides: [MooTools.More]

...
*/

MooTools.More = {
	'version': '1.2.4.2',
	'build': 'bd5a93c0913cce25917c48cbdacde568e15e02ef'
};

/*
---

script: MooTools.Lang.js

description: Provides methods for localization.

license: MIT-style license

authors:
- Aaron Newton

requires:
- core:1.2.4/Events
- /MooTools.More

provides: [MooTools.Lang]

...
*/

(function(){

	var data = {
		language: 'en-US',
		languages: {
			'en-US': {}
		},
		cascades: ['en-US']
	};
	
	var cascaded;

	MooTools.lang = new Events();

	$extend(MooTools.lang, {

		setLanguage: function(lang){
			if (!data.languages[lang]) return this;
			data.language = lang;
			this.load();
			this.fireEvent('langChange', lang);
			return this;
		},

		load: function() {
			var langs = this.cascade(this.getCurrentLanguage());
			cascaded = {};
			$each(langs, function(set, setName){
				cascaded[setName] = this.lambda(set);
			}, this);
		},

		getCurrentLanguage: function(){
			return data.language;
		},

		addLanguage: function(lang){
			data.languages[lang] = data.languages[lang] || {};
			return this;
		},

		cascade: function(lang){
			var cascades = (data.languages[lang] || {}).cascades || [];
			cascades.combine(data.cascades);
			cascades.erase(lang).push(lang);
			var langs = cascades.map(function(lng){
				return data.languages[lng];
			}, this);
			return $merge.apply(this, langs);
		},

		lambda: function(set) {
			(set || {}).get = function(key, args){
				return $lambda(set[key]).apply(this, $splat(args));
			};
			return set;
		},

		get: function(set, key, args){
			if (cascaded && cascaded[set]) return (key ? cascaded[set].get(key, args) : cascaded[set]);
		},

		set: function(lang, set, members){
			this.addLanguage(lang);
			langData = data.languages[lang];
			if (!langData[set]) langData[set] = {};
			$extend(langData[set], members);
			if (lang == this.getCurrentLanguage()){
				this.load();
				this.fireEvent('langChange', lang);
			}
			return this;
		},

		list: function(){
			return Hash.getKeys(data.languages);
		}

	});

})();

/*
---

script: Log.js

description: Provides basic logging functionality for plugins to implement.

license: MIT-style license

authors:
- Guillermo Rauch
- Thomas Aylott
- Scott Kyle

requires:
- core:1.2.4/Class
- /MooTools.More

provides: [Log]

...
*/

(function(){

var global = this;

var log = function(){
	if (global.console && console.log){
		try {
			console.log.apply(console, arguments);
		} catch(e) {
			console.log(Array.slice(arguments));
		}
	} else {
		Log.logged.push(arguments);
	}
	return this;
};

var disabled = function(){
	this.logged.push(arguments);
	return this;
};

this.Log = new Class({
	
	logged: [],
	
	log: disabled,
	
	resetLog: function(){
		this.logged.empty();
		return this;
	},

	enableLog: function(){
		this.log = log;
		this.logged.each(function(args){
			this.log.apply(this, args);
		}, this);
		return this.resetLog();
	},

	disableLog: function(){
		this.log = disabled;
		return this;
	}
	
});

Log.extend(new Log).enableLog();

// legacy
Log.logger = function(){
	return this.log.apply(this, arguments);
};

})();

/*
---

script: Depender.js

description: A stand alone dependency loader for the MooTools library.

license: MIT-style license

authors:
- Aaron Newton

requires:
- core:1.2.4/Element.Events
- core:1.2.4/Request.JSON
- /MooTools.More
- /Log

provides: Depender

...
*/

var Depender = {

	options: {
		/* 
		onRequire: $empty(options),
		onRequirementLoaded: $empty([scripts, options]),
		onScriptLoaded: $empty({
			script: script, 
			totalLoaded: percentOfTotalLoaded, 
			loaded: scriptsState
		}),
		serial: false,
		target: null,
		noCache: false,
		log: false,*/
		loadedSources: [],
		loadedScripts: ['Core', 'Browser', 'Array', 'String', 'Function', 'Number', 'Hash', 'Element', 'Event', 'Element.Event', 'Class', 'DomReady', 'Class.Extras', 'Request', 'JSON', 'Request.JSON', 'More', 'Depender', 'Log'],
		useScriptInjection: true
	},

	loaded: [],

	sources: {},

	libs: {},

	include: function(libs){
		this.log('include: ', libs);
		this.mapLoaded = false;
		var loader = function(data){
			this.libs = $merge(this.libs, data);
			$each(this.libs, function(data, lib){
				if (data.scripts) this.loadSource(lib, data.scripts);
			}, this);
		}.bind(this);
		if ($type(libs) == 'string'){
			this.log('fetching libs ', libs);
			this.request(libs, loader);
		} else {
			loader(libs);
		}
		return this;
	},

	required: [],

	require: function(options){
		var loaded = function(){
			var scripts = this.calculateDependencies(options.scripts);
			if (options.sources){
				options.sources.each(function(source){
					scripts.combine(this.libs[source].files);
				}, this);
			}
			if (options.serial) scripts.combine(this.getLoadedScripts());
			options.scripts = scripts;
			this.required.push(options);
			this.fireEvent('require', options);
			this.loadScripts(options.scripts);
		};
		if (this.mapLoaded){
			loaded.call(this);
		} else {
			this.addEvent('mapLoaded', function(){
				loaded.call(this);
				this.removeEvent('mapLoaded', arguments.callee);
			});
		}
		return this;
	},

	cleanDoubleSlash: function(str){
		if (!str) return str;
		var prefix = '';
		if (str.test(/^http:\/\//)){
			prefix = 'http://';
			str = str.substring(7, str.length);
		}
		str = str.replace(/\/\//g, '/');
		return prefix + str;
	},

	request: function(url, callback){
		new Request.JSON({
			url: url,
			secure: false,
			onSuccess: callback
		}).send();
	},

	loadSource: function(lib, source){
		if (this.libs[lib].files){
			this.dataLoaded();
			return;
		}
		this.log('loading source: ', source);
		this.request(this.cleanDoubleSlash(source + '/scripts.json'), function(result){
			this.log('loaded source: ', source);
			this.libs[lib].files = result;
			this.dataLoaded();
		}.bind(this));
	},

	dataLoaded: function(){
		var loaded = true;
		$each(this.libs, function(v, k){
			if (!this.libs[k].files) loaded = false;
		}, this);
		if (loaded){
			this.mapTree();
			this.mapLoaded = true;
			this.calculateLoaded();
			this.lastLoaded = this.getLoadedScripts().getLength();
			this.fireEvent('mapLoaded');
		}
	},

	calculateLoaded: function(){
		var set = function(script){
			this.scriptsState[script] = true;
		}.bind(this);
		if (this.options.loadedScripts) this.options.loadedScripts.each(set);
		if (this.options.loadedSources){
			this.options.loadedSources.each(function(lib){
				$each(this.libs[lib].files, function(dir){
					$each(dir, function(data, file){
						set(file);
					}, this);
				}, this);
			}, this);
		}
	},

	deps: {},

	pathMap: {},

	mapTree: function(){
		$each(this.libs, function(data, source){
			$each(data.files, function(scripts, folder){
				$each(scripts, function(details, script){
					var path = source + ':' + folder + ':' + script;
					if (this.deps[path]) return;
					this.deps[path] = details.deps;
					this.pathMap[script] = path;
				}, this);
			}, this);
		}, this);
	},

	getDepsForScript: function(script){
		return this.deps[this.pathMap[script]] || [];
	},

	calculateDependencies: function(scripts){
		var reqs = [];
		$splat(scripts).each(function(script){
			if (script == 'None' || !script) return;
			var deps = this.getDepsForScript(script);
			if (!deps){
				if (window.console && console.warn) console.warn('dependencies not mapped: script: %o, map: %o, :deps: %o', script, this.pathMap, this.deps);
			} else {
				deps.each(function(scr){
					if (scr == script || scr == 'None' || !scr) return;
					if (!reqs.contains(scr)) reqs.combine(this.calculateDependencies(scr));
					reqs.include(scr);
				}, this);
			}
			reqs.include(script);
		}, this);
		return reqs;
	},

	getPath: function(script){
		try {
			var chunks = this.pathMap[script].split(':');
			var lib = this.libs[chunks[0]];
			var dir = (lib.path || lib.scripts) + '/';
			chunks.shift();
			return this.cleanDoubleSlash(dir + chunks.join('/') + '.js');
		} catch(e){
			return script;
		}
	},

	loadScripts: function(scripts){
		scripts = scripts.filter(function(s){
			if (!this.scriptsState[s] && s != 'None'){
				this.scriptsState[s] = false;
				return true;
			}
		}, this);
		if (scripts.length){
			scripts.each(function(scr){
				this.loadScript(scr);
			}, this);
		} else {
			this.check();
		}
	},

	toLoad: [],

	loadScript: function(script){
		if (this.scriptsState[script] && this.toLoad.length){
			this.loadScript(this.toLoad.shift());
			return;
		} else if (this.loading){
			this.toLoad.push(script);
			return;
		}
		var finish = function(){
			this.loading = false;
			this.scriptLoaded(script);
			if (this.toLoad.length) this.loadScript(this.toLoad.shift());
		}.bind(this);
		var error = function(){
			this.log('could not load: ', scriptPath);
		}.bind(this);
		this.loading = true;
		var scriptPath = this.getPath(script);
		if (this.options.useScriptInjection){
			this.log('injecting script: ', scriptPath);
			var loaded = function(){
				this.log('loaded script: ', scriptPath);
				finish();
			}.bind(this);
			new Element('script', {
				src: scriptPath + (this.options.noCache ? '?noCache=' + new Date().getTime() : ''),
				events: {
					load: loaded,
					readystatechange: function(){
						if (['loaded', 'complete'].contains(this.readyState)) loaded();
					},
					error: error
				}
			}).inject(this.options.target || document.head);
		} else {
			this.log('requesting script: ', scriptPath);
			new Request({
				url: scriptPath,
				noCache: this.options.noCache,
				onComplete: function(js){
					this.log('loaded script: ', scriptPath);
					$exec(js);
					finish();
				}.bind(this),
				onFailure: error,
				onException: error
			}).send();
		}
	},

	scriptsState: $H(),
	
	getLoadedScripts: function(){
		return this.scriptsState.filter(function(state){
			return state;
		});
	},

	scriptLoaded: function(script){
		this.log('loaded script: ', script);
		this.scriptsState[script] = true;
		this.check();
		var loaded = this.getLoadedScripts();
		var loadedLength = loaded.getLength();
		var toLoad = this.scriptsState.getLength();
		this.fireEvent('scriptLoaded', {
			script: script,
			totalLoaded: (loadedLength / toLoad * 100).round(),
			currentLoaded: ((loadedLength - this.lastLoaded) / (toLoad - this.lastLoaded) * 100).round(),
			loaded: loaded
		});
		if (loadedLength == toLoad) this.lastLoaded = loadedLength;
	},

	lastLoaded: 0,

	check: function(){
		var incomplete = [];
		this.required.each(function(required){
			var loaded = [];
			required.scripts.each(function(script){
				if (this.scriptsState[script]) loaded.push(script);
			}, this);
			if (required.onStep){
				required.onStep({
					percent: loaded.length / required.scripts.length * 100,
					scripts: loaded
				});
			};
			if (required.scripts.length != loaded.length) return;
			required.callback();
			this.required.erase(required);
			this.fireEvent('requirementLoaded', [loaded, required]);
		}, this);
	}

};

$extend(Depender, new Events);
$extend(Depender, new Options);
$extend(Depender, new Log);

Depender._setOptions = Depender.setOptions;
Depender.setOptions = function(){
	Depender._setOptions.apply(Depender, arguments);
	if (this.options.log) Depender.enableLog();
	return this;
};


/*
---

script: Class.Refactor.js

description: Extends a class onto itself with new property, preserving any items attached to the class's namespace.

license: MIT-style license

authors:
- Aaron Newton

requires:
- core:1.2.4/Class
- /MooTools.More

provides: [Class.refactor]

...
*/

Class.refactor = function(original, refactors){

	$each(refactors, function(item, name){
		var origin = original.prototype[name];
		if (origin && (origin = origin._origin) && typeof item == 'function') original.implement(name, function(){
			var old = this.previous;
			this.previous = origin;
			var value = item.apply(this, arguments);
			this.previous = old;
			return value;
		}); else original.implement(name, item);
	});

	return original;

};

/*
---

script: Class.Binds.js

description: Automagically binds specified methods in a class to the instance of the class.

license: MIT-style license

authors:
- Aaron Newton

requires:
- core:1.2.4/Class
- /MooTools.More

provides: [Class.Binds]

...
*/

Class.Mutators.Binds = function(binds){
    return binds;
};

Class.Mutators.initialize = function(initialize){
	return function(){
		$splat(this.Binds).each(function(name){
			var original = this[name];
			if (original) this[name] = original.bind(this);
		}, this);
		return initialize.apply(this, arguments);
	};
};


/*
---

script: Class.Occlude.js

description: Prevents a class from being applied to a DOM element twice.

license: MIT-style license.

authors:
- Aaron Newton

requires: 
- core/1.2.4/Class
- core:1.2.4/Element
- /MooTools.More

provides: [Class.Occlude]

...
*/

Class.Occlude = new Class({

	occlude: function(property, element){
		element = document.id(element || this.element);
		var instance = element.retrieve(property || this.property);
		if (instance && !$defined(this.occluded))
			return this.occluded = instance;

		this.occluded = false;
		element.store(property || this.property, this);
		return this.occluded;
	}

});

/*
---

script: Chain.Wait.js

description: value, Adds a method to inject pauses between chained events.

license: MIT-style license.

authors:
- Aaron Newton

requires: 
- core:1.2.4/Chain 
- core:1.2.4/Element
- core:1.2.4/Fx
- /MooTools.More

provides: [Chain.Wait]

...
*/

(function(){

	var wait = {
		wait: function(duration){
			return this.chain(function(){
				this.callChain.delay($pick(duration, 500), this);
			}.bind(this));
		}
	};

	Chain.implement(wait);

	if (window.Fx){
		Fx.implement(wait);
		['Css', 'Tween', 'Elements'].each(function(cls){
			if (Fx[cls]) Fx[cls].implement(wait);
		});
	}

	Element.implement({
		chains: function(effects){
			$splat($pick(effects, ['tween', 'morph', 'reveal'])).each(function(effect){
				effect = this.get(effect);
				if (!effect) return;
				effect.setOptions({
					link:'chain'
				});
			}, this);
			return this;
		},
		pauseFx: function(duration, effect){
			this.chains(effect).get($pick(effect, 'tween')).wait(duration);
			return this;
		}
	});

})();

/*
---

script: Array.Extras.js

description: Extends the Array native object to include useful methods to work with arrays.

license: MIT-style license

authors:
- Christoph Pojer

requires:
- core:1.2.4/Array

provides: [Array.Extras]

...
*/
Array.implement({

	min: function(){
		return Math.min.apply(null, this);
	},

	max: function(){
		return Math.max.apply(null, this);
	},

	average: function(){
		return this.length ? this.sum() / this.length : 0;
	},

	sum: function(){
		var result = 0, l = this.length;
		if (l){
			do {
				result += this[--l];
			} while (l);
		}
		return result;
	},

	unique: function(){
		return [].combine(this);
	}

});

/*
---

script: Date.js

description: Extends the Date native object to include methods useful in managing dates.

license: MIT-style license

authors:
- Aaron Newton
- Nicholas Barthelemy - https://svn.nbarthelemy.com/date-js/
- Harald Kirshner - mail [at] digitarald.de; http://digitarald.de
- Scott Kyle - scott [at] appden.com; http://appden.com

requires:
- core:1.2.4/Array
- core:1.2.4/String
- core:1.2.4/Number
- core:1.2.4/Lang
- core:1.2.4/Date.English.US
- /MooTools.More

provides: [Date]

...
*/

(function(){

var Date = this.Date;

if (!Date.now) Date.now = $time;

Date.Methods = {
	ms: 'Milliseconds',
	year: 'FullYear',
	min: 'Minutes',
	mo: 'Month',
	sec: 'Seconds',
	hr: 'Hours'
};

['Date', 'Day', 'FullYear', 'Hours', 'Milliseconds', 'Minutes', 'Month', 'Seconds', 'Time', 'TimezoneOffset',
	'Week', 'Timezone', 'GMTOffset', 'DayOfYear', 'LastMonth', 'LastDayOfMonth', 'UTCDate', 'UTCDay', 'UTCFullYear',
	'AMPM', 'Ordinal', 'UTCHours', 'UTCMilliseconds', 'UTCMinutes', 'UTCMonth', 'UTCSeconds'].each(function(method){
	Date.Methods[method.toLowerCase()] = method;
});

var pad = function(what, length){
	return new Array(length - String(what).length + 1).join('0') + what;
};

Date.implement({

	set: function(prop, value){
		switch ($type(prop)){
			case 'object':
				for (var p in prop) this.set(p, prop[p]);
				break;
			case 'string':
				prop = prop.toLowerCase();
				var m = Date.Methods;
				if (m[prop]) this['set' + m[prop]](value);
		}
		return this;
	},

	get: function(prop){
		prop = prop.toLowerCase();
		var m = Date.Methods;
		if (m[prop]) return this['get' + m[prop]]();
		return null;
	},

	clone: function(){
		return new Date(this.get('time'));
	},

	increment: function(interval, times){
		interval = interval || 'day';
		times = $pick(times, 1);

		switch (interval){
			case 'year':
				return this.increment('month', times * 12);
			case 'month':
				var d = this.get('date');
				this.set('date', 1).set('mo', this.get('mo') + times);
				return this.set('date', d.min(this.get('lastdayofmonth')));
			case 'week':
				return this.increment('day', times * 7);
			case 'day':
				return this.set('date', this.get('date') + times);
		}

		if (!Date.units[interval]) throw new Error(interval + ' is not a supported interval');

		return this.set('time', this.get('time') + times * Date.units[interval]());
	},

	decrement: function(interval, times){
		return this.increment(interval, -1 * $pick(times, 1));
	},

	isLeapYear: function(){
		return Date.isLeapYear(this.get('year'));
	},

	clearTime: function(){
		return this.set({hr: 0, min: 0, sec: 0, ms: 0});
	},

	diff: function(date, resolution){
		if ($type(date) == 'string') date = Date.parse(date);
		
		return ((date - this) / Date.units[resolution || 'day'](3, 3)).toInt(); // non-leap year, 30-day month
	},

	getLastDayOfMonth: function(){
		return Date.daysInMonth(this.get('mo'), this.get('year'));
	},

	getDayOfYear: function(){
		return (Date.UTC(this.get('year'), this.get('mo'), this.get('date') + 1) 
			- Date.UTC(this.get('year'), 0, 1)) / Date.units.day();
	},

	getWeek: function(){
		return (this.get('dayofyear') / 7).ceil();
	},
	
	getOrdinal: function(day){
		return Date.getMsg('ordinal', day || this.get('date'));
	},

	getTimezone: function(){
		return this.toString()
			.replace(/^.*? ([A-Z]{3}).[0-9]{4}.*$/, '$1')
			.replace(/^.*?\(([A-Z])[a-z]+ ([A-Z])[a-z]+ ([A-Z])[a-z]+\)$/, '$1$2$3');
	},

	getGMTOffset: function(){
		var off = this.get('timezoneOffset');
		return ((off > 0) ? '-' : '+') + pad((off.abs() / 60).floor(), 2) + pad(off % 60, 2);
	},

	setAMPM: function(ampm){
		ampm = ampm.toUpperCase();
		var hr = this.get('hr');
		if (hr > 11 && ampm == 'AM') return this.decrement('hour', 12);
		else if (hr < 12 && ampm == 'PM') return this.increment('hour', 12);
		return this;
	},

	getAMPM: function(){
		return (this.get('hr') < 12) ? 'AM' : 'PM';
	},

	parse: function(str){
		this.set('time', Date.parse(str));
		return this;
	},

	isValid: function(date) {
		return !!(date || this).valueOf();
	},

	format: function(f){
		if (!this.isValid()) return 'invalid date';
		f = f || '%x %X';
		f = formats[f.toLowerCase()] || f; // replace short-hand with actual format
		var d = this;
		return f.replace(/%([a-z%])/gi,
			function($0, $1){
				switch ($1){
					case 'a': return Date.getMsg('days')[d.get('day')].substr(0, 3);
					case 'A': return Date.getMsg('days')[d.get('day')];
					case 'b': return Date.getMsg('months')[d.get('month')].substr(0, 3);
					case 'B': return Date.getMsg('months')[d.get('month')];
					case 'c': return d.toString();
					case 'd': return pad(d.get('date'), 2);
					case 'H': return pad(d.get('hr'), 2);
					case 'I': return ((d.get('hr') % 12) || 12);
					case 'j': return pad(d.get('dayofyear'), 3);
					case 'm': return pad((d.get('mo') + 1), 2);
					case 'M': return pad(d.get('min'), 2);
					case 'o': return d.get('ordinal');
					case 'p': return Date.getMsg(d.get('ampm'));
					case 'S': return pad(d.get('seconds'), 2);
					case 'U': return pad(d.get('week'), 2);
					case 'w': return d.get('day');
					case 'x': return d.format(Date.getMsg('shortDate'));
					case 'X': return d.format(Date.getMsg('shortTime'));
					case 'y': return d.get('year').toString().substr(2);
					case 'Y': return d.get('year');
					case 'T': return d.get('GMTOffset');
					case 'Z': return d.get('Timezone');
				}
				return $1;
			}
		);
	},

	toISOString: function(){
		return this.format('iso8601');
	}

});

Date.alias('toISOString', 'toJSON');
Date.alias('diff', 'compare');
Date.alias('format', 'strftime');

var formats = {
	db: '%Y-%m-%d %H:%M:%S',
	compact: '%Y%m%dT%H%M%S',
	iso8601: '%Y-%m-%dT%H:%M:%S%T',
	rfc822: '%a, %d %b %Y %H:%M:%S %Z',
	'short': '%d %b %H:%M',
	'long': '%B %d, %Y %H:%M'
};

var parsePatterns = [];
var nativeParse = Date.parse;

var parseWord = function(type, word, num){
	var ret = -1;
	var translated = Date.getMsg(type + 's');

	switch ($type(word)){
		case 'object':
			ret = translated[word.get(type)];
			break;
		case 'number':
			ret = translated[month - 1];
			if (!ret) throw new Error('Invalid ' + type + ' index: ' + index);
			break;
		case 'string':
			var match = translated.filter(function(name){
				return this.test(name);
			}, new RegExp('^' + word, 'i'));
			if (!match.length)    throw new Error('Invalid ' + type + ' string');
			if (match.length > 1) throw new Error('Ambiguous ' + type);
			ret = match[0];
	}

	return (num) ? translated.indexOf(ret) : ret;
};

Date.extend({

	getMsg: function(key, args) {
		return MooTools.lang.get('Date', key, args);
	},

	units: {
		ms: $lambda(1),
		second: $lambda(1000),
		minute: $lambda(60000),
		hour: $lambda(3600000),
		day: $lambda(86400000),
		week: $lambda(608400000),
		month: function(month, year){
			var d = new Date;
			return Date.daysInMonth($pick(month, d.get('mo')), $pick(year, d.get('year'))) * 86400000;
		},
		year: function(year){
			year = year || new Date().get('year');
			return Date.isLeapYear(year) ? 31622400000 : 31536000000;
		}
	},

	daysInMonth: function(month, year){
		return [31, Date.isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
	},

	isLeapYear: function(year){
		return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0);
	},

	parse: function(from){
		var t = $type(from);
		if (t == 'number') return new Date(from);
		if (t != 'string') return from;
		from = from.clean();
		if (!from.length) return null;

		var parsed;
		parsePatterns.some(function(pattern){
			var bits = pattern.re.exec(from);
			return (bits) ? (parsed = pattern.handler(bits)) : false;
		});

		return parsed || new Date(nativeParse(from));
	},

	parseDay: function(day, num){
		return parseWord('day', day, num);
	},

	parseMonth: function(month, num){
		return parseWord('month', month, num);
	},

	parseUTC: function(value){
		var localDate = new Date(value);
		var utcSeconds = Date.UTC(
			localDate.get('year'),
			localDate.get('mo'),
			localDate.get('date'),
			localDate.get('hr'),
			localDate.get('min'),
			localDate.get('sec')
		);
		return new Date(utcSeconds);
	},

	orderIndex: function(unit){
		return Date.getMsg('dateOrder').indexOf(unit) + 1;
	},

	defineFormat: function(name, format){
		formats[name] = format;
	},

	defineFormats: function(formats){
		for (var name in formats) Date.defineFormat(name, formats[name]);
	},

	parsePatterns: parsePatterns, // this is deprecated
	
	defineParser: function(pattern){
		parsePatterns.push((pattern.re && pattern.handler) ? pattern : build(pattern));
	},
	
	defineParsers: function(){
		Array.flatten(arguments).each(Date.defineParser);
	},
	
	define2DigitYearStart: function(year){
		startYear = year % 100;
		startCentury = year - startYear;
	}

});

var startCentury = 1900;
var startYear = 70;

var regexOf = function(type){
	return new RegExp('(?:' + Date.getMsg(type).map(function(name){
		return name.substr(0, 3);
	}).join('|') + ')[a-z]*');
};

var replacers = function(key){
	switch(key){
		case 'x': // iso8601 covers yyyy-mm-dd, so just check if month is first
			return ((Date.orderIndex('month') == 1) ? '%m[.-/]%d' : '%d[.-/]%m') + '([.-/]%y)?';
		case 'X':
			return '%H([.:]%M)?([.:]%S([.:]%s)?)? ?%p? ?%T?';
	}
	return null;
};

var keys = {
	d: /[0-2]?[0-9]|3[01]/,
	H: /[01]?[0-9]|2[0-3]/,
	I: /0?[1-9]|1[0-2]/,
	M: /[0-5]?\d/,
	s: /\d+/,
	o: /[a-z]*/,
	p: /[ap]\.?m\.?/,
	y: /\d{2}|\d{4}/,
	Y: /\d{4}/,
	T: /Z|[+-]\d{2}(?::?\d{2})?/
};

keys.m = keys.I;
keys.S = keys.M;

var currentLanguage;

var recompile = function(language){
	currentLanguage = language;
	
	keys.a = keys.A = regexOf('days');
	keys.b = keys.B = regexOf('months');
	
	parsePatterns.each(function(pattern, i){
		if (pattern.format) parsePatterns[i] = build(pattern.format);
	});
};

var build = function(format){
	if (!currentLanguage) return {format: format};
	
	var parsed = [];
	var re = (format.source || format) // allow format to be regex
	 .replace(/%([a-z])/gi,
		function($0, $1){
			return replacers($1) || $0;
		}
	).replace(/\((?!\?)/g, '(?:') // make all groups non-capturing
	 .replace(/ (?!\?|\*)/g, ',? ') // be forgiving with spaces and commas
	 .replace(/%([a-z%])/gi,
		function($0, $1){
			var p = keys[$1];
			if (!p) return $1;
			parsed.push($1);
			return '(' + p.source + ')';
		}
	).replace(/\[a-z\]/gi, '[a-z\\u00c0-\\uffff]'); // handle unicode words

	return {
		format: format,
		re: new RegExp('^' + re + '$', 'i'),
		handler: function(bits){
			bits = bits.slice(1).associate(parsed);
			var date = new Date().clearTime();
			if ('d' in bits) handle.call(date, 'd', 1);
			if ('m' in bits) handle.call(date, 'm', 1);
			for (var key in bits) handle.call(date, key, bits[key]);
			return date;
		}
	};
};

var handle = function(key, value){
	if (!value) return this;

	switch(key){
		case 'a': case 'A': return this.set('day', Date.parseDay(value, true));
		case 'b': case 'B': return this.set('mo', Date.parseMonth(value, true));
		case 'd': return this.set('date', value);
		case 'H': case 'I': return this.set('hr', value);
		case 'm': return this.set('mo', value - 1);
		case 'M': return this.set('min', value);
		case 'p': return this.set('ampm', value.replace(/\./g, ''));
		case 'S': return this.set('sec', value);
		case 's': return this.set('ms', ('0.' + value) * 1000);
		case 'w': return this.set('day', value);
		case 'Y': return this.set('year', value);
		case 'y':
			value = +value;
			if (value < 100) value += startCentury + (value < startYear ? 100 : 0);
			return this.set('year', value);
		case 'T':
			if (value == 'Z') value = '+00';
			var offset = value.match(/([+-])(\d{2}):?(\d{2})?/);
			offset = (offset[1] + '1') * (offset[2] * 60 + (+offset[3] || 0)) + this.getTimezoneOffset();
			return this.set('time', this - offset * 60000);
	}

	return this;
};

Date.defineParsers(
	'%Y([-./]%m([-./]%d((T| )%X)?)?)?', // "1999-12-31", "1999-12-31 11:59pm", "1999-12-31 23:59:59", ISO8601
	'%Y%m%d(T%H(%M%S?)?)?', // "19991231", "19991231T1159", compact
	'%x( %X)?', // "12/31", "12.31.99", "12-31-1999", "12/31/2008 11:59 PM"
	'%d%o( %b( %Y)?)?( %X)?', // "31st", "31st December", "31 Dec 1999", "31 Dec 1999 11:59pm"
	'%b( %d%o)?( %Y)?( %X)?', // Same as above with month and day switched
	'%Y %b( %d%o( %X)?)?', // Same as above with year coming first
	'%o %b %d %X %T %Y' // "Thu Oct 22 08:11:23 +0000 2009"
);

MooTools.lang.addEvent('langChange', function(language){
	if (MooTools.lang.get('Date')) recompile(language);
}).fireEvent('langChange', MooTools.lang.getCurrentLanguage());

})();

/*
---

script: Date.Extras.js

description: Extends the Date native object to include extra methods (on top of those in Date.js).

license: MIT-style license

authors:
- Aaron Newton
- Scott Kyle

requires:
- /Date

provides: [Date.Extras]

...
*/

Date.implement({

	timeDiffInWords: function(relative_to){
		return Date.distanceOfTimeInWords(this, relative_to || new Date);
	},

	timeDiff: function(to, joiner){
		if (to == null) to = new Date;
		var delta = ((to - this) / 1000).toInt();
		if (!delta) return '0s';
		
		var durations = {s: 60, m: 60, h: 24, d: 365, y: 0};
		var duration, vals = [];
		
		for (var step in durations){
			if (!delta) break;
			if ((duration = durations[step])){
				vals.unshift((delta % duration) + step);
				delta = (delta / duration).toInt();
			} else {
				vals.unshift(delta + step);
			}
		}
		
		return vals.join(joiner || ':');
	}

});

Date.alias('timeDiffInWords', 'timeAgoInWords');

Date.extend({

	distanceOfTimeInWords: function(from, to){
		return Date.getTimePhrase(((to - from) / 1000).toInt());
	},

	getTimePhrase: function(delta){
		var suffix = (delta < 0) ? 'Until' : 'Ago';
		if (delta < 0) delta *= -1;
		
		var units = {
			minute: 60,
			hour: 60,
			day: 24,
			week: 7,
			month: 52 / 12,
			year: 12,
			eon: Infinity
		};
		
		var msg = 'lessThanMinute';
		
		for (var unit in units){
			var interval = units[unit];
			if (delta < 1.5 * interval){
				if (delta > 0.75 * interval) msg = unit;
				break;
			}
			delta /= interval;
			msg = unit + 's';
		}
		
		return Date.getMsg(msg + suffix).substitute({delta: delta.round()});
	}

});


Date.defineParsers(

	{
		// "today", "tomorrow", "yesterday"
		re: /^(?:tod|tom|yes)/i,
		handler: function(bits){
			var d = new Date().clearTime();
			switch(bits[0]){
				case 'tom': return d.increment();
				case 'yes': return d.decrement();
				default: 	return d;
			}
		}
	},

	{
		// "next Wednesday", "last Thursday"
		re: /^(next|last) ([a-z]+)$/i,
		handler: function(bits){
			var d = new Date().clearTime();
			var day = d.getDay();
			var newDay = Date.parseDay(bits[2], true);
			var addDays = newDay - day;
			if (newDay <= day) addDays += 7;
			if (bits[1] == 'last') addDays -= 7;
			return d.set('date', d.getDate() + addDays);
		}
	}

);


/*
---

script: Hash.Extras.js

description: Extends the Hash native object to include getFromPath which allows a path notation to child elements.

license: MIT-style license

authors:
- Aaron Newton

requires:
- core:1.2.4/Hash.base
- /MooTools.More

provides: [Hash.Extras]

...
*/

Hash.implement({

	getFromPath: function(notation){
		var source = this.getClean();
		notation.replace(/\[([^\]]+)\]|\.([^.[]+)|[^[.]+/g, function(match){
			if (!source) return null;
			var prop = arguments[2] || arguments[1] || arguments[0];
			source = (prop in source) ? source[prop] : null;
			return match;
		});
		return source;
	},

	cleanValues: function(method){
		method = method || $defined;
		this.each(function(v, k){
			if (!method(v)) this.erase(k);
		}, this);
		return this;
	},

	run: function(){
		var args = arguments;
		this.each(function(v, k){
			if ($type(v) == 'function') v.run(args);
		});
	}

});

/*
---

script: String.Extras.js

description: Extends the String native object to include methods useful in managing various kinds of strings (query strings, urls, html, etc).

license: MIT-style license

authors:
- Aaron Newton
- Guillermo Rauch

requires:
- core:1.2.4/String
- core:1.2.4/$util
- core:1.2.4/Array

provides: [String.Extras]

...
*/

(function(){
  
var special = ['À','à','Á','á','Â','â','Ã','ã','Ä','ä','Å','å','Ă','ă','Ą','ą','Ć','ć','Č','č','Ç','ç', 'Ď','ď','Đ','đ', 'È','è','É','é','Ê','ê','Ë','ë','Ě','ě','Ę','ę', 'Ğ','ğ','Ì','ì','Í','í','Î','î','Ï','ï', 'Ĺ','ĺ','Ľ','ľ','Ł','ł', 'Ñ','ñ','Ň','ň','Ń','ń','Ò','ò','Ó','ó','Ô','ô','Õ','õ','Ö','ö','Ø','ø','ő','Ř','ř','Ŕ','ŕ','Š','š','Ş','ş','Ś','ś', 'Ť','ť','Ť','ť','Ţ','ţ','Ù','ù','Ú','ú','Û','û','Ü','ü','Ů','ů', 'Ÿ','ÿ','ý','Ý','Ž','ž','Ź','ź','Ż','ż', 'Þ','þ','Ð','ð','ß','Œ','œ','Æ','æ','µ'];

var standard = ['A','a','A','a','A','a','A','a','Ae','ae','A','a','A','a','A','a','C','c','C','c','C','c','D','d','D','d', 'E','e','E','e','E','e','E','e','E','e','E','e','G','g','I','i','I','i','I','i','I','i','L','l','L','l','L','l', 'N','n','N','n','N','n', 'O','o','O','o','O','o','O','o','Oe','oe','O','o','o', 'R','r','R','r', 'S','s','S','s','S','s','T','t','T','t','T','t', 'U','u','U','u','U','u','Ue','ue','U','u','Y','y','Y','y','Z','z','Z','z','Z','z','TH','th','DH','dh','ss','OE','oe','AE','ae','u'];

var tidymap = {
	"[\xa0\u2002\u2003\u2009]": " ",
	"\xb7": "*",
	"[\u2018\u2019]": "'",
	"[\u201c\u201d]": '"',
	"\u2026": "...",
	"\u2013": "-",
	"\u2014": "--",
	"\uFFFD": "&raquo;"
};

var getRegForTag = function(tag, contents) {
	tag = tag || '';
	var regstr = contents ? "<" + tag + "[^>]*>([\\s\\S]*?)<\/" + tag + ">" : "<\/?" + tag + "([^>]+)?>";
	reg = new RegExp(regstr, "gi");
	return reg;
};

String.implement({

	standardize: function(){
		var text = this;
		special.each(function(ch, i){
			text = text.replace(new RegExp(ch, 'g'), standard[i]);
		});
		return text;
	},

	repeat: function(times){
		return new Array(times + 1).join(this);
	},

	pad: function(length, str, dir){
		if (this.length >= length) return this;
		var pad = (str == null ? ' ' : '' + str).repeat(length - this.length).substr(0, length - this.length);
		if (!dir || dir == 'right') return this + pad;
		if (dir == 'left') return pad + this;
		return pad.substr(0, (pad.length / 2).floor()) + this + pad.substr(0, (pad.length / 2).ceil());
	},

	getTags: function(tag, contents){
		return this.match(getRegForTag(tag, contents)) || [];
	},

	stripTags: function(tag, contents){
		return this.replace(getRegForTag(tag, contents), '');
	},

	tidy: function(){
		var txt = this.toString();
		$each(tidymap, function(value, key){
			txt = txt.replace(new RegExp(key, 'g'), value);
		});
		return txt;
	}

});

})();

/*
---

script: String.QueryString.js

description: Methods for dealing with URI query strings.

license: MIT-style license

authors:
- Sebastian Markbåge, Aaron Newton, Lennart Pilon, Valerio Proietti

requires:
- core:1.2.4/Array
- core:1.2.4/String
- /MooTools.More

provides: [String.QueryString]

...
*/

String.implement({

	parseQueryString: function(){
		var vars = this.split(/[&;]/), res = {};
		if (vars.length) vars.each(function(val){
			var index = val.indexOf('='),
				keys = index < 0 ? [''] : val.substr(0, index).match(/[^\]\[]+/g),
				value = decodeURIComponent(val.substr(index + 1)),
				obj = res;
			keys.each(function(key, i){
				var current = obj[key];
				if(i < keys.length - 1)
					obj = obj[key] = current || {};
				else if($type(current) == 'array')
					current.push(value);
				else
					obj[key] = $defined(current) ? [current, value] : value;
			});
		});
		return res;
	},

	cleanQueryString: function(method){
		return this.split('&').filter(function(val){
			var index = val.indexOf('='),
			key = index < 0 ? '' : val.substr(0, index),
			value = val.substr(index + 1);
			return method ? method.run([key, value]) : $chk(value);
		}).join('&');
	}

});

/*
---

script: URI.js

description: Provides methods useful in managing the window location and uris.

license: MIT-style license

authors:
- Sebastian Markb�ge
- Aaron Newton

requires:
- core:1.2.4/Selectors
- /String.QueryString

provides: URI

...
*/

var URI = new Class({

	Implements: Options,

	options: {
		/*base: false*/
	},

	regex: /^(?:(\w+):)?(?:\/\/(?:(?:([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?)?(\.\.?$|(?:[^?#\/]*\/)*)([^?#]*)(?:\?([^#]*))?(?:#(.*))?/,
	parts: ['scheme', 'user', 'password', 'host', 'port', 'directory', 'file', 'query', 'fragment'],
	schemes: {http: 80, https: 443, ftp: 21, rtsp: 554, mms: 1755, file: 0},

	initialize: function(uri, options){
		this.setOptions(options);
		var base = this.options.base || URI.base;
		if(!uri) uri = base;
		
		if (uri && uri.parsed) this.parsed = $unlink(uri.parsed);
		else this.set('value', uri.href || uri.toString(), base ? new URI(base) : false);
	},

	parse: function(value, base){
		var bits = value.match(this.regex);
		if (!bits) return false;
		bits.shift();
		return this.merge(bits.associate(this.parts), base);
	},

	merge: function(bits, base){
		if ((!bits || !bits.scheme) && (!base || !base.scheme)) return false;
		if (base){
			this.parts.every(function(part){
				if (bits[part]) return false;
				bits[part] = base[part] || '';
				return true;
			});
		}
		bits.port = bits.port || this.schemes[bits.scheme.toLowerCase()];
		bits.directory = bits.directory ? this.parseDirectory(bits.directory, base ? base.directory : '') : '/';
		return bits;
	},

	parseDirectory: function(directory, baseDirectory) {
		directory = (directory.substr(0, 1) == '/' ? '' : (baseDirectory || '/')) + directory;
		if (!directory.test(URI.regs.directoryDot)) return directory;
		var result = [];
		directory.replace(URI.regs.endSlash, '').split('/').each(function(dir){
			if (dir == '..' && result.length > 0) result.pop();
			else if (dir != '.') result.push(dir);
		});
		return result.join('/') + '/';
	},

	combine: function(bits){
		return bits.value || bits.scheme + '://' +
			(bits.user ? bits.user + (bits.password ? ':' + bits.password : '') + '@' : '') +
			(bits.host || '') + (bits.port && bits.port != this.schemes[bits.scheme] ? ':' + bits.port : '') +
			(bits.directory || '/') + (bits.file || '') +
			(bits.query ? '?' + bits.query : '') +
			(bits.fragment ? '#' + bits.fragment : '');
	},

	set: function(part, value, base){
		if (part == 'value'){
			var scheme = value.match(URI.regs.scheme);
			if (scheme) scheme = scheme[1];
			if (scheme && !$defined(this.schemes[scheme.toLowerCase()])) this.parsed = { scheme: scheme, value: value };
			else this.parsed = this.parse(value, (base || this).parsed) || (scheme ? { scheme: scheme, value: value } : { value: value });
		} else if (part == 'data') {
			this.setData(value);
		} else {
			this.parsed[part] = value;
		}
		return this;
	},

	get: function(part, base){
		switch(part){
			case 'value': return this.combine(this.parsed, base ? base.parsed : false);
			case 'data' : return this.getData();
		}
		return this.parsed[part] || '';
	},

	go: function(){
		document.location.href = this.toString();
	},

	toURI: function(){
		return this;
	},

	getData: function(key, part){
		var qs = this.get(part || 'query');
		if (!$chk(qs)) return key ? null : {};
		var obj = qs.parseQueryString();
		return key ? obj[key] : obj;
	},

	setData: function(values, merge, part){
		if (typeof values == 'string'){
			values = this.getData();
			values[arguments[0]] = arguments[1];
		} else if (merge) {
			values = $merge(this.getData(), values);
		}
		return this.set(part || 'query', Hash.toQueryString(values));
	},

	clearData: function(part){
		return this.set(part || 'query', '');
	}

});

URI.prototype.toString = URI.prototype.valueOf = function(){
	return this.get('value');
};

URI.regs = {
	endSlash: /\/$/,
	scheme: /^(\w+):/,
	directoryDot: /\.\/|\.$/
};

URI.base = new URI(document.getElements('base[href]', true).getLast(), {base: document.location});

String.implement({

	toURI: function(options){
		return new URI(this, options);
	}

});

/*
---

script: URI.Relative.js

description: Extends the URI class to add methods for computing relative and absolute urls.

license: MIT-style license

authors:
- Sebastian Markbåge


requires:
- /Class.refactor
- /URI

provides: [URI.Relative]

...
*/

URI = Class.refactor(URI, {

	combine: function(bits, base){
		if (!base || bits.scheme != base.scheme || bits.host != base.host || bits.port != base.port)
			return this.previous.apply(this, arguments);
		var end = bits.file + (bits.query ? '?' + bits.query : '') + (bits.fragment ? '#' + bits.fragment : '');

		if (!base.directory) return (bits.directory || (bits.file ? '' : './')) + end;

		var baseDir = base.directory.split('/'),
			relDir = bits.directory.split('/'),
			path = '',
			offset;

		var i = 0;
		for(offset = 0; offset < baseDir.length && offset < relDir.length && baseDir[offset] == relDir[offset]; offset++);
		for(i = 0; i < baseDir.length - offset - 1; i++) path += '../';
		for(i = offset; i < relDir.length - 1; i++) path += relDir[i] + '/';

		return (path || (bits.file ? '' : './')) + end;
	},

	toAbsolute: function(base){
		base = new URI(base);
		if (base) base.set('directory', '').set('file', '');
		return this.toRelative(base);
	},

	toRelative: function(base){
		return this.get('value', new URI(base));
	}

});

/*
---

script: Element.Forms.js

description: Extends the Element native object to include methods useful in managing inputs.

license: MIT-style license

authors:
- Aaron Newton

requires:
- core:1.2.4/Element
- /MooTools.More

provides: [Element.Forms]

...
*/

Element.implement({

	tidy: function(){
		this.set('value', this.get('value').tidy());
	},

	getTextInRange: function(start, end){
		return this.get('value').substring(start, end);
	},

	getSelectedText: function(){
		if (this.setSelectionRange) return this.getTextInRange(this.getSelectionStart(), this.getSelectionEnd());
		return document.selection.createRange().text;
	},

	getSelectedRange: function() {
		if ($defined(this.selectionStart)) return {start: this.selectionStart, end: this.selectionEnd};
		var pos = {start: 0, end: 0};
		var range = this.getDocument().selection.createRange();
		if (!range || range.parentElement() != this) return pos;
		var dup = range.duplicate();
		if (this.type == 'text') {
			pos.start = 0 - dup.moveStart('character', -100000);
			pos.end = pos.start + range.text.length;
		} else {
			var value = this.get('value');
			var offset = value.length;
			dup.moveToElementText(this);
			dup.setEndPoint('StartToEnd', range);
			if(dup.text.length) offset -= value.match(/[\n\r]*$/)[0].length;
			pos.end = offset - dup.text.length;
			dup.setEndPoint('StartToStart', range);
			pos.start = offset - dup.text.length;
		}
		return pos;
	},

	getSelectionStart: function(){
		return this.getSelectedRange().start;
	},

	getSelectionEnd: function(){
		return this.getSelectedRange().end;
	},

	setCaretPosition: function(pos){
		if (pos == 'end') pos = this.get('value').length;
		this.selectRange(pos, pos);
		return this;
	},

	getCaretPosition: function(){
		return this.getSelectedRange().start;
	},

	selectRange: function(start, end){
		if (this.setSelectionRange) {
			this.focus();
			this.setSelectionRange(start, end);
		} else {
			var value = this.get('value');
			var diff = value.substr(start, end - start).replace(/\r/g, '').length;
			start = value.substr(0, start).replace(/\r/g, '').length;
			var range = this.createTextRange();
			range.collapse(true);
			range.moveEnd('character', start + diff);
			range.moveStart('character', start);
			range.select();
		}
		return this;
	},

	insertAtCursor: function(value, select){
		var pos = this.getSelectedRange();
		var text = this.get('value');
		this.set('value', text.substring(0, pos.start) + value + text.substring(pos.end, text.length));
		if ($pick(select, true)) this.selectRange(pos.start, pos.start + value.length);
		else this.setCaretPosition(pos.start + value.length);
		return this;
	},

	insertAroundCursor: function(options, select){
		options = $extend({
			before: '',
			defaultMiddle: '',
			after: ''
		}, options);
		var value = this.getSelectedText() || options.defaultMiddle;
		var pos = this.getSelectedRange();
		var text = this.get('value');
		if (pos.start == pos.end){
			this.set('value', text.substring(0, pos.start) + options.before + value + options.after + text.substring(pos.end, text.length));
			this.selectRange(pos.start + options.before.length, pos.end + options.before.length + value.length);
		} else {
			var current = text.substring(pos.start, pos.end);
			this.set('value', text.substring(0, pos.start) + options.before + current + options.after + text.substring(pos.end, text.length));
			var selStart = pos.start + options.before.length;
			if ($pick(select, true)) this.selectRange(selStart, selStart + current.length);
			else this.setCaretPosition(selStart + text.length);
		}
		return this;
	}

});

/*
---

script: Elements.From.js

description: Returns a collection of elements from a string of html.

license: MIT-style license

authors:
- Aaron Newton

requires:
- core:1.2.4/Element
- /MooTools.More

provides: [Elements.from]

...
*/

Elements.from = function(text, excludeScripts){
	if ($pick(excludeScripts, true)) text = text.stripScripts();

	var container, match = text.match(/^\s*<(t[dhr]|tbody|tfoot|thead)/i);

	if (match){
		container = new Element('table');
		var tag = match[1].toLowerCase();
		if (['td', 'th', 'tr'].contains(tag)){
			container = new Element('tbody').inject(container);
			if (tag != 'tr') container = new Element('tr').inject(container);
		}
	}

	return (container || new Element('div')).set('html', text).getChildren();
};

/*
---

script: Element.Delegation.js

description: Extends the Element native object to include the delegate method for more efficient event management.

credits:
- "Event checking based on the work of Daniel Steigerwald. License: MIT-style license.	Copyright: Copyright (c) 2008 Daniel Steigerwald, daniel.steigerwald.cz"

license: MIT-style license

authors:
- Aaron Newton
- Daniel Steigerwald

requires:
- core:1.2.4/Element.Event
- core:1.2.4/Selectors
- /MooTools.More

provides: [Element.Delegation]

...
*/
(function(){
	
	var match = /(.*?):relay\(([^)]+)\)$/,
		combinators = /[+>~\s]/,
		splitType = function(type){
			var bits = type.match(match);
			return !bits ? {event: type} : {
				event: bits[1],
				selector: bits[2]
			};
		},
		check = function(e, selector){
			var t = e.target;
			if (combinators.test(selector = selector.trim())){
				var els = this.getElements(selector);
				for (var i = els.length; i--; ){
					var el = els[i];
					if (t == el || el.hasChild(t)) return el;
				}
			} else {
				for ( ; t && t != this; t = t.parentNode){
					if (Element.match(t, selector)) return document.id(t);
				}
			}
			return null;
		};

	var oldAddEvent = Element.prototype.addEvent,
		oldRemoveEvent = Element.prototype.removeEvent;
		
	Element.implement({

		addEvent: function(type, fn){
			var splitted = splitType(type);
			if (splitted.selector){
				var monitors = this.retrieve('$moo:delegateMonitors', {});
				if (!monitors[type]){
					var monitor = function(e){
						var el = check.call(this, e, splitted.selector);
						if (el) this.fireEvent(type, [e, el], 0, el);
					}.bind(this);
					monitors[type] = monitor;
					oldAddEvent.call(this, splitted.event, monitor);
				}
			}
			return oldAddEvent.apply(this, arguments);
		},

		removeEvent: function(type, fn){
			var splitted = splitType(type);
			if (splitted.selector){
				var events = this.retrieve('events');
				if (!events || !events[type] || (fn && !events[type].keys.contains(fn))) return this;

				if (fn) oldRemoveEvent.apply(this, [type, fn]);
				else oldRemoveEvent.apply(this, type);

				events = this.retrieve('events');
				if (events && events[type] && events[type].length == 0){
					var monitors = this.retrieve('$moo:delegateMonitors', {});
					oldRemoveEvent.apply(this, [splitted.event, monitors[type]]);
					delete monitors[type];
				}
				return this;
			}

			return oldRemoveEvent.apply(this, arguments);
		},

		fireEvent: function(type, args, delay, bind){
			var events = this.retrieve('events');
			if (!events || !events[type]) return this;
			events[type].keys.each(function(fn){
				fn.create({bind: bind || this, delay: delay, arguments: args})();
			}, this);
			return this;
		}

	});

})();

/*
---

script: Element.Measure.js

description: Extends the Element native object to include methods useful in measuring dimensions.

credits: "Element.measure / .expose methods by Daniel Steigerwald License: MIT-style license. Copyright: Copyright (c) 2008 Daniel Steigerwald, daniel.steigerwald.cz"

license: MIT-style license

authors:
- Aaron Newton

requires:
- core:1.2.4/Element.Style
- core:1.2.4/Element.Dimensions
- /MooTools.More

provides: [Element.Measure]

...
*/

Element.implement({

	measure: function(fn){
		var vis = function(el) {
			return !!(!el || el.offsetHeight || el.offsetWidth);
		};
		if (vis(this)) return fn.apply(this);
		var parent = this.getParent(),
			restorers = [],
			toMeasure = []; 
		while (!vis(parent) && parent != document.body) {
			toMeasure.push(parent.expose());
			parent = parent.getParent();
		}
		var restore = this.expose();
		var result = fn.apply(this);
		restore();
		toMeasure.each(function(restore){
			restore();
		});
		return result;
	},

	expose: function(){
		if (this.getStyle('display') != 'none') return $empty;
		var before = this.style.cssText;
		this.setStyles({
			display: 'block',
			position: 'absolute',
			visibility: 'hidden'
		});
		return function(){
			this.style.cssText = before;
		}.bind(this);
	},

	getDimensions: function(options){
		options = $merge({computeSize: false},options);
		var dim = {};
		var getSize = function(el, options){
			return (options.computeSize)?el.getComputedSize(options):el.getSize();
		};
		var parent = this.getParent('body');
		if (parent && this.getStyle('display') == 'none'){
			dim = this.measure(function(){
				return getSize(this, options);
			});
		} else if (parent){
			try { //safari sometimes crashes here, so catch it
				dim = getSize(this, options);
			}catch(e){}
		} else {
			dim = {x: 0, y: 0};
		}
		return $chk(dim.x) ? $extend(dim, {width: dim.x, height: dim.y}) : $extend(dim, {x: dim.width, y: dim.height});
	},

	getComputedSize: function(options){
		options = $merge({
			styles: ['padding','border'],
			plains: {
				height: ['top','bottom'],
				width: ['left','right']
			},
			mode: 'both'
		}, options);
		var size = {width: 0,height: 0};
		switch (options.mode){
			case 'vertical':
				delete size.width;
				delete options.plains.width;
				break;
			case 'horizontal':
				delete size.height;
				delete options.plains.height;
				break;
		}
		var getStyles = [];
		//this function might be useful in other places; perhaps it should be outside this function?
		$each(options.plains, function(plain, key){
			plain.each(function(edge){
				options.styles.each(function(style){
					getStyles.push((style == 'border') ? style + '-' + edge + '-' + 'width' : style + '-' + edge);
				});
			});
		});
		var styles = {};
		getStyles.each(function(style){ styles[style] = this.getComputedStyle(style); }, this);
		var subtracted = [];
		$each(options.plains, function(plain, key){ //keys: width, height, plains: ['left', 'right'], ['top','bottom']
			var capitalized = key.capitalize();
			size['total' + capitalized] = size['computed' + capitalized] = 0;
			plain.each(function(edge){ //top, left, right, bottom
				size['computed' + edge.capitalize()] = 0;
				getStyles.each(function(style, i){ //padding, border, etc.
					//'padding-left'.test('left') size['totalWidth'] = size['width'] + [padding-left]
					if (style.test(edge)){
						styles[style] = styles[style].toInt() || 0; //styles['padding-left'] = 5;
						size['total' + capitalized] = size['total' + capitalized] + styles[style];
						size['computed' + edge.capitalize()] = size['computed' + edge.capitalize()] + styles[style];
					}
					//if width != width (so, padding-left, for instance), then subtract that from the total
					if (style.test(edge) && key != style &&
						(style.test('border') || style.test('padding')) && !subtracted.contains(style)){
						subtracted.push(style);
						size['computed' + capitalized] = size['computed' + capitalized]-styles[style];
					}
				});
			});
		});

		['Width', 'Height'].each(function(value){
			var lower = value.toLowerCase();
			if(!$chk(size[lower])) return;

			size[lower] = size[lower] + this['offset' + value] + size['computed' + value];
			size['total' + value] = size[lower] + size['total' + value];
			delete size['computed' + value];
		}, this);

		return $extend(styles, size);
	}

});

/*
---

script: Element.Pin.js

description: Extends the Element native object to include the pin method useful for fixed positioning for elements.

license: MIT-style license

authors:
- Aaron Newton

requires:
- core:1.2.4/Element.Event
- core:1.2.4/Element.Dimensions
- core:1.2.4/Element.Style
- /MooTools.More

provides: [Element.Pin]

...
*/

(function(){
	var supportsPositionFixed = false;
	window.addEvent('domready', function(){
		var test = new Element('div').setStyles({
			position: 'fixed',
			top: 0,
			right: 0
		}).inject(document.body);
		supportsPositionFixed = (test.offsetTop === 0);
		test.dispose();
	});

	Element.implement({

		pin: function(enable){
			if (this.getStyle('display') == 'none') return null;
			
			var p,
					scroll = window.getScroll();
			if (enable !== false){
				p = this.getPosition();
				if (!this.retrieve('pinned')){
					var pos = {
						top: p.y - scroll.y,
						left: p.x - scroll.x
					};
					if (supportsPositionFixed){
						this.setStyle('position', 'fixed').setStyles(pos);
					} else {
						this.store('pinnedByJS', true);
						this.setStyles({
							position: 'absolute',
							top: p.y,
							left: p.x
						}).addClass('isPinned');
						this.store('scrollFixer', (function(){
							if (this.retrieve('pinned'))
								var scroll = window.getScroll();
								this.setStyles({
									top: pos.top.toInt() + scroll.y,
									left: pos.left.toInt() + scroll.x
								});
						}).bind(this));
						window.addEvent('scroll', this.retrieve('scrollFixer'));
					}
					this.store('pinned', true);
				}
			} else {
				var op;
				if (!Browser.Engine.trident){
					var parent = this.getParent();
					op = (parent.getComputedStyle('position') != 'static' ? parent : parent.getOffsetParent());
				}
				p = this.getPosition(op);
				this.store('pinned', false);
				var reposition;
				if (supportsPositionFixed && !this.retrieve('pinnedByJS')){
					reposition = {
						top: p.y + scroll.y,
						left: p.x + scroll.x
					};
				} else {
					this.store('pinnedByJS', false);
					window.removeEvent('scroll', this.retrieve('scrollFixer'));
					reposition = {
						top: p.y,
						left: p.x
					};
				}
				this.setStyles($merge(reposition, {position: 'absolute'})).removeClass('isPinned');
			}
			return this;
		},

		unpin: function(){
			return this.pin(false);
		},

		togglepin: function(){
			this.pin(!this.retrieve('pinned'));
		}

	});

})();

/*
---

script: Element.Position.js

description: Extends the Element native object to include methods useful positioning elements relative to others.

license: MIT-style license

authors:
- Aaron Newton

requires:
- core:1.2.4/Element.Dimensions
- /Element.Measure

provides: [Elements.Position]

...
*/

(function(){

var original = Element.prototype.position;

Element.implement({

	position: function(options){
		//call original position if the options are x/y values
		if (options && ($defined(options.x) || $defined(options.y))) return original ? original.apply(this, arguments) : this;
		$each(options||{}, function(v, k){ if (!$defined(v)) delete options[k]; });
		options = $merge({
			// minimum: { x: 0, y: 0 },
			// maximum: { x: 0, y: 0},
			relativeTo: document.body,
			position: {
				x: 'center', //left, center, right
				y: 'center' //top, center, bottom
			},
			edge: false,
			offset: {x: 0, y: 0},
			returnPos: false,
			relFixedPosition: false,
			ignoreMargins: false,
			ignoreScroll: false,
			allowNegative: false
		}, options);
		//compute the offset of the parent positioned element if this element is in one
		var parentOffset = {x: 0, y: 0}, 
				parentPositioned = false;
		/* dollar around getOffsetParent should not be necessary, but as it does not return
		 * a mootools extended element in IE, an error occurs on the call to expose. See:
		 * http://mootools.lighthouseapp.com/projects/2706/tickets/333-element-getoffsetparent-inconsistency-between-ie-and-other-browsers */
		var offsetParent = this.measure(function(){
			return document.id(this.getOffsetParent());
		});
		if (offsetParent && offsetParent != this.getDocument().body){
			parentOffset = offsetParent.measure(function(){
				return this.getPosition();
			});
			parentPositioned = offsetParent != document.id(options.relativeTo);
			options.offset.x = options.offset.x - parentOffset.x;
			options.offset.y = options.offset.y - parentOffset.y;
		}
		//upperRight, bottomRight, centerRight, upperLeft, bottomLeft, centerLeft
		//topRight, topLeft, centerTop, centerBottom, center
		var fixValue = function(option){
			if ($type(option) != 'string') return option;
			option = option.toLowerCase();
			var val = {};
			if (option.test('left')) val.x = 'left';
			else if (option.test('right')) val.x = 'right';
			else val.x = 'center';
			if (option.test('upper') || option.test('top')) val.y = 'top';
			else if (option.test('bottom')) val.y = 'bottom';
			else val.y = 'center';
			return val;
		};
		options.edge = fixValue(options.edge);
		options.position = fixValue(options.position);
		if (!options.edge){
			if (options.position.x == 'center' && options.position.y == 'center') options.edge = {x:'center', y:'center'};
			else options.edge = {x:'left', y:'top'};
		}

		this.setStyle('position', 'absolute');
		var rel = document.id(options.relativeTo) || document.body,
				calc = rel == document.body ? window.getScroll() : rel.getPosition(),
				top = calc.y, left = calc.x;

		var scrolls = rel.getScrolls();
		top += scrolls.y;
		left += scrolls.x;

		var dim = this.getDimensions({computeSize: true, styles:['padding', 'border','margin']});
		var pos = {},
				prefY = options.offset.y,
				prefX = options.offset.x,
				winSize = window.getSize();
		switch(options.position.x){
			case 'left':
				pos.x = left + prefX;
				break;
			case 'right':
				pos.x = left + prefX + rel.offsetWidth;
				break;
			default: //center
				pos.x = left + ((rel == document.body ? winSize.x : rel.offsetWidth)/2) + prefX;
				break;
		}
		switch(options.position.y){
			case 'top':
				pos.y = top + prefY;
				break;
			case 'bottom':
				pos.y = top + prefY + rel.offsetHeight;
				break;
			default: //center
				pos.y = top + ((rel == document.body ? winSize.y : rel.offsetHeight)/2) + prefY;
				break;
		}
		if (options.edge){
			var edgeOffset = {};

			switch(options.edge.x){
				case 'left':
					edgeOffset.x = 0;
					break;
				case 'right':
					edgeOffset.x = -dim.x-dim.computedRight-dim.computedLeft;
					break;
				default: //center
					edgeOffset.x = -(dim.totalWidth/2);
					break;
			}
			switch(options.edge.y){
				case 'top':
					edgeOffset.y = 0;
					break;
				case 'bottom':
					edgeOffset.y = -dim.y-dim.computedTop-dim.computedBottom;
					break;
				default: //center
					edgeOffset.y = -(dim.totalHeight/2);
					break;
			}
			pos.x += edgeOffset.x;
			pos.y += edgeOffset.y;
		}
		pos = {
			left: ((pos.x >= 0 || parentPositioned || options.allowNegative) ? pos.x : 0).toInt(),
			top: ((pos.y >= 0 || parentPositioned || options.allowNegative) ? pos.y : 0).toInt()
		};
		var xy = {left: 'x', top: 'y'};
		['minimum', 'maximum'].each(function(minmax) {
			['left', 'top'].each(function(lr) {
				var val = options[minmax] ? options[minmax][xy[lr]] : null;
				if (val != null && pos[lr] < val) pos[lr] = val;
			});
		});
		if (rel.getStyle('position') == 'fixed' || options.relFixedPosition){
			var winScroll = window.getScroll();
			pos.top+= winScroll.y;
			pos.left+= winScroll.x;
		}
		if (options.ignoreScroll) {
			var relScroll = rel.getScroll();
			pos.top-= relScroll.y;
			pos.left-= relScroll.x;
		}
		if (options.ignoreMargins) {
			pos.left += (
				options.edge.x == 'right' ? dim['margin-right'] : 
				options.edge.x == 'center' ? -dim['margin-left'] + ((dim['margin-right'] + dim['margin-left'])/2) : 
					- dim['margin-left']
			);
			pos.top += (
				options.edge.y == 'bottom' ? dim['margin-bottom'] : 
				options.edge.y == 'center' ? -dim['margin-top'] + ((dim['margin-bottom'] + dim['margin-top'])/2) : 
					- dim['margin-top']
			);
		}
		pos.left = Math.ceil(pos.left);
		pos.top = Math.ceil(pos.top);
		if (options.returnPos) return pos;
		else this.setStyles(pos);
		return this;
	}

});

})();

/*
---

script: Element.Shortcuts.js

description: Extends the Element native object to include some shortcut methods.

license: MIT-style license

authors:
- Aaron Newton

requires:
- core:1.2.4/Element.Style
- /MooTools.More

provides: [Element.Shortcuts]

...
*/

Element.implement({

	isDisplayed: function(){
		return this.getStyle('display') != 'none';
	},

	isVisible: function(){
		var w = this.offsetWidth,
			h = this.offsetHeight;
		return (w == 0 && h == 0) ? false : (w > 0 && h > 0) ? true : this.isDisplayed();
	},

	toggle: function(){
		return this[this.isDisplayed() ? 'hide' : 'show']();
	},

	hide: function(){
		var d;
		try {
			// IE fails here if the element is not in the dom
			if ((d = this.getStyle('display')) == 'none') d = null;
		} catch(e){}
		
		return this.store('originalDisplay', d || 'block').setStyle('display', 'none');
	},

	show: function(display){
		return this.setStyle('display', display || this.retrieve('originalDisplay') || 'block');
	},

	swapClass: function(remove, add){
		return this.removeClass(remove).addClass(add);
	}

});


/*
---

script: Form.Request.js

description: Handles the basic functionality of submitting a form and updating a dom element with the result.

license: MIT-style license

authors:
- Aaron Newton

requires:
- core:1.2.4/Element.Event
- core:1.2.4/Request.HTML
- /Class.Binds
- /Class.Occlude
- /Spinner
- /String.QueryString

provides: [Form.Request]

...
*/

if (!window.Form) window.Form = {};

(function(){

	Form.Request = new Class({

		Binds: ['onSubmit', 'onFormValidate'],

		Implements: [Options, Events, Class.Occlude],

		options: {
			//onFailure: $empty,
			//onSuccess: #empty, //aliased to onComplete,
			//onSend: $empty
			requestOptions: {
				evalScripts: true,
				useSpinner: true,
				emulation: false,
				link: 'ignore'
			},
			extraData: {},
			resetForm: true
		},

		property: 'form.request',

		initialize: function(form, update, options) {
			this.element = document.id(form);
			if (this.occlude()) return this.occluded;
			this.update = document.id(update);
			this.setOptions(options);
			this.makeRequest();
			if (this.options.resetForm) {
				this.request.addEvent('success', function(){
					$try(function(){ this.element.reset(); }.bind(this));
					if (window.OverText) OverText.update();
				}.bind(this));
			}
			this.attach();
		},

		toElement: function() {
			return this.element;
		},

		makeRequest: function(){
			this.request = new Request.HTML($merge({
					url: this.element.get('action'),
					update: this.update,
					emulation: false,
					spinnerTarget: this.element,
					method: this.element.get('method') || 'post'
			}, this.options.requestOptions)).addEvents({
				success: function(text, xml){
					['success', 'complete'].each(function(evt){
						this.fireEvent(evt, [this.update, text, xml]);
					}, this);
				}.bind(this),
				failure: function(xhr){
					this.fireEvent('failure', xhr);
				}.bind(this),
				exception: function(){
					this.fireEvent('failure', xhr);
				}.bind(this)
			});
		},

		attach: function(attach){
			attach = $pick(attach, true);
			method = attach ? 'addEvent' : 'removeEvent';
			
			var fv = this.element.retrieve('validator');
			if (fv) fv[method]('onFormValidate', this.onFormValidate);
			if (!fv || !attach) this.element[method]('submit', this.onSubmit);
		},

		detach: function(){
			this.attach(false);
		},

		//public method
		enable: function(){
			this.attach();
		},

		//public method
		disable: function(){
			this.detach();
		},

		onFormValidate: function(valid, form, e) {
			if (valid || !fv.options.stopOnFailure) {
				if (e && e.stop) e.stop();
				this.send();
			}
		},

		onSubmit: function(e){
			if (this.element.retrieve('validator')) {
				//form validator was created after Form.Request
				this.detach();
				this.addFormEvent();
				return;
			}
			e.stop();
			this.send();
		},

		send: function(){
			var str = this.element.toQueryString().trim();
			var data = $H(this.options.extraData).toQueryString();
			if (str) str += "&" + data;
			else str = data;
			this.fireEvent('send', [this.element, str]);
			this.request.send({data: str});
			return this;
		}

	});

	Element.Properties.formRequest = {

		set: function(){
			var opt = Array.link(arguments, {options: Object.type, update: Element.type, updateId: String.type});
			var update = opt.update || opt.updateId;
			var updater = this.retrieve('form.request');
			if (update) {
				if (updater) updater.update = document.id(update);
				this.store('form.request:update', update);
			}
			if (opt.options) {
				if (updater) updater.setOptions(opt.options);
				this.store('form.request:options', opt.options);
			}
			return this;
		},

		get: function(){
			var opt = Array.link(arguments, {options: Object.type, update: Element.type, updateId: String.type});
			var update = opt.update || opt.updateId;
			if (opt.options || update || !this.retrieve('form.request')){
				if (opt.options || !this.retrieve('form.request:options')) this.set('form.request', opt.options);
				if (update) this.set('form.request', update);
				this.store('form.request', new Form.Request(this, this.retrieve('form.request:update'), this.retrieve('form.request:options')));
			}
			return this.retrieve('form.request');
		}

	};

	Element.implement({

		formUpdate: function(update, options){
			this.get('form.request', update, options).send();
			return this;
		}

	});

})();

/*
---

script: Form.Request.Append.js

description: Handles the basic functionality of submitting a form and updating a dom element with the result. The result is appended to the DOM element instead of replacing its contents.

license: MIT-style license

authors:
- Aaron Newton

requires:
- /Form.Request
- /Fx.Reveal
- /Elements.from

provides: [Form.Request.Append]

...
*/

Form.Request.Append = new Class({

	Extends: Form.Request,

	options: {
		//onBeforeEffect: $empty,
		useReveal: true,
		revealOptions: {},
		inject: 'bottom'
	},

	makeRequest: function(){
		this.request = new Request.HTML($merge({
				url: this.element.get('action'),
				method: this.element.get('method') || 'post',
				spinnerTarget: this.element
			}, this.options.requestOptions, {
				evalScripts: false
			})
		).addEvents({
			success: function(tree, elements, html, javascript){
				var container;
				var kids = Elements.from(html);
				if (kids.length == 1) {
					container = kids[0];
				} else {
					 container = new Element('div', {
						styles: {
							display: 'none'
						}
					}).adopt(kids);
				}
				container.inject(this.update, this.options.inject);
				if (this.options.requestOptions.evalScripts) $exec(javascript);
				this.fireEvent('beforeEffect', container);
				var finish = function(){
					this.fireEvent('success', [container, this.update, tree, elements, html, javascript]);
				}.bind(this);
				if (this.options.useReveal) {
					container.get('reveal', this.options.revealOptions).chain(finish);
					container.reveal();
				} else {
					finish();
				}
			}.bind(this),
			failure: function(xhr){
				this.fireEvent('failure', xhr);
			}.bind(this)
		});
	}

});

/*
---

script: Form.Validator.js

description: A css-class based form validation system.

license: MIT-style license

authors:
- Aaron Newton

requires:
- core:1.2.4/Options
- core:1.2.4/Events
- core:1.2.4/Selectors
- core:1.2.4/Element.Event
- core:1.2.4/Element.Style
- core:1.2.4/JSON
- /Lang- /Class.Binds
- /Date Element.Forms
- /Form.Validator.English
- /Element.Shortcuts

provides: [Form.Validator, InputValidator, FormValidator.BaseValidators]

...
*/
if (!window.Form) window.Form = {};

var InputValidator = new Class({

	Implements: [Options],

	options: {
		errorMsg: 'Validation failed.',
		test: function(field){return true;}
	},

	initialize: function(className, options){
		this.setOptions(options);
		this.className = className;
	},

	test: function(field, props){
		if (document.id(field)) return this.options.test(document.id(field), props||this.getProps(field));
		else return false;
	},

	getError: function(field, props){
		var err = this.options.errorMsg;
		if ($type(err) == 'function') err = err(document.id(field), props||this.getProps(field));
		return err;
	},

	getProps: function(field){
		if (!document.id(field)) return {};
		return field.get('validatorProps');
	}

});

Element.Properties.validatorProps = {

	set: function(props){
		return this.eliminate('validatorProps').store('validatorProps', props);
	},

	get: function(props){
		if (props) this.set(props);
		if (this.retrieve('validatorProps')) return this.retrieve('validatorProps');
		if (this.getProperty('validatorProps')){
			try {
				this.store('validatorProps', JSON.decode(this.getProperty('validatorProps')));
			}catch(e){
				return {};
			}
		} else {
			var vals = this.get('class').split(' ').filter(function(cls){
				return cls.test(':');
			});
			if (!vals.length){
				this.store('validatorProps', {});
			} else {
				props = {};
				vals.each(function(cls){
					var split = cls.split(':');
					if (split[1]) {
						try {
							props[split[0]] = JSON.decode(split[1]);
						} catch(e) {}
					}
				});
				this.store('validatorProps', props);
			}
		}
		return this.retrieve('validatorProps');
	}

};

Form.Validator = new Class({

	Implements:[Options, Events],

	Binds: ['onSubmit'],

	options: {/*
		onFormValidate: $empty(isValid, form, event),
		onElementValidate: $empty(isValid, field, className, warn),
		onElementPass: $empty(field),
		onElementFail: $empty(field, validatorsFailed) */
		fieldSelectors: 'input, select, textarea',
		ignoreHidden: true,
		ignoreDisabled: true,
		useTitles: false,
		evaluateOnSubmit: true,
		evaluateFieldsOnBlur: true,
		evaluateFieldsOnChange: true,
		serial: true,
		stopOnFailure: true,
		warningPrefix: function(){
			return Form.Validator.getMsg('warningPrefix') || 'Warning: ';
		},
		errorPrefix: function(){
			return Form.Validator.getMsg('errorPrefix') || 'Error: ';
		}
	},

	initialize: function(form, options){
		this.setOptions(options);
		this.element = document.id(form);
		this.element.store('validator', this);
		this.warningPrefix = $lambda(this.options.warningPrefix)();
		this.errorPrefix = $lambda(this.options.errorPrefix)();
		if (this.options.evaluateOnSubmit) this.element.addEvent('submit', this.onSubmit);
		if (this.options.evaluateFieldsOnBlur || this.options.evaluateFieldsOnChange) this.watchFields(this.getFields());
	},

	toElement: function(){
		return this.element;
	},

	getFields: function(){
		return (this.fields = this.element.getElements(this.options.fieldSelectors));
	},

	watchFields: function(fields){
		fields.each(function(el){
			if (this.options.evaluateFieldsOnBlur)
				el.addEvent('blur', this.validationMonitor.pass([el, false], this));
			if (this.options.evaluateFieldsOnChange)
				el.addEvent('change', this.validationMonitor.pass([el, true], this));
		}, this);
	},

	validationMonitor: function(){
		$clear(this.timer);
		this.timer = this.validateField.delay(50, this, arguments);
	},

	onSubmit: function(event){
		if (!this.validate(event) && event) event.preventDefault();
		else this.reset();
	},

	reset: function(){
		this.getFields().each(this.resetField, this);
		return this;
	},

	validate: function(event){
		var result = this.getFields().map(function(field){
			return this.validateField(field, true);
		}, this).every(function(v){ return v;});
		this.fireEvent('formValidate', [result, this.element, event]);
		if (this.options.stopOnFailure && !result && event) event.preventDefault();
		return result;
	},

	validateField: function(field, force){
		if (this.paused) return true;
		field = document.id(field);
		var passed = !field.hasClass('validation-failed');
		var failed, warned;
		if (this.options.serial && !force){
			failed = this.element.getElement('.validation-failed');
			warned = this.element.getElement('.warning');
		}
		if (field && (!failed || force || field.hasClass('validation-failed') || (failed && !this.options.serial))){
			var validators = field.className.split(' ').some(function(cn){
				return this.getValidator(cn);
			}, this);
			var validatorsFailed = [];
			field.className.split(' ').each(function(className){
				if (className && !this.test(className, field)) validatorsFailed.include(className);
			}, this);
			passed = validatorsFailed.length === 0;
			if (validators && !field.hasClass('warnOnly')){
				if (passed){
					field.addClass('validation-passed').removeClass('validation-failed');
					this.fireEvent('elementPass', field);
				} else {
					field.addClass('validation-failed').removeClass('validation-passed');
					this.fireEvent('elementFail', [field, validatorsFailed]);
				}
			}
			if (!warned){
				var warnings = field.className.split(' ').some(function(cn){
					if (cn.test('^warn-') || field.hasClass('warnOnly'))
						return this.getValidator(cn.replace(/^warn-/,''));
					else return null;
				}, this);
				field.removeClass('warning');
				var warnResult = field.className.split(' ').map(function(cn){
					if (cn.test('^warn-') || field.hasClass('warnOnly'))
						return this.test(cn.replace(/^warn-/,''), field, true);
					else return null;
				}, this);
			}
		}
		return passed;
	},

	test: function(className, field, warn){
		field = document.id(field);
		if((this.options.ignoreHidden && !field.isVisible()) || (this.options.ignoreDisabled && field.get('disabled'))) return true;
		var validator = this.getValidator(className);
		if (field.hasClass('ignoreValidation')) return true;
		warn = $pick(warn, false);
		if (field.hasClass('warnOnly')) warn = true;
		var isValid = validator ? validator.test(field) : true;
		if (validator && field.isVisible()) this.fireEvent('elementValidate', [isValid, field, className, warn]);
		if (warn) return true;
		return isValid;
	},

	resetField: function(field){
		field = document.id(field);
		if (field){
			field.className.split(' ').each(function(className){
				if (className.test('^warn-')) className = className.replace(/^warn-/, '');
				field.removeClass('validation-failed');
				field.removeClass('warning');
				field.removeClass('validation-passed');
			}, this);
		}
		return this;
	},

	stop: function(){
		this.paused = true;
		return this;
	},

	start: function(){
		this.paused = false;
		return this;
	},

	ignoreField: function(field, warn){
		field = document.id(field);
		if (field){
			this.enforceField(field);
			if (warn) field.addClass('warnOnly');
			else field.addClass('ignoreValidation');
		}
		return this;
	},

	enforceField: function(field){
		field = document.id(field);
		if (field) field.removeClass('warnOnly').removeClass('ignoreValidation');
		return this;
	}

});

Form.Validator.getMsg = function(key){
	return MooTools.lang.get('Form.Validator', key);
};

Form.Validator.adders = {

	validators:{},

	add : function(className, options){
		this.validators[className] = new InputValidator(className, options);
		//if this is a class (this method is used by instances of Form.Validator and the Form.Validator namespace)
		//extend these validators into it
		//this allows validators to be global and/or per instance
		if (!this.initialize){
			this.implement({
				validators: this.validators
			});
		}
	},

	addAllThese : function(validators){
		$A(validators).each(function(validator){
			this.add(validator[0], validator[1]);
		}, this);
	},

	getValidator: function(className){
		return this.validators[className.split(':')[0]];
	}

};

$extend(Form.Validator, Form.Validator.adders);

Form.Validator.implement(Form.Validator.adders);

Form.Validator.add('IsEmpty', {

	errorMsg: false,
	test: function(element){
		if (element.type == 'select-one' || element.type == 'select')
			return !(element.selectedIndex >= 0 && element.options[element.selectedIndex].value != '');
		else
			return ((element.get('value') == null) || (element.get('value').length == 0));
	}

});

Form.Validator.addAllThese([

	['required', {
		errorMsg: function(){
			return Form.Validator.getMsg('required');
		},
		test: function(element){
			return !Form.Validator.getValidator('IsEmpty').test(element);
		}
	}],

	['minLength', {
		errorMsg: function(element, props){
			if ($type(props.minLength))
				return Form.Validator.getMsg('minLength').substitute({minLength:props.minLength,length:element.get('value').length });
			else return '';
		},
		test: function(element, props){
			if ($type(props.minLength)) return (element.get('value').length >= $pick(props.minLength, 0));
			else return true;
		}
	}],

	['maxLength', {
		errorMsg: function(element, props){
			//props is {maxLength:10}
			if ($type(props.maxLength))
				return Form.Validator.getMsg('maxLength').substitute({maxLength:props.maxLength,length:element.get('value').length });
			else return '';
		},
		test: function(element, props){
			//if the value is <= than the maxLength value, element passes test
			return (element.get('value').length <= $pick(props.maxLength, 10000));
		}
	}],

	['validate-integer', {
		errorMsg: Form.Validator.getMsg.pass('integer'),
		test: function(element){
			return Form.Validator.getValidator('IsEmpty').test(element) || (/^(-?[1-9]\d*|0)$/).test(element.get('value'));
		}
	}],

	['validate-numeric', {
		errorMsg: Form.Validator.getMsg.pass('numeric'),
		test: function(element){
			return Form.Validator.getValidator('IsEmpty').test(element) ||
				(/^-?(?:0$0(?=\d*\.)|[1-9]|0)\d*(\.\d+)?$/).test(element.get('value'));
		}
	}],

	['validate-digits', {
		errorMsg: Form.Validator.getMsg.pass('digits'),
		test: function(element){
			return Form.Validator.getValidator('IsEmpty').test(element) || (/^[\d() .:\-\+#]+$/.test(element.get('value')));
		}
	}],

	['validate-alpha', {
		errorMsg: Form.Validator.getMsg.pass('alpha'),
		test: function(element){
			return Form.Validator.getValidator('IsEmpty').test(element) ||  (/^[a-zA-Z]+$/).test(element.get('value'));
		}
	}],

	['validate-alphanum', {
		errorMsg: Form.Validator.getMsg.pass('alphanum'),
		test: function(element){
			return Form.Validator.getValidator('IsEmpty').test(element) || !(/\W/).test(element.get('value'));
		}
	}],

	['validate-date', {
		errorMsg: function(element, props){
			if (Date.parse){
				var format = props.dateFormat || '%x';
				return Form.Validator.getMsg('dateSuchAs').substitute({date: new Date().format(format)});
			} else {
				return Form.Validator.getMsg('dateInFormatMDY');
			}
		},
		test: function(element, props){
			if (Form.Validator.getValidator('IsEmpty').test(element)) return true;
			var d;
			if (Date.parse){
				var format = props.dateFormat || '%x';
				d = Date.parse(element.get('value'));
				var formatted = d.format(format);
				if (formatted != 'invalid date') element.set('value', formatted);
				return !isNaN(d);
			} else {
				var regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
				if (!regex.test(element.get('value'))) return false;
				d = new Date(element.get('value').replace(regex, '$1/$2/$3'));
				return (parseInt(RegExp.$1, 10) == (1 + d.getMonth())) &&
					(parseInt(RegExp.$2, 10) == d.getDate()) &&
					(parseInt(RegExp.$3, 10) == d.getFullYear());
			}
		}
	}],

	['validate-email', {
		errorMsg: Form.Validator.getMsg.pass('email'),
		test: function(element){
			return Form.Validator.getValidator('IsEmpty').test(element) || (/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i).test(element.get('value'));
		}
	}],

	['validate-url', {
		errorMsg: Form.Validator.getMsg.pass('url'),
		test: function(element){
			return Form.Validator.getValidator('IsEmpty').test(element) || (/^(https?|ftp|rmtp|mms):\/\/(([A-Z0-9][A-Z0-9_-]*)(\.[A-Z0-9][A-Z0-9_-]*)+)(:(\d+))?\/?/i).test(element.get('value'));
		}
	}],

	['validate-currency-dollar', {
		errorMsg: Form.Validator.getMsg.pass('currencyDollar'),
		test: function(element){
			// [$]1[##][,###]+[.##]
			// [$]1###+[.##]
			// [$]0.##
			// [$].##
			return Form.Validator.getValidator('IsEmpty').test(element) ||  (/^\$?\-?([1-9]{1}[0-9]{0,2}(\,[0-9]{3})*(\.[0-9]{0,2})?|[1-9]{1}\d*(\.[0-9]{0,2})?|0(\.[0-9]{0,2})?|(\.[0-9]{1,2})?)$/).test(element.get('value'));
		}
	}],

	['validate-one-required', {
		errorMsg: Form.Validator.getMsg.pass('oneRequired'),
		test: function(element, props){
			var p = document.id(props['validate-one-required']) || element.getParent();
			return p.getElements('input').some(function(el){
				if (['checkbox', 'radio'].contains(el.get('type'))) return el.get('checked');
				return el.get('value');
			});
		}
	}]

]);

Element.Properties.validator = {

	set: function(options){
		var validator = this.retrieve('validator');
		if (validator) validator.setOptions(options);
		return this.store('validator:options');
	},

	get: function(options){
		if (options || !this.retrieve('validator')){
			if (options || !this.retrieve('validator:options')) this.set('validator', options);
			this.store('validator', new Form.Validator(this, this.retrieve('validator:options')));
		}
		return this.retrieve('validator');
	}

};

Element.implement({

	validate: function(options){
		this.set('validator', options);
		return this.get('validator', options).validate();
	}

});
//legacy
var FormValidator = Form.Validator;

/*
---

script: Form.Validator.Inline.js

description: Extends Form.Validator to add inline messages.

license: MIT-style license

authors:
- Aaron Newton

requires:
- /Form.Validator

provides: [Form.Validator.Inline]

...
*/

Form.Validator.Inline = new Class({

	Extends: Form.Validator,

	options: {
		scrollToErrorsOnSubmit: true,
		scrollFxOptions: {
			transition: 'quad:out',
			offset: {
				y: -20
			}
		}
	},

	initialize: function(form, options){
		this.parent(form, options);
		this.addEvent('onElementValidate', function(isValid, field, className, warn){
			var validator = this.getValidator(className);
			if (!isValid && validator.getError(field)){
				if (warn) field.addClass('warning');
				var advice = this.makeAdvice(className, field, validator.getError(field), warn);
				this.insertAdvice(advice, field);
				this.showAdvice(className, field);
			} else {
				this.hideAdvice(className, field);
			}
		});
	},

	makeAdvice: function(className, field, error, warn){
		var errorMsg = (warn)?this.warningPrefix:this.errorPrefix;
			errorMsg += (this.options.useTitles) ? field.title || error:error;
		var cssClass = (warn) ? 'warning-advice' : 'validation-advice';
		var advice = this.getAdvice(className, field);
		if(advice) {
			advice = advice.set('html', errorMsg);
		} else {
			advice = new Element('div', {
				html: errorMsg,
				styles: { display: 'none' },
				id: 'advice-' + className + '-' + this.getFieldId(field)
			}).addClass(cssClass);
		}
		field.store('advice-' + className, advice);
		return advice;
	},

	getFieldId : function(field){
		return field.id ? field.id : field.id = 'input_' + field.name;
	},

	showAdvice: function(className, field){
		var advice = this.getAdvice(className, field);
		if (advice && !field.retrieve(this.getPropName(className))
				&& (advice.getStyle('display') == 'none'
				|| advice.getStyle('visiblity') == 'hidden'
				|| advice.getStyle('opacity') == 0)){
			field.store(this.getPropName(className), true);
			if (advice.reveal) advice.reveal();
			else advice.setStyle('display', 'block');
		}
	},

	hideAdvice: function(className, field){
		var advice = this.getAdvice(className, field);
		if (advice && field.retrieve(this.getPropName(className))){
			field.store(this.getPropName(className), false);
			//if Fx.Reveal.js is present, transition the advice out
			if (advice.dissolve) advice.dissolve();
			else advice.setStyle('display', 'none');
		}
	},

	getPropName: function(className){
		return 'advice' + className;
	},

	resetField: function(field){
		field = document.id(field);
		if (!field) return this;
		this.parent(field);
		field.className.split(' ').each(function(className){
			this.hideAdvice(className, field);
		}, this);
		return this;
	},

	getAllAdviceMessages: function(field, force){
		var advice = [];
		if (field.hasClass('ignoreValidation') && !force) return advice;
		var validators = field.className.split(' ').some(function(cn){
			var warner = cn.test('^warn-') || field.hasClass('warnOnly');
			if (warner) cn = cn.replace(/^warn-/, '');
			var validator = this.getValidator(cn);
			if (!validator) return;
			advice.push({
				message: validator.getError(field),
				warnOnly: warner,
				passed: validator.test(),
				validator: validator
			});
		}, this);
		return advice;
	},

	getAdvice: function(className, field){
		return field.retrieve('advice-' + className);
	},

	insertAdvice: function(advice, field){
		//Check for error position prop
		var props = field.get('validatorProps');
		//Build advice
		if (!props.msgPos || !document.id(props.msgPos)){
			if(field.type.toLowerCase() == 'radio') field.getParent().adopt(advice);
			else advice.inject(document.id(field), 'after');
		} else {
			document.id(props.msgPos).grab(advice);
		}
	},

	validateField: function(field, force){
		var result = this.parent(field, force);
		if (this.options.scrollToErrorsOnSubmit && !result){
			var failed = document.id(this).getElement('.validation-failed');
			var par = document.id(this).getParent();
			while (par != document.body && par.getScrollSize().y == par.getSize().y){
				par = par.getParent();
			}
			var fx = par.retrieve('fvScroller');
			if (!fx && window.Fx && Fx.Scroll){
				fx = new Fx.Scroll(par, this.options.scrollFxOptions);
				par.store('fvScroller', fx);
			}
			if (failed){
				if (fx) fx.toElement(failed);
				else par.scrollTo(par.getScroll().x, failed.getPosition(par).y - 20);
			}
		}
		return result;
	}

});


/*
---

script: Form.Validator.Extras.js

description: Additional validators for the Form.Validator class.

license: MIT-style license

authors:
- Aaron Newton

requires:
- /Form.Validator

provides: [Form.Validator.Extras]

...
*/
Form.Validator.addAllThese([

	['validate-enforce-oncheck', {
		test: function(element, props){
			if (element.checked){
				var fv = element.getParent('form').retrieve('validator');
				if (!fv) return true;
				(props.toEnforce || document.id(props.enforceChildrenOf).getElements('input, select, textarea')).map(function(item){
					fv.enforceField(item);
				});
			}
			return true;
		}
	}],

	['validate-ignore-oncheck', {
		test: function(element, props){
			if (element.checked){
				var fv = element.getParent('form').retrieve('validator');
				if (!fv) return true;
				(props.toIgnore || document.id(props.ignoreChildrenOf).getElements('input, select, textarea')).each(function(item){
					fv.ignoreField(item);
					fv.resetField(item);
				});
			}
			return true;
		}
	}],

	['validate-nospace', {
		errorMsg: function(){
			return Form.Validator.getMsg('noSpace');
		},
		test: function(element, props){
			return !element.get('value').test(/\s/);
		}
	}],

	['validate-toggle-oncheck', {
		test: function(element, props){
			var fv = element.getParent('form').retrieve('validator');
			if (!fv) return true;
			var eleArr = props.toToggle || document.id(props.toToggleChildrenOf).getElements('input, select, textarea');
			if (!element.checked){
				eleArr.each(function(item){
					fv.ignoreField(item);
					fv.resetField(item);
				});
			} else {
				eleArr.each(function(item){
					fv.enforceField(item);
				});
			}
			return true;
		}
	}],

	['validate-reqchk-bynode', {
		errorMsg: function(){
			return Form.Validator.getMsg('reqChkByNode');
		},
		test: function(element, props){
			return (document.id(props.nodeId).getElements(props.selector || 'input[type=checkbox], input[type=radio]')).some(function(item){
				return item.checked;
			});
		}
	}],

	['validate-required-check', {
		errorMsg: function(element, props){
			return props.useTitle ? element.get('title') : Form.Validator.getMsg('requiredChk');
		},
		test: function(element, props){
			return !!element.checked;
		}
	}],

	['validate-reqchk-byname', {
		errorMsg: function(element, props){
			return Form.Validator.getMsg('reqChkByName').substitute({label: props.label || element.get('type')});
		},
		test: function(element, props){
			var grpName = props.groupName || element.get('name');
			var oneCheckedItem = $$(document.getElementsByName(grpName)).some(function(item, index){
				return item.checked;
			});
			var fv = element.getParent('form').retrieve('validator');
			if (oneCheckedItem && fv) fv.resetField(element);
			return oneCheckedItem;
		}
	}],

	['validate-match', {
		errorMsg: function(element, props){
			return Form.Validator.getMsg('match').substitute({matchName: props.matchName || document.id(props.matchInput).get('name')});
		},
		test: function(element, props){
			var eleVal = element.get('value');
			var matchVal = document.id(props.matchInput) && document.id(props.matchInput).get('value');
			return eleVal && matchVal ? eleVal == matchVal : true;
		}
	}],

	['validate-after-date', {
		errorMsg: function(element, props){
			return Form.Validator.getMsg('afterDate').substitute({
				label: props.afterLabel || (props.afterElement ? Form.Validator.getMsg('startDate') : Form.Validator.getMsg('currentDate'))
			});
		},
		test: function(element, props){
			var start = document.id(props.afterElement) ? Date.parse(document.id(props.afterElement).get('value')) : new Date();
			var end = Date.parse(element.get('value'));
			return end && start ? end >= start : true;
		}
	}],

	['validate-before-date', {
		errorMsg: function(element, props){
			return Form.Validator.getMsg('beforeDate').substitute({
				label: props.beforeLabel || (props.beforeElement ? Form.Validator.getMsg('endDate') : Form.Validator.getMsg('currentDate'))
			});
		},
		test: function(element, props){
			var start = Date.parse(element.get('value'));
			var end = document.id(props.beforeElement) ? Date.parse(document.id(props.beforeElement).get('value')) : new Date();
			return end && start ? end >= start : true;
		}
	}],

	['validate-custom-required', {
		errorMsg: function(){
			return Form.Validator.getMsg('required');
		},
		test: function(element, props){
			return element.get('value') != props.emptyValue;
		}
	}],

	['validate-same-month', {
		errorMsg: function(element, props){
			var startMo = document.id(props.sameMonthAs) && document.id(props.sameMonthAs).get('value');
			var eleVal = element.get('value');
			if (eleVal != '') return Form.Validator.getMsg(startMo ? 'sameMonth' : 'startMonth');
		},
		test: function(element, props){
			var d1 = Date.parse(element.get('value'));
			var d2 = Date.parse(document.id(props.sameMonthAs) && document.id(props.sameMonthAs).get('value'));
			return d1 && d2 ? d1.format('%B') == d2.format('%B') : true;
		}
	}],


	['validate-cc-num', {
		errorMsg: function(element){
			var ccNum = element.get('value').ccNum.replace(/[^0-9]/g, '');
			return Form.Validator.getMsg('creditcard').substitute({length: ccNum.length});
		},
		test: function(element){
			// required is a different test
			if (Form.Validator.getValidator('IsEmpty').test(element)) { return true; }

			// Clean number value
			var ccNum = element.get('value');
			ccNum = ccNum.replace(/[^0-9]/g, '');

			var valid_type = false;

			if (ccNum.test(/^4[0-9]{12}([0-9]{3})?$/)) valid_type = 'Visa';
			else if (ccNum.test(/^5[1-5]([0-9]{14})$/)) valid_type = 'Master Card';
			else if (ccNum.test(/^3[47][0-9]{13}$/)) valid_type = 'American Express';
			else if (ccNum.test(/^6011[0-9]{12}$/)) valid_type = 'Discover';

			if (valid_type) {
				var sum = 0;
				var cur = 0;

				for(var i=ccNum.length-1; i>=0; --i) {
					cur = ccNum.charAt(i).toInt();
					if (cur == 0) { continue; }

					if ((ccNum.length-i) % 2 == 0) { cur += cur; }
					if (cur > 9) { cur = cur.toString().charAt(0).toInt() + cur.toString().charAt(1).toInt(); }

					sum += cur;
				}
				if ((sum % 10) == 0) { return true; }
			}

			var chunks = '';
			while (ccNum != '') {
				chunks += ' ' + ccNum.substr(0,4);
				ccNum = ccNum.substr(4);
			}

			element.getParent('form').retrieve('validator').ignoreField(element);
			element.set('value', chunks.clean());
			element.getParent('form').retrieve('validator').enforceField(element);
			return false;
		}
	}]


]);

/*
---

script: OverText.js

description: Shows text over an input that disappears when the user clicks into it. The text remains hidden if the user adds a value.

license: MIT-style license

authors:
- Aaron Newton

requires:
- core:1.2.4/Options
- core:1.2.4/Events
- core:1.2.4/Element.Event
- /Class.Binds
- /Class.Occlude
- /Element.Position
- /Element.Shortcuts

provides: [OverText]

...
*/

var OverText = new Class({

	Implements: [Options, Events, Class.Occlude],

	Binds: ['reposition', 'assert', 'focus', 'hide'],

	options: {/*
		textOverride: null,
		onFocus: $empty()
		onTextHide: $empty(textEl, inputEl),
		onTextShow: $empty(textEl, inputEl), */
		element: 'label',
		positionOptions: {
			position: 'upperLeft',
			edge: 'upperLeft',
			offset: {
				x: 4,
				y: 2
			}
		},
		poll: false,
		pollInterval: 250,
		wrap: false
	},

	property: 'OverText',

	initialize: function(element, options){
		this.element = document.id(element);
		if (this.occlude()) return this.occluded;
		this.setOptions(options);
		this.attach(this.element);
		OverText.instances.push(this);
		if (this.options.poll) this.poll();
		return this;
	},

	toElement: function(){
		return this.element;
	},

	attach: function(){
		var val = this.options.textOverride || this.element.get('alt') || this.element.get('title');
		if (!val) return;
		this.text = new Element(this.options.element, {
			'class': 'overTxtLabel',
			styles: {
				lineHeight: 'normal',
				position: 'absolute',
				cursor: 'text'
			},
			html: val,
			events: {
				click: this.hide.pass(this.options.element == 'label', this)
			}
		}).inject(this.element, 'after');
		if (this.options.element == 'label') {
			if (!this.element.get('id')) this.element.set('id', 'input_' + new Date().getTime());
			this.text.set('for', this.element.get('id'));
		}

		if (this.options.wrap) {
			this.textHolder = new Element('div', {
				styles: {
					lineHeight: 'normal',
					position: 'relative'
				},
				'class':'overTxtWrapper'
			}).adopt(this.text).inject(this.element, 'before');
		}

		this.element.addEvents({
			focus: this.focus,
			blur: this.assert,
			change: this.assert
		}).store('OverTextDiv', this.text);
		window.addEvent('resize', this.reposition.bind(this));
		this.assert(true);
		this.reposition();
	},

	wrap: function(){
		if (this.options.element == 'label') {
			if (!this.element.get('id')) this.element.set('id', 'input_' + new Date().getTime());
			this.text.set('for', this.element.get('id'));
		}
	},

	startPolling: function(){
		this.pollingPaused = false;
		return this.poll();
	},

	poll: function(stop){
		//start immediately
		//pause on focus
		//resumeon blur
		if (this.poller && !stop) return this;
		var test = function(){
			if (!this.pollingPaused) this.assert(true);
		}.bind(this);
		if (stop) $clear(this.poller);
		else this.poller = test.periodical(this.options.pollInterval, this);
		return this;
	},

	stopPolling: function(){
		this.pollingPaused = true;
		return this.poll(true);
	},

	focus: function(){
		if (this.text && (!this.text.isDisplayed() || this.element.get('disabled'))) return;
		this.hide();
	},

	hide: function(suppressFocus, force){
		if (this.text && (this.text.isDisplayed() && (!this.element.get('disabled') || force))){
			this.text.hide();
			this.fireEvent('textHide', [this.text, this.element]);
			this.pollingPaused = true;
			try {
				if (!suppressFocus) this.element.fireEvent('focus');
				this.element.focus();
			} catch(e){} //IE barfs if you call focus on hidden elements
		}
		return this;
	},

	show: function(){
		if (this.text && !this.text.isDisplayed()){
			this.text.show();
			this.reposition();
			this.fireEvent('textShow', [this.text, this.element]);
			this.pollingPaused = false;
		}
		return this;
	},

	assert: function(suppressFocus){
		this[this.test() ? 'show' : 'hide'](suppressFocus);
	},

	test: function(){
		var v = this.element.get('value');
		return !v;
	},

	reposition: function(){
		this.assert(true);
		if (!this.element.isVisible()) return this.stopPolling().hide();
		if (this.text && this.test()) this.text.position($merge(this.options.positionOptions, {relativeTo: this.element}));
		return this;
	}

});

OverText.instances = [];

$extend(OverText, {

	each: function(fn) {
		return OverText.instances.map(function(ot, i){
			if (ot.element && ot.text) return fn.apply(OverText, [ot, i]);
			return null; //the input or the text was destroyed
		});
	},
	
	update: function(){

		return OverText.each(function(ot){
			return ot.reposition();
		});

	},

	hideAll: function(){

		return OverText.each(function(ot){
			return ot.hide(true, true);
		});

	},

	showAll: function(){
		return OverText.each(function(ot) {
			return ot.show();
		});
	}

});

if (window.Fx && Fx.Reveal) {
	Fx.Reveal.implement({
		hideInputs: Browser.Engine.trident ? 'select, input, textarea, object, embed, .overTxtLabel' : false
	});
}

/*
---

script: Fx.Elements.js

description: Effect to change any number of CSS properties of any number of Elements.

license: MIT-style license

authors:
- Valerio Proietti

requires:
- core:1.2.4/Fx.CSS
- /MooTools.More

provides: [Fx.Elements]

...
*/

Fx.Elements = new Class({

	Extends: Fx.CSS,

	initialize: function(elements, options){
		this.elements = this.subject = $$(elements);
		this.parent(options);
	},

	compute: function(from, to, delta){
		var now = {};
		for (var i in from){
			var iFrom = from[i], iTo = to[i], iNow = now[i] = {};
			for (var p in iFrom) iNow[p] = this.parent(iFrom[p], iTo[p], delta);
		}
		return now;
	},

	set: function(now){
		for (var i in now){
			var iNow = now[i];
			for (var p in iNow) this.render(this.elements[i], p, iNow[p], this.options.unit);
		}
		return this;
	},

	start: function(obj){
		if (!this.check(obj)) return this;
		var from = {}, to = {};
		for (var i in obj){
			var iProps = obj[i], iFrom = from[i] = {}, iTo = to[i] = {};
			for (var p in iProps){
				var parsed = this.prepare(this.elements[i], p, iProps[p]);
				iFrom[p] = parsed.from;
				iTo[p] = parsed.to;
			}
		}
		return this.parent(from, to);
	}

});

/*
---

script: Fx.Accordion.js

description: An Fx.Elements extension which allows you to easily create accordion type controls.

license: MIT-style license

authors:
- Valerio Proietti

requires:
- core:1.2.4/Element.Event
- /Fx.Elements

provides: [Fx.Accordion]

...
*/

var Accordion = Fx.Accordion = new Class({

	Extends: Fx.Elements,

	options: {/*
		onActive: $empty(toggler, section),
		onBackground: $empty(toggler, section),
		fixedHeight: false,
		fixedWidth: false,
		*/
		display: 0,
		show: false,
		height: true,
		width: false,
		opacity: true,
		alwaysHide: false,
		trigger: 'click',
		initialDisplayFx: true,
		returnHeightToAuto: true
	},

	initialize: function(){
		var params = Array.link(arguments, {'container': Element.type, 'options': Object.type, 'togglers': $defined, 'elements': $defined});
		this.parent(params.elements, params.options);
		this.togglers = $$(params.togglers);
		this.container = document.id(params.container);
		this.previous = -1;
		this.internalChain = new Chain();
		if (this.options.alwaysHide) this.options.wait = true;
		if ($chk(this.options.show)){
			this.options.display = false;
			this.previous = this.options.show;
		}
		if (this.options.start){
			this.options.display = false;
			this.options.show = false;
		}
		this.effects = {};
		if (this.options.opacity) this.effects.opacity = 'fullOpacity';
		if (this.options.width) this.effects.width = this.options.fixedWidth ? 'fullWidth' : 'offsetWidth';
		if (this.options.height) this.effects.height = this.options.fixedHeight ? 'fullHeight' : 'scrollHeight';
		for (var i = 0, l = this.togglers.length; i < l; i++) this.addSection(this.togglers[i], this.elements[i]);
		this.elements.each(function(el, i){
			if (this.options.show === i){
				this.fireEvent('active', [this.togglers[i], el]);
			} else {
				for (var fx in this.effects) el.setStyle(fx, 0);
			}
		}, this);
		if ($chk(this.options.display)) this.display(this.options.display, this.options.initialDisplayFx);
		this.addEvent('complete', this.internalChain.callChain.bind(this.internalChain));
	},

	addSection: function(toggler, element){
		toggler = document.id(toggler);
		element = document.id(element);
		var test = this.togglers.contains(toggler);
		this.togglers.include(toggler);
		this.elements.include(element);
		var idx = this.togglers.indexOf(toggler);
		var displayer = this.display.bind(this, idx);
		toggler.store('accordion:display', displayer);
		toggler.addEvent(this.options.trigger, displayer);
		if (this.options.height) element.setStyles({'padding-top': 0, 'border-top': 'none', 'padding-bottom': 0, 'border-bottom': 'none'});
		if (this.options.width) element.setStyles({'padding-left': 0, 'border-left': 'none', 'padding-right': 0, 'border-right': 'none'});
		element.fullOpacity = 1;
		if (this.options.fixedWidth) element.fullWidth = this.options.fixedWidth;
		if (this.options.fixedHeight) element.fullHeight = this.options.fixedHeight;
		element.setStyle('overflow', 'hidden');
		if (!test){
			for (var fx in this.effects) element.setStyle(fx, 0);
		}
		return this;
	},

	detach: function(){
		this.togglers.each(function(toggler) {
			toggler.removeEvent(this.options.trigger, toggler.retrieve('accordion:display'));
		}, this);
	},

	display: function(index, useFx){
		if (!this.check(index, useFx)) return this;
		useFx = $pick(useFx, true);
		if (this.options.returnHeightToAuto){
			var prev = this.elements[this.previous];
			if (prev && !this.selfHidden){
				for (var fx in this.effects){
					prev.setStyle(fx, prev[this.effects[fx]]);
				}
			}
		}
		index = ($type(index) == 'element') ? this.elements.indexOf(index) : index;
		if ((this.timer && this.options.wait) || (index === this.previous && !this.options.alwaysHide)) return this;
		this.previous = index;
		var obj = {};
		this.elements.each(function(el, i){
			obj[i] = {};
			var hide;
			if (i != index){
				hide = true;
			} else if (this.options.alwaysHide && ((el.offsetHeight > 0 && this.options.height) || el.offsetWidth > 0 && this.options.width)){
				hide = true;
				this.selfHidden = true;
			}
			this.fireEvent(hide ? 'background' : 'active', [this.togglers[i], el]);
			for (var fx in this.effects) obj[i][fx] = hide ? 0 : el[this.effects[fx]];
		}, this);
		this.internalChain.chain(function(){
			if (this.options.returnHeightToAuto && !this.selfHidden){
				var el = this.elements[index];
				if (el) el.setStyle('height', 'auto');
			};
		}.bind(this));
		return useFx ? this.start(obj) : this.set(obj);
	}

});

/*
---

script: Fx.Move.js

description: Defines Fx.Move, a class that works with Element.Position.js to transition an element from one location to another.

license: MIT-style license

authors:
- Aaron Newton

requires:
- core:1.2.4/Fx.Morph
- /Element.Position

provides: [Fx.Move]

...
*/

Fx.Move = new Class({

	Extends: Fx.Morph,

	options: {
		relativeTo: document.body,
		position: 'center',
		edge: false,
		offset: {x: 0, y: 0}
	},

	start: function(destination){
		return this.parent(this.element.position($merge(this.options, destination, {returnPos: true})));
	}

});

Element.Properties.move = {

	set: function(options){
		var morph = this.retrieve('move');
		if (morph) morph.cancel();
		return this.eliminate('move').store('move:options', $extend({link: 'cancel'}, options));
	},

	get: function(options){
		if (options || !this.retrieve('move')){
			if (options || !this.retrieve('move:options')) this.set('move', options);
			this.store('move', new Fx.Move(this, this.retrieve('move:options')));
		}
		return this.retrieve('move');
	}

};

Element.implement({

	move: function(options){
		this.get('move').start(options);
		return this;
	}

});


/*
---

script: Fx.Reveal.js

description: Defines Fx.Reveal, a class that shows and hides elements with a transition.

license: MIT-style license

authors:
- Aaron Newton

requires:
- core:1.2.4/Fx.Morph
- /Element.Shortcuts
- /Element.Measure

provides: [Fx.Reveal]

...
*/

Fx.Reveal = new Class({

	Extends: Fx.Morph,

	options: {/*	  
		onShow: $empty(thisElement),
		onHide: $empty(thisElement),
		onComplete: $empty(thisElement),
		heightOverride: null,
		widthOverride: null, */
		link: 'cancel',
		styles: ['padding', 'border', 'margin'],
		transitionOpacity: !Browser.Engine.trident4,
		mode: 'vertical',
		display: 'block',
		hideInputs: Browser.Engine.trident ? 'select, input, textarea, object, embed' : false
	},

	dissolve: function(){
		try {
			if (!this.hiding && !this.showing){
				if (this.element.getStyle('display') != 'none'){
					this.hiding = true;
					this.showing = false;
					this.hidden = true;
					this.cssText = this.element.style.cssText;
					var startStyles = this.element.getComputedSize({
						styles: this.options.styles,
						mode: this.options.mode
					});
					this.element.setStyle('display', 'block');
					if (this.options.transitionOpacity) startStyles.opacity = 1;
					var zero = {};
					$each(startStyles, function(style, name){
						zero[name] = [style, 0];
					}, this);
					this.element.setStyle('overflow', 'hidden');
					var hideThese = this.options.hideInputs ? this.element.getElements(this.options.hideInputs) : null;
					this.$chain.unshift(function(){
						if (this.hidden){
							this.hiding = false;
							$each(startStyles, function(style, name){
								startStyles[name] = style;
							}, this);
							this.element.style.cssText = this.cssText;
							this.element.setStyle('display', 'none');
							if (hideThese) hideThese.setStyle('visibility', 'visible');
						}
						this.fireEvent('hide', this.element);
						this.callChain();
					}.bind(this));
					if (hideThese) hideThese.setStyle('visibility', 'hidden');
					this.start(zero);
				} else {
					this.callChain.delay(10, this);
					this.fireEvent('complete', this.element);
					this.fireEvent('hide', this.element);
				}
			} else if (this.options.link == 'chain'){
				this.chain(this.dissolve.bind(this));
			} else if (this.options.link == 'cancel' && !this.hiding){
				this.cancel();
				this.dissolve();
			}
		} catch(e){
			this.hiding = false;
			this.element.setStyle('display', 'none');
			this.callChain.delay(10, this);
			this.fireEvent('complete', this.element);
			this.fireEvent('hide', this.element);
		}
		return this;
	},

	reveal: function(){
		try {
			if (!this.showing && !this.hiding){
				if (this.element.getStyle('display') == 'none' ||
					 this.element.getStyle('visiblity') == 'hidden' ||
					 this.element.getStyle('opacity') == 0){
					this.showing = true;
					this.hiding = this.hidden =  false;
					var startStyles;
					this.cssText = this.element.style.cssText;
					//toggle display, but hide it
					this.element.measure(function(){
						//create the styles for the opened/visible state
						startStyles = this.element.getComputedSize({
							styles: this.options.styles,
							mode: this.options.mode
						});
					}.bind(this));
					$each(startStyles, function(style, name){
						startStyles[name] = style;
					});
					//if we're overridding height/width
					if ($chk(this.options.heightOverride)) startStyles.height = this.options.heightOverride.toInt();
					if ($chk(this.options.widthOverride)) startStyles.width = this.options.widthOverride.toInt();
					if (this.options.transitionOpacity) {
						this.element.setStyle('opacity', 0);
						startStyles.opacity = 1;
					}
					//create the zero state for the beginning of the transition
					var zero = {
						height: 0,
						display: this.options.display
					};
					$each(startStyles, function(style, name){ zero[name] = 0; });
					//set to zero
					this.element.setStyles($merge(zero, {overflow: 'hidden'}));
					//hide inputs
					var hideThese = this.options.hideInputs ? this.element.getElements(this.options.hideInputs) : null;
					if (hideThese) hideThese.setStyle('visibility', 'hidden');
					//start the effect
					this.start(startStyles);
					this.$chain.unshift(function(){
						this.element.style.cssText = this.cssText;
						this.element.setStyle('display', this.options.display);
						if (!this.hidden) this.showing = false;
						if (hideThese) hideThese.setStyle('visibility', 'visible');
						this.callChain();
						this.fireEvent('show', this.element);
					}.bind(this));
				} else {
					this.callChain();
					this.fireEvent('complete', this.element);
					this.fireEvent('show', this.element);
				}
			} else if (this.options.link == 'chain'){
				this.chain(this.reveal.bind(this));
			} else if (this.options.link == 'cancel' && !this.showing){
				this.cancel();
				this.reveal();
			}
		} catch(e){
			this.element.setStyles({
				display: this.options.display,
				visiblity: 'visible',
				opacity: 1
			});
			this.showing = false;
			this.callChain.delay(10, this);
			this.fireEvent('complete', this.element);
			this.fireEvent('show', this.element);
		}
		return this;
	},

	toggle: function(){
		if (this.element.getStyle('display') == 'none' ||
			 this.element.getStyle('visiblity') == 'hidden' ||
			 this.element.getStyle('opacity') == 0){
			this.reveal();
		} else {
			this.dissolve();
		}
		return this;
	},

	cancel: function(){
		this.parent.apply(this, arguments);
		this.element.style.cssText = this.cssText;
		this.hidding = false;
		this.showing = false;
	}

});

Element.Properties.reveal = {

	set: function(options){
		var reveal = this.retrieve('reveal');
		if (reveal) reveal.cancel();
		return this.eliminate('reveal').store('reveal:options', options);
	},

	get: function(options){
		if (options || !this.retrieve('reveal')){
			if (options || !this.retrieve('reveal:options')) this.set('reveal', options);
			this.store('reveal', new Fx.Reveal(this, this.retrieve('reveal:options')));
		}
		return this.retrieve('reveal');
	}

};

Element.Properties.dissolve = Element.Properties.reveal;

Element.implement({

	reveal: function(options){
		this.get('reveal', options).reveal();
		return this;
	},

	dissolve: function(options){
		this.get('reveal', options).dissolve();
		return this;
	},

	nix: function(){
		var params = Array.link(arguments, {destroy: Boolean.type, options: Object.type});
		this.get('reveal', params.options).dissolve().chain(function(){
			this[params.destroy ? 'destroy' : 'dispose']();
		}.bind(this));
		return this;
	},

	wink: function(){
		var params = Array.link(arguments, {duration: Number.type, options: Object.type});
		var reveal = this.get('reveal', params.options);
		reveal.reveal().chain(function(){
			(function(){
				reveal.dissolve();
			}).delay(params.duration || 2000);
		});
	}


});

/*
---

script: Fx.Scroll.js

description: Effect to smoothly scroll any element, including the window.

license: MIT-style license

authors:
- Valerio Proietti

requires:
- core:1.2.4/Fx
- core:1.2.4/Element.Event
- core:1.2.4/Element.Dimensions
- /MooTools.More

provides: [Fx.Scroll]

...
*/

Fx.Scroll = new Class({

	Extends: Fx,

	options: {
		offset: {x: 0, y: 0},
		wheelStops: true
	},

	initialize: function(element, options){
		this.element = this.subject = document.id(element);
		this.parent(options);
		var cancel = this.cancel.bind(this, false);

		if ($type(this.element) != 'element') this.element = document.id(this.element.getDocument().body);

		var stopper = this.element;

		if (this.options.wheelStops){
			this.addEvent('start', function(){
				stopper.addEvent('mousewheel', cancel);
			}, true);
			this.addEvent('complete', function(){
				stopper.removeEvent('mousewheel', cancel);
			}, true);
		}
	},

	set: function(){
		var now = Array.flatten(arguments);
		if (Browser.Engine.gecko) now = [Math.round(now[0]), Math.round(now[1])];
		this.element.scrollTo(now[0], now[1]);
	},

	compute: function(from, to, delta){
		return [0, 1].map(function(i){
			return Fx.compute(from[i], to[i], delta);
		});
	},

	start: function(x, y){
		if (!this.check(x, y)) return this;
		var scrollSize = this.element.getScrollSize(),
			scroll = this.element.getScroll(), 
			values = {x: x, y: y};
		for (var z in values){
			var max = scrollSize[z];
			if ($chk(values[z])) values[z] = ($type(values[z]) == 'number') ? values[z] : max;
			else values[z] = scroll[z];
			values[z] += this.options.offset[z];
		}
		return this.parent([scroll.x, scroll.y], [values.x, values.y]);
	},

	toTop: function(){
		return this.start(false, 0);
	},

	toLeft: function(){
		return this.start(0, false);
	},

	toRight: function(){
		return this.start('right', false);
	},

	toBottom: function(){
		return this.start(false, 'bottom');
	},

	toElement: function(el){
		var position = document.id(el).getPosition(this.element);
		return this.start(position.x, position.y);
	},

	scrollIntoView: function(el, axes, offset){
		axes = axes ? $splat(axes) : ['x','y'];
		var to = {};
		el = document.id(el);
		var pos = el.getPosition(this.element);
		var size = el.getSize();
		var scroll = this.element.getScroll();
		var containerSize = this.element.getSize();
		var edge = {
			x: pos.x + size.x,
			y: pos.y + size.y
		};
		['x','y'].each(function(axis) {
			if (axes.contains(axis)) {
				if (edge[axis] > scroll[axis] + containerSize[axis]) to[axis] = edge[axis] - containerSize[axis];
				if (pos[axis] < scroll[axis]) to[axis] = pos[axis];
			}
			if (to[axis] == null) to[axis] = scroll[axis];
			if (offset && offset[axis]) to[axis] = to[axis] + offset[axis];
		}, this);
		if (to.x != scroll.x || to.y != scroll.y) this.start(to.x, to.y);
		return this;
	},

	scrollToCenter: function(el, axes, offset){
		axes = axes ? $splat(axes) : ['x', 'y'];
		el = $(el);
		var to = {},
			pos = el.getPosition(this.element),
			size = el.getSize(),
			scroll = this.element.getScroll(),
			containerSize = this.element.getSize(),
			edge = {
				x: pos.x + size.x,
				y: pos.y + size.y
			};

		['x','y'].each(function(axis){
			if(axes.contains(axis)){
				to[axis] = pos[axis] - (containerSize[axis] - size[axis])/2;
			}
			if(to[axis] == null) to[axis] = scroll[axis];
			if(offset && offset[axis]) to[axis] = to[axis] + offset[axis];
		}, this);
		if (to.x != scroll.x || to.y != scroll.y) this.start(to.x, to.y);
		return this;
	}

});


/*
---

script: Fx.Slide.js

description: Effect to slide an element in and out of view.

license: MIT-style license

authors:
- Valerio Proietti

requires:
- core:1.2.4/Fx Element.Style
- /MooTools.More

provides: [Fx.Slide]

...
*/

Fx.Slide = new Class({

	Extends: Fx,

	options: {
		mode: 'vertical',
		hideOverflow: true
	},

	initialize: function(element, options){
		this.addEvent('complete', function(){
			this.open = (this.wrapper['offset' + this.layout.capitalize()] != 0);
			if (this.open && Browser.Engine.webkit419) this.element.dispose().inject(this.wrapper);
		}, true);
		this.element = this.subject = document.id(element);
		this.parent(options);
		var wrapper = this.element.retrieve('wrapper');
		var styles = this.element.getStyles('margin', 'position', 'overflow');
		if (this.options.hideOverflow) styles = $extend(styles, {overflow: 'hidden'});
		this.wrapper = wrapper || new Element('div', {
			styles: styles
		}).wraps(this.element);
		this.element.store('wrapper', this.wrapper).setStyle('margin', 0);
		this.now = [];
		this.open = true;
	},

	vertical: function(){
		this.margin = 'margin-top';
		this.layout = 'height';
		this.offset = this.element.offsetHeight;
	},

	horizontal: function(){
		this.margin = 'margin-left';
		this.layout = 'width';
		this.offset = this.element.offsetWidth;
	},

	set: function(now){
		this.element.setStyle(this.margin, now[0]);
		this.wrapper.setStyle(this.layout, now[1]);
		return this;
	},

	compute: function(from, to, delta){
		return [0, 1].map(function(i){
			return Fx.compute(from[i], to[i], delta);
		});
	},

	start: function(how, mode){
		if (!this.check(how, mode)) return this;
		this[mode || this.options.mode]();
		var margin = this.element.getStyle(this.margin).toInt();
		var layout = this.wrapper.getStyle(this.layout).toInt();
		var caseIn = [[margin, layout], [0, this.offset]];
		var caseOut = [[margin, layout], [-this.offset, 0]];
		var start;
		switch (how){
			case 'in': start = caseIn; break;
			case 'out': start = caseOut; break;
			case 'toggle': start = (layout == 0) ? caseIn : caseOut;
		}
		return this.parent(start[0], start[1]);
	},

	slideIn: function(mode){
		return this.start('in', mode);
	},

	slideOut: function(mode){
		return this.start('out', mode);
	},

	hide: function(mode){
		this[mode || this.options.mode]();
		this.open = false;
		return this.set([-this.offset, 0]);
	},

	show: function(mode){
		this[mode || this.options.mode]();
		this.open = true;
		return this.set([0, this.offset]);
	},

	toggle: function(mode){
		return this.start('toggle', mode);
	}

});

Element.Properties.slide = {

	set: function(options){
		var slide = this.retrieve('slide');
		if (slide) slide.cancel();
		return this.eliminate('slide').store('slide:options', $extend({link: 'cancel'}, options));
	},

	get: function(options){
		if (options || !this.retrieve('slide')){
			if (options || !this.retrieve('slide:options')) this.set('slide', options);
			this.store('slide', new Fx.Slide(this, this.retrieve('slide:options')));
		}
		return this.retrieve('slide');
	}

};

Element.implement({

	slide: function(how, mode){
		how = how || 'toggle';
		var slide = this.get('slide'), toggle;
		switch (how){
			case 'hide': slide.hide(mode); break;
			case 'show': slide.show(mode); break;
			case 'toggle':
				var flag = this.retrieve('slide:flag', slide.open);
				slide[flag ? 'slideOut' : 'slideIn'](mode);
				this.store('slide:flag', !flag);
				toggle = true;
			break;
			default: slide.start(how, mode);
		}
		if (!toggle) this.eliminate('slide:flag');
		return this;
	}

});


/*
---

script: Fx.SmoothScroll.js

description: Class for creating a smooth scrolling effect to all internal links on the page.

license: MIT-style license

authors:
- Valerio Proietti

requires:
- core:1.2.4/Selectors
- /Fx.Scroll

provides: [Fx.SmoothScroll]

...
*/

var SmoothScroll = Fx.SmoothScroll = new Class({

	Extends: Fx.Scroll,

	initialize: function(options, context){
		context = context || document;
		this.doc = context.getDocument();
		var win = context.getWindow();
		this.parent(this.doc, options);
		this.links = $$(this.options.links || this.doc.links);
		var location = win.location.href.match(/^[^#]*/)[0] + '#';
		this.links.each(function(link){
			if (link.href.indexOf(location) != 0) {return;}
			var anchor = link.href.substr(location.length);
			if (anchor) this.useLink(link, anchor);
		}, this);
		if (!Browser.Engine.webkit419) {
			this.addEvent('complete', function(){
				win.location.hash = this.anchor;
			}, true);
		}
	},

	useLink: function(link, anchor){
		var el;
		link.addEvent('click', function(event){
			if (el !== false && !el) el = document.id(anchor) || this.doc.getElement('a[name=' + anchor + ']');
			if (el) {
				event.preventDefault();
				this.anchor = anchor;
				this.toElement(el).chain(function(){
					this.fireEvent('scrolledTo', [link, el]);
				}.bind(this));
				link.blur();
			}
		}.bind(this));
	}
});

/*
---

script: Fx.Sort.js

description: Defines Fx.Sort, a class that reorders lists with a transition.

license: MIT-style license

authors:
- Aaron Newton

requires:
- core:1.2.4/Element.Dimensions
- /Fx.Elements
- /Element.Measure

provides: [Fx.Sort]

...
*/

Fx.Sort = new Class({

	Extends: Fx.Elements,

	options: {
		mode: 'vertical'
	},

	initialize: function(elements, options){
		this.parent(elements, options);
		this.elements.each(function(el){
			if (el.getStyle('position') == 'static') el.setStyle('position', 'relative');
		});
		this.setDefaultOrder();
	},

	setDefaultOrder: function(){
		this.currentOrder = this.elements.map(function(el, index){
			return index;
		});
	},

	sort: function(newOrder){
		if ($type(newOrder) != 'array') return false;
		var top = 0,
			left = 0,
			next = {},
			zero = {},
			vert = this.options.mode == 'vertical';
		var current = this.elements.map(function(el, index){
			var size = el.getComputedSize({styles: ['border', 'padding', 'margin']});
			var val;
			if (vert){
				val = {
					top: top,
					margin: size['margin-top'],
					height: size.totalHeight
				};
				top += val.height - size['margin-top'];
			} else {
				val = {
					left: left,
					margin: size['margin-left'],
					width: size.totalWidth
				};
				left += val.width;
			}
			var plain = vert ? 'top' : 'left';
			zero[index] = {};
			var start = el.getStyle(plain).toInt();
			zero[index][plain] = start || 0;
			return val;
		}, this);
		this.set(zero);
		newOrder = newOrder.map(function(i){ return i.toInt(); });
		if (newOrder.length != this.elements.length){
			this.currentOrder.each(function(index){
				if (!newOrder.contains(index)) newOrder.push(index);
			});
			if (newOrder.length > this.elements.length)
				newOrder.splice(this.elements.length-1, newOrder.length - this.elements.length);
		}
		var margin = top = left = 0;
		newOrder.each(function(item, index){
			var newPos = {};
			if (vert){
				newPos.top = top - current[item].top - margin;
				top += current[item].height;
			} else {
				newPos.left = left - current[item].left;
				left += current[item].width;
			}
			margin = margin + current[item].margin;
			next[item]=newPos;
		}, this);
		var mapped = {};
		$A(newOrder).sort().each(function(index){
			mapped[index] = next[index];
		});
		this.start(mapped);
		this.currentOrder = newOrder;
		return this;
	},

	rearrangeDOM: function(newOrder){
		newOrder = newOrder || this.currentOrder;
		var parent = this.elements[0].getParent();
		var rearranged = [];
		this.elements.setStyle('opacity', 0);
		//move each element and store the new default order
		newOrder.each(function(index){
			rearranged.push(this.elements[index].inject(parent).setStyles({
				top: 0,
				left: 0
			}));
		}, this);
		this.elements.setStyle('opacity', 1);
		this.elements = $$(rearranged);
		this.setDefaultOrder();
		return this;
	},

	getDefaultOrder: function(){
		return this.elements.map(function(el, index){
			return index;
		});
	},

	forward: function(){
		return this.sort(this.getDefaultOrder());
	},

	backward: function(){
		return this.sort(this.getDefaultOrder().reverse());
	},

	reverse: function(){
		return this.sort(this.currentOrder.reverse());
	},

	sortByElements: function(elements){
		return this.sort(elements.map(function(el){
			return this.elements.indexOf(el);
		}, this));
	},

	swap: function(one, two){
		if ($type(one) == 'element') one = this.elements.indexOf(one);
		if ($type(two) == 'element') two = this.elements.indexOf(two);
		
		var newOrder = $A(this.currentOrder);
		newOrder[this.currentOrder.indexOf(one)] = two;
		newOrder[this.currentOrder.indexOf(two)] = one;
		return this.sort(newOrder);
	}

});

/*
---

script: Drag.js

description: The base Drag Class. Can be used to drag and resize Elements using mouse events.

license: MIT-style license

authors:
- Valerio Proietti
- Tom Occhinno
- Jan Kassens

requires:
- core:1.2.4/Events
- core:1.2.4/Options
- core:1.2.4/Element.Event
- core:1.2.4/Element.Style
- /MooTools.More

provides: [Drag]

*/

var Drag = new Class({

	Implements: [Events, Options],

	options: {/*
		onBeforeStart: $empty(thisElement),
		onStart: $empty(thisElement, event),
		onSnap: $empty(thisElement)
		onDrag: $empty(thisElement, event),
		onCancel: $empty(thisElement),
		onComplete: $empty(thisElement, event),*/
		snap: 6,
		unit: 'px',
		grid: false,
		style: true,
		limit: false,
		handle: false,
		invert: false,
		preventDefault: false,
		stopPropagation: false,
		modifiers: {x: 'left', y: 'top'}
	},

	initialize: function(){
		var params = Array.link(arguments, {'options': Object.type, 'element': $defined});
		this.element = document.id(params.element);
		this.document = this.element.getDocument();
		this.setOptions(params.options || {});
		var htype = $type(this.options.handle);
		this.handles = ((htype == 'array' || htype == 'collection') ? $$(this.options.handle) : document.id(this.options.handle)) || this.element;
		this.mouse = {'now': {}, 'pos': {}};
		this.value = {'start': {}, 'now': {}};

		this.selection = (Browser.Engine.trident) ? 'selectstart' : 'mousedown';

		this.bound = {
			start: this.start.bind(this),
			check: this.check.bind(this),
			drag: this.drag.bind(this),
			stop: this.stop.bind(this),
			cancel: this.cancel.bind(this),
			eventStop: $lambda(false)
		};
		this.attach();
	},

	attach: function(){
		this.handles.addEvent('mousedown', this.bound.start);
		return this;
	},

	detach: function(){
		this.handles.removeEvent('mousedown', this.bound.start);
		return this;
	},

	start: function(event){
		if (event.rightClick) return;
		if (this.options.preventDefault) event.preventDefault();
		if (this.options.stopPropagation) event.stopPropagation();
		this.mouse.start = event.page;
		this.fireEvent('beforeStart', this.element);
		var limit = this.options.limit;
		this.limit = {x: [], y: []};
		for (var z in this.options.modifiers){
			if (!this.options.modifiers[z]) continue;
			if (this.options.style) this.value.now[z] = this.element.getStyle(this.options.modifiers[z]).toInt();
			else this.value.now[z] = this.element[this.options.modifiers[z]];
			if (this.options.invert) this.value.now[z] *= -1;
			this.mouse.pos[z] = event.page[z] - this.value.now[z];
			if (limit && limit[z]){
				for (var i = 2; i--; i){
					if ($chk(limit[z][i])) this.limit[z][i] = $lambda(limit[z][i])();
				}
			}
		}
		if ($type(this.options.grid) == 'number') this.options.grid = {x: this.options.grid, y: this.options.grid};
		this.document.addEvents({mousemove: this.bound.check, mouseup: this.bound.cancel});
		this.document.addEvent(this.selection, this.bound.eventStop);
	},

	check: function(event){
		if (this.options.preventDefault) event.preventDefault();
		var distance = Math.round(Math.sqrt(Math.pow(event.page.x - this.mouse.start.x, 2) + Math.pow(event.page.y - this.mouse.start.y, 2)));
		if (distance > this.options.snap){
			this.cancel();
			this.document.addEvents({
				mousemove: this.bound.drag,
				mouseup: this.bound.stop
			});
			this.fireEvent('start', [this.element, event]).fireEvent('snap', this.element);
		}
	},

	drag: function(event){
		if (this.options.preventDefault) event.preventDefault();
		this.mouse.now = event.page;
		for (var z in this.options.modifiers){
			if (!this.options.modifiers[z]) continue;
			this.value.now[z] = this.mouse.now[z] - this.mouse.pos[z];
			if (this.options.invert) this.value.now[z] *= -1;
			if (this.options.limit && this.limit[z]){
				if ($chk(this.limit[z][1]) && (this.value.now[z] > this.limit[z][1])){
					this.value.now[z] = this.limit[z][1];
				} else if ($chk(this.limit[z][0]) && (this.value.now[z] < this.limit[z][0])){
					this.value.now[z] = this.limit[z][0];
				}
			}
			if (this.options.grid[z]) this.value.now[z] -= ((this.value.now[z] - (this.limit[z][0]||0)) % this.options.grid[z]);
			if (this.options.style) {
				this.element.setStyle(this.options.modifiers[z], this.value.now[z] + this.options.unit);
			} else {
				this.element[this.options.modifiers[z]] = this.value.now[z];
			}
		}
		this.fireEvent('drag', [this.element, event]);
	},

	cancel: function(event){
		this.document.removeEvent('mousemove', this.bound.check);
		this.document.removeEvent('mouseup', this.bound.cancel);
		if (event){
			this.document.removeEvent(this.selection, this.bound.eventStop);
			this.fireEvent('cancel', this.element);
		}
	},

	stop: function(event){
		this.document.removeEvent(this.selection, this.bound.eventStop);
		this.document.removeEvent('mousemove', this.bound.drag);
		this.document.removeEvent('mouseup', this.bound.stop);
		if (event) this.fireEvent('complete', [this.element, event]);
	}

});

Element.implement({

	makeResizable: function(options){
		var drag = new Drag(this, $merge({modifiers: {x: 'width', y: 'height'}}, options));
		this.store('resizer', drag);
		return drag.addEvent('drag', function(){
			this.fireEvent('resize', drag);
		}.bind(this));
	}

});


/*
---

script: Drag.Move.js

description: A Drag extension that provides support for the constraining of draggables to containers and droppables.

license: MIT-style license

authors:
- Valerio Proietti
- Tom Occhinno
- Jan Kassens
- Aaron Newton
- Scott Kyle

requires:
- core:1.2.4/Element.Dimensions
- /Drag

provides: [Drag.Move]

...
*/

Drag.Move = new Class({

	Extends: Drag,

	options: {/*
		onEnter: $empty(thisElement, overed),
		onLeave: $empty(thisElement, overed),
		onDrop: $empty(thisElement, overed, event),*/
		droppables: [],
		container: false,
		precalculate: false,
		includeMargins: true,
		checkDroppables: true
	},

	initialize: function(element, options){
		this.parent(element, options);
		element = this.element;
		
		this.droppables = $$(this.options.droppables);
		this.container = document.id(this.options.container);
		
		if (this.container && $type(this.container) != 'element')
			this.container = document.id(this.container.getDocument().body);
		
		var styles = element.getStyles('left', 'right', 'position');
		if (styles.left == 'auto' || styles.top == 'auto')
			element.setPosition(element.getPosition(element.getOffsetParent()));
		
		if (styles.position == 'static')
			element.setStyle('position', 'absolute');

		this.addEvent('start', this.checkDroppables, true);

		this.overed = null;
	},

	start: function(event){
		if (this.container) this.options.limit = this.calculateLimit();
		
		if (this.options.precalculate){
			this.positions = this.droppables.map(function(el){
				return el.getCoordinates();
			});
		}
		
		this.parent(event);
	},
	
	calculateLimit: function(){
		var offsetParent = this.element.getOffsetParent(),
			containerCoordinates = this.container.getCoordinates(offsetParent),
			containerBorder = {},
			elementMargin = {},
			elementBorder = {},
			containerMargin = {},
			offsetParentPadding = {};

		['top', 'right', 'bottom', 'left'].each(function(pad){
			containerBorder[pad] = this.container.getStyle('border-' + pad).toInt();
			elementBorder[pad] = this.element.getStyle('border-' + pad).toInt();
			elementMargin[pad] = this.element.getStyle('margin-' + pad).toInt();
			containerMargin[pad] = this.container.getStyle('margin-' + pad).toInt();
			offsetParentPadding[pad] = offsetParent.getStyle('padding-' + pad).toInt();
		}, this);

		var width = this.element.offsetWidth + elementMargin.left + elementMargin.right,
			height = this.element.offsetHeight + elementMargin.top + elementMargin.bottom,
			left = 0,
			top = 0,
			right = containerCoordinates.right - containerBorder.right - width,
			bottom = containerCoordinates.bottom - containerBorder.bottom - height;

		if (this.options.includeMargins){
			left += elementMargin.left;
			top += elementMargin.top;
		} else {
			right += elementMargin.right;
			bottom += elementMargin.bottom;
		}
		
		if (this.element.getStyle('position') == 'relative'){
			var coords = this.element.getCoordinates(offsetParent);
			coords.left -= this.element.getStyle('left').toInt();
			coords.top -= this.element.getStyle('top').toInt();
			
			left += containerBorder.left - coords.left;
			top += containerBorder.top - coords.top;
			right += elementMargin.left - coords.left;
			bottom += elementMargin.top - coords.top;
			
			if (this.container != offsetParent){
				left += containerMargin.left + offsetParentPadding.left;
				top += (Browser.Engine.trident4 ? 0 : containerMargin.top) + offsetParentPadding.top;
			}
		} else {
			left -= elementMargin.left;
			top -= elementMargin.top;
			
			if (this.container == offsetParent){
				right -= containerBorder.left;
				bottom -= containerBorder.top;
			} else {
				left += containerCoordinates.left + containerBorder.left;
				top += containerCoordinates.top + containerBorder.top;
			}
		}
		
		return {
			x: [left, right],
			y: [top, bottom]
		};
	},

	checkAgainst: function(el, i){
		el = (this.positions) ? this.positions[i] : el.getCoordinates();
		var now = this.mouse.now;
		return (now.x > el.left && now.x < el.right && now.y < el.bottom && now.y > el.top);
	},

	checkDroppables: function(){
		var overed = this.droppables.filter(this.checkAgainst, this).getLast();
		if (this.overed != overed){
			if (this.overed) this.fireEvent('leave', [this.element, this.overed]);
			if (overed) this.fireEvent('enter', [this.element, overed]);
			this.overed = overed;
		}
	},

	drag: function(event){
		this.parent(event);
		if (this.options.checkDroppables && this.droppables.length) this.checkDroppables();
	},

	stop: function(event){
		this.checkDroppables();
		this.fireEvent('drop', [this.element, this.overed, event]);
		this.overed = null;
		return this.parent(event);
	}

});

Element.implement({

	makeDraggable: function(options){
		var drag = new Drag.Move(this, options);
		this.store('dragger', drag);
		return drag;
	}

});


/*
---

script: Slider.js

description: Class for creating horizontal and vertical slider controls.

license: MIT-style license

authors:
- Valerio Proietti

requires:
- core:1.2.4/Element.Dimensions
- /Class.Binds
- /Drag
- /Element.Dimensions
- /Element.Measure

provides: [Slider]

...
*/

var Slider = new Class({

	Implements: [Events, Options],

	Binds: ['clickedElement', 'draggedKnob', 'scrolledElement'],

	options: {/*
		onTick: $empty(intPosition),
		onChange: $empty(intStep),
		onComplete: $empty(strStep),*/
		onTick: function(position){
			if (this.options.snap) position = this.toPosition(this.step);
			this.knob.setStyle(this.property, position);
		},
		initialStep: 0,
		snap: false,
		offset: 0,
		range: false,
		wheel: false,
		steps: 100,
		mode: 'horizontal'
	},

	initialize: function(element, knob, options){
		this.setOptions(options);
		this.element = document.id(element);
		this.knob = document.id(knob);
		this.previousChange = this.previousEnd = this.step = -1;
		var offset, limit = {}, modifiers = {'x': false, 'y': false};
		switch (this.options.mode){
			case 'vertical':
				this.axis = 'y';
				this.property = 'top';
				offset = 'offsetHeight';
				break;
			case 'horizontal':
				this.axis = 'x';
				this.property = 'left';
				offset = 'offsetWidth';
		}
		
		this.full = this.element.measure(function(){ 
			this.half = this.knob[offset] / 2; 
			return this.element[offset] - this.knob[offset] + (this.options.offset * 2); 
		}.bind(this));
		
		this.min = $chk(this.options.range[0]) ? this.options.range[0] : 0;
		this.max = $chk(this.options.range[1]) ? this.options.range[1] : this.options.steps;
		this.range = this.max - this.min;
		this.steps = this.options.steps || this.full;
		this.stepSize = Math.abs(this.range) / this.steps;
		this.stepWidth = this.stepSize * this.full / Math.abs(this.range) ;

		this.knob.setStyle('position', 'relative').setStyle(this.property, this.options.initialStep ? this.toPosition(this.options.initialStep) : - this.options.offset);
		modifiers[this.axis] = this.property;
		limit[this.axis] = [- this.options.offset, this.full - this.options.offset];

		var dragOptions = {
			snap: 0,
			limit: limit,
			modifiers: modifiers,
			onDrag: this.draggedKnob,
			onStart: this.draggedKnob,
			onBeforeStart: (function(){
				this.isDragging = true;
			}).bind(this),
			onCancel: function() {
				this.isDragging = false;
			}.bind(this),
			onComplete: function(){
				this.isDragging = false;
				this.draggedKnob();
				this.end();
			}.bind(this)
		};
		if (this.options.snap){
			dragOptions.grid = Math.ceil(this.stepWidth);
			dragOptions.limit[this.axis][1] = this.full;
		}

		this.drag = new Drag(this.knob, dragOptions);
		this.attach();
	},

	attach: function(){
		this.element.addEvent('mousedown', this.clickedElement);
		if (this.options.wheel) this.element.addEvent('mousewheel', this.scrolledElement);
		this.drag.attach();
		return this;
	},

	detach: function(){
		this.element.removeEvent('mousedown', this.clickedElement);
		this.element.removeEvent('mousewheel', this.scrolledElement);
		this.drag.detach();
		return this;
	},

	set: function(step){
		if (!((this.range > 0) ^ (step < this.min))) step = this.min;
		if (!((this.range > 0) ^ (step > this.max))) step = this.max;

		this.step = Math.round(step);
		this.checkStep();
		this.fireEvent('tick', this.toPosition(this.step));
		this.end();
		return this;
	},

	clickedElement: function(event){
		if (this.isDragging || event.target == this.knob) return;

		var dir = this.range < 0 ? -1 : 1;
		var position = event.page[this.axis] - this.element.getPosition()[this.axis] - this.half;
		position = position.limit(-this.options.offset, this.full -this.options.offset);

		this.step = Math.round(this.min + dir * this.toStep(position));
		this.checkStep();
		this.fireEvent('tick', position);
		this.end();
	},

	scrolledElement: function(event){
		var mode = (this.options.mode == 'horizontal') ? (event.wheel < 0) : (event.wheel > 0);
		this.set(mode ? this.step - this.stepSize : this.step + this.stepSize);
		event.stop();
	},

	draggedKnob: function(){
		var dir = this.range < 0 ? -1 : 1;
		var position = this.drag.value.now[this.axis];
		position = position.limit(-this.options.offset, this.full -this.options.offset);
		this.step = Math.round(this.min + dir * this.toStep(position));
		this.checkStep();
	},

	checkStep: function(){
		if (this.previousChange != this.step){
			this.previousChange = this.step;
			this.fireEvent('change', this.step);
		}
	},

	end: function(){
		if (this.previousEnd !== this.step){
			this.previousEnd = this.step;
			this.fireEvent('complete', this.step + '');
		}
	},

	toStep: function(position){
		var step = (position + this.options.offset) * this.stepSize / this.full * this.steps;
		return this.options.steps ? Math.round(step -= step % this.stepSize) : step;
	},

	toPosition: function(step){
		return (this.full * Math.abs(this.min - step)) / (this.steps * this.stepSize) - this.options.offset;
	}

});

/*
---

script: Sortables.js

description: Class for creating a drag and drop sorting interface for lists of items.

license: MIT-style license

authors:
- Tom Occhino

requires:
- /Drag.Move

provides: [Slider]

...
*/

var Sortables = new Class({

	Implements: [Events, Options],

	options: {/*
		onSort: $empty(element, clone),
		onStart: $empty(element, clone),
		onComplete: $empty(element),*/
		snap: 4,
		opacity: 1,
		clone: false,
		revert: false,
		handle: false,
		constrain: false
	},

	initialize: function(lists, options){
		this.setOptions(options);
		this.elements = [];
		this.lists = [];
		this.idle = true;

		this.addLists($$(document.id(lists) || lists));
		if (!this.options.clone) this.options.revert = false;
		if (this.options.revert) this.effect = new Fx.Morph(null, $merge({duration: 250, link: 'cancel'}, this.options.revert));
	},

	attach: function(){
		this.addLists(this.lists);
		return this;
	},

	detach: function(){
		this.lists = this.removeLists(this.lists);
		return this;
	},

	addItems: function(){
		Array.flatten(arguments).each(function(element){
			this.elements.push(element);
			var start = element.retrieve('sortables:start', this.start.bindWithEvent(this, element));
			(this.options.handle ? element.getElement(this.options.handle) || element : element).addEvent('mousedown', start);
		}, this);
		return this;
	},

	addLists: function(){
		Array.flatten(arguments).each(function(list){
			this.lists.push(list);
			this.addItems(list.getChildren());
		}, this);
		return this;
	},

	removeItems: function(){
		return $$(Array.flatten(arguments).map(function(element){
			this.elements.erase(element);
			var start = element.retrieve('sortables:start');
			(this.options.handle ? element.getElement(this.options.handle) || element : element).removeEvent('mousedown', start);
			
			return element;
		}, this));
	},

	removeLists: function(){
		return $$(Array.flatten(arguments).map(function(list){
			this.lists.erase(list);
			this.removeItems(list.getChildren());
			
			return list;
		}, this));
	},

	getClone: function(event, element){
		if (!this.options.clone) return new Element('div').inject(document.body);
		if ($type(this.options.clone) == 'function') return this.options.clone.call(this, event, element, this.list);
		return element.clone(true).setStyles({
			margin: '0px',
			position: 'absolute',
			visibility: 'hidden',
			'width': element.getStyle('width')
		}).inject(this.list).setPosition(element.getPosition(element.getOffsetParent()));
	},

	getDroppables: function(){
		var droppables = this.list.getChildren();
		if (!this.options.constrain) droppables = this.lists.concat(droppables).erase(this.list);
		return droppables.erase(this.clone).erase(this.element);
	},

	insert: function(dragging, element){
		var where = 'inside';
		if (this.lists.contains(element)){
			this.list = element;
			this.drag.droppables = this.getDroppables();
		} else {
			where = this.element.getAllPrevious().contains(element) ? 'before' : 'after';
		}
		this.element.inject(element, where);
		this.fireEvent('sort', [this.element, this.clone]);
	},

	start: function(event, element){
		if (!this.idle) return;
		this.idle = false;
		this.element = element;
		this.opacity = element.get('opacity');
		this.list = element.getParent();
		this.clone = this.getClone(event, element);

		this.drag = new Drag.Move(this.clone, {
			snap: this.options.snap,
			container: this.options.constrain && this.element.getParent(),
			droppables: this.getDroppables(),
			onSnap: function(){
				event.stop();
				this.clone.setStyle('visibility', 'visible');
				this.element.set('opacity', this.options.opacity || 0);
				this.fireEvent('start', [this.element, this.clone]);
			}.bind(this),
			onEnter: this.insert.bind(this),
			onCancel: this.reset.bind(this),
			onComplete: this.end.bind(this)
		});

		this.clone.inject(this.element, 'before');
		this.drag.start(event);
	},

	end: function(){
		this.drag.detach();
		this.element.set('opacity', this.opacity);
		if (this.effect){
			var dim = this.element.getStyles('width', 'height');
			var pos = this.clone.computePosition(this.element.getPosition(this.clone.offsetParent));
			this.effect.element = this.clone;
			this.effect.start({
				top: pos.top,
				left: pos.left,
				width: dim.width,
				height: dim.height,
				opacity: 0.25
			}).chain(this.reset.bind(this));
		} else {
			this.reset();
		}
	},

	reset: function(){
		this.idle = true;
		this.clone.destroy();
		this.fireEvent('complete', this.element);
	},

	serialize: function(){
		var params = Array.link(arguments, {modifier: Function.type, index: $defined});
		var serial = this.lists.map(function(list){
			return list.getChildren().map(params.modifier || function(element){
				return element.get('id');
			}, this);
		}, this);

		var index = params.index;
		if (this.lists.length == 1) index = 0;
		return $chk(index) && index >= 0 && index < this.lists.length ? serial[index] : serial;
	}

});


/*
---

script: Request.JSONP.js

description: Defines Request.JSONP, a class for cross domain javascript via script injection.

license: MIT-style license

authors:
- Aaron Newton
- Guillermo Rauch

requires:
- core:1.2.4/Element
- core:1.2.4/Request
- /Log

provides: [Request.JSONP]

...
*/

Request.JSONP = new Class({

	Implements: [Chain, Events, Options, Log],

	options: {/*
		onRetry: $empty(intRetries),
		onRequest: $empty(scriptElement),
		onComplete: $empty(data),
		onSuccess: $empty(data),
		onCancel: $empty(),
		log: false,
		*/
		url: '',
		data: {},
		retries: 0,
		timeout: 0,
		link: 'ignore',
		callbackKey: 'callback',
		injectScript: document.head
	},

	initialize: function(options){
		this.setOptions(options);
		if (this.options.log) this.enableLog();
		this.running = false;
		this.requests = 0;
		this.triesRemaining = [];
	},

	check: function(){
		if (!this.running) return true;
		switch (this.options.link){
			case 'cancel': this.cancel(); return true;
			case 'chain': this.chain(this.caller.bind(this, arguments)); return false;
		}
		return false;
	},

	send: function(options){
		if (!$chk(arguments[1]) && !this.check(options)) return this;

		var type = $type(options), 
				old = this.options, 
				index = $chk(arguments[1]) ? arguments[1] : this.requests++;
		if (type == 'string' || type == 'element') options = {data: options};

		options = $extend({data: old.data, url: old.url}, options);

		if (!$chk(this.triesRemaining[index])) this.triesRemaining[index] = this.options.retries;
		var remaining = this.triesRemaining[index];

		(function(){
			var script = this.getScript(options);
			this.log('JSONP retrieving script with url: ' + script.get('src'));
			this.fireEvent('request', script);
			this.running = true;

			(function(){
				if (remaining){
					this.triesRemaining[index] = remaining - 1;
					if (script){
						script.destroy();
						this.send(options, index).fireEvent('retry', this.triesRemaining[index]);
					}
				} else if(script && this.options.timeout){
					script.destroy();
					this.cancel().fireEvent('failure');
				}
			}).delay(this.options.timeout, this);
		}).delay(Browser.Engine.trident ? 50 : 0, this);
		return this;
	},

	cancel: function(){
		if (!this.running) return this;
		this.running = false;
		this.fireEvent('cancel');
		return this;
	},

	getScript: function(options){
		var index = Request.JSONP.counter,
				data;
		Request.JSONP.counter++;

		switch ($type(options.data)){
			case 'element': data = document.id(options.data).toQueryString(); break;
			case 'object': case 'hash': data = Hash.toQueryString(options.data);
		}

		var src = options.url + 
			 (options.url.test('\\?') ? '&' :'?') + 
			 (options.callbackKey || this.options.callbackKey) + 
			 '=Request.JSONP.request_map.request_'+ index + 
			 (data ? '&' + data : '');
		if (src.length > 2083) this.log('JSONP '+ src +' will fail in Internet Explorer, which enforces a 2083 bytes length limit on URIs');

		var script = new Element('script', {type: 'text/javascript', src: src});
		Request.JSONP.request_map['request_' + index] = function(data){ this.success(data, script); }.bind(this);
		return script.inject(this.options.injectScript);
	},

	success: function(data, script){
		if (script) script.destroy();
		this.running = false;
		this.log('JSONP successfully retrieved: ', data);
		this.fireEvent('complete', [data]).fireEvent('success', [data]).callChain();
	}

});

Request.JSONP.counter = 0;
Request.JSONP.request_map = {};

/*
---

script: Request.Queue.js

description: Controls several instances of Request and its variants to run only one request at a time.

license: MIT-style license

authors:
- Aaron Newton

requires:
- core:1.2.4/Element
- core:1.2.4/Request
- /Log

provides: [Request.Queue]

...
*/

Request.Queue = new Class({

	Implements: [Options, Events],

	Binds: ['attach', 'request', 'complete', 'cancel', 'success', 'failure', 'exception'],

	options: {/*
		onRequest: $empty(argsPassedToOnRequest),
		onSuccess: $empty(argsPassedToOnSuccess),
		onComplete: $empty(argsPassedToOnComplete),
		onCancel: $empty(argsPassedToOnCancel),
		onException: $empty(argsPassedToOnException),
		onFailure: $empty(argsPassedToOnFailure),
		onEnd: $empty,
		*/
		stopOnFailure: true,
		autoAdvance: true,
		concurrent: 1,
		requests: {}
	},

	initialize: function(options){
		if(options){
			var requests = options.requests;
			delete options.requests;	
		}
		this.setOptions(options);
		this.requests = new Hash;
		this.queue = [];
		this.reqBinders = {};
		
		if(requests) this.addRequests(requests);
	},

	addRequest: function(name, request){
		this.requests.set(name, request);
		this.attach(name, request);
		return this;
	},

	addRequests: function(obj){
		$each(obj, function(req, name){
			this.addRequest(name, req);
		}, this);
		return this;
	},

	getName: function(req){
		return this.requests.keyOf(req);
	},

	attach: function(name, req){
		if (req._groupSend) return this;
		['request', 'complete', 'cancel', 'success', 'failure', 'exception'].each(function(evt){
			if(!this.reqBinders[name]) this.reqBinders[name] = {};
			this.reqBinders[name][evt] = function(){
				this['on' + evt.capitalize()].apply(this, [name, req].extend(arguments));
			}.bind(this);
			req.addEvent(evt, this.reqBinders[name][evt]);
		}, this);
		req._groupSend = req.send;
		req.send = function(options){
			this.send(name, options);
			return req;
		}.bind(this);
		return this;
	},

	removeRequest: function(req){
		var name = $type(req) == 'object' ? this.getName(req) : req;
		if (!name && $type(name) != 'string') return this;
		req = this.requests.get(name);
		if (!req) return this;
		['request', 'complete', 'cancel', 'success', 'failure', 'exception'].each(function(evt){
			req.removeEvent(evt, this.reqBinders[name][evt]);
		}, this);
		req.send = req._groupSend;
		delete req._groupSend;
		return this;
	},

	getRunning: function(){
		return this.requests.filter(function(r){
			return r.running;
		});
	},

	isRunning: function(){
		return !!(this.getRunning().getKeys().length);
	},

	send: function(name, options){
		var q = function(){
			this.requests.get(name)._groupSend(options);
			this.queue.erase(q);
		}.bind(this);
		q.name = name;
		if (this.getRunning().getKeys().length >= this.options.concurrent || (this.error && this.options.stopOnFailure)) this.queue.push(q);
		else q();
		return this;
	},

	hasNext: function(name){
		return (!name) ? !!this.queue.length : !!this.queue.filter(function(q){ return q.name == name; }).length;
	},

	resume: function(){
		this.error = false;
		(this.options.concurrent - this.getRunning().getKeys().length).times(this.runNext, this);
		return this;
	},

	runNext: function(name){
		if (!this.queue.length) return this;
		if (!name){
			this.queue[0]();
		} else {
			var found;
			this.queue.each(function(q){
				if (!found && q.name == name){
					found = true;
					q();
				}
			});
		}
		return this;
	},

	runAll: function() {
		this.queue.each(function(q) {
			q();
		});
		return this;
	},

	clear: function(name){
		if (!name){
			this.queue.empty();
		} else {
			this.queue = this.queue.map(function(q){
				if (q.name != name) return q;
				else return false;
			}).filter(function(q){ return q; });
		}
		return this;
	},

	cancel: function(name){
		this.requests.get(name).cancel();
		return this;
	},

	onRequest: function(){
		this.fireEvent('request', arguments);
	},

	onComplete: function(){
		this.fireEvent('complete', arguments);
		if (!this.queue.length) this.fireEvent('end');
	},

	onCancel: function(){
		if (this.options.autoAdvance && !this.error) this.runNext();
		this.fireEvent('cancel', arguments);
	},

	onSuccess: function(){
		if (this.options.autoAdvance && !this.error) this.runNext();
		this.fireEvent('success', arguments);
	},

	onFailure: function(){
		this.error = true;
		if (!this.options.stopOnFailure && this.options.autoAdvance) this.runNext();
		this.fireEvent('failure', arguments);
	},

	onException: function(){
		this.error = true;
		if (!this.options.stopOnFailure && this.options.autoAdvance) this.runNext();
		this.fireEvent('exception', arguments);
	}

});


/*
---

script: Request.Periodical.js

description: Requests the same URL to pull data from a server but increases the intervals if no data is returned to reduce the load

license: MIT-style license

authors:
- Christoph Pojer

requires:
- core:1.2.4/Request
- /MooTools.More

provides: [Request.Periodical]

...
*/

Request.implement({

	options: {
		initialDelay: 5000,
		delay: 5000,
		limit: 60000
	},

	startTimer: function(data){
		var fn = function(){
			if (!this.running) this.send({data: data});
		};
		this.timer = fn.delay(this.options.initialDelay, this);
		this.lastDelay = this.options.initialDelay;
		this.completeCheck = function(response){
			$clear(this.timer);
			this.lastDelay = (response) ? this.options.delay : (this.lastDelay + this.options.delay).min(this.options.limit);
			this.timer = fn.delay(this.lastDelay, this);
		};
		return this.addEvent('complete', this.completeCheck);
	},

	stopTimer: function(){
		$clear(this.timer);
		return this.removeEvent('complete', this.completeCheck);
	}

});

/*
---

script: Assets.js

description: Provides methods to dynamically load JavaScript, CSS, and Image files into the document.

license: MIT-style license

authors:
- Valerio Proietti

requires:
- core:1.2.4/Element.Event
- /MooTools.More

provides: [Assets]

...
*/

var Asset = {

	javascript: function(source, properties){
		properties = $extend({
			onload: $empty,
			document: document,
			check: $lambda(true)
		}, properties);

		var script = new Element('script', {src: source, type: 'text/javascript'});

		var load = properties.onload.bind(script), 
			check = properties.check, 
			doc = properties.document;
		delete properties.onload;
		delete properties.check;
		delete properties.document;

		script.addEvents({
			load: load,
			readystatechange: function(){
				if (['loaded', 'complete'].contains(this.readyState)) load();
			}
		}).set(properties);

		if (Browser.Engine.webkit419) var checker = (function(){
			if (!$try(check)) return;
			$clear(checker);
			load();
		}).periodical(50);

		return script.inject(doc.head);
	},

	css: function(source, properties){
		return new Element('link', $merge({
			rel: 'stylesheet',
			media: 'screen',
			type: 'text/css',
			href: source
		}, properties)).inject(document.head);
	},

	image: function(source, properties){
		properties = $merge({
			onload: $empty,
			onabort: $empty,
			onerror: $empty
		}, properties);
		var image = new Image();
		var element = document.id(image) || new Element('img');
		['load', 'abort', 'error'].each(function(name){
			var type = 'on' + name;
			var event = properties[type];
			delete properties[type];
			image[type] = function(){
				if (!image) return;
				if (!element.parentNode){
					element.width = image.width;
					element.height = image.height;
				}
				image = image.onload = image.onabort = image.onerror = null;
				event.delay(1, element, element);
				element.fireEvent(name, element, 1);
			};
		});
		image.src = element.src = source;
		if (image && image.complete) image.onload.delay(1);
		return element.set(properties);
	},

	images: function(sources, options){
		options = $merge({
			onComplete: $empty,
			onProgress: $empty,
			onError: $empty,
			properties: {}
		}, options);
		sources = $splat(sources);
		var images = [];
		var counter = 0;
		return new Elements(sources.map(function(source){
			return Asset.image(source, $extend(options.properties, {
				onload: function(){
					options.onProgress.call(this, counter, sources.indexOf(source));
					counter++;
					if (counter == sources.length) options.onComplete();
				},
				onerror: function(){
					options.onError.call(this, counter, sources.indexOf(source));
					counter++;
					if (counter == sources.length) options.onComplete();
				}
			}));
		}));
	}

};

/*
---

script: Color.js

description: Class for creating and manipulating colors in JavaScript. Supports HSB -> RGB Conversions and vice versa.

license: MIT-style license

authors:
- Valerio Proietti

requires:
- core:1.2.4/Array
- core:1.2.4/String
- core:1.2.4/Number
- core:1.2.4/Hash
- core:1.2.4/Function
- core:1.2.4/$util

provides: [Color]

...
*/

var Color = new Native({

	initialize: function(color, type){
		if (arguments.length >= 3){
			type = 'rgb'; color = Array.slice(arguments, 0, 3);
		} else if (typeof color == 'string'){
			if (color.match(/rgb/)) color = color.rgbToHex().hexToRgb(true);
			else if (color.match(/hsb/)) color = color.hsbToRgb();
			else color = color.hexToRgb(true);
		}
		type = type || 'rgb';
		switch (type){
			case 'hsb':
				var old = color;
				color = color.hsbToRgb();
				color.hsb = old;
			break;
			case 'hex': color = color.hexToRgb(true); break;
		}
		color.rgb = color.slice(0, 3);
		color.hsb = color.hsb || color.rgbToHsb();
		color.hex = color.rgbToHex();
		return $extend(color, this);
	}

});

Color.implement({

	mix: function(){
		var colors = Array.slice(arguments);
		var alpha = ($type(colors.getLast()) == 'number') ? colors.pop() : 50;
		var rgb = this.slice();
		colors.each(function(color){
			color = new Color(color);
			for (var i = 0; i < 3; i++) rgb[i] = Math.round((rgb[i] / 100 * (100 - alpha)) + (color[i] / 100 * alpha));
		});
		return new Color(rgb, 'rgb');
	},

	invert: function(){
		return new Color(this.map(function(value){
			return 255 - value;
		}));
	},

	setHue: function(value){
		return new Color([value, this.hsb[1], this.hsb[2]], 'hsb');
	},

	setSaturation: function(percent){
		return new Color([this.hsb[0], percent, this.hsb[2]], 'hsb');
	},

	setBrightness: function(percent){
		return new Color([this.hsb[0], this.hsb[1], percent], 'hsb');
	}

});

var $RGB = function(r, g, b){
	return new Color([r, g, b], 'rgb');
};

var $HSB = function(h, s, b){
	return new Color([h, s, b], 'hsb');
};

var $HEX = function(hex){
	return new Color(hex, 'hex');
};

Array.implement({

	rgbToHsb: function(){
		var red = this[0],
				green = this[1],
				blue = this[2],
				hue = 0;
		var max = Math.max(red, green, blue),
				min = Math.min(red, green, blue);
		var delta = max - min;
		var brightness = max / 255,
				saturation = (max != 0) ? delta / max : 0;
		if(saturation != 0) {
			var rr = (max - red) / delta;
			var gr = (max - green) / delta;
			var br = (max - blue) / delta;
			if (red == max) hue = br - gr;
			else if (green == max) hue = 2 + rr - br;
			else hue = 4 + gr - rr;
			hue /= 6;
			if (hue < 0) hue++;
		}
		return [Math.round(hue * 360), Math.round(saturation * 100), Math.round(brightness * 100)];
	},

	hsbToRgb: function(){
		var br = Math.round(this[2] / 100 * 255);
		if (this[1] == 0){
			return [br, br, br];
		} else {
			var hue = this[0] % 360;
			var f = hue % 60;
			var p = Math.round((this[2] * (100 - this[1])) / 10000 * 255);
			var q = Math.round((this[2] * (6000 - this[1] * f)) / 600000 * 255);
			var t = Math.round((this[2] * (6000 - this[1] * (60 - f))) / 600000 * 255);
			switch (Math.floor(hue / 60)){
				case 0: return [br, t, p];
				case 1: return [q, br, p];
				case 2: return [p, br, t];
				case 3: return [p, q, br];
				case 4: return [t, p, br];
				case 5: return [br, p, q];
			}
		}
		return false;
	}

});

String.implement({

	rgbToHsb: function(){
		var rgb = this.match(/\d{1,3}/g);
		return (rgb) ? rgb.rgbToHsb() : null;
	},

	hsbToRgb: function(){
		var hsb = this.match(/\d{1,3}/g);
		return (hsb) ? hsb.hsbToRgb() : null;
	}

});


/*
---

script: Group.js

description: Class for monitoring collections of events

license: MIT-style license

authors:
- Valerio Proietti

requires:
- core:1.2.4/Events
- /MooTools.More

provides: [Group]

...
*/

var Group = new Class({

	initialize: function(){
		this.instances = Array.flatten(arguments);
		this.events = {};
		this.checker = {};
	},

	addEvent: function(type, fn){
		this.checker[type] = this.checker[type] || {};
		this.events[type] = this.events[type] || [];
		if (this.events[type].contains(fn)) return false;
		else this.events[type].push(fn);
		this.instances.each(function(instance, i){
			instance.addEvent(type, this.check.bind(this, [type, instance, i]));
		}, this);
		return this;
	},

	check: function(type, instance, i){
		this.checker[type][i] = true;
		var every = this.instances.every(function(current, j){
			return this.checker[type][j] || false;
		}, this);
		if (!every) return;
		this.checker[type] = {};
		this.events[type].each(function(event){
			event.call(this, this.instances, instance);
		}, this);
	}

});


/*
---

script: Hash.Cookie.js

description: Class for creating, reading, and deleting Cookies in JSON format.

license: MIT-style license

authors:
- Valerio Proietti
- Aaron Newton

requires:
- core:1.2.4/Cookie
- core:1.2.4/JSON
- /MooTools.More

provides: [Hash.Cookie]

...
*/

Hash.Cookie = new Class({

	Extends: Cookie,

	options: {
		autoSave: true
	},

	initialize: function(name, options){
		this.parent(name, options);
		this.load();
	},

	save: function(){
		var value = JSON.encode(this.hash);
		if (!value || value.length > 4096) return false; //cookie would be truncated!
		if (value == '{}') this.dispose();
		else this.write(value);
		return true;
	},

	load: function(){
		this.hash = new Hash(JSON.decode(this.read(), true));
		return this;
	}

});

Hash.each(Hash.prototype, function(method, name){
	if (typeof method == 'function') Hash.Cookie.implement(name, function(){
		var value = method.apply(this.hash, arguments);
		if (this.options.autoSave) this.save();
		return value;
	});
});

/*
---

script: IframeShim.js

description: Defines IframeShim, a class for obscuring select lists and flash objects in IE.

license: MIT-style license

authors:
- Aaron Newton

requires:
- core:1.2.4/Element.Event
- core:1.2.4/Element.Style
- core:1.2.4/Options Events
- /Element.Position
- /Class.Occlude

provides: [IframeShim]

...
*/

var IframeShim = new Class({

	Implements: [Options, Events, Class.Occlude],

	options: {
		className: 'iframeShim',
		src: 'javascript:false;document.write("");',
		display: false,
		zIndex: null,
		margin: 0,
		offset: {x: 0, y: 0},
		browsers: (Browser.Engine.trident4 || (Browser.Engine.gecko && !Browser.Engine.gecko19 && Browser.Platform.mac))
	},

	property: 'IframeShim',

	initialize: function(element, options){
		this.element = document.id(element);
		if (this.occlude()) return this.occluded;
		this.setOptions(options);
		this.makeShim();
		return this;
	},

	makeShim: function(){
		if(this.options.browsers){
			var zIndex = this.element.getStyle('zIndex').toInt();

			if (!zIndex){
				zIndex = 1;
				var pos = this.element.getStyle('position');
				if (pos == 'static' || !pos) this.element.setStyle('position', 'relative');
				this.element.setStyle('zIndex', zIndex);
			}
			zIndex = ($chk(this.options.zIndex) && zIndex > this.options.zIndex) ? this.options.zIndex : zIndex - 1;
			if (zIndex < 0) zIndex = 1;
			this.shim = new Element('iframe', {
				src: this.options.src,
				scrolling: 'no',
				frameborder: 0,
				styles: {
					zIndex: zIndex,
					position: 'absolute',
					border: 'none',
					filter: 'progid:DXImageTransform.Microsoft.Alpha(style=0,opacity=0)'
				},
				'class': this.options.className
			}).store('IframeShim', this);
			var inject = (function(){
				this.shim.inject(this.element, 'after');
				this[this.options.display ? 'show' : 'hide']();
				this.fireEvent('inject');
			}).bind(this);
			if (IframeShim.ready) window.addEvent('load', inject);
			else inject();
		} else {
			this.position = this.hide = this.show = this.dispose = $lambda(this);
		}
	},

	position: function(){
		if (!IframeShim.ready || !this.shim) return this;
		var size = this.element.measure(function(){ 
			return this.getSize(); 
		});
		if (this.options.margin != undefined){
			size.x = size.x - (this.options.margin * 2);
			size.y = size.y - (this.options.margin * 2);
			this.options.offset.x += this.options.margin;
			this.options.offset.y += this.options.margin;
		}
		this.shim.set({width: size.x, height: size.y}).position({
			relativeTo: this.element,
			offset: this.options.offset
		});
		return this;
	},

	hide: function(){
		if (this.shim) this.shim.setStyle('display', 'none');
		return this;
	},

	show: function(){
		if (this.shim) this.shim.setStyle('display', 'block');
		return this.position();
	},

	dispose: function(){
		if (this.shim) this.shim.dispose();
		return this;
	},

	destroy: function(){
		if (this.shim) this.shim.destroy();
		return this;
	}

});

window.addEvent('load', function(){
	IframeShim.ready = true;
});

/*
---

script: HtmlTable.js

description: Builds table elements with methods to add rows.

license: MIT-style license

authors:
- Aaron Newton

requires:
- core:1.2.4/Options
- core:1.2.4/Events
- /Class.Occlude

provides: [HtmlTable]

...
*/

var HtmlTable = new Class({

	Implements: [Options, Events, Class.Occlude],

	options: {
		properties: {
			cellpadding: 0,
			cellspacing: 0,
			border: 0
		},
		rows: [],
		headers: [],
		footers: []
	},

	property: 'HtmlTable',

	initialize: function(){
		var params = Array.link(arguments, {options: Object.type, table: Element.type});
		this.setOptions(params.options);
		this.element = params.table || new Element('table', this.options.properties);
		if (this.occlude()) return this.occluded;
		this.build();
	},

	build: function(){
		this.element.store('HtmlTable', this);

		this.body = document.id(this.element.tBodies[0]) || new Element('tbody').inject(this.element);
		$$(this.body.rows);

		if (this.options.headers.length) this.setHeaders(this.options.headers);
		else this.thead = document.id(this.element.tHead);
		if (this.thead) this.head = document.id(this.thead.rows[0]);

		if (this.options.footers.length) this.setFooters(this.options.footers);
		this.tfoot = document.id(this.element.tFoot);
		if (this.tfoot) this.foot = document.id(this.thead.rows[0]);

		this.options.rows.each(function(row){
			this.push(row);
		}, this);

		['adopt', 'inject', 'wraps', 'grab', 'replaces', 'dispose'].each(function(method){
				this[method] = this.element[method].bind(this.element);
		}, this);
	},

	toElement: function(){
		return this.element;
	},

	empty: function(){
		this.body.empty();
		return this;
	},

	setHeaders: function(headers){
		this.thead = (document.id(this.element.tHead) || new Element('thead').inject(this.element, 'top')).empty();
		this.push(headers, this.thead, 'th');
		this.head = document.id(this.thead.rows[0]);
		return this;
	},

	setFooters: function(footers){
		this.tfoot = (document.id(this.element.tFoot) || new Element('tfoot').inject(this.element, 'top')).empty();
		this.push(footers, this.tfoot);
		this.foot = document.id(this.thead.rows[0]);
		return this;
	},

	push: function(row, target, tag){
		var tds = row.map(function(data){
			var td = new Element(tag || 'td', data.properties),
				type = data.content || data || '',
				element = document.id(type);

			if(element) td.adopt(element);
			else td.set('html', type);

			return td;
		});

		return {
			tr: new Element('tr').inject(target || this.body).adopt(tds),
			tds: tds
		};
	}

});


/*
---

script: HtmlTable.Zebra.js

description: Builds a stripy table with methods to add rows.

license: MIT-style license

authors:
- Harald Kirschner
- Aaron Newton

requires:
- /HtmlTable
- /Class.refactor

provides: [HtmlTable.Zebra]

...
*/

HtmlTable = Class.refactor(HtmlTable, {

	options: {
		classZebra: 'table-tr-odd',
		zebra: true
	},

	initialize: function(){
		this.previous.apply(this, arguments);
		if (this.occluded) return this.occluded;
		if (this.options.zebra) this.updateZebras();
	},

	updateZebras: function(){
		Array.each(this.body.rows, this.zebra, this);
	},

	zebra: function(row, i){
		return row[((i % 2) ? 'remove' : 'add')+'Class'](this.options.classZebra);
	},

	push: function(){
		var pushed = this.previous.apply(this, arguments);
		if (this.options.zebra) this.updateZebras();
		return pushed;
	}

});

/*
---

script: HtmlTable.Sort.js

description: Builds a stripy, sortable table with methods to add rows.

license: MIT-style license

authors:
- Harald Kirschner
- Aaron Newton

requires:
- core:1.2.4/Hash
- /HtmlTable
- /Class.refactor
- /Element.Delegation
- /Date

provides: [HtmlTable.Sort]

...
*/

HtmlTable = Class.refactor(HtmlTable, {

	options: {/*
		onSort: $empty, */
		sortIndex: 0,
		sortReverse: false,
		parsers: [],
		defaultParser: 'string',
		classSortable: 'table-sortable',
		classHeadSort: 'table-th-sort',
		classHeadSortRev: 'table-th-sort-rev',
		classNoSort: 'table-th-nosort',
		classGroupHead: 'table-tr-group-head',
		classGroup: 'table-tr-group',
		classCellSort: 'table-td-sort',
		classSortSpan: 'table-th-sort-span',
		sortable: false
	},

	initialize: function () {
		this.previous.apply(this, arguments);
		if (this.occluded) return this.occluded;
		this.sorted = {index: null, dir: 1};
		this.bound = {
			headClick: this.headClick.bind(this)
		};
		this.sortSpans = new Elements();
		if (this.options.sortable) {
			this.enableSort();
			if (this.options.sortIndex != null) this.sort(this.options.sortIndex, this.options.sortReverse);
		}
	},

	attachSorts: function(attach){
		this.element[$pick(attach, true) ? 'addEvent' : 'removeEvent']('click:relay(th)', this.bound.headClick);
	},

	setHeaders: function(){
		this.previous.apply(this, arguments);
		if (this.sortEnabled) this.detectParsers();
	},
	
	detectParsers: function(force){
		if (!this.head) return;
		var parsers = this.options.parsers, 
				rows = this.body.rows;

		// auto-detect
		this.parsers = $$(this.head.cells).map(function(cell, index) {
			if (!force && (cell.hasClass(this.options.classNoSort) || cell.retrieve('htmltable-sort'))) return cell.retrieve('htmltable-sort');
			var sortSpan = new Element('span', {'html': '&#160;', 'class': this.options.classSortSpan}).inject(cell, 'top');
			this.sortSpans.push(sortSpan);

			var parser = parsers[index], 
					cancel;
			switch ($type(parser)) {
				case 'function': parser = {convert: parser}; cancel = true; break;
				case 'string': parser = parser; cancel = true; break;
			}
			if (!cancel) {
				HtmlTable.Parsers.some(function(current) {
					var match = current.match;
					if (!match) return false;
					if (Browser.Engine.trident) return false;
					for (var i = 0, j = rows.length; i < j; i++) {
						var text = rows[i].cells[index].get('html').clean();
						if (text && match.test(text)) {
							parser = current;
							return true;
						}
					}
				});
			}

			if (!parser) parser = this.options.defaultParser;
			cell.store('htmltable-parser', parser);
			return parser;
		}, this);
	},

	headClick: function(event, el) {
		if (!this.head) return;
		var index = Array.indexOf(this.head.cells, el);
		this.sort(index);
		return false;
	},

	sort: function(index, reverse, pre) {
		if (!this.head) return;
		pre = !!(pre);
		var classCellSort = this.options.classCellSort;
		var classGroup = this.options.classGroup, 
				classGroupHead = this.options.classGroupHead;

		if (!pre) {
			if (index != null) {
				if (this.sorted.index == index) {
					this.sorted.reverse = !(this.sorted.reverse);
				} else {
					if (this.sorted.index != null) {
						this.sorted.reverse = false;
						this.head.cells[this.sorted.index].removeClass(this.options.classHeadSort).removeClass(this.options.classHeadSortRev);
					} else {
						this.sorted.reverse = true;
					}
					this.sorted.index = index;
				}
			} else {
				index = this.sorted.index;
			}

			if (reverse != null) this.sorted.reverse = reverse;

			var head = document.id(this.head.cells[index]);
			if (head) {
				head.addClass(this.options.classHeadSort);
				if (this.sorted.reverse) head.addClass(this.options.classHeadSortRev);
				else head.removeClass(this.options.classHeadSortRev);
			}

			this.body.getElements('td').removeClass(this.options.classCellSort);
		}

		var parser = this.parsers[index];
		if ($type(parser) == 'string') parser = HtmlTable.Parsers.get(parser);
		if (!parser) return;

		if (!Browser.Engine.trident) {
			var rel = this.body.getParent();
			this.body.dispose();
		}

		var data = Array.map(this.body.rows, function(row, i) {
			var value = parser.convert.call(document.id(row.cells[index]));

			return {
				position: i,
				value: value,
				toString:  function() {
					return value.toString();
				}
			};
		}, this);
		data.reverse(true);

		data.sort(function(a, b){
			if (a.value === b.value) return 0;
			return a.value > b.value ? 1 : -1;
		});

		if (!this.sorted.reverse) data.reverse(true);

		var i = data.length, body = this.body;
		var j, position, entry, group;

		while (i) {
			var item = data[--i];
			position = item.position;
			var row = body.rows[position];
			if (row.disabled) continue;

			if (!pre) {
				if (group === item.value) {
					row.removeClass(classGroupHead).addClass(classGroup);
				} else {
					group = item.value;
					row.removeClass(classGroup).addClass(classGroupHead);
				}
				if (this.zebra) this.zebra(row, i);

				row.cells[index].addClass(classCellSort);
			}

			body.appendChild(row);
			for (j = 0; j < i; j++) {
				if (data[j].position > position) data[j].position--;
			}
		};
		data = null;
		if (rel) rel.grab(body);

		return this.fireEvent('sort', [body, index]);
	},

	reSort: function(){
		if (this.sortEnabled) this.sort.call(this, this.sorted.index, this.sorted.reverse);
		return this;
	},

	enableSort: function(){
		this.element.addClass(this.options.classSortable);
		this.attachSorts(true);
		this.detectParsers();
		this.sortEnabled = true;
		return this;
	},

	disableSort: function(){
		this.element.remove(this.options.classSortable);
		this.attachSorts(false);
		this.sortSpans.each(function(span) { span.destroy(); });
		this.sortSpans.empty();
		this.sortEnabled = false;
		return this;
	}

});

HtmlTable.Parsers = new Hash({

	'date': {
		match: /^\d{2}[-\/ ]\d{2}[-\/ ]\d{2,4}$/,
		convert: function() {
			return Date.parse(this.get('text').format('db'));
		},
		type: 'date'
	},
	'input-checked': {
		match: / type="(radio|checkbox)" /,
		convert: function() {
			return this.getElement('input').checked;
		}
	},
	'input-value': {
		match: /<input/,
		convert: function() {
			return this.getElement('input').value;
		}
	},
	'number': {
		match: /^\d+[^\d.,]*$/,
		convert: function() {
			return this.get('text').toInt();
		},
		number: true
	},
	'numberLax': {
		match: /^[^\d]+\d+$/,
		convert: function() {
			return this.get('text').replace(/[^-?^0-9]/, '').toInt();
		},
		number: true
	},
	'float': {
		match: /^[\d]+\.[\d]+/,
		convert: function() {
			return this.get('text').replace(/[^-?^\d.]/, '').toFloat();
		},
		number: true
	},
	'floatLax': {
		match: /^[^\d]+[\d]+\.[\d]+$/,
		convert: function() {
			return this.get('text').replace(/[^-?^\d.]/, '');
		},
		number: true
	},
	'string': {
		match: null,
		convert: function() {
			return this.get('text');
		}
	},
	'title': {
		match: null,
		convert: function() {
			return this.title;
		}
	}

});


/*
---

script: HtmlTable.Select.js

description: Builds a stripy, sortable table with methods to add rows. Rows can be selected with the mouse or keyboard navigation.

license: MIT-style license

authors:
- Harald Kirschner
- Aaron Newton

requires:
- /Keyboard
- /HtmlTable
- /Class.refactor
- /Element.Delegation

provides: [HtmlTable.Select]

...
*/

HtmlTable = Class.refactor(HtmlTable, {

	options: {
		/*onRowSelect: $empty,
		onRowUnselect: $empty,*/
		useKeyboard: true,
		classRowSelected: 'table-tr-selected',
		classRowHovered: 'table-tr-hovered',
		classSelectable: 'table-selectable',
		allowMultiSelect: true,
		selectable: false
	},

	initialize: function(){
		this.previous.apply(this, arguments);
		if (this.occluded) return this.occluded;
		this.selectedRows = new Elements();
		this.bound = {
			mouseleave: this.mouseleave.bind(this),
			focusRow: this.focusRow.bind(this)
		};
		if (this.options.selectable) this.enableSelect();
	},

	enableSelect: function(){
		this.selectEnabled = true;
		this.attachSelects();
		this.element.addClass(this.options.classSelectable);
	},

	disableSelect: function(){
		this.selectEnabled = false;
		this.attach(false);
		this.element.removeClass(this.options.classSelectable);
	},

	attachSelects: function(attach){
		attach = $pick(attach, true);
		var method = attach ? 'addEvents' : 'removeEvents';
		this.element[method]({
			mouseleave: this.bound.mouseleave
		});
		this.body[method]({
			'click:relay(tr)': this.bound.focusRow
		});
		if (this.options.useKeyboard || this.keyboard){
			if (!this.keyboard) this.keyboard = new Keyboard({
				events: {
					down: function(e) {
						e.preventDefault();
						this.shiftFocus(1);
					}.bind(this),
					up: function(e) {
						e.preventDefault();
						this.shiftFocus(-1);
					}.bind(this),
					enter: function(e) {
						e.preventDefault();
						if (this.hover) this.focusRow(this.hover);
					}.bind(this)
				},
				active: true
			});
			this.keyboard[attach ? 'activate' : 'deactivate']();
		}
		this.updateSelects();
	},

	mouseleave: function(){
		if (this.hover) this.leaveRow(this.hover);
	},

	focus: function(){
		if (this.keyboard) this.keyboard.activate();
	},

	blur: function(){
		if (this.keyboard) this.keyboard.deactivate();
	},

	push: function(){
		var ret = this.previous.apply(this, arguments);
		this.updateSelects();
		return ret;
	},

	updateSelects: function(){
		Array.each(this.body.rows, function(row){
			var binders = row.retrieve('binders');
			if ((binders && this.selectEnabled) || (!binders && !this.selectEnabled)) return;
			if (!binders){
				binders = {
					mouseenter: this.enterRow.bind(this, [row]),
					mouseleave: this.leaveRow.bind(this, [row])
				};
				row.store('binders', binders).addEvents(binders);
			} else {
				row.removeEvents(binders);
			}
		}, this);
	},

	enterRow: function(row){
		if (this.hover) this.hover = this.leaveRow(this.hover);
		this.hover = row.addClass(this.options.classRowHovered);
	},

	shiftFocus: function(offset){
		if (!this.hover) return this.enterRow(this.body.rows[0]);
		var to = Array.indexOf(this.body.rows, this.hover) + offset;
		if (to < 0) to = 0;
		if (to >= this.body.rows.length) to = this.body.rows.length - 1;
		if (this.hover == this.body.rows[to]) return this;
		this.enterRow(this.body.rows[to]);
	},

	leaveRow: function(row){
		row.removeClass(this.options.classRowHovered);
	},

	focusRow: function(){
		var row = arguments[1] || arguments[0]; //delegation passes the event first
		if (!this.body.getChildren().contains(row)) return;
		var unfocus = function(row){
			this.selectedRows.erase(row);
			row.removeClass(this.options.classRowSelected);
			this.fireEvent('rowUnfocus', [row, this.selectedRows]);
		}.bind(this);
		if (!this.options.allowMultiSelect) this.selectedRows.each(unfocus);
		if (!this.selectedRows.contains(row)) {
			this.selectedRows.push(row);
			row.addClass(this.options.classRowSelected);
			this.fireEvent('rowFocus', [row, this.selectedRows]);
		} else {
			unfocus(row);
		}
		return false;
	},

	selectAll: function(status){
		status = $pick(status, true);
		if (!this.options.allowMultiSelect && status) return;
		if (!status) this.selectedRows.removeClass(this.options.classRowSelected).empty();
		else this.selectedRows.combine(this.body.rows).addClass(this.options.classRowSelected);
		return this;
	},

	selectNone: function(){
		return this.selectAll(false);
	}

});

/*
---

script: Keyboard.js

description: KeyboardEvents used to intercept events on a class for keyboard and format modifiers in a specific order so as to make alt+shift+c the same as shift+alt+c.

license: MIT-style license

authors:
- Perrin Westrich
- Aaron Newton
- Scott Kyle

requires:
- core:1.2.4/Events
- core:1.2.4/Options
- core:1.2.4/Element.Event
- /Log

provides: [Keyboard]

...
*/

(function(){

	var parsed = {};
	var modifiers = ['shift', 'control', 'alt', 'meta'];
	var regex = /^(?:shift|control|ctrl|alt|meta)$/;
	
	var parse = function(type, eventType){
		type = type.toLowerCase().replace(/^(keyup|keydown):/, function($0, $1){
			eventType = $1;
			return '';
		});
		
		if (!parsed[type]){
			var key = '', mods = {};
			type.split('+').each(function(part){
				if (regex.test(part)) mods[part] = true;
				else key = part;
			});
		
			mods.control = mods.control || mods.ctrl; // allow both control and ctrl
			var match = '';
			modifiers.each(function(mod){
				if (mods[mod]) match += mod + '+';
			});
			
			parsed[type] = match + key;
		}
		
		return eventType + ':' + parsed[type];
	};

	this.Keyboard = new Class({

		Extends: Events,

		Implements: [Options, Log],

		options: {
			/*
			onActivate: $empty,
			onDeactivate: $empty,
			*/
			defaultEventType: 'keydown',
			active: false,
			events: {}
		},

		initialize: function(options){
			this.setOptions(options);
			//if this is the root manager, nothing manages it
			if (Keyboard.manager) Keyboard.manager.manage(this);
			this.setup();
		},

		setup: function(){
			this.addEvents(this.options.events);
			if (this.options.active) this.activate();
		},

		handle: function(event, type){
			//Keyboard.stop(event) prevents key propagation
			if (!this.active || event.preventKeyboardPropagation) return;
			
			var bubbles = !!this.manager;
			if (bubbles && this.activeKB){
				this.activeKB.handle(event, type);
				if (event.preventKeyboardPropagation) return;
			}
			this.fireEvent(type, event);
			
			if (!bubbles && this.activeKB) this.activeKB.handle(event, type);
		},

		addEvent: function(type, fn, internal) {
			return this.parent(parse(type, this.options.defaultEventType), fn, internal);
		},

		removeEvent: function(type, fn) {
			return this.parent(parse(type, this.options.defaultEventType), fn);
		},

		activate: function(){
			this.active = true;
			return this.enable();
		},

		deactivate: function(){
			this.active = false;
			return this.fireEvent('deactivate');
		},

		toggleActive: function(){
			return this[this.active ? 'deactivate' : 'activate']();
		},

		enable: function(instance){
			if (instance) {
				//if we're stealing focus, store the last keyboard to have it so the relenquish command works
				if (instance != this.activeKB) this.previous = this.activeKB;
				//if we're enabling a child, assign it so that events are now passed to it
				this.activeKB = instance.fireEvent('activate');
			} else if (this.manager) {
				//else we're enabling ourselves, we must ask our parent to do it for us
				this.manager.enable(this);
			}
			return this;
		},

		relenquish: function(){
			if (this.previous) this.enable(this.previous);
		},

		//management logic
		manage: function(instance) {
			if (instance.manager) instance.manager.drop(instance);
			this.instances.push(instance);
			instance.manager = this;
			if (!this.activeKB) this.enable(instance);
			else this._disable(instance);
		},

		_disable: function(instance) {
			if (this.activeKB == instance) this.activeKB = null;
		},

		drop: function(instance) {
			this._disable(instance);
			this.instances.erase(instance);
		},

		instances: [],

		trace: function(){
			this.enableLog();
			var item = this;
			this.log('the following items have focus: ');
			while (item) {
				this.log(document.id(item.widget) || item.widget || item, 'active: ' + this.active);
				item = item.activeKB;
			}
		}

	});

	Keyboard.stop = function(event) {
		event.preventKeyboardPropagation = true;
	};

	Keyboard.manager = new this.Keyboard({
		active: true
	});
	
	Keyboard.trace = function(){
		Keyboard.manager.trace();
	};
	
	var handler = function(event){
		var mods = '';
		modifiers.each(function(mod){
			if (event[mod]) mods += mod + '+';
		});
		Keyboard.manager.handle(event, event.type + ':' + mods + event.key);
	};
	
	document.addEvents({
		'keyup': handler,
		'keydown': handler
	});

	Event.Keys.extend({
		'pageup': 33,
		'pagedown': 34,
		'end': 35,
		'home': 36,
		'capslock': 20,
		'numlock': 144,
		'scrolllock': 145
	});

})();


/*
---

script: Mask.js

description: Creates a mask element to cover another.

license: MIT-style license

authors:
- Aaron Newton

requires:
- core:1.2.4/Options
- core:1.2.4/Events
- core:1.2.4/Element.Event
- /Class.Binds
- /Element.Position
- /IframeShim

provides: [Mask]

...
*/

var Mask = new Class({

	Implements: [Options, Events],

	Binds: ['resize'],

	options: {
		// onShow: $empty,
		// onHide: $empty,
		// onDestroy: $empty,
		// onClick: $empty,
		//inject: {
		//  where: 'after',
		//  target: null,
		//},
		// hideOnClick: false,
		// id: null,
		// destroyOnHide: false,
		style: {},
		'class': 'mask',
		maskMargins: false,
		useIframeShim: true
	},

	initialize: function(target, options){
		this.target = document.id(target) || document.body;
		this.target.store('mask', this);
		this.setOptions(options);
		this.render();
		this.inject();
	},
	
	render: function() {
		this.element = new Element('div', {
			'class': this.options['class'],
			id: this.options.id || 'mask-' + $time(),
			styles: $merge(this.options.style, {
				display: 'none'
			}),
			events: {
				click: function(){
					this.fireEvent('click');
					if (this.options.hideOnClick) this.hide();
				}.bind(this)
			}
		});
		this.hidden = true;
	},

	toElement: function(){
		return this.element;
	},

	inject: function(target, where){
		where = where || this.options.inject ? this.options.inject.where : '' || this.target == document.body ? 'inside' : 'after';
		target = target || this.options.inject ? this.options.inject.target : '' || this.target;
		this.element.inject(target, where);
		if (this.options.useIframeShim) {
			this.shim = new IframeShim(this.element);
			this.addEvents({
				show: this.shim.show.bind(this.shim),
				hide: this.shim.hide.bind(this.shim),
				destroy: this.shim.destroy.bind(this.shim)
			});
		}
	},

	position: function(){
		this.resize(this.options.width, this.options.height);
		this.element.position({
			relativeTo: this.target,
			position: 'topLeft',
			ignoreMargins: !this.options.maskMargins,
			ignoreScroll: this.target == document.body
		});
		return this;
	},

	resize: function(x, y){
		var opt = {
			styles: ['padding', 'border']
		};
		if (this.options.maskMargins) opt.styles.push('margin');
		var dim = this.target.getComputedSize(opt);
		if (this.target == document.body) {
			var win = window.getSize();
			if (dim.totalHeight < win.y) dim.totalHeight = win.y;
			if (dim.totalWidth < win.x) dim.totalWidth = win.x;
		}
		this.element.setStyles({
			width: $pick(x, dim.totalWidth, dim.x),
			height: $pick(y, dim.totalHeight, dim.y)
		});
		return this;
	},

	show: function(){
		if (!this.hidden) return this;
		this.target.addEvent('resize', this.resize);
		if (this.target != document.body) document.id(document.body).addEvent('resize', this.resize);
		this.position();
		this.showMask.apply(this, arguments);
		return this;
	},

	showMask: function(){
		this.element.setStyle('display', 'block');
		this.hidden = false;
		this.fireEvent('show');
	},

	hide: function(){
		if (this.hidden) return this;
		this.target.removeEvent('resize', this.resize);
		this.hideMask.apply(this, arguments);
		if (this.options.destroyOnHide) return this.destroy();
		return this;
	},

	hideMask: function(){
		this.element.setStyle('display', 'none');
		this.hidden = true;
		this.fireEvent('hide');
	},

	toggle: function(){
		this[this.hidden ? 'show' : 'hide']();
	},

	destroy: function(){
		this.hide();
		this.element.destroy();
		this.fireEvent('destroy');
		this.target.eliminate('mask');
	}

});

Element.Properties.mask = {

	set: function(options){
		var mask = this.retrieve('mask');
		return this.eliminate('mask').store('mask:options', options);
	},

	get: function(options){
		if (options || !this.retrieve('mask')){
			if (this.retrieve('mask')) this.retrieve('mask').destroy();
			if (options || !this.retrieve('mask:options')) this.set('mask', options);
			this.store('mask', new Mask(this, this.retrieve('mask:options')));
		}
		return this.retrieve('mask');
	}

};

Element.implement({

	mask: function(options){
		this.get('mask', options).show();
		return this;
	},

	unmask: function(){
		this.get('mask').hide();
		return this;
	}

});

/*
---

script: Scroller.js

description: Class which scrolls the contents of any Element (including the window) when the mouse reaches the Element's boundaries.

license: MIT-style license

authors:
- Valerio Proietti

requires:
- core:1.2.4/Events
- core:1.2.4/Options
- core:1.2.4/Element.Event
- core:1.2.4/Element.Dimensions

provides: [Scroller]

...
*/

var Scroller = new Class({

	Implements: [Events, Options],

	options: {
		area: 20,
		velocity: 1,
		onChange: function(x, y){
			this.element.scrollTo(x, y);
		},
		fps: 50
	},

	initialize: function(element, options){
		this.setOptions(options);
		this.element = document.id(element);
		this.listener = ($type(this.element) != 'element') ? document.id(this.element.getDocument().body) : this.element;
		this.timer = null;
		this.bound = {
			attach: this.attach.bind(this),
			detach: this.detach.bind(this),
			getCoords: this.getCoords.bind(this)
		};
	},

	start: function(){
		this.listener.addEvents({
			mouseover: this.bound.attach,
			mouseout: this.bound.detach
		});
	},

	stop: function(){
		this.listener.removeEvents({
			mouseover: this.bound.attach,
			mouseout: this.bound.detach
		});
		this.detach();
		this.timer = $clear(this.timer);
	},

	attach: function(){
		this.listener.addEvent('mousemove', this.bound.getCoords);
	},

	detach: function(){
		this.listener.removeEvent('mousemove', this.bound.getCoords);
		this.timer = $clear(this.timer);
	},

	getCoords: function(event){
		this.page = (this.listener.get('tag') == 'body') ? event.client : event.page;
		if (!this.timer) this.timer = this.scroll.periodical(Math.round(1000 / this.options.fps), this);
	},

	scroll: function(){
		var size = this.element.getSize(), 
			scroll = this.element.getScroll(), 
			pos = this.element.getOffsets(), 
			scrollSize = this.element.getScrollSize(), 
			change = {x: 0, y: 0};
		for (var z in this.page){
			if (this.page[z] < (this.options.area + pos[z]) && scroll[z] != 0)
				change[z] = (this.page[z] - this.options.area - pos[z]) * this.options.velocity;
			else if (this.page[z] + this.options.area > (size[z] + pos[z]) && scroll[z] + size[z] != scrollSize[z])
				change[z] = (this.page[z] - size[z] + this.options.area - pos[z]) * this.options.velocity;
		}
		if (change.y || change.x) this.fireEvent('change', [scroll.x + change.x, scroll.y + change.y]);
	}

});

/*
---

script: Tips.js

description: Class for creating nice tips that follow the mouse cursor when hovering an element.

license: MIT-style license

authors:
- Valerio Proietti
- Christoph Pojer

requires:
- core:1.2.4/Options
- core:1.2.4/Events
- core:1.2.4/Element.Event
- core:1.2.4/Element.Style
- core:1.2.4/Element.Dimensions
- /MooTools.More

provides: [Tips]

...
*/

(function(){

var read = function(option, element){
	return (option) ? ($type(option) == 'function' ? option(element) : element.get(option)) : '';
};

this.Tips = new Class({

	Implements: [Events, Options],

	options: {
		/*
		onAttach: $empty(element),
		onDetach: $empty(element),
		*/
		onShow: function(){
			this.tip.setStyle('display', 'block');
		},
		onHide: function(){
			this.tip.setStyle('display', 'none');
		},
		title: 'title',
		text: function(element){
			return element.get('rel') || element.get('href');
		},
		showDelay: 100,
		hideDelay: 100,
		className: 'tip-wrap',
		offset: {x: 16, y: 16},
		fixed: false
	},

	initialize: function(){
		var params = Array.link(arguments, {options: Object.type, elements: $defined});
		this.setOptions(params.options);
		document.id(this);
		
		if (params.elements) this.attach(params.elements);
	},

	toElement: function(){
		if (this.tip) return this.tip;
		
		this.container = new Element('div', {'class': 'tip'});
		return this.tip = new Element('div', {
			'class': this.options.className,
			styles: {
				position: 'absolute',
				top: 0,
				left: 0
			}
		}).adopt(
			new Element('div', {'class': 'tip-top'}),
			this.container,
			new Element('div', {'class': 'tip-bottom'})
		).inject(document.body);
	},

	attach: function(elements){
		$$(elements).each(function(element){
			var title = read(this.options.title, element),
				text = read(this.options.text, element);
			
			element.erase('title').store('tip:native', title).retrieve('tip:title', title);
			element.retrieve('tip:text', text);
			this.fireEvent('attach', [element]);
			
			var events = ['enter', 'leave'];
			if (!this.options.fixed) events.push('move');
			
			events.each(function(value){
				var event = element.retrieve('tip:' + value);
				if (!event) event = this['element' + value.capitalize()].bindWithEvent(this, element);
				
				element.store('tip:' + value, event).addEvent('mouse' + value, event);
			}, this);
		}, this);
		
		return this;
	},

	detach: function(elements){
		$$(elements).each(function(element){
			['enter', 'leave', 'move'].each(function(value){
				element.removeEvent('mouse' + value, element.retrieve('tip:' + value)).eliminate('tip:' + value);
			});
			
			this.fireEvent('detach', [element]);
			
			if (this.options.title == 'title'){ // This is necessary to check if we can revert the title
				var original = element.retrieve('tip:native');
				if (original) element.set('title', original);
			}
		}, this);
		
		return this;
	},

	elementEnter: function(event, element){
		this.container.empty();
		
		['title', 'text'].each(function(value){
			var content = element.retrieve('tip:' + value);
			if (content) this.fill(new Element('div', {'class': 'tip-' + value}).inject(this.container), content);
		}, this);
		
		$clear(this.timer);
		this.timer = this.show.delay(this.options.showDelay, this, element);
		this.position((this.options.fixed) ? {page: element.getPosition()} : event);
	},

	elementLeave: function(event, element){
		$clear(this.timer);
		this.timer = this.hide.delay(this.options.hideDelay, this, element);
		this.fireForParent(event, element);
	},

	fireForParent: function(event, element){
		if (!element) return;
		parentNode = element.getParent();
		if (parentNode == document.body) return;
		if (parentNode.retrieve('tip:enter')) parentNode.fireEvent('mouseenter', event);
		else this.fireForParent(parentNode, event);
	},

	elementMove: function(event, element){
		this.position(event);
	},

	position: function(event){
		var size = window.getSize(), scroll = window.getScroll(),
			tip = {x: this.tip.offsetWidth, y: this.tip.offsetHeight},
			props = {x: 'left', y: 'top'},
			obj = {};
		
		for (var z in props){
			obj[props[z]] = event.page[z] + this.options.offset[z];
			if ((obj[props[z]] + tip[z] - scroll[z]) > size[z]) obj[props[z]] = event.page[z] - this.options.offset[z] - tip[z];
		}
		
		this.tip.setStyles(obj);
	},

	fill: function(element, contents){
		if(typeof contents == 'string') element.set('html', contents);
		else element.adopt(contents);
	},

	show: function(element){
		this.fireEvent('show', [this.tip, element]);
	},

	hide: function(element){
		this.fireEvent('hide', [this.tip, element]);
	}

});

})();

/*
---

script: Spinner.js

description: Adds a semi-transparent overlay over a dom element with a spinnin ajax icon.

license: MIT-style license

authors:
- Aaron Newton

requires:
- core:1.2.4/Fx.Tween
- /Class.refactor
- /Mask

provides: [Spinner]

...
*/

var Spinner = new Class({

	Extends: Mask,

	options: {
		/*message: false,*/
		'class':'spinner',
		containerPosition: {},
		content: {
			'class':'spinner-content'
		},
		messageContainer: {
			'class':'spinner-msg'
		},
		img: {
			'class':'spinner-img'
		},
		fxOptions: {
			link: 'chain'
		}
	},

	initialize: function(){
		this.parent.apply(this, arguments);
		this.target.store('spinner', this);

		//add this to events for when noFx is true; parent methods handle hide/show
		var deactivate = function(){ this.active = false; }.bind(this);
		this.addEvents({
			hide: deactivate,
			show: deactivate
		});
	},

	render: function(){
		this.parent();
		this.element.set('id', this.options.id || 'spinner-'+$time());
		this.content = document.id(this.options.content) || new Element('div', this.options.content);
		this.content.inject(this.element);
		if (this.options.message) {
			this.msg = document.id(this.options.message) || new Element('p', this.options.messageContainer).appendText(this.options.message);
			this.msg.inject(this.content);
		}
		if (this.options.img) {
			this.img = document.id(this.options.img) || new Element('div', this.options.img);
			this.img.inject(this.content);
		}
		this.element.set('tween', this.options.fxOptions);
	},

	show: function(noFx){
		if (this.active) return this.chain(this.show.bind(this));
		if (!this.hidden) {
			this.callChain.delay(20, this);
			return this;
		}
		this.active = true;
		return this.parent(noFx);
	},

	showMask: function(noFx){
		var pos = function(){
			this.content.position($merge({
				relativeTo: this.element
			}, this.options.containerPosition));
		}.bind(this);
		if (noFx) {
			this.parent();
			pos();
		} else {
			this.element.setStyles({
				display: 'block',
				opacity: 0
			}).tween('opacity', this.options.style.opacity || 0.9);
			pos();
			this.hidden = false;
			this.fireEvent('show');
			this.callChain();
		}
	},

	hide: function(noFx){
		if (this.active) return this.chain(this.hide.bind(this));
		if (this.hidden) {
			this.callChain.delay(20, this);
			return this;
		}
		this.active = true;
		return this.parent(noFx);
	},

	hideMask: function(noFx){
		if (noFx) return this.parent();
		this.element.tween('opacity', 0).get('tween').chain(function(){
			this.element.setStyle('display', 'none');
			this.hidden = true;
			this.fireEvent('hide');
			this.callChain();
		}.bind(this));
	},

	destroy: function(){
		this.content.destroy();
		this.parent();
		this.target.eliminate('spinner');
	}

});

Spinner.implement(new Chain);

if (window.Request) {
	Request = Class.refactor(Request, {
		
		options: {
			useSpinner: false,
			spinnerOptions: {},
			spinnerTarget: false
		},
		
		initialize: function(options){
			this._send = this.send;
			this.send = function(options){
				if (this.spinner) this.spinner.chain(this._send.bind(this, options)).show();
				else this._send(options);
				return this;
			};
			this.previous(options);
			var update = document.id(this.options.spinnerTarget) || document.id(this.options.update);
			if (this.options.useSpinner && update) {
				this.spinner = update.get('spinner', this.options.spinnerOptions);
				['onComplete', 'onException', 'onCancel'].each(function(event){
					this.addEvent(event, this.spinner.hide.bind(this.spinner));
				}, this);
			}
		},
		
		getSpinner: function(){
			return this.spinner;
		}
		
	});
}

Element.Properties.spinner = {

	set: function(options){
		var spinner = this.retrieve('spinner');
		return this.eliminate('spinner').store('spinner:options', options);
	},

	get: function(options){
		if (options || !this.retrieve('spinner')){
			if (this.retrieve('spinner')) this.retrieve('spinner').destroy();
			if (options || !this.retrieve('spinner:options')) this.set('spinner', options);
			new Spinner(this, this.retrieve('spinner:options'));
		}
		return this.retrieve('spinner');
	}

};

Element.implement({

	spin: function(options){
		this.get('spinner', options).show();
		return this;
	},

	unspin: function(){
		var opt = Array.link(arguments, {options: Object.type, callback: Function.type});
		this.get('spinner', opt.options).hide(opt.callback);
		return this;
	}

});

/*
---

script: Date.English.US.js

description: Date messages for US English.

license: MIT-style license

authors:
- Aaron Newton

requires:
- /Lang
- /Date

provides: [Date.English.US]

...
*/

MooTools.lang.set('en-US', 'Date', {

	months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
	days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
	//culture's date order: MM/DD/YYYY
	dateOrder: ['month', 'date', 'year'],
	shortDate: '%m/%d/%Y',
	shortTime: '%I:%M%p',
	AM: 'AM',
	PM: 'PM',

	/* Date.Extras */
	ordinal: function(dayOfMonth){
		//1st, 2nd, 3rd, etc.
		return (dayOfMonth > 3 && dayOfMonth < 21) ? 'th' : ['th', 'st', 'nd', 'rd', 'th'][Math.min(dayOfMonth % 10, 4)];
	},

	lessThanMinuteAgo: 'less than a minute ago',
	minuteAgo: 'about a minute ago',
	minutesAgo: '{delta} minutes ago',
	hourAgo: 'about an hour ago',
	hoursAgo: 'about {delta} hours ago',
	dayAgo: '1 day ago',
	daysAgo: '{delta} days ago',
	weekAgo: '1 week ago',
	weeksAgo: '{delta} weeks ago',
	monthAgo: '1 month ago',
	monthsAgo: '{delta} months ago',
	yearAgo: '1 year ago',
	yearsAgo: '{delta} years ago',
	lessThanMinuteUntil: 'less than a minute from now',
	minuteUntil: 'about a minute from now',
	minutesUntil: '{delta} minutes from now',
	hourUntil: 'about an hour from now',
	hoursUntil: 'about {delta} hours from now',
	dayUntil: '1 day from now',
	daysUntil: '{delta} days from now',
	weekUntil: '1 week from now',
	weeksUntil: '{delta} weeks from now',
	monthUntil: '1 month from now',
	monthsUntil: '{delta} months from now',
	yearUntil: '1 year from now',
	yearsUntil: '{delta} years from now'

});


/*
---

script: Form.Validator.English.js

description: Date messages for English.

license: MIT-style license

authors:
- Aaron Newton

requires:
- /Lang
- /Form.Validator

provides: [Form.Validator.English]

...
*/

MooTools.lang.set('en-US', 'Form.Validator', {

	required:'This field is required.',
	minLength:'Please enter at least {minLength} characters (you entered {length} characters).',
	maxLength:'Please enter no more than {maxLength} characters (you entered {length} characters).',
	integer:'Please enter an integer in this field. Numbers with decimals (e.g. 1.25) are not permitted.',
	numeric:'Please enter only numeric values in this field (i.e. "1" or "1.1" or "-1" or "-1.1").',
	digits:'Please use numbers and punctuation only in this field (for example, a phone number with dashes or dots is permitted).',
	alpha:'Please use letters only (a-z) with in this field. No spaces or other characters are allowed.',
	alphanum:'Please use only letters (a-z) or numbers (0-9) only in this field. No spaces or other characters are allowed.',
	dateSuchAs:'Please enter a valid date such as {date}',
	dateInFormatMDY:'Please enter a valid date such as MM/DD/YYYY (i.e. "12/31/1999")',
	email:'Please enter a valid email address. For example "fred@domain.com".',
	url:'Please enter a valid URL such as http://www.google.com.',
	currencyDollar:'Please enter a valid $ amount. For example $100.00 .',
	oneRequired:'Please enter something for at least one of these inputs.',
	errorPrefix: 'Error: ',
	warningPrefix: 'Warning: ',

	//Form.Validator.Extras

	noSpace: 'There can be no spaces in this input.',
	reqChkByNode: 'No items are selected.',
	requiredChk: 'This field is required.',
	reqChkByName: 'Please select a {label}.',
	match: 'This field needs to match the {matchName} field',
	startDate: 'the start date',
	endDate: 'the end date',
	currendDate: 'the current date',
	afterDate: 'The date should be the same or after {label}.',
	beforeDate: 'The date should be the same or before {label}.',
	startMonth: 'Please select a start month',
	sameMonth: 'These two dates must be in the same month - you must change one or the other.',
	creditcard: 'The credit card number entered is invalid. Please check the number and try again. {length} digits entered.'

});/*
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
});/*
	File: CIEvent.js
	Event Definitions
*/

/*
	Class: CIEvent
	CIEvent is an Object of String constants that define the events used in CIP.

	Constants: Events
	ApplicationReady - When the CIApplication has completed initializing
	RequestingData - When data is about to be requested via XHR. Passes method, params, moreParams, argsObject
	RequestedData - When any data is requested via XHR
	GotData - When data is received using GET XHR
	PostedData - When data is received using POST XHR
	DeletedData - When data is received using DELETE XHR
	PutData - When data is received using PUT XHR
	RequestFailed - When an XHR request for data fails, regardless of method
	Clicked - When an object is clicked
	DoubleClicked - When an object is double-clicked
	MousedOver - When the mouse passes over an object
	MousedOut - When the mouse leaves an object
	AddedToDom - When a view's structure is added to the DOM. Automatically fired after CIObject.element
	EnterPressed - When the enter/return key is pressed in/on an object
	EscapePressed - When the escape key is pressed in/on an object
	Showing - When an object is about to become visible. Fired before Shown
	Shown - When an object becomes visible
	Hiding - When an object begins to hide. Fired before Hidden
	Hidden - When an object is hidden from the user
	PropertyChanging - When an object's property is about to change
	PropertyChanged - When an object's property has changed: property, newValue[, oldValue]
	Changed - When an object's state has changed
	Selected - When an object's state has changed and a new item is selcted. Usually fired after Clicked
	Deselected - When an object's state has changed and a new item is selected. Fired before Selected
	RemovingFromDom - When an object's element is about to be removed from the DOM
	RemovedFromDom - When an object's element is removed from the DOM
	DragEntered - When a dragged object enters an object
	DragStarted - When an object is dragged
	Rendered - When a view has laid its content (not structure) out. Usually fired after AddedToDom
	Unrendered - When a view has removed its content. Ususally fired before Rendered.
	Resizing - When a view is about to be resized
	Resized - When a view has been resized
	
	Example:
	(start code)
	var CatView = new Class({ Extends: CIView,
		initialize: function(config) {
			...
			this.synthesize(['name', 'age'], config);
			this.addEvent(CIEvent.PropertyChanged, function(property, newValue) {
				if (property == 'age') alert('Happy Birthday!');
			});
		}
	});
	var cat = new CatView();
	cat.setAge(1);	// will alert "Happy Birthday!"
	cat.fireEvent(CIEvent.Rendered);
	(end)
	
	See Also:
		Mootools.Event.fireEvent
*/
var CIEvent = {
	'ApplicationReady': 'ApplicationReady',
	'RequestingData': 'RequestingData',
	'RequestedData': 'RequestedData',
	'GotData': 'GotData',
	'PostedData': 'PostedData',
	'DeletedData': 'DeletedData',
	'PutData': 'PutData',
	'RequestFailed': 'RequestFailed',
	'Clicked': 'Clicked',
	'DoubleClicked': 'DoubleClicked',
	'MousedOver': 'MousedOver',
	'MousedOut': 'MousedOut',
	'AddedToDom': 'AddedToDom',
	'EnterPressed': 'EnterPressed',
	'EscapePressed': 'EscapePressed',
	'Showing': 'Showing',
	'Shown': 'Shown',
	'Hiding': 'Hiding',
	'Hidden': 'Hidden',	// TextMate indicates Hidden may be a keyword
	'PropertyChanging': 'PropertyChanging',
	'PropertyChanged': 'PropertyChanged',
	'Changed': 'Changed',
	'Selected': 'Selected',
	'Deselected': 'Deselected',
	'Unselected': 'Deselected',
	'RemovingFromDom': 'RemovingFromDom',
	'RemovedFromDom': 'RemovedFromDom',
	'DragEntered': 'DragEntered',
	'DragStarted': 'DragStarted',
	'Rendered': 'Rendered',
	'Unrendered': 'Unrendered',
	'Resizing': 'Resizing',
	'Resized': 'Resized'
};/*
	File: CIObject.js
*/

/*
	Class: CIObject
	The base class from which all CIP classes inherit. Handles key-value-coding, events, hierarchy, and property synthesis.
	
	Properties:
		isCIObject - Boolean. Should remain true
		objectId - Integer. The internal id number. Should not be modified
		id - String. Like "CIObject_42". Should be overwritten by subclasses by calling <CIObject.isA(newType)>
	
	Topic: Key-Value Coding
	Key-Value Coding (KVC) is a design pattern by which an object's properties can be accessed and mutated using methods based on a
	convention. Therefore, given the name of the property, any object can modify or retrieve any property on any other object
	simply by forming the correct method name. CIP uses camel case. Given the property *fullName*, the methods *setFullName(newName)* and
	*getFullName()* are created. KVC also provides the generic <CIObject.set(property, newValue)> method which accepts the property as the first argument.
	
	KVC is especially powerful because it enables binding -- whereby an object can be notified of a change on a property of another object.
	When a property is changing, an object will fire <CIEvent.PropertyChanging>, then <CIEvent.PropertyChanged> once the property has
	been changed.
	
	To take advantage of Key-Value Coding, simply call <CIObject.synthesize(properties, configuration)> in your Class' constructor.
*/
var CIObject = new Class({
	Implements: Events,
	
	/*
		Constructor: initialize
		Accepts a configuration Hash. All configurations are optional.
		
		Configuration:
			<CIEvent> - String. The constant name of the CIEvent for which to listen.
			
		Example:
		(start code)
		var o = new CIObject({
			Clicked: function(event) { ... }
		});
		(end)
	*/
	initialize: function(options) {
		this.isCIObject = true;
		this.objectId = CIObject.nextId();
		this.__family = [];
		this.__properties = [];
		this.isA('CIObject');
		
		if ($type(options) != 'object') options = null;
		options = options || {};
		$H(options).each(function(value, key) {
			if (CIEvent[key] && $type(value) == 'function')
				this.addEvent(key, value.bind(this));
		}.bind(this));
	},
	
	/*
		Function: element(parent)
		Returns the Element implementation for the CIObject. It operates in three modes, depending on the parameters.
		
		No parameters - looks for the Element in the DOM with id of CIObject.id using $(CIObject.id) and returns that Element or null
		String or Element - looks for the Element in the DOM using $(String/Element) and passes it to CIObject._makeElement() as the parent, returning an Element. Fires <CIEvent.AddedToDom>
		No parameters, no Element found - returns null
	*/
	element: function(parent) {
		//console.log('Looking for ' + this.id);
		var elem = $(this.id);
		if (elem != null) {
			//console.log ('  - Found ' + this.id);
			return elem;
		} else if (parent) {
			if (parent.isCIObject) parent = parent.element();
			//console.log('  - Could not find ' + this.id + ' in DOM, creating...')
			// _makeElement returns one element, therefore
			// all components must be contained within one element only!
			var e = this._makeElement($(parent));
			this.fireEvent(CIEvent.AddedToDom, [e, parent])
			return e;
		} else {
			//console.log("  - Could not find " + this.id + " in DOM and will not create");
			return null;
		}
	},
	
	/*
		Function: toObject()
		Returns a JavaScript-native Object of this CIObject's properties and their values. Only returns synthesized properties.
		
		Returns:
			Object
			
		Example:
		Assume class MyObject has synthesized properties name and age.
		(start code)
		new MyObject({
			name: 'My Name',
			age:  2
		}).toObject() => { name: 'My Name', age: 2 }
	*/
	toObject: function() {
		object = {};
		// TODO Make sure this doesn't cause any dependencies on
		// account of references. Deep copy?
		this.__properties.each(function(property) {
			object[property] = this[property];
		}.bind(this));
		return object;
	},
	
	/*
		Function: synthesize(properties, configuration)
		Creates the specified properties on this CIObject with defaults if provided using the configuration Object or Hash.
		synthesize can be called multiple times to synthesize more properties.
		Key-Value-compliant accessors will be created unless they already exist in the object.
		
		Parameters:
			properties - Array or Object or Hash. Specifies the properties to synthesize and defaults if passed an
			Object or Hash. If passed an Array, the properties will default to null.
			configuration - Object or Hash or null. The configuration to use to set the properties.
		
		Returns:
			This CIObject
		Example:
		(start code)
		Cat = new Class({
			Extends: CIObject,
			initialize: function(configuration) {
				this.parent(configuration);
				this.isA('MyClass');
				this.synthesize({
					name: 'A Cat',
					age: 1
				}, configuration);
			}
		});
		new Cat().name 								=> 'A Cat'
		var fluffy = new Cat({ name: 'Fluffy' });
		fluffy.getName() 							=> 'Fluffy'
		fluffy.getAge()								=> 1
		fluffy.name									=> 'Fluffy'
		(end)
	*/
	// TODO create Class.<Property>Changed events
	synthesize: function(theProperties, configuration) {
		var propertiesToSynthesize = new Hash();
		if ($type(theProperties) == 'array') {
			theProperties.each(function(p) { propertiesToSynthesize.set(p, null); });
		} else {
			propertiesToSynthesize = new Hash(theProperties);
		}
		configuration = configuration || {};
		if (configuration.isCIObject) configuration = configuration.toObject();
		propertiesToSynthesize.each(function(defaultValue, property) {
			if (!this.__properties.contains(property)) this.__properties.push(property);
			
			if (!$defined(configuration[property]))
				this[property] = defaultValue;
			else
				this[property] = configuration[property];
			
			// The descendent's accessors take precedence
			var setter = 'set' + property.capitalize();
			if (!this[setter]) this[setter] = function(newProperty) { return this.set(property, newProperty); }.bind(this);
			var getter = 'get' + property.capitalize();
			if (!this[getter]) this[getter] = function() { return this[property]; }.bind(this);
		}.bind(this));
		return this;
	},
	
	/*
		Function: isA(newType)
		*Only used in class constructors*. Establishes this new class' class name, id, and family tree.
		
		Parameters:
			newType - String. The name of this new class.
			
		Returns:
			This CIObject
	*/
	isA: function(type) {
		this.__className = type;
		this.id = this.__className + '_' + this.objectId;
		this.__family.push(this.__className);
		return this;
	},
	
	/*
		Function: isOfClass(type)
		Test if this class is of a specific type. The target class' constructor must have declared its type using <CIObject.isA>
		to query its name and ancestry.
		
		Parameters:
			type - String. The type to test.
			
		Returns:
			This CIObject
	*/
	isOfClass: function(type) {
		return this.__className == type;
	},
	
	/*
		Function: set(property, newValue)
		Key-Value mutator. Fires <CIEvent.PropertyChanging>, passing property, newValue, and oldValue. Next reassigns property.
		Finally fires <CIEvent.PropertyChanged> with the same parameters
		
		Parameters:
			property - String. The property to set
			newValue - Anything. The new value
		
		Returns:
			This CIObject
	*/
	set: function(property, newValue) {
		var oldValue = CIObject.duplicate(this[property]);
		this.fireEvent(CIEvent.PropertyChanging, [property, newValue, oldValue]);
		this[property] = newValue;
		this.fireEvent(CIEvent.PropertyChanged, [property, newValue, oldValue]);
		return this;
	}
});

/* The internal counter used to number CIObjects uniquely */
CIObject._idCounter = 0;

/*
 	Function: CIObject.nextId()
	Increment and return the internal id counter. Should not be called directly, use <CIObject.isA> instead.
	
	Returns:
		Number
 */
CIObject.nextId = function() { return ++CIObject._idCounter };

/*	
	Function: CIObject.interpretStyles(styles)
	*Deprecated*. Process special CIP styles to CSS styles. Called automatically by CIObject on its cssStyles config option
	
	Deprecated: *Use <CIRect> to define a <CIView>'s dimensions and <CIStyle> to define a <CIView>'s appearance.*
	
	CIP Styles:
		CIFirmWidth - Value/Percentage. Sets min-, max- and width to the specified value.
		CIFirmHeight - Value/Percentage. Sets min-, max- and height to the specified value.
	
	Returns:
		Hash
*/
CIObject.interpretStyles = function(styles) {
	styles = styles || {};
	if (styles.getKeys) styles = styles.getClean();
	var firmWidth = styles['CIFirmWidth'];
	if (firmWidth) {
		delete styles['CIFirmWidth'];
		styles['min-width'] = firmWidth;
		styles['max-width'] = firmWidth;
		styles['width'] = firmWidth;
	}
	var firmHeight = styles['CIFirmHeight'];
	if (firmHeight) {
		delete styles['CIFirmHeight'];
		styles['min-height'] = firmHeight;
		styles['max-height'] = firmHeight;
		styles['height'] = firmHeight;
	}
	var scrollAtHeight = styles['CIScrollAtHeight'];
	if (scrollAtHeight) {
		delete styles['CIScrollAtHeight'];
		styles['max-height'] = scrollAtHeight;
		styles['overflow'] = 'auto';
	}
	return styles;
};

/*
	Function: CIObject.duplicate(value)
	Attempt to duplicate the passed value
	
	Returns:
		A duplicate of value or value
*/
CIObject.duplicate = function(value) {
	switch ($type(value)) {
	case 'number':
		return new Number(value);
		break;
	default:
		return value;
	}
}/*
	File: CIApplication.js
	The global application representation
*/

/*
	Topic: CIApplication
	The global application instance
*/

/*
	Class: CIApplicationInstance
	CIApplicationInstance represents the application being used. It is instantiated in a global
	variable CIApplication. *Extends <CIObject>*.
	
	Properties:
		baseParams - *Object*. The master parameters to include with every <CIRequest>.
		
	Events:
		- <CIEvent.ApplicationReady>
*/
var CIApplicationInstance = new Class({
	Extends: CIObject,
	
	initialize: function(configuration) {
		this.parent(configuration);
		this.isA('CIApplication');
		this.synthesize({
			baseParams: {}
		}, configuration);
		// this.registeredClasses = new Hash(); // className => Class
	},
	
	/*
		Function: __main__()
		Called when the DOM is loaded, this sets up the environment for CIP.
		Fires <CIEvent.ApplicationReady> when finished.
		This should never be run manually
	*/
	'__main__': function __main__() {
		CIObject.implement(Chain);
		Element.implement(Chain);
		$$('body')[0].addClass(Browser.Engine.name);

		if (!$defined(console)) {
			console = {};
		} else if (!$defined(console.log)) {
			console.log = function() { }
		}

		CIApplication.fireEvent(CIEvent.ApplicationReady);
	}
	
	// registerClass(Class or Object)
	// classNamed(String)
});

CIApplication = new CIApplicationInstance();/*
	File: CIRequest.js
	The generic RESTful request object that can be modified using a <CIRequestController>.
*/

/*
	Class: CIRequest
	A generic RESTful JSON requester. It creates a number of verb-based convenience methods.
	Each verb's behavior can be modified using a <CIRequestController>. *Extends <CIObject>*. 
	
	Properties:
		requestor - *<CIObject>*. A target to pass onto the request controller. Usually not used.
		indicator - *<CIView>*. A view, usually a <CIIndicator> to hide and show based on request progress.
		forwarders - *Array*. Not synthesized. CIObjects on which to fire the request success methods by proxy.
		
	Convenience Methods:
		Substitute _verb_ for get, put, post, or delete for the following methods.
		
		verbURLFn - the URL-building function
		verbParamsFn - the parameter object-building function
		verb - shortcut for <CIRequest.send> using this verb
		canVerb - whether the verb is supported by this CIRequest
*/
var CIRequest = new Class({
	Extends: CIObject,
	
	/*
		Constructor: initialize(configuration)
		Creates the convenience methods and controllers for each verb specified.
		
		Configuration:
			requestor - *<CIObject>*. A target to pass onto the request controller. Usually not used.
			indicator - *<CIView>*. A view, usually a <CIIndicator> to hide and show based on request progress.
			verb - *String* or *Object*. Defines the url for the specified verb. If passed an Object,
			the url- and parameter-building functions, and the request controller can be specified.
			verb.controller - *<CIRequestController>*. The request controller to use for this verb. Defaults to <CIStandardRequestController>.
			verb.url or verb.urlFn - *String* or *Function*. The value or the function to use for the URL for this verb.
			If a function is provided, it should return a String.
			verb.params or verb.paramsFn - *Object* or *Function*. The object or function to use for the parameters for this
			verb's request. If a function is provided, it should return an Object.
	*/
	initialize: function(options) {
		this.parent(options);
		this.isA('CIRequest');
		this.synthesize(['requestor', 'indicator'], options);
		$H(options).each(function(config, method) {
			if (method == 'destroy') method = 'delete';
			if (!CIRequest.isValidHTTPMethod(method)) return;
			if ($type(config) == 'string')
				config = { url: config, params: {} };
			this[method+'URLFn'] = $lambda(config.urlFn || config.url);
			this[method+'ParamsFn'] = $lambda(config.params || config.paramsFn || {});
			this[method] = function(moreParams, argsObject) { this.send(method, moreParams, argsObject); }.bind(this);
			if (method == 'delete') this['destroy'] = this['delete'];
			this['can'+method.capitalize()] = true;
			
			var verbController = method + 'Controller';
			this.synthesize([verbController]);
			this[verbController] = config.controller || new CIStandardRequestController();
			if (this.requestor) this[verbController].target = this.requestor;
		}.bind(this));
		this.forwarders = [];
	},
	
	/*
		Function: forwardEventsTo(target)
		Add a target CIObject on which to fire the request success events by proxy. Does not allow duplicates or null.
	
		Parameters:
			target - *CIObject*. The target to add to forwarders
			
		Returns:
			This CIRequest
	*/
	forwardEventsTo: function(target) {
		if (!this.forwarders.contains(target)) this.forwarders.push(target);
		this.forwarders = this.forwarders.clean();
		return this;
	},
	
	/*
		Function: fireAndForward(event, args)
		Fire this specified <CIEvent> on this CIRequest and its forwarders array of CIObjects.
		
		Parameters:
			event - *<CIEvent>*. The event to fire.
			args - *Array*. Arguments to pass to Mootools.Event.fireEvent
		
		Returns:
			This CIRequest
	*/
	fireAndForward: function(event, args) {
		this.fireEvent(event, args);
		for (var i = 0; i < this.forwarders.length; i++)
			this.forwarders[i].fireEvent(event, args);
		return this;
	},
	
	/*
		Function: getControllerForMethod(method)
		Returns the <CIRequestController> for the specified method
		
		Parameters:
			method - *String*. The lowercase HTTP verb to lookup.
			
		Returns:
			<CIRequestController>
	*/
	getControllerForMethod: function(method) { return this[method + 'Controller']; },
	
	
	_requestSuccess: function(method, response, json) {
		this.getControllerForMethod(method).reset();
		if (method == 'get')
			this.fireAndForward(CIEvent.GotData, [response, json])
		else if (method == 'post')
			this.fireAndForward(CIEvent.PostedData, [response, json]);
		else if (method == 'delete')
			this.fireAndForward(CIEvent.DeletedData, [response, json]);
		else if (method == 'put')
			this.fireAndForward(CIEvent.PutData, [response, json]);
	},
	
	_send: function(method, params, moreParams, argsObject, successCallback) {
		this.fireEvent(CIEvent.RequestingData, [method, params, moreParams, argsObject]);
		new Request.JSON({
			method: method,
			url: this[method+'URLFn'](argsObject),
			data: params.set('_method', method).getClean(),
			link: this.getControllerForMethod(method).requestMode,
			onFailure: function(xhr) {
				if (this.indicator) this.indicator.hide();
				this.fireAndForward(CIEvent.RequestFailed, [xhr]);
			}.bind(this), 
			onSuccess: function(response, json) {
				successCallback(this, method, response, json);
			}.bind(this),
			onComplete: function(xhr) {
				if (this.indicator) this.indicator.hide();
				this.fireAndForward(CIEvent.RequestedData, [xhr])
			}.bind(this)
		}).send();
	},
	
	/*
		Function: send(method, moreParams, argsObject)
		Make the specified request and include more parameters if passed.
		<CIApplication.baseParams> overrides paramsFn which overrides moreParams.
		
		Parameters:
			method - *String*. The lowercase HTTP verb to use. Default is 'get'.
			moreParams - *Object* or *Hash*. The parameters to pass to the request. Is overriden by the verb's paramsFn. Default is {}.
			argsObject - *Anything*. The contextual object to pass to the verb's paramsFn and urlFn
			
		Events:
			- <CIEvent.RequestedData>
			- <CIEvent.GotData>
			- <CIEvent.PostedData>
			- <CIEvent.PutData>
			- <CIEvent.DeletedData>
			- <CIEvent.RequestFailed>
		
		Returns:
			This CIRequest
	*/
	send: function(method, moreParams, argsObject) {
		method = method || 'get';
		var params = $H(moreParams);
		params.extend(this[method+'ParamsFn'](argsObject)).extend(CIApplication.baseParams);
		if (this.indicator) this.indicator.show();
		
		var controller = this.getControllerForMethod(method);
		params.extend(controller.reset().getParams());
		controller.complete = this._requestSuccess.bind(this);
		controller.request = function(request) {
			params = this.updateParams(params);
			request._send(method, params, moreParams, argsObject, this.successCallback.bind(this));
		};
		controller.request(this);
		
		return this;
	}
});
/*
	Function: CIRequest.isValidHTTPMethod(method)
	Tests if the passed method is a valid HTTP method. get, post, put, delete.
	
	Parameters:
		method - *String*. A lowercase HTTP verb. Valid values are 'get', 'post', 'put', or 'delete'.
	
	Returns:
		true or false
*/
CIRequest.isValidHTTPMethod = function(method) {
	return ['get','post','put','delete'].contains(method);
};


/*
	Class: CIRequestController
	A request controller is a simple state machine that controls the behavior of a <CIRequest>'s request.
	For instance, a request controller might update a specific component when a certain amount of data has been received.
	CIRequestController should never be instantiated, only subclassed. *Extends <CIObject>*.
	
	Properties:
		requestMode - *String*. What to do with subsequent requests. See Mootools.Request. Default is 'ignore'.
		
	Topic: States
	- Inactive - no request is in progress. Call request to initiate a request.
	- Active - a request is in progress or has finished. Call complete to return to inactive state.
	
	Topic: Subclassing
	All CIRequestController subclasses must respond to six methods, four of which 
	the subclass is responsible for if the CIRequestController is being used by a <CIRequest>.
	
	getParams - called by <CIRequest> immediately before the first request to retrieve the Object of parameters the controller needs to send. Cannot be overriden by any other set of parameters.
	updateParams - called by <CIRequest> each time a request is issued so the controller has a chance to update its required parameters accordingly.
	reset - to reset the controller to its inactive state. If overriding, subclasses should reset any relevant properties and call this.parent() to delete the other activation functions. Must be idempotent.
	request - to initiate an HTTP request and move the controller to its active state. If the subclasse is used by <CIRequest>, it should not be defined.
	successCallback - called by <CIRequest> whenever a request successfully completes. Subclasses must respond to it until it calls complete. Beware of inifinite loops here!
	complete - called only by successCallback when no more requests should be issued. It should call reset. If the subclass is used by <CIRequest>, it should not be defined.
*/
var CIRequestController = new Class({
	Extends: CIObject,
	
	/*
		Constructor: initialize(configuration)
		
		Configuration:
			requestMode - *String*. What to do with subsequent requests. See Mootools.Request. Default is 'ignore'.
	*/
	initialize: function(configuration) {
		this.parent({});
		this.isA('CIRequestController');
		this.synthesize({
			requestMode: 'ignore'
		}, configuration);
		this.reset();
	},
	
	/*
		Function: reset()
		Returns the controller to its inactive state from any state by deleting its request and complete functions.
		
		Returns:
			This CIRequestController
	*/
	reset: function() {
		delete this.request;
		delete this.complete;
		this.complete = function() {
			throw new ReferenceError('Called an undefined complete method on ' + this.id);
		};
		this.request = function() {
			throw new ReferenceError('Called an undefined request method on ' + this.id);
		};
		return this;
	},
	
	/*
		Function: getParams()
		Returns an Object of the additional parameters needed by this controller.
		
		Returns:
			An empty Object {}.
	*/
	getParams: function() { return {}; },
	
	/*
		Function: updateParams(hash)
		Updates the parameters Hash passed to it and returns it.
		
		Parameters:
			hash - *Hash*. The Hash of parameters for this request.
			
		Returns:
			The unmodified Hash
	*/
	updateParams: function(hash) { return hash; }
});

/*
	Class: CIStandardRequestController
	The default request controller. It retains all defaults of <CIRequestController> except for
	the addition of successCallback. *Extends <CIRequestController>*.
*/
var CIStandardRequestController = new Class({
	Extends: CIRequestController,
	
	/*
		Constructor: initialize()
	*/
	initialize: function() {
		this.parent({});
		this.isA('CIStandardController');
		this.reset();
	},
	
	/*
		Function: successCallback(request, method, response, json)
		The success callback for a standard request. It just calls <CIRequestController.complete>, passing method, response and json.
		
		Parameters:
			request - *<CIRequest>*. The <CIRequest> object that is using this controller
			method - *String*. The lowercase HTTP verb of this request
			response - *Object*. The JSON object returned by the request
			json - *String*. The JSON string returned by the request
	*/
	successCallback: function(request, method, response, json) {
		this.complete(method, response, json);
	}
});

/*
	Class: CIChunkRequestController
	A more complex request controller that loads data in discrete chunks. Once data is loaded,
	it updates its target with its current buffer. It continues to request data by calling request until the server indicates
	there is no more data. The server is told the chunk position and size and must respond with a specific JSON object.
	*Extends <CIRequestController>.
	
	Topic: Request Parameters
	The request provided with two parameters that track the controller's position in the data set.
	
	CIChunkRequestControllerPosition - *Number*. The position property of the CIChunkRequestController. This is updated in updateParams.
	CIChunkRequestControllerChunkSize - *Number*. The size property of the CIChunkRequestController. 
	
	Topic: Response
	The request is expected to respond with a JSON Object containing two properties.
	
	CIChunkRequestControllerChunkTotal - *Number*. The total number of records transferred so far. The server is expected to keep up with this number.
	CIChunkRequestControllerCollection - *Array*. The data of this chunk in an Array.
	
	Properties:
		requestMode - *String*. See <CIRequestController.requestMode>. Default is 'chain'.
		size - *Number*. The number of items expected from in each chunk. Default is 10.
		target - *<CIObject>*. The target object to update with the buffer after each chunk. It can be usefully omitted for a request that simply loads a large amount of data incrementally.
		property - *String*. The key-value-compliant property on target to update. Default is 'collection'.
	
*/
// TODO Create CIProgressRequestController, which also chunks but indicates numerical progress instead of chunks of data
var CIChunkRequestController = new Class({
	Extends: CIRequestController,
	
	/*
		Constructor: initialize(configuration)
		
		Configuration:
			requestMode - *String*. See <CIRequestController.requestMode>. Default is 'chain'.
			size - *Number*. The number of items expected from in each chunk. Default is 10.
			target - *<CIObject>*. The target object to update with the buffer after each chunk.
			property - *String*. The key-value-compliant property on target to update. Default is 'collection'.
			position - *Number*. The current position in the sequence of requests. Used with the request's response to determine the chunks remaining. Reset to 1 when reset is called.
			buffer - *Array*. The data returned from the request so far. Reset to [] when reset is called.
	*/
	initialize: function(configuration) {
		this.parent(configuration);
		this.isA('CIChunkController');
		this.synthesize({
			size: 10,
			requestMode: 'chain',
			target: null,
			property: 'collection'
		}, configuration);
		this.reset();
	},
	
	/*
		Function: reset()
		Resets the request controller to its inactive state. Its position and buffer are reset to 1 and [], respectively.
		
		See Also: <CIRequestController>
	*/
	reset: function() {
		delete this.buffer;
		this.synthesize({ position: 1, buffer: [] });
		return this.parent();
	},
	
	/*
		Function getParams()
		Returns a parameters Object containing CIChunkRequestControllerPosition and CIChunkRequestControllerChunkSize.
		
		Returns:
			Object
	*/
	getParams: function() {
		return {
			'CIChunkRequestControllerPosition': this.position,
			'CIChunkRequestControllerChunkSize': this.size
		};
	},
	
	/*
		Function: updateParams(params)
		Updates the CIChunkRequestControllerPosition key in the parameters hash with the current position.
		
		Returns:
			Hash
	*/
	updateParams: function(params) {
		return params.set('CIChunkRequestControllerPosition', this.position);
	},
	
	/*
		Function: successCallback(request, method, response, json)
		Called after each successful request. It gives the next chunk of data to the target if necessary and checks to see if
		all the data has been loaded. If not, it updates its position and calls request again. If all data has been loaded, it
		calls complete with the method and the buffer. If the request's response is malformed, it will fire <CIEvent.RequestFailed>
		and throw an error.
		
		Throws:
			ReferenceError - if the response is not an Object with CIChunkRequestControllerChunkTotal and CIChunkRequestControllerCollection properties.
	*/
	successCallback: function(request, method, response, json) {
		var total = response['CIChunkRequestControllerChunkTotal'];
		if (!$defined(total)) {
			request.fireEvent(CIEvent.RequestFailed);
			throw new ReferenceError(this.id + ' could not access response.CIChunkRequestControllerChunkTotal. ' + request.id + ' has failed.');
		}
		if (!$defined(response['CIChunkRequestControllerCollection'])) {
			request.fireEvent(CIEvent.RequestFailed);
			throw new ReferenceError(this.id + ' could not access response.CIChunkRequestControllerCollection. ' + request.id + ' has failed.');
		}
		total = total.toInt();
		var chunks = (total / this.size).floor();
		if ((total % this.size) != 0) chunks++;
		this.buffer.extend($splat(response['CIChunkRequestControllerCollection']));
		
		if (this.target) this.target.set(property, this.buffer);
		
		if (chunks == this.position) {
			this.complete(method, this.buffer, null);
		} else {
			this.position++;
			this.request(request);
		}
	}
});/*
	File: CIRect.js
	Defines CIRect and its convenience functions
*/

/*
	Class: CIRect
	A CIRect defines the size, origin, clipping and positioning for an object, usually a CIView. CIRect provides several
	convenience methods for building <CIResizeBehavior>s. *Extends <CIObject>*. 
*/
var CIRect = new Class({
	Extends: CIObject,
	
	/*
		Constructor: initialize(configuration)
		
		Configuration:
			minWidth - *Integer or <CIResizeBehavior>*. The minimum width of the CIRect.
			width - *Integer or <CIResizeBehavior>*. The width of the CIRect.
			height - *Integer or <CIResizeBehavior>*. The height of the CIRect.
			x - *Integer or <CIResizeBehavior>*. The horizontal position of the CIRect.
			y - *Integer or <CIResizeBehavior>*. The vertical position of the CIRect.
			clipping - *String*. The <CIClippingBehavior> of the CIRect. Defaults to <CIClippingBehavior.Clip>.
			position - *String*. The <CIPositioningBehavior> of the CIRect.
	*/
	initialize: function(configuration) {
		this.parent(configuration);
		this.isA('CIRect');
		this.synthesize(['minWidth','width', 'height', 'x','y',], configuration);
		this.synthesize({
			clipping: CIClippingBehavior.Clip,
			positioning: null
		}, configuration);
	},
	
	/*
		Function: toCssStylesObject(css, superview)
		Convert this CIRect to an Object defining CSS Styles
		
		Parameters:
			css - *Object*. Optional CSS styles to override or extend the generated styles
			superview - *CIView*. Optional superview the CIRect will use when resolving <CIResizeBehavior>s
		
		Returns:
			Object
		
		Example:
		(start code)
		new CIRect({
			width: 100, height: 150, y: 20
		}).toCssStylesObject({
			color: 'red', width: 150
		}) => {
			width: 150,
			height: 150,
			y: 20,
			color: 'red'
		}
		(end)
	*/
	toCssStylesObject: function(css, superview) {
		this.superview = superview;
		css = $pick(css, {});
		
		var styles = new Hash();
		if ($defined(this.minWidth)) {
			styles.set('min-width', this.getMinWidth());
		}
		if ($defined(this.width)) {
			//styles.set('max-width', this.getWidth());
			styles.set('width',		this.getWidth());
		}
		if ($defined(this.height)) {
			//styles.set('min-height', this.getHeight());
			//styles.set('max-height', this.getHeight());
			styles.set('height',	 this.getHeight());
		}
		
		if (CIClippingBehavior.clippingBehaviors.contains(this.clipping)) styles.set('overflow', this.clipping);
		
		styles.set('top',  this.getY());
		styles.set('left', this.getX());
		if (this.hasOrigin()) styles.set('position', 'absolute');
		
		if (CIPositioningBehavior.positioningBehaviors.contains(this.positioning)) styles.set('position', this.positioning);
		
		styles.extend(css);

		return styles.getClean();
	},
	
	/*
		Function: isEmpty()
		Tests if this CIRect is of an empty size and does not have an origin
		
		Returns:
			true or false
	*/
	isEmpty: function() { return this.isEmptySize() && this.isEmptyPoint(); },
	
	/*
		Function: isEmptySize()
		Tests if this CIRect is of an empty size (no width nor height)
		
		Returns:
			true or false
	*/
	isEmptySize: function() { return !this.hasSize(); },
	
	/*
		Function: isEmptyPoint()
		Tests if this CIRect does not have an origin (no x nor y)
		
		Returns:
			true or false
	*/
	isEmptyPoint: function() { return !this.hasOrigin(); },
	
	
	/*
		Function: hasSize()
		Tests if this CIRect has a size (width and height)
		
		Returns:
			true or false
	*/
	hasSize: function() { return $defined(this.width) && $defined(this.height); },
	
	/*
		Function: hasOrigin()
		Tests if this CIRect has an origin (x and y)
		
		Returns:
			true or false
	*/
	hasOrigin: function() { return $defined(this.x) && $defined(this.y) },
	
	/*
		Function: getHeight()
		*Accessor Override*. Returns the height of this CIRect, resolving its <CIResizeBehavior> if necessary
		
		Returns:
			Number
	*/
	getHeight: function() { return $defined(this.height) ? this.height.toInteger(this.superview) : 0; },
	
	/*
		Function: getMinWidth()
		*Accessor Override*. Returns the minimum width of this CIRect, resolving its <CIResizeBehavior> if necessary
		
		Returns:
			Number
	*/
	getMinWidth: function() { return $pick(this.minWidth, this.getWidth()); },
	/*
		Function: getWidth()
		*Accessor Override*. Returns the width of this CIRect, resolving its <CIResizeBehavior> if necessary
		
		Returns:
			Number
	*/
	getWidth: function() { return this.width != null ? this.width.toInteger(this.superview) : 0; },
	
	/*
		Function: getX()
		*Accessor Override*. Returns the horizontal position of this CIRect, resolving its <CIResizeBehavior> if necessary
		
		Returns:
			Number
	*/
	getX: function() { return this.x != null ? this.x.toInteger(this.superview) : 0; },
	/*
		Function: getY()
		*Accessor Override*. Returns the vertical position of this CIRect, resolving its <CIResizeBehavior> if necessary
		
		Returns:
			Number
	*/
	getY: function() { return this.y != null ? this.y.toInteger(this.superview) : 0; }
});

/*
	Topic: <CIResizeBehavior> Convenience Methods
	CIRect provides several methods for the most common resizing behaviors for both width and height.
	
	Function: CIRect.WidthOfWindow()
	Resize width to the width of the window
	
	Function: CIRect.HeightOfWindow()
	Resize height to the height of the window
	
	Function: CIRect.WidthOfSuperview()
	Resize width to the width of the view's parent view (superview)
	
	Function: CIRect.HeightOfSuperview()
	Resize height to the height of the view's parent view (superview)
	
	Function: CIRect.WidthOfView(view)
	Resize width to the width of the specified view
	
	Function: CIRect.HeightOfView(view)
	Resize height to the height of the specified view
	
	Function: CIRect.TallestSubviewOfView(view)
	Resize height to the height of the tallest subview of the specified view.
	*Note:* This does not return a CIResizeBehavior, but an anonymous object that responds to toInteger() and compares the subviews' heights.
*/
CIRect.WidthOfWindow = function() { return new CIResizeBehavior({ action: 'getWidth', target: window }) };
CIRect.HeightOfWindow = function() { return new CIResizeBehavior({ action: 'getHeight', target: window }) };
CIRect.WidthOfSuperview = function() { return new CIResizeBehavior({ action: 'getWidth', willReceiveView: true }); };
CIRect.HeightOfSuperview = function() { return new CIResizeBehavior({ action: 'getHeight', willReceiveView: true }); };
CIRect.WidthOfView = function(view) { return new CIResizeBehavior({ action: 'getWidth', target: view }) };
CIRect.HeightOfView = function(view) { return new CIResizeBehavior({ action: 'getHeight', target: view }) };
CIRect.TallestSubviewOfView = function(superview) {
	// Construct an anonymous object to do the comparison and implement toInteger
	var comparator = function(theView) {
		this.view = theView;
		this.compare = function() {
			var tallest = 0;
			if (this.view) this.view.subviews.each(function(subview) {
				var h = subview.getHeight().toInteger();
				if (h > tallest) tallest = h;
			});
			return tallest;
		};
		// This is the key -- CIRect#toCssStylesObject will call toInteger on the value of TallestSubviewOf, no matter what the value is
		this.toInteger = function() { return this.compare(); }
	};
	return new comparator(superview);
};


/*
	Class: CIClippingBehavior
	CIClippingBehavior is an Object of String constants that define the available behaviors
	when a <CIView>'s content exceeds the boundaries defined by its <CIRect>.
	
	Constants: Clipping Behaviors
	<CIRect.clipping> determines what happens when the content exceeds the boundaries of the CIRect.
	
	CIClippingBehavior.AutoScroll 	- Use scrollbars, but only show them when scrolling is necessary
	CIClippingBehavior.Clip			- Clip the excess content at the boundaries of the CIRect. This is CIRect's default.
	CIClippingBehavior.Scroll		- Use scrollbars
	CIClippingBehavior.DoNotClip	- Do not clip the excess content
*/
CIClippingBehavior = {
	'AutoScroll': 'auto',
	'Clip': 'hidden',
	'Scroll': 'scroll',
	'DoNotClip': 'visible'
};
CIClippingBehavior.clippingBehaviors = $H(CIClippingBehavior).getValues();

/*
	Class: CIPositioningBehavior
	CIPositioningBehavior is an Object of String constants that define how a <CIView> can be positioned in the page.
	
	Constants: Positioning Behaviors
	<CIRect.positioning> determines how the <CIView> will be positioned.
	
	CIPositioningBehavior.Flow 		- Flow from left to right, top to bottom and ignore the CIRect's X and Y. This is CIRect's default when <CIRect.isEmptyPoint> is true.
	CIPositioningBehavior.Absolute	- Position the view from the top-left corner of the page. This is CIRect's default when <CIRect.hasOrigin> is true.
	CIPositioningBehavior.Relative	- Position the view from the top-left corner of the view's superview.
	CIPositioningBehavior.Fixed		- Position the view from the top-left corner of the page and do not scroll it within the browser window.
*/
CIPositioningBehavior = {
	'Flow': 'static',
	'Absolute': 'absolute',
	'Relative': 'relative',
	'Fixed': 'fixed'
}
CIPositioningBehavior.positioningBehaviors = $H(CIPositioningBehavior).getValues();/*
	File: CIRequestable.js
	A mixin that allows any <CIObject> to be configured with HTTP verbs and retrofitted with a <CIRequest> object.
*/

/*
	Interface: CIRequestable
	CIRequestable allows any <CIObject> to be configured using HTTP verbs in the same manner as a <CIRequest> object,
	then creates a hidden <CIRequest> object inside the host with the complete configuration.
	The six request-related <CIEvent>s are fired on the host object when fired by the internal <CIRequest>.
	
	Properties:
		_request - *<CIRequest>*. The hidden request object to configure
		
	See Also:
		<CIRequest>
		Mootools.Class.implement
		
	Example:
	(start code)
	var SmartCat = new Class({
		Extends: CIObject,
		Implements: CIRequestable,
		
		initialize: function(configuration) {
			...
			this._makeRequestable(configuration);
		},
		download: function() { this._request.get() }
	});
	var cat = new SmartCat({
		get: '/url',
		post: {
			url: '/url',
			params: function() { return { foo: 'bar' }; }
		}
	});
	cat.download();
*/
var CIRequestable = new Class({
	/*
		Function: _makeRequestable(configuration, allowedMethods)
		Parse configuration for the allowed HTTP verbs then retrofit the <CIRequest> into this object.
		
		Parameters:
			configuration - *Object*. the configuration of the host CIObject.
			allowedMethods - *Array*. The allowed HTTP verbs as lowercase Strings. Defaults to ['get', 'post', 'delete', 'put', 'destroy']
	*/
	_makeRequestable: function(configuration, allowedMethods) {
		allowedMethods = $splat(allowedMethods);
		if (allowedMethods.length == 0) allowedMethods = ['get', 'post', 'delete', 'put', 'destroy'];
		
		var config = { requestor: this };
		allowedMethods.each(function(method) {
			if (!$defined(configuration[method])) {
				return;
			} else if (configuration[method].isCIObject && configuration[method].isOfType('CIRequest')) {
				this._request = configuration[method];
			} else {
				config[method] = configuration[method];
			}
		}.bind(this));
		if (!$defined(this._request)) this._request = new CIRequest(config);

		// Fire-by-proxy the events on the implementing object
		this._request.addEvent(CIEvent.RequestedData, function(xhr) { this.fireEvent(CIEvent.RequestedData, [xhr]); }.bind(this));
		this._request.addEvent(CIEvent.RequestFailed, function(xhr) { this.fireEvent(CIEvent.RequestFailed, [xhr]); }.bind(this));
		[CIEvent.GotData, CIEvent.PostedData, CIEvent.DeletedData, CIEvent.PutData].each(function(event) {
			this._request.addEvent(event, function(o,j) { this.fireEvent(event, [o,j]); }.bind(this));
		}.bind(this))
	}
});/*
	File: CIResizeBehavior.js
	CIResizeBehavior delegates the computation of a <CIRect>'s dimensions
*/

/*
	Class: CIResizeBehavior
	CIResizeBehavior allows a <CIRect> to calculate the *integer* value of a target variable at any given time
	by delegating the retrieval of the variable to a function. Though CIResizeBehavior can be used
	with any object, it has special logic for the delayed receipt of a <CIView> as a target.
	*Extends <CIObject>*.
	
	Properties:
		target - *<CIObject>*. The target is the object on which to call _action_.
		action - *String*. The function or property to call on _target_.
		additions - *Array*. Integer additions to perform on the target value (target.action). See <plus>.
		subtractions - *Array*. Integer subtractions to perform on the target value (target.action). See <minus>.
		willReceiveView - *Boolean*. Set to true to indicate this CIResizeBehavior will receive a view as a target later on, when <toInteger> is called. Defaults to false.
	
	Example:
		The following is the definition for <CIRect.WidthOfView>
	(start code)
	CIRect.WidthOfView = function(view) {
		return new CIResizeBehavior({
			action: 'getWidth',
			target: view
		});
	};
	(end)
*/	
var CIResizeBehavior = new Class({
	Extends: CIObject,
	
	/*
		Constructor: initialize(configuration)
		
		Configuration:
			target - *<CIObject>*. The target is the object on which to call _action_.
			action - *String*. The function or property to call on _target_.
			additions - *Array*. Integer additions to perform on the target value (target.action). See <plus>.
			subtractions - *Array*. Integer subtractions to perform on the target value (target.action). See <minus>.
			willReceiveView - *Boolean*. Set to true to indicate this CIResizeBehavior will receive a view as a target later on, when <toInteger> is called. Defaults to false.
	*/
	initialize: function(configuration) {
		this.parent(configuration);
		this.isA('CIResizeBehavior');
		this.synthesize(['action', 'target'], configuration);
		//this.target = this._lambdaCreator(this.target);
		this.synthesize({
			additions: [],
			subtractions: [],
			willReceiveView: false
		}, configuration);
		this.additions = $splat(this.additions).map(this._lambdaCreator);
		this.subtractions = $splat(this.subtractions).map(this._lambdaCreator);
	},
	
	_lambdaCreator: function(y) {
		// Can't use $lambda on functions because it breaks the this reference, even if you re-bind it
		return $type(y) == 'function' ? y : $lambda(y);
	},
	
	/*
		Function: targetValue()
		Call _action_ on _target_ regardless of it being a function or property. CIResizeBehavior is intended to work with *Numbers*.
		
		Returns:
			*Number*
	*/
	targetValue: function() {
		if (this.target == null) return null;
		if ($type(this.target[this.action]) == 'function')
			return this.target[this.action]();
		else
			return this.target[this.action];
	},
	
	/*
		Function: plus(x)
		Enqueue an addition to perform on the target value.
		
		Parameters:
			x - *Number* or *Function*. The value to add to the target value. A function may be passed in order to create a closure, but it must return a *Number*.
		
		Returns:
			This CIResizeBehavior
			
		Example:
		(start code)
		var rubberBand = new CIResizeBehavior({
			action: 'getWidth', target: aView
		}).plus(20).plus(function () { return anotherView.getWidth() / 2; });
		(end)
	*/
	plus: function(x) { this.additions.push(this._lambdaCreator(x)); return this; },
	/*
		Function: minus(x)
		Enqueue a subtraction to perform on the target value.
		
		Parameters:
			x - *Number* or *Function*. The value to subtract from the target value. A function may be passed in order to create a closure, but it must return a *Number*.
		
		Returns:
			This CIResizeBehavior
		
		Example:
		(start code)
		var rubberBand = new CIResizeBehavior({
			action: 'getHeight', target: aView
		}).minus(function() { return window.getHeight() / 2; });
		(end)
	*/
	minus: function(x) { this.subtractions.push(this._lambdaCreator(x)); return this; },
	
	/*
		Function: toInteger(view)
		This retrieves the target value then performs additions and subtractions.
		If willReceiveView is true and a <CIView> is passed, the view is assigned to target.
		This delayed assignment is used for calculating super and subview dimensions.
	*/
	toInteger: function(view) {
		if (this.willReceiveView && view) this.target = view;
		var x = this.targetValue();
		if (x == null) return null;
		
		this.additions.each(function(addition) { x += addition().toInt(); });
		this.subtractions.each(function(subtraction) { x -= subtraction().toInt(); });
		return x;
	}
});/*
	File: CIView.js
	A CIView is a generic visual component
*/

/*
	Class: CIView
	CIView is CIP's generic visual component. It combines almost every other foundation class. *Extends <CIObject>*.
	
	Properties:
		frame - *<CIRect>*. The dimensions of the view.
		subviews - *<Array>*. Other CIViews inside of this view that are updated by this view (their superview).
		style - *CIStyle*. The style rules for this view.
		resizable - *Boolean*. Whether this view is affected when the window is resized. Use with caution as resizing is an expensive operation!
*/
var CIView = new Class({
	Extends: CIObject,
	
	/*
		Constructor: initialize(configuration)
		
		Configuration:
			frame - *<CIRect>*. The dimensions of the view. Defaults to new CIRect().
			subviews - *<Array>*. Other CIViews inside of this view that are updated by this view (their superview). Defaults to empty Array [].
			style - *CIStyle*. The style rules for this view. Defaults to CIView.Style.
			resizable - *Boolean*. Whether this view is affected when the window is resized. Use with caution as resizing is an expensive operation! Defaults to false.
	*/
	initialize: function(configuration) {
		configuration = configuration || {}
		this.parent(configuration);
		this.isA('CIView');
		this.synthesize({
			frame: new CIRect(),
			subviews: [],
			style: CIView.Style,
			resizable: false,
			firstResponder: null
		}, configuration);
		this.setResizable(this.resizable);
		this.frame = new CIRect(configuration.frame);
		this.subviews = $splat(configuration.subviews);
		this.cssClass = configuration.cssClass || '';
		this.cssStyles = CIObject.interpretStyles(configuration.cssStyles);
		this.addEvent(CIEvent.Shown, function() {
			if (this.firstResponder && this.firstResponder.giveFocus) this.firstResponder.giveFocus();
		}.bind(this));
	},
	
	/*
		Function: setSubviews(newSubviews)
		This accessor override ensures subviews is an Array.
		
		Parameters:
			newSubviews - *Array*. The replacement subviews.
		
		Returns:
			This CIView
	*/
	setSubviews: function(newSubviews) {
		return this.set('subviews', $splat(newSubviews).clean());
	},
	
	/*
		Function: addSubview(newSubview)
		Add newSubview to the end of subviews (push)
		
		Parameters:
			newSubview - *<CIView>*. The subview to add to subviews.
			
		Returns:
			This CIView
	*/
	addSubview: function(newSubview) {
		this.subviews.push(newSubview);
		this.subviews = this.subviews.clean();
		return this;
	},
	
	/*
		Function: addSubviewToBeginning(newSubview)
		Push newSubview into the beginning of subviews (unshift).
		
		Parameters:
			newSubview - *<CIView>*. The subview to add to subviews.
			
		Returns:
			This CIView
	*/
	addSubviewToBeginning: function(newSubview) {
		this.subviews.unshift(newSubview);
		this.subviews = this.subviews.clean();
		return this;
	},
	
	/*
		Function: setResizable(isResizable)
		This accessor override manages the attachment of the resize event on the window.
		
		Parameters:
			isResizable - *Boolean*. Whether this view is affected by window resizing.
			
		Returns:
			This CIView
	*/
	setResizable: function(isResizable) {
		// this._windowResized is not defined at construction
		if (!this._boundWindowResizedFunction) this._boundWindowResizedFunction = this._windowResized.bind(this)
		this.set('resizable', isResizable);
		// We manage the event for performance
		if (this.resizable) {
			window.addEvent('resize', this._boundWindowResizedFunction);
		} else {
			window.removeEvent('resize', this._boundWindowResizedFunction);
		}
		return this;
	},
	
	
	_windowResized: function(event) {
		this.fireEvent(CIEvent.Resizing, [event]);
		this._viewResized();
		this.fireEvent(CIEvent.Resized, [event]);
	},
	
	/*
		Function: _viewResized(superview)
		This method may be overriden in CIView subclasses to implement custom resizing logic, though it usually does not need to be.
		It calculates the new view size by calling <CIRect.toCssStylesObject> on this view's frame, updates its Element, then
		calls _viewResized on its subviews, passing itself as the superview.
		
		Parameters:
			superview - *<CIView>*. This view's superview. The most ancestral view will not receive a superview.
	*/
	_viewResized: function(superview) {
		if (!$defined(this.element())) return;
		var newSize = this.frame.toCssStylesObject({}, superview);
		//console.log('Called ancestor _viewResized on ', this.id);

		this.element().setStyles(newSize);
		// subviews can be any subclass of Enumerable. Loop needs to be optimized
		if ($defined(this.subviews)) this.subviews.each(function(view) { view._viewResized(this); }.bind(this));
	},
	
	/* 
		Function: show()
		Show the CIView's Element in the window.
		
		Fires:
			- <CIEvent.Showing>
			- <CIEvent.Shown>
			
		Returns:
			This CIView
	*/
	show: function() {
		var elem = $(this.id);
		if (elem) {
			this.fireEvent(CIEvent.Showing);
			elem.show();
			this.fireEvent(CIEvent.Shown);
		}
		return this;
	},
	
	/* 
		Function: hide()
		Hide the CIView's Element in the window
		
		Fires:
			- <CIEvent.Hiding>
			- <CIEvent.Hidden>
			
		Returns:
			This CIView
	*/
	hide: function() {
		var elem = $(this.id);
		if (elem) {
			this.fireEvent(CIEvent.Hiding);
			elem.hide();
			this.fireEvent(CIEvent.Hidden);
		}
		return this;
	},
	
	/* 
		Function: toggle()
		Toggle the display of the CIView's Element using <CIView.show> and <CIView.hide>
		
		Returns:
			This CIView
	*/
	toggle: function() {
		var elem = $(this.id);
		if (elem && (elem.getStyle('display') == 'none'))
			return this.show();
		else if (elem)
			return this.hide();
	},
	
	_makeElement: function(parent) {
		styles = this.frame.toCssStylesObject();
		styles.position = 'relative';
		
		var view = new Element('div', {
			id: this.id,
			'class': 'CIView',
			'styles': styles
		});
		parent.adopt(view);
		
		this.render();
		return view;
	},
	
	/*
		Function: unrender()
		Remove this view's content from the window.
		
		Fires:
			<CIEvent.Unrendered>
		
		Returns:
			This CIVIew
	*/
	unrender: function() {
		if (!this.element()) return null;
		this.element().empty();
		this.fireEvent(CIEvent.Unrendered);
		return this;
	},
	
	/*
		Function: unrender()
		First calls unrender, then draws this view's content in the window by calling <CIObject.element> on its superviews,
		passing this view's Element as the parent Element.
		
		Fires:
			<CIEvent.Unrendered>
			<CIEvent.Rendered>
			
		Returns:
			This CIVIew
	*/
	render: function(newViews) {
		this.unrender();
		if (!this.element()) return null;
		this.subviews.each(function(view) {
			view.superview = this;
			view.element(this.element());
		}.bind(this));
		this._viewResized();
		this.fireEvent(CIEvent.Rendered);
	},
	
	getWidth: function() {
		if (this.frame.width) {
			return this.frame.getWidth();
		} else {
			return this.element() ? this.element.getWidth() : 0;
		}
	},
	getHeight: function() {
		if (this.frame.height) {
			return this.frame.getHeight();
		} else {
			return this.element() ? this.element().getHeight() : 0;
		}
	},
	
	/*
		Function: _objectForViewBaseElement: function(additional)
		Get an Object you can use as the HTML attributes Object for the base
		Element of a <CIView>. Includes id, class and styles. Pass an Object
		for additional attributes or to override the defaults. This is a
		convenience method so you don't forget to set these attributes when
		subclassing <CIView>.
		
		Parameters:
			additional - *Object*. Additional attributes with which to extend the attributes Object. You can also override the attributes Object using this Object.
		
		Returns:
			Object
	*/
	_objectForViewBaseElement: function(additional) {
		var o = {
			'id': this.id,
			'class': this.__className,
			'styles': this.frame.toCssStylesObject()
		};
		return $extend(o, $pick(additional, {}));
	}
});

CIView._zIndexCounter = 100;
/*
	Function: CIView.nextZIndex()
	Get the next highest z-index.
	
	Returns:
		Number
*/
CIView.nextZIndex = function() { return CIView._zIndexCounter++; }

/*
	Class: CIElement
	A wrapper around Mootools' Element that extends <CIView> for use within CIP. Has exact
	same constructor as Mootools.Element. *Extends <CIView>*.
	
	Properties (none are synthesized):
		tag - *String*. The HTML tag to create.
		config - *Object* or *Hash*. The HTML configuration.
*/
var CIElement = new Class({
	Extends: CIView,
	
	/*
		Constructor: initialize
		
		Parameters:
			tag - String. The HTML tag.
			config - Hash. The HTML configuration passed to Element
	*/
	initialize: function(tag, config) {
		this.parent(config);
		this.isA('CIElement');
		this.tag = tag;
		this.config = $extend({ id: this.id }, $pick(config, {}));
	},
	
	_makeElement: function(parent) {
		var elem = $H(this.config).getLength() > 0 ? new Element(this.tag, this.config) : new Element(this.tag);
		parent.adopt(elem);
		return elem;
	}
});

// Do a check for html here because if the html property is defined,
// the resulting HTML will be <tag></tag> instead of just <tag/> which
// will create DOM errors for elements like <br/> which cannot have even
// null children/innerHTML
/*
	Function: CIElement.make(tag, html)
	A shortcut function. The same as instantiating a new CIElement with its html property set to _html_.
	
	Returns:
		CIElement
		
	Example:
	(start code)
	new CIElement('p', { html: "Hello World" }) => <p>Hello World</p>
	CIElement.make('p', "Hello World") => <p>Hello World</p>
	CIElement.make('br') => <br/>
*/
CIElement.make = function(tag, html) { return new CIElement(tag, html ? { html: html } : {}); };

/*
	Function: $E(tag, html)
	A legacy shortcut for the shortcut function CIElement.make
*/
function $E(tag, html) { return CIElement.make(tag, html); }/*
	File: constants.js
	Foundational constants
*/

/*
	Constant: kAlphabet
	The English alphabet as an Array of lowercase letters (a-z).
*/
kAlphabet = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];

/*
	Constant: kAlphabetIndexHash
	A Hash mapping each lowercase letter (a-z) with its position in the alphabet (0-26)
*/
kAlphabetIndexHash = new Hash();
kAlphabet.map(function(letter, index) {
	kAlphabetIndexHash.set(letter, index);
});/*
	File: main.js
	<CIApplicationInstance.__main__> function is executed when the DOM is loaded
*/

window.addEvent('domready', CIApplication.__main__);
/*window.addEvent('click', function(event) {
	console.log(event.target);
});*/
/*window.addEvent('keydown', function(event) {
	// Intercept control keys and set their state as being pressed
});
window.addEvent('keyup', function(event) {
	// Intercept control keys and set their state as not being pressed
});*//*
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
});var CIStyle = new Class({
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

CIView.Style = new CIStyle({});/*
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
var CIImageLink = CIImageButton;/*
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
});var CIPopupButton = new Class({
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
});/*
	Class: CISourceList
	Represents a 1-column list of items. Commonly used to select source. Implements CIRequestable only for get.
	
	Properties:
		id - String like CISourceList_#
		collection - Array. The collection of objects in the CISourceList. Set on each get, but can be set in config
		selected - Object. The currently selected object
		selectedElement - Element. The Element representing the currently selected object in the CISourceList
		
		*See configuration for others*
	
	Events:
		- CIClicked
		- CISelected
*/
// TODO create a CICell class for CISourceList, CITable, CIMenu and CIAutocomplete
var CISourceList = new Class({
	Extends: CIView,
	Implements: CIRequestable,
	
	/*
		Constructor: initialize(options)
		
		Configuration:
			get - String or Hash. See <CIRequestable>
			title - String. The title for the CISourceList. Displayed above the toolbar
			toolbar - Hash. The configuration for the toolbar to appear below the title and above the list. Default {}
			labelProperty - String. The property on the received objects to display. Default 'label'
			collection - Array. The collection of objects in the CISourceList. Default []
			identifyBy - String. The property by which to _uniquely_ identify each object in the collection. Default 'id'
	*/
	initialize: function(options) {
		this.parent(options);
		this.isA('CISourceList');
		
		this._makeRequestable(options, 'get');
		this._request.addEvent(CIEvent.GotData, this._onGotData.bind(this));
		this.synthesize({
			noun: null,
			selected: null,
			selectedIndex: null,
			selectedElement: null,
			renderer: null,
			labelProperty: 'label',
			identifyBy: 'id',
			title: 'title',
			style: CISourceList.Style,
			collection: [],
			noDataText: '&nbsp;'
		}, options);
		
		this.toolbar = new CIToolbar(options.toolbar);
		this.subviews = [
			$type(this.title) == 'string' ? new CITitle({ title: this.title }) : this.title,
			this.toolbar
		];
		this.collection = $splat(options.collection);
		this.collectionLength = this.collection.length;
		
		this.addEvent(CIEvent.AddedToDom, this.render);
	},
	
	_makeElement: function(parent) {
		var sourceList = new Element('div', {
			id: this.id,
			'class': 'CISourceList ' + this.cssClass,
			styles: this.frame.toCssStylesObject()
		});
		parent.adopt(sourceList);
		
		var titleContainer = new Element('div', {
			id: this.id + '_CISourceListTitleContainer',
			'class': 'CISourceListTitleContainer'
		});
		sourceList.adopt(titleContainer);
		
		this.subviews[0].element(titleContainer);
		this._request.setIndicator(this.subviews[0].indicator);
		
		this.subviews[1].element(titleContainer);
		
		sourceList.adopt(new Element('div', {
			id: this.id + '_CISourceListCellContainer',
			'class': 'CISourceListCellContainer'
		}));
		
		this.applyStyle();
		return sourceList;
	},
	
	cellContainerElement: function() { return $(this.id + '_CISourceListCellContainer'); },
	titleContainerElement: function() { return $(this.id + '_CISourceListTitleContainer'); },
	titleView: function() { return this.subviews[0]; },
	
	setTitle: function(newTitle) { this.titleView().setTitle(newTitle); },
	
	applyStyle: function(newStyle) {
		var style = newStyle || this.style;
		var container = this.cellContainerElement();
		style.applyBordersOntoElement('solid', container);
	},
	
	removeCells: function() {
		var elems = this.element().getElements('.CISourceListCell');
		for (var i = 0; i < elems.length; i++) elems[i].destroy();
		return this;
	},
	
	setCollection: function(newCollection) {
		this.set('collection', $splat(newCollection));
		this.set('collectionLength', this.collection.length);
		this.render();
	},
	
	_onCellClick: function(event) {
		this.fireEvent(CIEvent.Clicked, [event]);
		var element = event.target.getParent('.CISourceListCell') || event.target;
		if (this.selectedElement) CISelectionStyle.unselect(this.selectedElement);
		this._selectElement(element);
	},
	
	_selectElement: function(element) {
		this.deselect();
		this.set('selectedElement', element);
		this.set('selectedIndex', element.retrieve('CISourceListIndex'));
		this.set('selected', this.collection[this.selectedIndex]);
		
		CISelectionStyle.select(this.selectedElement);
		this.fireEvent(CIEvent.Selected, [this.selected]);
		this.fireEvent(CIEvent.Changed);
	},
	
	_viewResized: function(superview) {
		if (!this.element()) return;
		var newSize = this.frame.toCssStylesObject({}, superview);
		
		this.cellContainerElement().setStyles({
			overflow: 'auto',
			height: newSize.height - this.titleContainerElement().getSize().y
		});
		this.parent(superview);
	},
	
	render: function() {
		var container = this.cellContainerElement();
		this.removeCells();
		
		if (this.collection.length == 0) {
			var cell = new Element('div', {
				'class': 'CISourceListEmptyListCell CISourceListCell',
				styles: { 'font-weight': 'bold', padding: 10, 'text-align': 'center' },
				html: this.noDataText
			});
			container.adopt(cell);
			return this;
		}
		
		for (var counter = 0; counter < this.collection.length; counter++) {
			var item = this.collection[counter];
			var backgroundColor = counter % 2 == 0 ? this.style.get('evenBackgroundColor') : this.style.get('oddBackgroundColor')
			var cell = new Element('div', {
				styles: { 'background-color': backgroundColor },
				'class': 'CISourceListCell'
			});
			cell.store('CISourceListIndex', counter);
			cell.addEvent('click', this._onCellClick.bind(this));
			container.adopt(cell);
			
			var value = $type(item) == 'string' ? item : item[this.labelProperty];
			if (this.renderer) {
				var view = this.renderer(value, item, this);
				view.element(cell);
			} else {
				cell.set('html', value);
			}
			if (this.selected && (this.selected[this.identifyBy] === item[this.identifyBy]))
				this._selectElement(cell);
		}
		this._viewResized(this.superview);
		this.fireEvent(CIEvent.Rendered);
		return this;
	},
	
	_onGotData: function(collection, json) {
		this.setCollection(collection);
	},
	
	reload: function(moreParams) {
		this._request.get();
	},
	
	getData: function(moreParams) { this.reload(moreParams); },
	
	deselect: function() {
		if (this.selectedElement) CISelectionStyle.unselect(this.selectedElement);
		this.selectedElement = null;
		this.selectedIndex = null;
		this.selected = null;
		this.fireEvent(CIEvent.Deselected);
	},
	
	hasObjectWithValue: function(value) {
		for (var i = 0; i < this.collection.length; i++)
			if (this.collection[i][this.identifyBy] == value) return true
			
		return false;
	},
	
	selectByProperty: function(value) {
		for (var i = 0; i < this.collection.length; i++) {
			if (this.collection[i][this.identifyBy] == value) {
				this._selectElement(this.element().getElements('.CISourceListCell')[i]);
				break;
			}
		}
		return this;
	},
	
	selectByIndex: function(index) {
		var elems = this.element().getElements('.CISourceListCell');
		if (elems[index]) this._selectElement(elems[index]);
		return this;
	}
});

CISourceList.Style = new CIStyle({
	evenBackgroundColor: '#FFFFFF',
	oddBackgroundColor: CIStyle.OddColor,
	solidBorders: CIStyle.Left | CIStyle.Right | CIStyle.Bottom,
	borderColor: CIStyle.BorderColor,
	borderSize: 1
});/*
	Class: CIFormField
	Represents a form field. Usually used inside a CIForm, but works just as well alone. It can show a label, padding or spacing, and text before, after and below the field.
	
	Properties:
		id - String like CIFormField_#
		options - The options for type select.
		field - The HTML <input>, <textarea>, or <select> Element
		
		*See configuration for others*
	
	Events:
		- Changed
		- EnterPressed
		- EscapePressed
*/
// TODO Better coverage of Changed
// TODO fire Clicked and GotFocus and LostFocus
var CIFormField = new Class({
	Extends: CIView,
	
	/*
		Constructor: initialize(configuration)
		
		Configuration:
			name - String. The HTTP parameter name to be sent for this field. Default property
			size - Number. The number of characters to show. Only affects types text and password. Default unknown
			property - String. The property on the source object corresponding to this field. Each field must represent a different property.
			type - String. The type of field. Possible values are 'text', 'file', 'password', 'textarea', 'select', 'label', 'checkbox'. Default 'text'
			label - String. The label to display to the left of the field
			value - Mixed. The value to which to set the field
			values - Hash. The values for type checkbox. Default { checked: 'true', unchecked: 'false' }
			form - CIForm. The parent form
			note - String. The text to display underneath the field
			noteBeforeField - String. The text to display to the left of the field, to the right of the label
			noteAfterField - String. The text to display to the right of the field
			options - Hash or Function. The options for type select. Pass a Function to dynamically change the options. Default {}. Specified like: { labelHTML: value }
			rows - Number. The rows attribute for type textarea
			cols - Number. The cols attribute for type textarea
			labelStyles - Hash. The CSS styles to apply to the label. If this CIFormField is a child of a CIForm, the CIForm's labelStyles override. Interpreted by <CIObject.interpretStyles>
			padding - Number. The padding inside each cell. Default 0
			spacing - Number. The spacing inside each cell. Default 5
			autocomplete - CIAutocomplete. The configuration, or CIAutocomplete to use on this text field
	*/
	// TODO implement title type
	initialize: function(options) {
		this.parent(options);
		this.isA('CIFormField');
		
		this.synthesize([
			'name', 'size', 'property', 'label', 'value', 'form', 'note', 'noteBeforeField',
			'noteAfterField', 'field', 'rows', 'cols', 'autocomplete', 'renderer', 'labelStyles',
			'placeholderText'
			], options
		);
		this.synthesize({
			type: 'text',
			values: { checked: 'true', unchecked: 'false' },
			'options': {},
			padding: 0,
			spacing: 5
		}, options);
		this.labelStyles = CIObject.interpretStyles(options.labelStyles);
	},
	/*
		Function: giveFocus()
		Place cursor focus inside this field's field
		
		Returns:
			This CIFormField
	*/
	giveFocus: function() { if (this.field && (this.type != 'custom')) this.field.focus(); return this; },
	
	/*
		Function: setValue(newValue)
		Set the value of this CIFormField, depending on type. Fires <CIEvent.Changed>
		
		Parameters:
			newValue - Mixed. The new value
		
		Returns:
			This CIFormField
	*/
	setValue: function(newValue, object) {
		if (this.type == 'custom') {
			this.field.empty();
			var result = this.renderer(newValue, object);
			if ($type(result) == 'string') result = new CIText(result);
			result.element(this.field);
			return this;
		}
		var htmlValue = this.type == 'label' ? 'html' : 'value';
		var oldValue = this.field.get(htmlValue); // Hopefully this returns a clone
		if (this.type == 'checkbox') {
			this.field.checked = (newValue || '').toString() == this.values.checked;
		} else {
			this.field.set(htmlValue, newValue);
		}
		this.fireEvent(CIEvent.Changed, [newValue, oldValue]);
		return this;
	},
	
	/*
		Function: getValue()
		Retrieves the value of this CIFormField, depending on type.
		
		Returns:
			Mixed, usually String
	*/
	getValue: function() {
		if (this.type == 'checkbox') {
			if (this.field.checked)
				return this.values['checked'];
			else
				return this.values['unchecked'];
		} else if (this.type == 'label') {
			return this.field.get('html');
		} else if (this.type == 'custom') {
			return null;
		} else {
			return this.field.get('value');
		}
	},
	
	/*	Function: _makeElement(parent)
		Parent adopts Element
	*/
	// TODO return <tr> if parent is <table>, otherwise return <div>
	_makeElement: function(parent) {
		this.field = this._makeField();
		
		var tr = new Element('tr', { id: this.id });
		var labelTd = new Element('td', {
			'class': 'CIFormLabel',
			html: this.label || '&nbsp;',
			styles: this.form ? $extend(this.form.labelStyles, this.labelStyles) : this.labelStyles,
			valign: this.note || this.type == 'textarea' ? 'top' : ''
		});
		var fieldTd = new Element('td');
		
		// Add the note before the field element in the field TD
		if (this.noteBeforeField) {
			fieldTd.adopt(new Element('span', {
				'class': 'CIFormFieldNote',
				html: this.noteBeforeField + '&nbsp;'
			}));
		}
		// Add the field
		fieldTd.adopt(this.field);
		if (this.type == 'custom') {
			var result = this.renderer(this.form ? this.form.object : null);
			if ($type(result) == 'string') result = new CIText(result);
			result.element(this.field);
		}
		
		// Add the note after the field
		if (this.noteAfterField) {
			fieldTd.adopt(new Element('span', {
				'class': 'CIFormFieldNote',
				html: '&nbsp;' + this.noteAfterField
			}));
		}
		// Add the note after a line break
		if (this.note) {
			labelTd.setStyle('padding-top', 8);
			fieldTd.adopt(new Element('br')).adopt(new Element('span', {
				'class': 'CIFormFieldNote',
				html: this.note
			}));
		}
		// Adopt both <td>s into the <tr>, then the <tr> into the parent
		tr.adopt(labelTd).adopt(fieldTd);
		if (parent.get('tag') == 'table')
			parent.adopt(tr);
		else {
			var table = new Element('table', {
				cellpadding: this.padding,
				cellspacing: this.spacing,
				styles: { border: 'none' }
			});
			parent.adopt(table.adopt(tr));
		}
		
		return tr;
	},
	
	_makeField: function() {
		var field = null;
		
		switch (this.type) {
		case 'custom':
			field = new Element('div');
		break;
		
		case 'text':
			field = new Element('input', {
				type: 'text',
				'class': 'CIFormField',
				name: this.name,
				size: this.size,
				value: this.value || this.placeholderText
			});
			// Text field specific events:
			field.addEvent('keypress', function(event) {
				//this.fireEvent(CIEvent.KeyPressed, [event]);
				this.fireEvent(CIEvent.Changed);
				if (event.key == 'enter') {
					this.fireEvent(CIEvent.EnterPressed, [event]);
				} else if (event.key == 'esc') {
					this.fireEvent(CIEvent.EscapePressed, [event]);
				}
			}.bind(this));
			if (this.autocomplete) {
				this.autocomplete = this.autocomplete.isCIObject ? this.autocomplete : new CIAutocomplete(this.autocomplete);
				this.autocomplete.bindTo(this);
			}
		break;
		
		case 'textarea':
			field = new Element('textarea', {
				'class': 'CIFormField',
				name: this.name,
				rows: this.rows,
				cols: this.cols,
				value: this.value
			});
		break;
		
		case 'file':
			field = new Element('input', {
				type: 'file',
				'class': 'CIFormField',
				name: this.name,
				size: this.size
			});
		break;

		case 'password':
			field = new Element('input', {
				type: 'password',
				'class': 'CIFormField',
				name: this.name,
				size: this.size,
				value: this.value
			});
		break;

		case 'select':
			field = new Element('select', {
				name: this.name,
				size: this.size,
				'class': 'CIFormField'
			});
			if ($type(this.options) == 'object') this.options = $lambda(this.options);
			new Hash(this.options()).each(function(value, html) {
				field.adopt(new Element('option', { value: value, html: html }));
			}.bind(this));
			field.addEvent('change', function() { this.fireEvent(CIEvent.Changed); }.bind(this));
		break;

		case 'label':
			field = new Element('span', {
				'class': 'CIFormLabelField',
				html: this.value
			});
		break;

		case 'checkbox':
			field = new Element('input', {
				type: 'checkbox',
				name: this.name,
				'class': 'CIFormField'
			});
		break;
		}; // end switch
		
		return field;
	} // end function
});/*
	Class: CIForm
	Represents a form that can make requests and set itself from those requests. Extends CIFormBase
	
	Properties:
		id - String like CIForm_#
		object - Object. The source object. Default null
		submitButton - Element. The 
		*See configuration for others*
		
	Events:
		- GotData
		- PostedData
*/
// TODO rename object to source
// TODO fire Changed
var CIForm = new Class({
	Extends: CIView,
	Implements: CIRequestable,
	
	/*
		Constructor: initialize(configuration)
		
		Configuration:
			submittingLabel - String. The label of the submit button while submitting data. Default 'Saving...'
			title - String. The title at the top of the form
			padding - Number. The padding inside each cell. Default 0
			spacing - Number. The spacing between each cell. Default 5
	*/
	initialize: function(options) {
		this.parent(options);
		this.isA('CIForm');
		this._makeRequestable(options);
		this.indicator = new CIIndicator({ cssStyles: { 'float': 'right' }});
		this._request.setIndicator(this.indicator);
		this.addEvent(CIEvent.GotData, function(o,j) { this.use(o); });
		this.addEvent(CIEvent.RequestedData, function() { this.submitButton.setLabel(this.submitLabel); });
		
		this.synthesize({
			object: {},
			hideSubmitButton: false,
			submitLabel: 'Save',
			submittingLabel: 'Saving...',
			title: null,
			padding: 0,
			spacing: 5,
		}, options);
		this.fields = $splat(options.fields);
		this.labelStyles = CIObject.interpretStyles(options.labelStyles || {});
		this._fieldsTable = new Hash();
	},
	
	/*
		Function: setTitle(newTitle)
		Set the first title on the form
		
		Parameters:
			newTitle - String. The new title
		
		Returns:
			This CIForm
	*/
	setTitle: function(newTitle) {
		this.set('title', newTitle);
		if (this.element()) $splat(this.element().getChildren('tr'))[0].getChildren('.CIFormTitle').set('html', this.title);
		return this;
	},
	
	/*
		Function: toObject()
		Outputs this form's fields and values as an Object. Uses <CIFormField.name> as keys. Excludes fields without name set and fields of type label
	
		Returns:
			Object
	*/
	toObject: function() {
		var params = {};
		this._fieldsTable.each(function(field, property) {
			if (property && field.name && field.type != 'label') params[field.name] = field.getValue();
		});
		return params;
	},
	
	/*
		Function: getData()
		Makes an HTTP request using its get parameters, then populates the form fields using the result
		
		Returns:
			This CIForm
	*/
	getData: function(moreParams) {
		this._request.get(moreParams);
		return this;
	},
	
	_onGotData: function(object, json) {
		this.use(object);
	},
	
	use: function(object) {
		this.setObject(object);
		this.populate();
	},
	
	/*
		Function: populate(object)
		Populate this form's fields using object and <CIFormField.setValue>.
		If object is not provided, use <CIForm.object>. The keys of object must correspond to
		each field's property, not its name
		
		Returns:
			This CIForm
	*/
	populate: function(object) {
		object = object || this.object || {};
		if (this.responseWrapsObject) object = object[this.responseWrapsObject];
		this._fieldsTable.each(function(field, property) {
			if (field.type == 'select') {
				var newElem = field._makeField();
				newElem.replaces(field.field);
				field.field = newElem;
			}
			field.setValue(object[property], object);
		});
		return this;
	},
	
	/*
		Function: clear()
		Clear all of this form's fields
		
		Returns:
			This CIForm
	*/
	clear: function() {
		this._fieldsTable.each(function(field, property) {
			switch (field.type) {
				case 'checkbox':
					field.checked = false;
					field.setValue('value', field.values.unchecked);
				break;
				
				default:
					field.setValue('');
				break;
			}
		});
		return this;
	},
	
	/*
		Function: submit()
		Submit this form's fields via the post configuration.
		Changes the submit button's label to submittingLabel, then back to submitLabel when finished. Fires <CIEvent.PostedData>
	
		Returns:
			This CIForm
	*/
	submit: function() {
		if (!this._request.canPost) return;
		if (this.submitButton) this.submitButton.setLabel(this.submittingLabel);
		this._request.post(this.toObject());
		return this;
	},
	
	/*
		Function: removeField(property)
		Remove the CIFormField relating to the specified property from the DOM and the CIForm
		
		Parameters:
			property - String. The property relating to the CIFormField
		
		Returns:
			The removed CIFormField or null if no field found
	*/
	removeField: function(property) {
		var field = this.getField(property);
		if (field) {
			field.element().destroy();
			this._fieldsTable.erase(property);
		}
		return field;
	},
	
	/*
		Function: getField(property)
		Retrieve the CIFormField relating to the specified property
		
		Parameters:
			property - String. The property relating to the CIFormField
		
		Returns:
			The CIFormField or null if no field found
	*/
	getField: function(property) {
		return this._fieldsTable.get(property);
	},
	
	/*
		Function: getValue(property)
		Retrieve the value from the CIFormField relating to the specified property
		
		Parameters:
			property - String. The property relating to the CIFormField
		
		Returns:
			The CIFormField's value or null if no field found
	*/
	getValue: function(property) {
		var field = this.getField(property);
		return field ? field.getValue() : null;
	},

	// TODO rename render()
	_adoptFieldsInto: function(parent) {
		this.fields.each(function(fieldObject) {
			/*
				This is a dirty little secret for when dynamically populating a page using Rails
				or something, and you are building a form in a loop. Consider the fields:
					fields: [...
					<% @coverage_options.each do |cvg| %>
					{ label: "<%=cvg%>", type: 'checkbox', fieldName: 'coverages[<%=cvg.id%>]' },
					<% end %>
					null]
				Without the null, you would have to figure out which item is the last one and remove the
				comma from the end of the line so the parser doesn't complain. By null-terminating the array,
				you can be saved a headache.
			*/
			if (fieldObject == null) return;
			
			fieldObject.form = this;
			var field = fieldObject.isCIObject ? fieldObject : new CIFormField(fieldObject);
			field.element(parent);
			
			// In the internal table, each key is the name of the field as it is going to be
			// received from the server. They correspond to the <input> objects they represent.
			this._fieldsTable.set(field.property || field.name, field);
		}.bind(this));

		// Append the dangling submit button
		if (!this.hideSubmitButton) {
			var labelTd = new Element('td', { html: '', styles: { 'text-align': 'right' } })
			var tr = new Element('tr');
			var td = new Element('td');
			this.submitButton = new CIButton({
				label: this.submitLabel,
				Clicked: this.submit.bind(this),
				cssClass: 'CIFormSubmitButton'
			});
			parent.adopt(tr.adopt(labelTd).adopt(td));
			this.indicator.element(labelTd);
			this.submitButton.element(td);
		}
		return parent;
	},
	
	/*	Function: _makeElement(parent)
		Parent adopts Element
	*/
	_makeElement: function(parent) {
		var table = new Element('table', {
			id: this.id,
			'class': 'CIForm',
			cellpadding: this.padding,
			cellspacing: this.spacing,
			styles: this.cssStyles
		});
		parent.adopt(table);
		if (this.title) {
			var tr = new Element('tr');
			table.adopt(tr);
			tr.adopt(new Element('td', { html: '&nbsp;' }));
			tr.adopt(new Element('td', {
				'class': 'CIFormTitle',
				html: this.title
			}))
		}
		this._adoptFieldsInto(table);
		
		return table;
	}
});/* 
	Class: CITabPanel
	Represents tabs that hide and show content. The tab labels can be toggled in response to events

	Properties:
		id - String like CITabPanel_#
		_tabs - Array. An array of tab objects. Properties are: item, element, label
		selectedTabItem - Object. The selected item
		selectedTabElement - Object. The Element containing the selected item
		
		*See configuration for others*
	
	Events:
*/
// TODO fire Clicked, Changed, Selected
// TODO create CITab to encapsulate each tab
// TODO create tabForIndex(Number)
var CITabPanel = new Class({
	Extends: CIView,
	
	/*
		Constructor: initialize(configuration)
		
		Configuration:
			selectedTab - Number. The index of the tab to select upon creation
			tabs - Hash. The hash of tab labels as keys, and content as values
			tabBodyStyles - Hash. The CSS styles to apply to the container of the tab items
	*/
	initialize: function(options) {
		this.parent(options);
		this.isA('CITabPanel');
		this.synthesize({
			subviews: {},
			style: CITabPanel.Style,
			selectedIndex: null,
			selectedSubviewElement: null,
		}, options);
		this.selectedTab = options.selectedTab;
		// Hopefully this isn't a circular dependency
		this.setSubviews(this.subviews);
		
		if (options.selectTab != undefined) {
			this.addEvent(CIEvent.AddedToDom, function() {
				this.selectTab(options.selectTab);
			}.bind(this));
		}
	},
	
	setSubviews: function(tabs) {
		return this.set('subviews', new Hash(tabs));
	},
	
	/*	Function: _makeElement(parent)
		Parent adopts Element
	*/
	_makeElement: function(parent) {
		var tabPanel = new Element('div', {
			id: this.id,
			'class': 'CITabPanel',
			styles: this.frame.toCssStylesObject()
		});
		parent.adopt(tabPanel);
		var table = new Element('table', {
			id: this.id + '_TableElement',
			cellspacing: 0,
			cellpadding: 0,
			border: 0,
			'class': 'CITabPanelTableElement',
			styles: this.frame.toCssStylesObject()
		});
		tabPanel.adopt(table);
		var tabsTr = new Element('tr', { id: this.id + '_TabRowElement' });
		table.adopt(tabsTr);
		
		var bodyTr = new Element('tr', { id: this.id + '_SubviewsRowElement' });
		table.adopt(bodyTr);
		
		this.render();
		return tabPanel;
	},
	
	tableElement: function() { return $(this.id + '_TableElement'); },
	tabRowElement: function() { return $(this.id + '_TabRowElement'); },
	subviewsRowElement: function() { return $(this.id + '_SubviewsRowElement'); },
	subviewsContainerElement: function() { return $(this.id + '_SubviewsContainerElement'); },
	
	unrender: function() {
		if (!this.element()) return;
		this.tabRowElement().empty();
		this.subviewsRowElement().empty();
		this.fireEvent(CIEvent.Unrendered);
	},
	
	render: function() {
		this.unrender();
		
		var subviewsContainer = new Element('td', {
			id: this.id + '_SubviewsContainerElement',
			'class': 'CITabPanelSubviewsContainerElement',
			colspan: this.subviews.getLength(),
			valign: 'top', styles: { 'vertical-align': 'top' }
		});
		this.subviewsRowElement().adopt(subviewsContainer);
		// Render the tabs
		var width = 100.0 / this.subviews.getLength().toFloat();
		var i = 0;
		this.subviews.each(function(subview, label) {
			var styles = { width: width + '%' };
			if (i > 0) styles['border-left'] = '1px solid white';
			if (i < this.subviews.getLength() - 1) styles['border-right'] = '1px solid #AAA';
			
			var tab = new Element('td', {
				'class': 'CITabPanelTab', html: label, styles: styles
			});
			tab.store('CITabPanelTabIndex', i);
			this.tabRowElement().adopt(tab);
			tab.addEvent('click', this._tabClicked.bind(this));
			
			subview.element(subviewsContainer).hide();
			i++;
		}.bind(this));
		
		this._viewResized();
		this.applyStyle();
		this.fireEvent(CIEvent.Rendered);
	},
	
	_viewResized: function(superview) {
		if (!this.element()) return;
		this.tableElement().setStyles(this.frame.toCssStylesObject({}, superview));
		this.parent(superview);
		return this;
	},
	
	_tabClicked: function(event) {
		this.fireEvent(CIEvent.Clicked, [event]);
		var index = 0;
		if ($type(event.target) == 'number') {
			index = event.target;
		} else {
			index = (event.target.hasClass('CITabPanelTab') ? event.target : event.target.getParent('.CITabPanelTab')).retrieve('CITabPanelTabIndex');
		}
		
		if (this.selectedSubviewElement) {
			CISelectionStyle.unselect(this.selectedTabElement());
			this.selectedSubviewElement.hide();
		}
		this.setSelectedIndex(index);
		CISelectionStyle.select(this.selectedTabElement(), { inverse: true });
		this.setSelectedSubviewElement(this.subviewForIndex(index).element());
		this.selectedSubviewElement.show();
		this.fireEvent(CIEvent.Selected, [this.selectedIndex, this.selectedSubviewElement]);
	},
	
	selectedTabElement: function() { return this.tabRowElement().getChildren()[this.selectedIndex]; },
	subviewForIndex: function(index) { return this.subviews.get(this.subviews.getKeys()[index]); },
	
	applyStyle: function(newStyle) {
		var style = newStyle || this.style || CITabPanel.Style;
		var tabs = this.tabRowElement().getChildren();
		tabs.each(function(td, index) {
			if (index == 0) {
				style.strokeElementSide('solid', td, CIStyle.Top);
				style.strokeElementSide('solid', td, CIStyle.Left);
				style.strokeElementSide('solid', td, CIStyle.Bottom);
				style.roundElementCorner(td, CIStyle.TopLeft);
				style.roundElementCorner(td, CIStyle.BottomLeft);
			} else if (index == tabs.length - 1) {
				style.strokeElementSide('solid', td, CIStyle.Top);
				style.strokeElementSide('solid', td, CIStyle.Right);
				style.strokeElementSide('solid', td, CIStyle.Bottom);
				style.roundElementCorner(td, CIStyle.TopRight);
				style.roundElementCorner(td, CIStyle.BottomRight);
			} else {
				style.strokeElementSide('solid', td, CIStyle.Top);
				style.strokeElementSide('solid', td, CIStyle.Bottom);
			}
		});
	},
	
	/*
		Function: selectTab(tab)
		Select and show the specified tab
		
		Parameters:
			tab - Number or tab Object. If a Number, the index of the tab in _tabs, otherwise the tab object to choose
	
		Returns:
			This CITabPanel
	*/
	selectTab: function(index) {
		this._tabClicked({ target: index });
	}
});

CITabPanel.Style = new CIStyle({
	padding: 10,
	roundedCorners: CIStyle.AllCorners,
	solidBorders: CIStyle.AllSides,
	borderColor: CIStyle.BorderColor,
	borderSize: 1,
	roundedCornerRadius: 3
});/*
	Class: CIPanelBase
	The abstract base for CIVPanel and CIHPanel
	
	Properties:
		id - String like CIPanelBase_#. Should be overwritten by subclass
		children - Array. The content of the panel. See content configuration
		*See configuration for others*
*/
// TODO rename children to content
// TODO add cssClass to inner childrenn
var CIPanelBase = new Class({
	Extends: CIView,
	
	/*
		Constructor: initialize(configuration)
		May be an Array of content, nothing, or a Hash
		
		Configuration:
			content - Array. The content of the panel. Each item in the array may be the CIObject to add, or a Hash with keys: cssStyles, cssClass, valign, and content, with content being the CIObject. Default []
			padding - Number. The padding inside each child. Default 0
			spacing - Number. The spacing between each child. Default 0
	*/
	initialize: function(options) {
		this.parent(options);
		this.isA('CIPanelBase');
		
		if ($type(options) == 'object') {
			this.children = options.children || options.content || [];
			this.padding = options.padding || 0;
			this.spacing = options.spacing || 0;
			return this;
		} else if ($type(options) == 'array')
			this.children = $splat(options);
		else
			this.children = [];
			
		this.padding = 0;
		this.spacing = 0;
	},
	_makeElement: function(parent) {
		console.error('Cannot add a CIPanelBase to the DOM; it is abstract.');
		return null;
	}
});

/*
	Class: CIHPanel
	A panel with content oriented horizontally, right to left. Extends CIPanelBase
	
	Properties:
		id - String like CIHPanel_#
		
		*See <CIPanelBase.initialize()> and configuration below for others*
*/
var CIHPanel = new Class({
	Extends: CIPanelBase,
	
	/*
		Constructor: initialize(configuration)
		
		Configuration:
			valign - String. The vertical alignment of the content: 'top', 'middle', or 'bottom'. Default 'top'
			
		See:
			<CIPanelBase.initialize()>
	*/
	initialize: function(options) {
		this.parent(options);
		this.isA('CIHPanel');
		this.valign = options ? options.valign : 'top';
	},
	
	_makeElement: function(parent) {
		var table = new Element('table', {
			id: this.id,
			'class': 'CIPanelBase CIHBox ' + this.cssClass,
			cellpadding: this.padding,
			cellspacing: this.spacing,
			styles: this.frame.toCssStylesObject()
		});
		parent.adopt(table);
		var tr = new Element('tr');
		table.adopt(tr);
		this.children.each(function(child) {
			if (child.objectId) child = { content: child };
			var td = new Element('td', {
				valign: child.valign || this.valign || 'top',
				styles: CIObject.interpretStyles(child.cssStyles)
			});
			tr.adopt(td);
			child.content.superview = this;
			child.content.element(td);
		}.bind(this));
		
		return table;
	}
});

/*
	Class: CIVPanel
	A panel with content oriented vertically, top to bottom. Extends CIPanelBase
	
	Properties:
		id - String like CIVPanel_#
		
		*See <CIPanelBase.initialize()> and configuration below for others*
*/
var CIVPanel = new Class({
	Extends: CIPanelBase,
	
	/*
		Constructor: initialize(configuration)
		
		See:
			<CIPanelBase.initialize()>
	*/
	initialize: function(options) {
		this.parent(options);
		this.isA('CIVPanel');
	},
	
	_makeElement: function(parent) {
		var table = new Element('table', {
			id: this.id,
			'class': 'CIPanelBase CIVBox ' + this.cssClass,
			cellpadding: this.padding,
			cellspacing: this.spacing,
			styles: this.cssStyles
		});
		parent.adopt(table);
		this.children.each(function(child) {
			if (child.objectId) child = { content: child };
			var tr = new Element('tr');
			table.adopt(tr);
			var td = new Element('td', {
				valign: child.valign || 'top',
				styles: CIObject.interpretStyles(child.cssStyles)
			});
			tr.adopt(td);
			child.content.element(td);
		});
		
		return table;
	}
});

var CIVFlow = new Class({
	Extends: CIView,
	
	initialize: function(options) {
		this.parent(options);
		this.isA('CIVFlow');
		this.synthesize({
			style: CIVFlow.Style,
			subviews: []
		}, options);
		this.setSubviews(this.subviews);
	},
	
	_makeElement: function(parent) {
		/*var table = new Element('table', {
			id: this.id,
			'class': 'CIVFlow',
			styles: this.frame.toCssStylesObject()
		});*/
		var flow = new Element('div', {
			id: this.id,
			'class': 'CIVFlow',
			styles: this.frame.toCssStylesObject()
		})
		parent.adopt(flow);

		this.render();
		return flow;
	},
	
	applyStyle: function(newStyle) {
		var style = newStyle || this.style || CIVFlow.Style;
		var flow = this.element();
		if (!flow) return;
		flow.setStyles({
			padding: style.getInt('padding'),
			margin: style.getInt('margin')
		});
	},
	
	unrender: function() {
		if (!this.element()) return null;
		this.element().empty();
		this.fireEvent(CIEvent.Unrendered);
		return this;
	},
	
	render: function() {
		if (!this.element()) return null;
		this.unrender();
		
		var flow = this.element();
		this.subviews.each(function(view) {
			//view.superview = this;
			view.element(flow);
		}.bind(this));
		/*
		var table = this.element();
		this.applyStyle();
		this.subviews.each(function(view) {
			var tr = new Element('tr');
			table.adopt(tr);
			var td = new Element('td', {
				valign: (this.style || CIVFlow.Style).get('valign')
			});
			tr.adopt(td);
			view.superview = this;
			view.element(td);
		}.bind(this));*/
		
		this.applyStyle();
		this.fireEvent(CIEvent.Rendered);
		return this;
	}
});
CIVFlow.Style = new CIStyle({
	padding: 0,
	spacing: 0,
	margin: 0,
	valign: 'top'
});/*
	Class: CICurtainPanel
	A sliding panel with a 'curtain' and a 'drawer.' The drawer slides under the curtain.
	
	Properties:
		id - String like CICurtainPanel_#
		_contentEl - Element. The drawer Element
		
		*See configuration for others*
		
	Events:
		
*/
// TODO rename to CIDrawerPanel?
// TODO support Clicked, Showing, Shown, Hiding, Hidden, Changed
// TODO refactor 'content' concept to 'drawer'
var CICurtainPanel = new Class({
	Extends: CIView,
	
	/*
		Constructor: initialize(configuration)
		
		label - String. The HTML to show on the curtain. Default 'Click to reveal.'
		content - CIObject. The content of the drawer
		contentClass - String. The CSS class to apply to the drawer container
		contentStyles - Hash. The CSS styles to apply to the drawer container
		openState - String. How the curtain should start out. Accepts 'reveal' or 'conceal'. Default 'conceal'
	*/
	initialize: function(options) {
		this.parent(options);
		this.isA('CICurtainPanel');
		this.label = options.label || 'Click to reveal.';
		this.content = options.content;
		this.aggressive = options.aggressive || false;
		this.contentClass = options.contentClass || '';
		this.contentStyles = CIObject.interpretStyles(options.contentStyles);
		this.openState = options.openState;
		this.addEvent(CIEvent.AddedToDom, function(element) {
			if (this.openState) this[this.openState]();
		}.bind(this));
	},
	
	/*	Function: _makeElement(parent)
		Parent adopts Element
	*/
	_makeElement: function(parent) {
		var panel = new Element('div', {
			id: this.id,
			'class': 'CICurtainPanel ' + this.cssClass,
			// panelStyles override styles set here
			styles: new Hash({
				width: this.width || 150
			}).extend(this.cssStyles).getClean()
		});
		
		parent.adopt(panel);
		// Create the curtain
		var text = new Element('p', {
			html: this.label,
			'class': 'CICurtainPanelLabel'
		});
		text.addEvent('click', function() {
			this.toggle();
		}.bind(this));
		panel.adopt(text);
		
		// Add the content, which must be a single CIObject
		this._contentEl = new Element('div', {
			'class': 'CICurtainPanelBody ' + this.contentClass,
			styles: this.contentStyles
		});
		panel.adopt(this._contentEl);
		this.content.element(this._contentEl);
		this._contentEl.set('slide', { duration: 300, transition: Fx.Transitions.Back.easeOut });
		this._contentEl.slide('hide');
		
		return panel;
	},
	
	/*
		Function: reveal()
		Reveal the drawer
		
		Returns:
			This CICurtainPanel
	*/
	reveal: function() {
		this._contentEl.slide('in');
		return this;
	},
	
	/*
		Function: conceal()
		Conceal the drawer
		
		Returns:
			This CICurtainPanel
	*/
	conceal: function() {
		this._contentEl.slide('out');
		return this;
	},
	
	/*
		Function: toggle()
		Toggle the drawer
		
		Returns:
			This CICurtainPanel
	*/
	toggle: function() {
		this._contentEl.slide('toggle');
		return this;
	},
	
	/*
		Funtion: setLabel(newLabel)
		Set the curtain's label
		
		Returns:
			This CICurtainPanel
	*/
	setLabel: function(newLabel) {
		this.label = newLabel;
		var p = this.element().getChildren('.CICurtainPanelLabel')[0];
		p.set('html', this.label);
	},
	
	/*
		Function: contentElement()
		Retrieve the drawer container element
		
		Returns:
			Element
	*/
	contentElement: function() {
		return this._contentEl;
	}
});/*
	Class: CIToolbar
	Represents a toolbar attached to another component
	
	Properties
	 	id - String like CIToolbar_#
		content - Array. The CIObjects in the toolbar
*/
var CIToolbar = new Class({
	Extends: CIView,
	
	/*
		Constructor: initialize(configuration)
		Accepts an array of items to render inside the toolbar
	*/
	initialize: function(configuration) {
		this.parent(configuration);
		this.isA('CIToolbar');
		this.synthesize(['style', 'content']);
		if ($type(configuration) == 'array') {
			this.style = CIToolbar.Style;
			this.setSubviews(configuration);
		} else {
			this.synthesize({
				style: CIToolbar.Style,
				subviews: []
			}, configuration);
		}
		this.frame.width = CIRect.WidthOfSuperview().minus(function() { return this.style.getInt('padding') * 2; }.bind(this));
		this.frame.height = this.frame.height || 18;
	},
	
	/*
		Function: isEmpty()
		Returns whether this toolbar contains any items or not
		
		Returns:
			Boolean
	*/
	isEmpty: function() { return this.subviews.length == 0; },
	
	/*	Function: _makeElement(parent)
		Parent adopts Element
	*/
	_makeElement: function(parent) {
		var toolbar = new Element('div', {
			id: this.id,
			'class': 'CIToolbar'
		});
		parent.adopt(toolbar);
		
		this.render();
		return toolbar;
	},
	
	render: function() {
		if (!this.element()) return;
		this.unrender();
		
		var container = this.element();
		if (this.isEmpty())
			container.hide();
		else
			container.show();
		this.subviews.each(function(view, index) {
			var e = view.element(container);
			e.setStyle('float', 'left');
			if (index != 0) e.setStyle('margin-left', this.style.getInt('gap'));
		}.bind(this));
		
		this._viewResized();
		this.applyStyle();
		this.fireEvent(CIEvent.Rendered);
	},
	
	applyStyle: function(style) {
		var style = style || this.style || CIToolbar.Style;
		var elem = this.element();
		if (!elem) return;
		elem.setStyles({
			'background-color': style.get('backgroundColor'),
			'padding': style.getInt('padding')
		});
		style.applyBordersOntoElement('solid', elem);
		style.applyBordersOntoElement('dotted', elem);
	},
	
	/*
		Function: addItemToLeft(item)
		Adds item as the first index to CIToolbar's content array and renders it
		
		Returns:
			This CIToolbar
	*/
	addItemToLeft: function(view) {
		this.subviews.unshift(view);
		view.element(this.element());
		return this;
	}
});

CIToolbar.Style = new CIStyle({
	backgroundColor: CIStyle.BackgroundColor,
	padding: 5,
	solidBorders: CIStyle.Left | CIStyle.Right | CIStyle.Bottom,
	borderColor: CIStyle.BorderColor,
	borderSize: 1,
	gap: 10
});/* Options:
	- cssStyles: (See CIObject)
	- cssClass: String
	+ get: { url: String, paramsFn: Mixed or Function } or String
	- post: { url: String, paramsFn: Mixed or Function } or String
		When called for params for submitting editor data for
			a default editor renderer, the paramsFn is called
			with the signature: function(value, record, data)
	- data: Array
	+ columns: { "Header": { property: String, }, ... }
		+ property: String
		- cssStyles: { }
		- renderer: function(propertyValue, record, taffyDB, table) => String, CIObject, or Element
			The html property of the returned data will be used for the default editor's value
		- editor: Object
			+ fieldName: String
			- renderer: Function
	- padding: Number (Default 5)
	- toolbar: { CIToolbar config (See CIToolbar) }
	- tableHeight: Mixed (Default "auto")
	- label: String
*/ 

var CIColumn = new Class({
	Extends: CIView,
	
	initialize: function(configuration) {
		this.parent(configuration);
		this.isA('CIColumn');
		this.synthesize({
			header: '',
			property: 'id',
			width: null,
			renderer: null,
			editor: null,
			dontEncodeEntitiyChars: false,
			truncateAfter: null
		}, configuration);
	},
	
	getHeader: function() { return (this.header || '').toString(); }
});
/*
	Class: CITable
	Represents a table of information. Implements CIRequestable. It uses get to retreive the data
	for the cells, and post to send updated data back. Capable of custom renderes and editors. The editor
	is shown in a <CIHud> and the 'editing' style is applied to the cell
	
	Properties:
		id - String like CITable_#
		selected - Object. The currently selected row's object
		selectedRowElement - Element. The currently selected row's Element
		
		*See configuration for others*
		
	Events:
		- GotData
		- DragEntered
		- DragLeft
		- Clicked
		- Selected
		- Changed
*/
var CITable = new Class({
	Extends: CIView,
	Implements: CIRequestable,

	/*
		Constructor: initialize(configuration)
		
		Configuration:
			get - String or Hash. The configuration to use when requesting data to populate the table. See <CIRequestable>
			post - String or Hash. The configuration to user when requesting a change to data. *The request must respond with the newly updated record.* If using the Hash form, the params function provides the currently editing record as a parameter. See <CIRequestable>
			label - String. The title of the table
			columns - Hash. The columns that make up the table. The keys become the header labels and must be unique. Default {}
			data - Array. An array of objects representing the rows of data in the table. The objects' properties represent possible columns. See <Column Configuration>. Default []
			padding - Number. The amount of padding inside each cell. Default 5
			paginator - Hash. Configuration for the paginator to use on this table
			toolbar - Array. Items to display in this table's toolbar
			selectable - Boolean. Enable row selection. Default false
			useArray - Boolean. Whether to back the table with an Array instead of TaffyDB object. Default false
			hideHeader - Boolean. Whether to hide the header row. Default false
			acceptsDrop - Boolean. Whether this table acceptsDrops. Default false
			
		Column Configuration:
			property - String. The property on the object to use that represents the column. Need not be unique across columns
			dontEncodeEntityChars - Boolean. Whether to skip encoding HTML entity character codes when not using a renderer. Default false
			editor - Hash. The configuration for the column editor. See <Editor Configuration>
			renderer - Function. A function that returns the appropriate CIObject for the cell.
			Has a method signature of: *propertyValue, recordObject, ciTable, dataArray, tdElement, trElement*.
			If the renderer returns a string, it becomes a <span>. Otherwise, the renderer may return an Element or CIObject
			
		Editor Configuration:
			value - String or Number. The value to which to set the editor's field. Default the innerHTML of the first child in the <td>
			padding - Number. The padding between the editor field and button. Default 0
			spacing - Number. The spacing around the editor field and button. Default 0
			type - String. The type of editor. Accepts 'textarea' or 'text.' Default 'text'

			*The editor configuration is used to create a <CIFormField>. See <CIFormField.initialize> for the full configuration*
	*/
	// TODO change label to title
	// TODO use array instead of hash for columns
	// TODO create CITableColumn
	// TODO rename data collection
	initialize: function(options) {
		this.parent(options);
		this.isA('CITable');
		this._makeRequestable(options);
		
		this.synthesize({
			title: '',
			selectable: false,
			selected: null,
			deletePrompt: null,
			getAfterResourceChange: false,
			noDataText: 'No data to display',
			doNotSetDataAfterGet: false,
			style: CITable.Style
		}, options);
		
		this._title = null;
		this.setCollection(options.collection);
		this.columns = $splat(options.columns);
		this.paginator = options.paginator ? new CIPaginator($extend(options.paginator, {paginates: this})) : null;
		this.toolbar = new CIToolbar(options.toolbar);
		
		this.addEvent(CIEvent.PropertyChanged, function(property,newValue, oldValue) {
			if (property == 'collection') this.render();
		}.bind(this));
		if (this._request.canPut)
			this.addEvent(CIEvent.PutData, this._onPostedData);
		else
			this.addEvent(CIEvent.PostedData, this._onPostedData);
		this.addEvent(CIEvent.GotData, function(newCollection) { if (!this.doNotSetDataAfterGet) this.setCollection(newCollection); }.bind(this));
		if (this.getAfterResourceChange) {
			this.addEvent(CIEvent.DeletedData, this._onGetAfterResourceChange);
			this.addEvent(CIEvent.PostedData, this._onGetAfterResourceChange);
			this.addEvent(CIEvent.PutData, this._onGetAfterResourceChange);
		}
	},
	
	_onGetAfterResourceChange: function() { this.getData(); },
	
	/*	Function: _makeElement(parent)
		Parent adopts Element
	*/
	_makeElement: function(parent) {
		var container = new Element('div', {
			id: this.id,
			'class': 'CITableContainer ' + this.cssClass,
			styles: this.cssStyles
		});
		parent.adopt(container);

		// Make title
		this._title = $type(this.title) == 'string' ? new CITitle({ title: this.title }) : this.title;
		this._title.element(container);
		this._request.setIndicator(this._title.indicator);
		
		// Make CIToolbar
		this.toolbar.element(container);
		
		// Make table
		var innerHeight = 'auto';
		// If the height is explicitly set in cssStyles, do some math to figure out what the container size should be
		if ($H(this.cssStyles).some(function(value, key) { return key.contains('eight'); })) {
			innerHeight = container.getStyle('height').toInt() -
						  this._title.element().getStyle('height').toInt() -
						  this.toolbar.element().getStyle('height').toInt();
		}
		
		var innerContainer = new Element('div', {
			'class': 'CITableInnerContainer',
			id: this.id + '_innerContainer',
			styles: { height: innerHeight }
		});
		container.adopt(innerContainer);
		var table = new Element('table', {
			id: this.id + '_table',
			cellpadding: this.style.get('cellPadding'),
			cellspacing: 0,
			styles: { width: '100%' }
		});
		table.store('CITable', this);
		container.adopt(innerContainer.adopt(table));
		
		// Make Header Row
		this._makeHeader();
		this.setCollection(this.collection);
		
		this._applyStyle();
		this._viewResized();
		return container;
	},
	
	_applyStyle: function(newStyle) {
		var style = newStyle || this.style;
		var container = this.element();
		if (style.get('hidden')) container.setStyle('display', 'none');
		// Background Color
		container.setStyle('background-color', style.get('backgroundColor'));
		// TODO Need to hide header row here
		if (style.get('hideHeaderRow') && this.headerRowElement())
			this.headerRowElement().setStyle('display', 'none');
		// Borders
		style.applyBordersOntoElement('solid', container.getChildren('.CITableInnerContainer')[0]);
		style.interpolateRoundedCornerMaskOntoElement(container.getChildren('.CITableInnerContainer')[0]);
	},
	
	/*
		Function: tableElement()
		Returns the Element representing the body of the table
		
		Returns:
			Element
	*/
	tableElement: function() {
		return $(this.id + '_table');
	},
	
	/*
		Function: getData(moreParams)
		Makes the get request to retreive table data, using moreParams which are overridden by getParams(), which are overriden by CIApplication.baseParams
		Fires <CIEvent.GotData> or <CIEvent.RequestFailed>
		
		Returns:
			This CITable
	*/
	getData: function(moreParams) {
		this._request.get(moreParams);
		return this;
	},
	
	getRecords: function(record, moreParams) {
		this._request.get(moreParams, record);
		return this;
	},
	
	postRecord: function(record, moreParams) {
		this._request.post(moreParams, record);
		return this;
	},
	
	putRecord: function(record, moreParams) {
		this._request.put(moreParams, record);
		return this;
	},
	
	deleteRecord: function(record, moreParams) {
		if (this.deletePrompt) {
			var sheet = CISheet.prompt(
				'Confirm Delete', this.deletePrompt,
				{ label: 'Delete', Clicked: function() {
					sheet.hide();
					this._request.destroy(moreParams || {}, record);
				}.bind(this) },
				{ label: 'Don&rsquo;t Delete' }
			);
		} else {
			this._request.destroy(moreParams || {}, record);
		}
		
		return this;
	},
	_makeHeader: function() {
		var headerTr = new Element('tr', { 'class': 'CITableHeaderRow', id: this.id + '_tableHeaderRow' });
		this.tableElement().adopt(headerTr);
		
		for (var columnCounter = 0; columnCounter < this.columns.length; columnCounter++) {
			var column = this.columns[columnCounter];
			var classes = ' ';
			if (columnCounter > 0) classes += 'CITableHeaderColumnLeftBorder';
			if (columnCounter < this.columns.length - 1) classes += ' CITableHeaderColumnRightBorder';
			
			var td = new Element('td', {
				html: column.header || '',
				'class': 'CITableHeaderColumn' + classes
			});
			headerTr.adopt(td);
		}
	},
	headerRowElement: function() {
		return $(this.id + '_tableHeaderRow');
	},
	/*
		Function: clear()
		Removes all rows and cells from the table. Does not clear the data
		
		Returns:
			This CITable
	*/
	clear: function() {
		$$('table#'+this.tableElement().id+' tr.CITableRow').each(function(row) {
			row.destroy();
		});
		return this;
	},
	
	innerContainerElement: function() {
		return $(this.id + '_innerContainer');
	},
	
	setCollection: function(newCollection) {
		if (this.paginator) newCollection = newCollection['CIPaginatorCollection'];
		this.set('collection', $splat(newCollection).clean());
	},
	
	getCollection: function() { return this.collection; },
		
	render: function() {
		if (!this.element()) return;
		
		this.clear();
		this.data = new TAFFY(this.collection);
		this.data.onUpdate = this._onTaffyUpdate.bind(this);
		
		if (this.collection.length == 0) {
			this.clear();
			var td = new Element('td', {
				colspan: this.columns.length,
				'class': 'CITableNoDataColumn',
				html: this.noDataText || 'No data to display.'
			});
			this.tableElement().adopt(new Element('tr', {'class':'CITableRow'}).adopt(td));
		}

		this.data.forEach(function(record, index) {
			record.__rowIndex = index;
			var paritySkin = (index % 2) == 0 ? 'CIEvenSkin' : 'CIOddSkin';
			var tr = new Element('tr', {
				id: this.id + '_row_' + index,
				'class': 'CITableRow CIHoverableSkin ' + paritySkin
			});
			tr.store('CITableRowIndex', index);
			this.tableElement().adopt(tr);
			this._makeCellsInRowUsingRecord(tr, record, index);
		}.bind(this));
		this.fireEvent(CIEvent.Rendered);
	},
	
	/*
		Function: removeSelection()
		Removes the selection and selected row. Fires <CIEvent.Changed>
		
		Returns:
			This CITable
	*/
	removeSelection: function() {
		if (this.selectedRowElement) CISelectionStyle.unselect(this.selectedRowElement);
		this.set('selectedRowElement', null);
		this.set('selectedRowIndex', null);
		this.set('selected', null);
		this.fireEvent(CIEvent.Changed);
		return this;
	},
	
	selectRow: function(indexOrTR, suppressSelectedEvent) {
		this.removeSelection();
		
		var tr = indexOrTR;
		if ($type(indexOrTR) == 'number') tr = $(this.id + '_row_' + indexOrTR);
		this.set('selectedRowElement', tr);
		this.set('selectedRowIndex', this.selectedRowElement.retrieve('CITableRowIndex'));
		this.set('selected', this.data.get(this.selectedRowIndex)[0]);
		this.fireEvent(CIEvent.Changed);
		
		CISelectionStyle.select(this.selectedRowElement);
		//var container = $(this.id + '_innerContainer');
		//container.scrollTo(this.selectedRowElement.getPosition(container).x, this.selectedRowElement.getPosition(container).y);
		if (!suppressSelectedEvent) this.fireEvent(CIEvent.Selected, [this.selected]);
		
		return this;
	},
	
	_onSelectRow: function(event) {
		this.fireEvent(CIEvent.Clicked, [event]);
		this.selectRow(event.target.getParent('.CITableRow'));
	},
	
	_makeColumnsHashIntoArray: function(hash) {
		var columns = [];
		hash.each(function(col, header) {
			col.header = col.header || header;
			columns.push(col)
		});
		return columns;
	},
	
	_viewResized: function(superview) {
		if (!this.element()) return;
		var newSize = this.frame.toCssStylesObject({}, superview);
		//console.log(this.id, 'has been told to resize to width of', newSize.width);
		
		this.element().setStyles(newSize);
		//this.subviews.each(function(view) { view._viewResized(this); }.bind(this));
	},
	
	_makeCellsInRowUsingRecord: function(tr, record, index) {
		for (var columnCounter = 0; columnCounter < this.columns.length; columnCounter++) {
			var column = this.columns[columnCounter];
			
			var styles = column.cssStyles;
			if (column.width) styles['CIFirmWidth'] = column.width;
			
			if (columnCounter < this.columns.length - 1) styles['border-right'] = '1px solid #CCC';
			
			var editable = column.editor != null && !this.useArray;
			if (editable) {
				column.editor.editableIf = column.editor.editableIf || $lambda(true);
				editable = editable && column.editor.editableIf(record[column.property], record);
			}
			var cssClass = column.cssClass || '';
			if (editable) {
				cssClass += ' CITableEditableCell';
				if (index < this.collection.length - 1) styles['border-bottom'] = '1px dotted #CCC';
			}
			
			var td = new Element('td', {
				styles: CIObject.interpretStyles(styles),
				'class': 'CITableCell ' + cssClass
			});
			if (this.selectable && !editable) {
				tr.addClass('CISelectableTableRow');
				td.addEvent('click', this._onSelectRow.bind(this));
			}
			if (editable) {
				column.editor.type = column.editor.type || 'text';
				td.addEvent('click', this._onEditCell.bind(this));
				td.store('CITableColumnEditorConfig', column.editor);
			}
			
			td.store('CITableColumnProperty', column.property);
			td.store('CITableRowIndex', index);
			
			tr.adopt(td);
			if (column.renderer) {
				var content = column.renderer(record[column.property], record, this, this.data, td, tr);
				if (content != null) {
					if ($type(content) == 'string')
						// Wrapped in a <span> because Element.getChildren will not return text nodes
						td.adopt(new Element('span', { html: content }));
					else if (content.objectId)	// CIObject
						content.element(td);
					else					// Element
						td.adopt(content);
				}
			} else {
				var value = (record[column.property] || '').toString();
				var html = column.dontEncodeEntityChars ? value : value.withEntityCharsEncoded();
				html = column.truncateAfter && html.length > column.truncateAfter.toInt() ? html.substr(0, column.truncateAfter.toInt()) + '...' : html;
				td.adopt(new Element('span', { html: html }));
			}
		}
	},
	
	_onTaffyUpdate: function(newRecord, oldRecord) {
		newRecord.__rowIndex = oldRecord.__rowIndex;
		var tr = $(this.id+'_row_'+oldRecord.__rowIndex);
		this._makeCellsInRowUsingRecord(tr.empty(), newRecord, newRecord.__rowIndex);
	},
	
	_onEditCell: function(event) {
		var td = event.target;
		if (td.get('tag') != 'td') td = event.target.getParent('td');
		 
		var config 	= td.retrieve('CITableColumnEditorConfig');
		var content = $splat(td.getChildren());
		var value 	=  '';
		var input, field, editingHudContent;
		var buttonHPanel = new CIHPanel({
			spacing: 5, valign: 'middle',
			cssStyles: { CIFirmWidth: 140 },
			content: [
				new CILink({
					label: 'Cancel',
					Clicked: this.stopEditing.bind(this)
				}),
				new CILink({
					label: 'Save',
					Clicked: this.commitChanges.bind(this)
				})
			]
		});
		
		if (config.useRecordProperty) {
			var property = td.retrieve('CITableColumnProperty');
			var index = td.retrieve('CITableRowIndex');
			value = this.collection[index][property];
			// Catch null values
			value = value ? value.toString() : '';
		} else {
			value = content.length > 0 ? content[0].get('html') : '';
		}
		if ($type(value) == 'string') config.value = value.withEntityCharsDecoded();
		config.labelStyles = { display: 'none' };
		config.padding = config.padding || 0;
		config.spacing = config.spacing || 0;
		
		if (config.type == 'textarea') {
			config.value = value.replace(/<br\/?>/g, '\n');
			config.cssStyles = config.cssStyles || {};
			config.cols = 32;
			config.rows = 6;
			field = new CIFormField(config);
			editingHudContent = new CIVPanel({
				spacing: 5,
				content: [ field, buttonHPanel ]
			});
		} else {
			field = new CIFormField(config);
			field.addEvent(CIEvent.EnterPressed, this.commitChanges.bind(this));
			field.addEvent(CIEvent.EscapePressed, this.stopEditing.bind(this));
			editingHudContent = new CIHPanel({
				spacing: 5, valign: 'middle',
				content: [ field, buttonHPanel ]
			});
		}
		
		if (this.editingHud) {
			if (this.editingHud._td != td)
				this.stopEditing();
			else
				return;
		}
		
		this.editingHud = new CIHud({
			title: "Editing Cell",
			subviews: editingHudContent,
			offset: { from: td, dx: 10, dy: 10 },
			hideCloseButton: true,
			firstResponder: field,
			Shown: function() { field.setValue(config.value); }
		});
		this.editingHud._td = td;
		CISelectionStyle.set(this.editingHud._td, 'editing');
		this.editingHud.show();
	},
	
	/*
		Function: stopEditing()
		Hides the editor <CIHud> and removes the 'editing' <CISelectionStyle>
	
		Returns:
			This CITable
	*/
	stopEditing: function() {
		if (!this.editingHud) return;
		CISelectionStyle.unset(this.editingHud._td, 'editing');
		this.editingHud.hide();
		this.editingHud = null;
		return this;
	},
	
	_onPostedData: function(newRecord, json) {
		if (!this.editingHud) return;
		
		var index = this.editingHud._td.getParent().retrieve('CITableRowIndex');
		if (this.responseWrapsObject) newRecord = newRecord[this.responseWrapsObject];
		this.stopEditing();
		this.data.update(newRecord, index);
	},
	
	/*
		Function: commitChanges()
		Make the request using the CITable's post. If succesful, the editing HUD is hidden and just the table row is updated using TaffyDB
		
		Returns:
			This CITable
	*/
	commitChanges: function() {
		if (!this.editingHud) return;

		var index = this.editingHud._td.getParent().retrieve('CITableRowIndex');
		var oldRecord = this.data.get(index)[0];
		var field = this.editingHud.content[0].children[0];
		var params = {}; params[field.name] = field.getValue();
		
		if (this._request.canPut)
			this._request.put(params, oldRecord);
		else
			this._request.post(params, oldRecord);
		return this;
	}
});/*
	CIPaginator makes a lot of expectations. It expects:
		- an item count in CIPaginatorItemCount
		- the collection in CIPaginatorCollection
		- the page number in CIPaginatorPage, defaults to 1
	Properties:
		- page: Number, The current page
		- itemCount: Number, The total number of
	Options:
		+ paginates: The object to paginate. It looks for a data property
		- itemsPerPage: Number (Default 30)
*/
/*
	Class: CIPaginator
	A paginator component, usually added to a toolbar. When its element is added to the DOM, it adds a <CIEvent.GotData> handler to
	the target, paginates.
	
	Properties:
		id - String like CIPaginator_#
		page - Number. The current page. Default 1
		itemCount - Number. The total number of items being paginated
		*See configuration for others*
	
	Request Format:
		CIPaginator requests data for pages using the following params:
		CIPaginatorItemsPerPage - Number. The number of items to show on each page
		CIPaginatorPage - Number. The page to show
		
	Response Format:
		CIPaginator expects the get response to have the following format:
		CIPaginatorPage - Number. The page to show
		CIPaginatorItemCount - Number. The total number of items being paged
		CIPaginatorCollection - Array. The actual to show for this page
*/
// TODO better creation of paginator. Maybe CIPaginator.Attached event? CIPageable?
// TODO more event hooks
var CIPaginator = new Class({
	Extends: CIView,
	
	/*
		Constructor: initialize(configuration)
		
		Configuration:
			paginates - CIObject. The CIObject on which to call getData
			itemsPerPage - Number. The number of items to show per page. Default 30
			type - String. The type of paginator. Accepts 'alpha' or 'numeric'. Default 'numeric'
	*/
	initialize: function(options) {
		this.parent(options);
		this.isA('CIPaginator');
		this.paginates = options.paginates;
		this.itemsPerPage = options.itemsPerPage || 30;
		this.page = 1;
		this.itemCount = 0;
		this.type = options.type || 'numeric';
		this.filters = options.filters;
		if (this.filters) this.filters.paginator = this;
	},
	
	/* 	Function: _makeElement(parent)
		Parent adopts Element and listens for <CIEvent.GotData> on paginates
	*/
	_makeElement: function(parent) {
		var container = new Element('div', {
			id: this.id,
			'class': 'CIPaginator ' + this.cssClass,
			styles: {
				width: 400,
				height: 18,
				margin: '0 auto 0 auto'
			}
		});
		parent.adopt(container);
		// If this._onGotData is not explicitly bound to this, it will be bound to the parent object
		this.paginates.addEvent(CIEvent.GotData, this._onGotData.bind(this));
		
		if (this.filters) this.filters.element(this.paginates._title.contentElement());
		return container;
	},
	
	_onGotData: function(response, json) {
		if (!json) return;
		var container = this.element().empty();
		if (this.type == 'numeric') {
			this.page = (response.CIPaginatorPage || 1).toInt();
			this.itemCount = response.CIPaginatorItemCount.toInt();
			var pages = (this.itemCount / this.itemsPerPage).toInt();
			pages += this.itemCount / this.itemsPerPage - pages == 0 ? 0 : 2;
			
			if (pages < 10) {
				container.setStyle('width', pages * 30);
				pages.times(function(page) {
					if (page == 0) return;
					var link = new CIButton({
						label: page,
						style: this.page == page ? CIButton.SelectedPageStyle : CIButton.PageStyle,
						Clicked: function() { this.selectPage(page) }.bind(this)
					});
					link.element(container);
				}.bind(this));
			} else {
				if (pages <= 99)
					container.setStyle('width', 450);
				else if (pages <= 999)
					container.setStyle('width', 550);
				else
					container.setStyle('width', 650);
					
				var pagesets = [
					{ start: 1, end: 3 },
					{ start: this.page - 2, end: this.page + 2 },
					{ start: pages - 2, end: pages }
				];
				var cssClass, style;
				for (var setIndex = 0; setIndex < pagesets.length; setIndex++) {
					var set = pagesets[setIndex];
					for (var i = set.start; i <= set.end; i++) {
						if (i < 1 || i > pages) continue;
						style = setIndex  != 1 ? CIButton.PageStyle : (this.page == i ? CIButton.SelectedPageStyle : CIButton.PageStyle);
						var e = new CIButton({
							label: i,
							style: style,
							Clicked: this._selectPageUsingEvent.bind(this)
						}).element(container);
						e.store('CIPaginatorPage', i);
					}
					if (setIndex == 0) new CIElement('p', { styles: { 'float': 'left', margin: 0 }, html: '&nbsp;&laquo;&nbsp;&nbsp;'}).element(container);
					if (setIndex == 1) new CIElement('p', { styles: { 'float': 'left', margin: 0 }, html: '&nbsp;&raquo;&nbsp;&nbsp;'}).element(container);
				}
			} 
		} else if (this.type == 'alpha') {
			container.setStyle('width', CIPaginator.alphabet.length * 30);
			this.page = (response.CIPaginatorPage || 'A');
			CIPaginator.alphabet.each(function(letter) {
				var link = new CIButton({
					label: letter.toUpperCase(),
					style: this.page == letter ? CIButton.SelectedPageStyle : CIButton.PageStyle,
					Clicked: function() { this.selectPage(letter); }.bind(this)
				});
				link.element(container);
			}.bind(this));
		}
	},
	
	/*
		Function: selectPage(page)
		Sends a request to retrieve the data for the specified page
		
		Parameters:
			page - Number. The page to show
		
		Returns:
			This CIPaginator
	*/
	selectPage: function(page) {
		var params = {
			CIPaginatorItemsPerPage: this.itemsPerPage,
			CIPaginatorPage: page
		};
		if (this.filters) params[this.filters.name] = this.filters.toParam();
		this.paginates.getData(params);
		return this;
	},
	
	_selectPageUsingEvent: function(event) {
		this.selectPage(event.target.getParent().retrieve('CIPaginatorPage'));
	},
	
	reloadPage: function() {
		this.selectPage(this.page);
		return this;
	}
});
/*
	Constant: CIPaginator.alphabet
	An array of the characters to display for alpha-type paginators.
	First character is '#', then is 'a' through 'z', all lowercase.
*/
CIPaginator.alphabet = ['#', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z' ]
var CIFilter = new Class({
	Extends: CIView,
	
	initialize: function(configuration) {
		this.parent(configuration);
		this.isA('CIFilter');
		this.name = configuration.name;
		this.label = configuration.label || this.name;
		this.setSrc(configuration.src);
		this.setActive(configuration.active);
		this.setFilterSet(configuration.filterSet);
	},
	setSrc: function(newSrc) {
		this.src = newSrc;
		var match = this.src.match(/(.+?)\.(\w{3,4})$/);
		this.activeSrc = match[1] + '_active.' + match[2];
	},
	setActive: function(newActive) {
		this.set('active', newActive);
		if (!this._button) return;
		this._button.setSrc(this.active ? this.activeSrc : this.src);
		this.filterSet.reload();
	},
	setFilterSet: function(newFilterSet) {
		this.set('filterSet', newFilterSet);
	},
	toggleActive: function() {
		this.setActive(!this.active);
	},
	_makeElement: function(parent) {
		this._button = new CIImageLink({
			src: this.active ? this.activeSrc : this.src,
			alt: this.label,
			cssStyles: { 'margin-left': 8 },
			Clicked: this.toggleActive.bind(this)
		});
		return this._button.element(parent);
	}
});

var CIFilterSet = new Class({
	Extends: CIView,
	
	initialize: function(configuration) {
		this.parent(configuration);
		this.isA('CIFilterSet');
		this.name = configuration.name || 'CIFilterActiveFilters';
		this.filters = $splat(configuration.filters);
		this.toParam = configuration.toParam ? configuration.toParam.bind(this) : this.defaultToParam;
		this.filters.each(function(filter) { filter.setFilterSet(this); }.bind(this));
		this.paginator = configuration.paginator;
	},
	defaultToParam: function() {
		return this.filters.map(function(filter) { return filter.active ? filter.name : null; }).clean().join(',');
	},
	reload: function() {
		this.paginator.reloadPage();
	},
	_makeElement: function(parent) {
		var container = new Element('div', {
			id: this.id,
			'class': 'CIFilterSet',
			styles: this.cssStyles
		});
		parent.adopt(container);
		for (var i = 0; i < this.filters.length; i++)
			this.filters[i].element(container);
		
		return container;
	}
});/*
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
};/*
	Class: CIText
	A simple wrapper class. It wraps a <p> Element
	
	Properties:
		id - String like CIText_#
		html - String. The innerHTML of the Element
*/
var CIText = new Class({
	Extends: CIView,
	
	/*
		Constructor: initialize(configuration)
		
		Configuration:
			CIText may be configured with just a string of the innerHTML or a Hash:
			html - String. The innerHTML to store
	*/
	initialize: function(options) {
		this.parent(options);
		this.isA('CIText');
		
		if ($type(options) == 'string' || ($type(options) == false))
			this.text = options
		else
			this.text = options.html || options.text || '';
	},
	
	setText: function(newText) {
		this.set('text', newText);
		if (this.element()) this.element().set('html', this.text);
	},
	
	/*	Function: _makeElement(parent)
		Parent adopts Element */
	_makeElement: function(parent) {
		var p = new Element('p', {
			id: this.id,
			styles: this.cssStyles,
			'class': 'CIText ' + this.cssClass,
			html: this.text
		});
		parent.adopt(p);
		return p;
	}
});/*
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
var CIHUD = CIHud;/*
	Class: CIAutocomplete
	An basic but efficient textual autocomplete widget applied to a text CIFormField. Implements CIRequestable's get to retrieve the set of data to filter, and post to submit the selected item.
	Note that the get request is only called once, to retrieve the set of data to filter, making it very efficient. Its element(parent) should not be called directly.
	It will be shown when its target fires a <CIEvent.Changed> event
	
	Properties:
		id - String like CIAutocomplete_#
		target - CIObject. The target field to autocomplete. Usually CIFormField. Do not set directly, instead use <CIAutocomplete#bindTo(target)>
		selected - Object. The selected object
		
		*See configuration for others*
		
	Events:
		- <CIEvent.Clicked>
		- <CIEvent.Changed>
		- <CIEvent.Selected>
		- <CIEvent.GotData>
		- <CIEvent.PostedData>
		- <CIEvent.Hiding>
		- <CIEvent.RemovingFromDom>
		- <CIEvent.RemovedFromDom>
		- <CIEvent.Hidden>
*/
// TODO split into CIAutocomplete (being a logic-only controller), and CIAutocompleter which creates the bindings and uses CIMenu
var CIAutocomplete = new Class({
	Extends: CIView,
	Implements: CIRequestable,
	
	/*
		Constructor: initialize(configuration)
		
		Configuration:
			get - String or Hash. The get request to retrieve the set of data to filter. See <CIRequestable>
			post - String or Hash. The post request made when an item is clicked. See <CIRequestable>
			property - String. The textual property on the filtered objects by which to filter results. Default 'label'
			collection - Array. The array of objects to filter
			targetValueFn - Function. A function that returns the value of the target field. Default target.getValue()
			caseSensitive - Boolean. Whether the filter is case sensitive. Default false
	*/
	initialize: function(options) {
		this.parent(options);
		this.isA('CIAutocomplete');
		this._makeRequestable(options);
		this._request.addEvent(CIEvent.GotData, this._gotData.bind(this));
		this._request.addEvent(CIEvent.PostedData, this.hide.bind(this));
		this.property = options.property || 'label';
		this.collection = $splat(options.collection);
		this.target = null;
		this.targetValueFn = options.targetValueFn || function(target) { return target.getValue(); };
		this.caseSensitive = options.caseSensitive;
		this.addEvent(CIEvent.Selected, this.postData);
	},
	
	/*
		Function: bindTo(target)
		Bind this CIAutocomplete to the target and make the get request. When the target fires a <CIEvent.Changed>, it will invoke the autocompleter
		
		Returns:
			This CIAutocomplete
	*/
	// TODO remove the Changed event if already bound
	bindTo: function(target) {
		this.getData();
		this.target = target;
		this.target.addEvent(CIEvent.Changed, this._autocomplete.bind(this));
		return this;
	},
	
	/*
		Function: getData()
		HTTP get the set of data to filter
		
		Returns:
			This CIAutocomplete
	*/
	getData: function(moreParams) {
		this._request.get(moreParams);
		return this;
	},
	_gotData: function(collection, json) {
		this.set('collection', $splat(collection));
	},
	
	/*
		Function: postData()
		HTTP post something. The post paramsFn is passed this.selected
		
		Returns:
			This CIAutocomplete
	*/
	postData: function(moreParams) {
		if (this._request.canPost) {
			this._request.post(moreParams, this.selected);
		}
	},
	
	/*
		Function: hide()
		Hide the autocompleter. Useful when the autocompleter's parent has changed position since autocompleters cannot move.
		Fires the following events in order:
		<CIEvent.Hiding> -> <CIEvent.RemovingFromDom> -> (element destroyed) -> <CIEvent.RemovedFromDom> -> <CIEvent.Hidden>
	
		Returns:
			Mootools.Fx.Tween
	*/
	hide: function() {
		var elem = this.element();
		if (!elem) return;
		return new Fx.Tween(elem, {
			property: 'opacity', duration: 150
		}).start(0).chain(function() {
			this.fireEvent(CIEvent.Hiding, [elem]);
			this.fireEvent(CIEvent.RemovingFromDom, [elem]);
			elem.destroy();
			this.fireEvent(CIEvent.RemovedFromDom);
			this.fireEvent(CIEvent.Hidden);
		}.bind(this));
	},
	
	_autocomplete: function() {
		var overlay = this.element(document.body).empty();
		
		var query = this.targetValueFn(this.target);
		if (!this.caseSensitive) query = query.toLowerCase();
		// Pre-cache for performance
		var i = 0, s = '', index = -1;
		var item = {}, cssClass = '', div = {}, html = '';
		for (i; i < this.collection.length; i++) {
			item = this.collection[i];
			s = item[this.property];
			s = s ? s.toString() : '';
			index = (!this.caseSensitive ? s.toLowerCase() : s).indexOf(query);
			
			if (index > -1) {
				html = s.substring(0, index) + '<span class="CIAutoCompleteHighlight">';
				html += s.substr(index, query.length) + '</span>';
				html += s.substring(index+query.length);
				cssClass = i % 2 == 0 ? 'CIEvenSkin' : 'CIOddSkin';
				div = new Element('div', {
					'class': 'CIAutocompleteResult CIHoverableSkin ' + cssClass,
					html: html
				});
				div.store('CIAutocompleteRecord', item);
				div.addEvent('click', function(event) {
					this.fireEvent(CIEvent.Clicked, [event]);
					this.selected = div.retrieve('CIAutocompleteRecord');
					this.fireEvent(CIEvent.Changed, [this.selected])
					this.fireEvent(CIEvent.Selected);
				}.bind(this));
				overlay.adopt(div);
			}
		}
	},
	
	_makeElement: function(parent) {
		// Setting targetElement needs to be delayed until it's time to
		// show the overlay because we need the target to be in the DOM
		this.targetElement = this.target.isCIObject ? this.target.element() : this.target;
		var dimensions = this.targetElement.getCoordinates();
		var overlay = new Element('div', {
			'class': 'CIAutocomplete',
			id: this.id,
			styles: {
				width: dimensions.width,
				top: dimensions.top + dimensions.height,
				left: dimensions.left
			}
		});
		overlay.inject(document.body, 'top');
		
		return overlay;
	}
});var CIIndicator = new Class({
	Extends: CIView,
	
	initialize: function(configuration) {
		configuration = configuration || {};
		this.parent(configuration);
		this.isA('CIIndicator');
		this.alt = configuration.alt || 'Working...';
		this.style = configuration.style || CIIndicator.Style;
	},
	
	_makeElement: function(parent) {
		var container = new Element('div', {
			id: this.id,
			'class': 'CIIndicator ' + this.cssClass,
			styles: this.cssStyles
		});
		container.setStyle('display', 'none');
		parent.adopt(container);
		this._imageElement = new Element('img', {
			src: this.style.get('image'),
			alt: this.alt,
			title: this.alt
		});
		container.adopt(this._imageElement);
		
		this._applyStyle();
		return container;
	},
	
	_applyStyle: function(newStyle) {
		if (!this.element()) return;
		var style = newStyle || this.style;
		this._imageElement.src = style.get('image');
		this.element().setStyles({
			width: style.get('width') || 'auto',
			height: style.get('height') || 'auto'
		});
		
		return this;
	}
});/* CIMenu is a dumb container. It needs its subviews to tell it which of them was clicked */
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
});*/var CIMenuItem = new Class({
	Extends: CITitle,
	
	initialize: function(configuration) {
		this.parent(configuration);
		this.isA('CIMenuItem');
		this.synthesize({
			style: CIMenuItem.Style,
			menu: null,
			value: null
		}, configuration);
	},
	
	_makeElement: function(parent) {
		var title = this.parent(parent);
		title.addEvent('mouseenter', this._mouseEntered.bind(this));
		title.addEvent('mouseleave', this._mouseLeft.bind(this));
		title.addEvent('click', this._clicked.bind(this));
		return title;
	},
	
	_mouseEntered: function(event) {
		this.fireEvent(CIEvent.MousedOver, [event]);
		CISelectionStyle.select(this.element());
	},
	
	_mouseLeft: function(event) {
		this.fireEvent(CIEvent.MousedOut, [event]);
		CISelectionStyle.unselect(this.element());
	},
	
	_clicked: function(event) {
		this.fireEvent(CIEvent.Clicked, [event]);
		CISelectionStyle.unselect(this.element());
		(function() { CISelectionStyle.select(this);   }).delay(50, this.element());
		(function() { CISelectionStyle.unselect(this); }).delay(150, this.element());
		if (this.menu) (function() {
			this.menu.selectSubview(this);
			this.menu.hide();
		}).delay(150, this);
	}
});
CIMenuItem.Style = new CIStyle({
	borderSize: 0,
	textSize: '0.9em',
	padding: 3,
	gap: 0
});var CIVerticalTabPanel = new Class({
	Extends: CIView,
	
	initialize: function(configuration) {
		this.parent(configuration);
		this.isA('CIVerticalTabPanel');
		this.synthesize({
			style: CIVerticalTabPanel.Style,
			tabs: [],
			content: [],
			selectedIndex: null,
			selectedContentElement: null
		}, configuration);
		this.tabs = $splat(this.tabs);
		this.content = $splat(this.content);
		if (configuration.selectTab != undefined) {
			this.addEvent(CIEvent.AddedToDom, function() {
				this.selectTab(configuration.selectTab);
			}.bind(this));
		}
	},
	
	_makeElement: function(parent) {
		var tabPanel = new Element('div', {
			id: this.id,
			'class': 'CIVerticalTabPanel'
		});
		parent.adopt(tabPanel);
		var table = new Element('table', {
			id: this.id + '_TableElement',
			cellpadding: 0,
			cellspacing: 0,
			border: 0
		});
		tabPanel.adopt(table);
		var tr = new Element('tr');
		table.adopt(tr);
		
		var tabColumn = new Element('td', {
			id: this.id + '_TabColumn',
			'class': 'CIVerticalTabPanelTabColumn',
			valign: 'top',
			styles: {'vertical-align': 'top'}
		});
		tr.adopt(tabColumn);
		var contentColumn = new Element('td', {
			id: this.id + '_ContentColumn',
			'class': 'CIVerticalTabPanelContentColumn',
			valign: 'top',
			styles: {'vertical-align': 'top'}
		});
		tr.adopt(contentColumn);
		
		this.render();
		this.applyStyle();
		return tabPanel
	},
	
	tabColumnElement: function() {
		return $(this.id + '_TabColumn');
	},
	
	contentColumnElement: function() {
		return $(this.id + '_ContentColumn');
	},
	
	applyStyle: function(newStyle) {
		var style = newStyle || this.style || CIVerticalTabPanel.Style;
		var panel = this.element();
		this.tabColumnElement().setStyles({
			'background-color': style.get('tabColumnBackgroundColor')
		});
		this.tabColumnElement().getChildren().each(function(e) {
			e.setStyle('cursor', 'pointer');
		});
		this.contentColumnElement().setStyles({
			'background-color': style.get('contentColumnBackgroundColor'),
			'border-left-style': 'solid',
			'border-left-width': style.get('dividerWidth'),
			'border-left-color': style.get('dividerColor')
		});
	},
	
	unrender: function() {
		this.tabColumnElement().empty();
		this.contentColumnElement().empty();
		this.fireEvent(CIEvent.Unrendered);
	},
	
	render: function() {
		this.unrender();
		var i = 0;
		for (; i < this.tabs.length; i++) {
			var container = new Element('div', {
				'class':'CIVerticalTabPanelTabContainer'
			});
			this.tabColumnElement().adopt(container);
			var e = this.tabs[i].element(container);
			container.store('CIVerticalTabPanelIndex', i);
			container.addEvent('click', this._tabClicked.bind(this));
		}
		for (i = 0; i < this.content.length; i++) {
			var e = this.content[i].element(this.contentColumnElement());
			e.store('CIVerticalTabPanelIndex', i);
			e.hide();
		}
		this.fireEvent(CIEvent.Rendered);
	},
	
	_tabClicked: function(event) {
		this.fireEvent(CIEvent.Clicked, [event]);
		var tab = event.target.getParent('.CIVerticalTabPanelTabContainer');
		var index = tab.retrieve('CIVerticalTabPanelIndex');
		if (this.selectedContentElement) {
			CISelectionStyle.unselect(this.tabs[this.selectedIndex].element());
			this.selectedContentElement.hide();
		}
		this.setSelectedIndex(index);
		CISelectionStyle.select(this.tabs[index].element());
		this.setSelectedContentElement(this.content[index].element());
		this.selectedContentElement.show();
		this.fireEvent(CIEvent.Selected, [this.selectedIndex, this.selectedContentElement]);
	},
	
	selectTab: function(index) {
		var tab = this.tabs[index].element();
		this._tabClicked({ target: tab });
	}
});

CIVerticalTabPanel.Style = new CIStyle({
	tabColumnBackgroundColor: CIStyle.SourceBackgroundColor,
	contentColumnBackgroundColor: '#FFFFFF',
	dividerWidth: 2,
	dividerColor: CIStyle.DividerColor
});CITable.Style = new CIStyle({
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