/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**
 * Determines weither this number is an integer
 * @param {Number} n
 * @return {Boolean}
 */

(function($) {
	$.extend({
		keys: function(obj) {
			var a = [];
			$.each(obj, function(k) {a.push(k); });
			return a;
		},
		/**
		 * For an url option specified in ptcl://url/path/file.ext?options#anchor,
		 * retrieve the value given (if option looks like name=value),
		 * true if the option was gicen without and argument (http://...html?...&ImHappy&...)
		 * false if the option was not given
		 * @param {String} opt The name of the option to retrieve
		 * @return {Boolean|String} The value of the given option
		 */
		url: function(opt) {
			var srch = (window.location.href.split('?')[1]||'').split('#')[0];
			if(!srch) return;
			srch = '&'+srch+'&';
			var rx = new RegExp('\\&'+opt+'(\\=(.*?))?\\&');
			var mh = rx.exec(srch);
			return mh?(mh[2]||true):false;
		},
		id: function(x) { return x; },
		/**
		 * Text node creation shortcut
		 * @param {String} str
		 * @return {jQuery} text node
		 */
		text: function(str) { return $(document.createTextNode(str)); }
	});
})(jQuery);

function isJsInt(n) {
	return n== Math.floor(n);
}

/**
 * Gets weither the index is defined in the class definition
 * @param obj
 * @param ndx
 * @return {Boolean}
 */
function isClsNdx(obj, ndx) {
	if(!obj || 'object'!= typeof obj) return false;
	if('constructor'== ndx) return true;
	for(var c = obj.constructor; c; c = c.superclass)
		if('undefined'!= typeof c.prototype[ndx])
			return c.prototype[ndx] === obj[ndx];
	return false;
}

/**
 * Creates an empty object having the same class as a given one
 * @param {Object} obj Object to mimic
 * @return {Object}
 */
function newEmpty(obj) {
	if('object' != typeof obj) return obj;
	if(!obj.constructor) return {};
	var nativeTypes = [Array, Boolean, Date, String, Number];

	var c = obj.constructor;
	var rv = nativeTypes.include(c) ? c() : {constructor: c, toString: obj.toString};
	for(; c; c = c.superclass) for(var i in c.prototype) if(c.prototype[i]===obj[i]) rv[i] = c.prototype[i];

	return rv;
}

/**
 * Return all the elements that are owned by the object, not his prototype or such
 * @param itm
 * @param fct function(dst, src, ndx)
 * @return
 */
function ownNdx(itm, fct) {
	//TODO 3: use yield?
	if(fct) {
		var rv = newEmpty(itm);
		for(var ndx in itm)
			if(!isClsNdx(itm, ndx))
				fct(rv, itm, reTyped(ndx));
		return rv;
	}
	var rv = {};
	for(var ndx in itm)
		if(!isClsNdx(itm, ndx))
			rv[ndx] = itm[ndx];
	return rv;
}

/**
 * Internal (helper) use for mapping functions
 * @private
 */
function mapCb(fct, ndx, itm) {
	return fct?fct.apply( ['object','function'].include(typeof itm)?itm:null, [reTyped(ndx), itm]):itm;
}

/**
 * Returns the first of 'itm' for which the function 'fct' returned a value evaluated to true
 * @param {Object} itm
 * @param {MapCallBack} fct
 */
function trys(itm, fct) {
	var rv;
	for(var i in ownNdx(itm))
		if(rv = mapCb(fct, i, itm[i])) return rv;
}

/**
 * Returns the sum of the returns value (or 1 if not-false and not-number)
 * @param {Object} itm
 * @param {MapCallBack} fct
 */
function cnt(itm, fct) {
	var rv = 0;
	
	for(var i in ownNdx(itm)) { 
		var trv = mapCb(fct, i, itm[i]);
		if('number'== typeof trv) rv += trv;
		else if(trv) ++rv;
	}
	return rv;
}

/**
 * Returns the same item as 'itm' where each member went through 'fct'.
 * @param {Object} itm
 * @param {MapCallBack} fct
 */
function map(itm, fct) {
	return ownNdx(itm, function(dst, src, ndx) {
		dst[ndx] = mapCb(fct, ndx, itm[ndx]);
	});
}


/**
 * Returns the same item as 'itm' where each member went through 'fct'.
 * Each members returning an empty value are not added
 * @param {Object} itm
 * @param {MapCallBack} fct
 */
