/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**
 * Gets weither this object is an array [] and not an object {}
 * @param {Object} itm
 * @return {Boolean}
 */
function isArray(itm) {
	return itm &&
		typeof(itm) == 'object' &&
		typeof itm.length === 'number' &&
		typeof itm.splice === 'function';
}

/**
 * Determines weither this number is an integer
 * @param {Number} n
 * @return {Boolean}
 */
function isJsInt(n) {
	return n== Math.floor(n);
}

/**
 * Gets weither 'ndx' is a custom index of 'ass'
 * Returns false for all the default properties of the arrays.
 * @param {String|Number} ndx
 * @param {Object} ass
 * @return {Boolean}
 */
function cstmNdx(ndx, ass) {	//TODO 2: avoid the items that are identical to prototype
	return ((ass && (!isArray(ass) || ass[ndx]!= [][ndx])) || Object.isUndefined([][ndx]));
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
	for(var i in itm) if(cstmNdx(i, itm))
		if(rv = mapCb(fct, i, itm[i])) return rv;
}

/**
 * Returns the sum of the returns value (or 1 if not-false and not-number)
 * @param {Object} itm
 * @param {MapCallBack} fct
 */
function cnt(itm, fct) {
	var rv = 0;
	for(var i in itm) if(cstmNdx(i, itm)) { 
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
	var rv = isArray(itm)?[]:{};
	for(var i in itm) if(cstmNdx(i, itm)) 
		rv[i] = mapCb(fct, i, itm[i]);
	return rv;
}


/**
 * Returns the same item as 'itm' where each member went through 'fct'.
 * Each members returning an empty value are not added
 * @param {Object} itm
 * @param {MapCallBack} fct
 */
function maf(itm, fct) {
	var rv = isArray(itm)?[]:{};
	for(var i in itm) if(cstmNdx(i, itm)) {
		var ndx = reTyped(i); 
		var trv = mapCb(fct, i, itm[i]);
		if(!Object.isUndefined(trv) && null!== trv) {
			if('number'== typeof ndx) rv.push(trv);
			else rv[ndx] = trv;
		}
	}
	return rv;
}

/**
 * Escape a string for it to be displayable as text in a HTML page
 * @param {String} str
 * @return {HTML}
 */
function escapeHTML(str) {
   var div = document.createElement('div');
   var text = document.createTextNode(str);
   div.appendChild(text);
   return div.innerHTML;
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
	if(1+ndx== args.length && isArray(args[ndx])) return map(args[ndx]);
	return $A(args).slice(ndx);
}

/**
 * Modifies the components of an Object (dst) along the components of another Object {src}
 * @param {Object} dst The destination Object
 * @param {Object} src The modifying Object
 * @param {function(srcElement,dstElement) {any}} cb Call-back to compute the new value
 * @return {Object} dst
 */
function merge(dst, src, cb) {
	for(var i in src) if(cstmNdx(i, dst)) dst[i] = cb?cb(dst[i],src[i], i):src[i];
	if(cb) for(var i in dst) if(Object.isUndefined(src[i])) dst[i] = cb(dst[i], null, i);
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
			if(this===o)
				throw nul.internalException('Catenating self');
			for(var i=0; i<o.length; ++i) this.push(o[i]);
		}
		return this; 
	});

[].without || (Array.prototype.without =
	/**
	 * Concatenate array(s) to this one
	 * @memberOf Array#
	 * @param {Array} [paramarray]
	 * @name without
	 */
	function(){
		var excl = beArrg(arguments);
		return maf(this, function(n, o) { return excl.include(o)?null:o; } ); 
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
		for(var i in this) if(cstmNdx(i)) rv.pushs(mapCb(fct, i, this[i]));
		return rv;
	});

/** @constant */
pinf = Number.POSITIVE_INFINITY;
/** @constant */
ninf = Number.NEGATIVE_INFINITY;

////////////////	prototype extension

Element.addMethods(/** @ignore */{
	asHTML: function() {
		if(this.outerHTML) return this.outerHTML;
		var parent = this.parentNode;
		var posNext = this.nextSibling;
		var el = document.createElement(parent.tagName);
		el.appendChild(this);
		var shtml = el.innerHTML;
		if(!posNext) parent.appendChild(this);
		else parent.insertBefore(this, posNext);
		return shtml;
	}
});

/** @ignore */
Class.Methods.is= function(obj) {
	if(!obj || 'object'!= typeof obj) return false;
	var c = obj.constructor;
	while(c && c!= this) c = c.superclass;
	return c == this;
};

/** @ignore */
Element.addMethods(['TABLE', 'tbody'], {
	nbrRows: function(tbl) {
		return tbl.rows?tbl.rows.length:0;
	},
	clear: function(tbl) {
		while(tbl.nbrRows()) tbl.deleteRow(0);
	},
	completeFrom: function(tbl, src) {
		for(var r = tbl.nbrRows(); r<src.nbrRows(); ++r) {
			var drw = tbl.insertRow(-1);
			var srw = src.rows[r];
			for(var a=0; srw.attributes[a]; ++a) drw.writeAttribute(srw.attributes[a].name, srw.attributes[a].value);
			for(var c = 0; c < srw.cells.length; ++c)
				drw.insertCell(-1).innerHTML = srw.cells[c].innerHTML;
		}
	},
	copyFrom: function(tbl, src) {
		tbl.clear();
		tbl.completeFrom(src);
	}
});