function maf(itm, fct) {
	return ownNdx(itm, function(dst, src, ndx) {
		var trv = mapCb(fct, ndx, itm[ndx]);
		if('undefined'!= typeof trv && null!== trv) {
			if('number'== typeof ndx) dst.push(trv);
			else dst[ndx] = trv;
		}
	});
}

/**
 * Escape a string for it to be displayable as text in a HTML page
 * @param {String} str
 * @return {HTML}
 */
function escapeHTML(str) {
	return $('<div />').text(str).html();
};

/**
 * Is 'o' an empty association ? (beside the values contained in array 'b')
 * @param {Object} o
 * @param {param array} b
 * @return {Boolean}
 */ 
function isEmpty(o, b) {
	b = beArrg(arguments, 1);
	for(var i in o) if(!b || !b.include(i)) return false;
	return true;
}

/**
 * If a string is '5', get it as the number 5
 * @param {String|Number} v
 * @return {String|Number}
 */
function reTyped(v) {
	if('string'!= typeof v) return v;
	if((new RegExp('^(\\d+)$', 'g')).exec(v)) return parseInt(v);
	return v;
}

/**
 * Take the 'param array' parameters of the function
 * @param {Arguments} args The given "arguments"
 * @param ndx The argument-index where the param-array begind
 * @return {any[]}
 */
function beArrg(args, ndx) {
	if(!ndx) ndx = 0;
	if(ndx >= args.length) return [];
	if(1+ndx== args.length && $.isArray(args[ndx])) return map(args[ndx]);
	return $.makeArray(args).slice(ndx);
}

/**
 * Modifies the components of an Object (dst) along the components of another Object {src}
 * @param {Object} dst The destination Object
 * @param {Object} src The modifying Object
 * @param {function(srcElement,dstElement) {any}} cb Call-back to compute the new value
 * @return {Object} dst
 */
function merge(dst, src, cb) {
	for(var i in ownNdx(src)) dst[i] = cb?cb(dst[i],src[i], i):src[i];
	if(cb) for(var i in ownNdx(dst)) if('undefined'== typeof src[i]) dst[i] = cb(dst[i], null, i);
	return dst; 
}

//TODO 2: use prototype addMethod ?
[].pushs || (Array.prototype.pushs =
	/**
	 * Concatenate array(s) to this one
	 * @memberOf Array#
	 * @param {Array} [paramarray]
	 * @name pushs
	 */
	function(){
		for(var j=0; j<arguments.length; ++j) {
			var o = arguments[j];
			if(this===o) nul.ex.internal('Catenating self');
			if(!$.isArray(o)) this.push(o);
			else for(var i=0; i<o.length; ++i) this.push(o[i]);
		}
		return this; 
	});

[].union || (Array.prototype.union = 
	/**
	 * Add elements from an array if they're not already present
	 * @memberOf Array#
	 * @param {Array} [paramarray]
	 * @name union
	 */
	function(){
		for(var j=0; j<arguments.length; ++j) {
			var o = arguments[j];
			for(var i=0; i<o.length; ++i) {
				var s;
				for(s=0; s<this.length; ++s) if(this[s]===o[i]) break;
				if(s>=this.length) this.push(o[i]);
			}
		}
		return this; 
	});

[].mar || (Array.prototype.mar = 
	/**
	 * Returns an array whose elements are the return values of <fct> taken for each item of <itm>
	 * <fct> return an array of element to add in the return list
	 * @memberOf Array#
	 * @param {MapCallBack} fct
	 * @name mar
	 */
	function(fct) {
		var rv = [];
		for(var i in ownNdx(this)) rv.pushs(mapCb(fct, i, this[i]));
		return rv;
	});

[].include || (Array.prototype.include = 
	function(itm) { return -1< $.inArray(itm, this); });

[].indexOf || (Array.prototype.indexOf = 
	function(itm) { return $.inArray(itm, this); });


/** @constant */
pinf = Number.POSITIVE_INFINITY;
/** @constant */
ninf = Number.NEGATIVE_INFINITY;

$o = {
	clone: function(o) {
		var rv = {};
		for(var a in o) rv[a] = o[a];
		return rv;
	}
};

Function.prototype.contract = function(){ return function(){}; };
Function.prototype.asserted = function(){};
