/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
 
/**
 * Gets weither this object is an array [] and not an object {}
 */
function isArray(itm) {
	return itm &&
		typeof(itm) == 'object' &&
		typeof itm.length === 'number' &&
		typeof itm.splice === 'function';
}

var cloneStack = [];
/**
 * Duplicate <myObj> and its components
 */
function clone(myObj) {
	if(null== myObj || typeof(myObj) != 'object' || myObj.ownerDocument) return myObj;
	if(nul.debug.assert) assert(!cloneStack.contains(myObj), 'Clone not re-entrant'); 
	cloneStack.push(myObj);
	try { return map(myObj, function(i, o) { return clone(o); }); }
	finally { cloneStack.pop(myObj); }
}

/**
 * Duplicate <myObj> ut components are just references
 */
function clone1(myObj) {
	if(null== myObj || typeof(myObj) != 'object') return myObj;
	return map(myObj, function(i,o) { return o; });
}

/**
 * Gets weither <ndx> is a custom index of <ass>
 * Returns false for all the default properties of the arrays.
 */
function cstmNdx(ndx, ass) {
	return ''!== ndx && 
		((ass && (!isArray(ass) || ass[ndx]!= [][ndx])) || 'undefined'== typeof [][ndx]);
}
/**
 * Internal (helper) use for mapping functions
 */
function mapCb(fct, ndx, itm) {
	return fct?fct.apply( ['object','function'].contains(typeof itm)?itm:null, [reTyped(ndx), itm]):itm;
}

/**
 * Returns the first of <itm> for which the function <fct> returned a value evaluated to true
 */
function trys(itm, fct) {
	var rv;
	for(var i in itm) if(cstmNdx(i, itm))
		if(rv = mapCb(fct, i, itm[i])) return rv;
}

/**
 * Returns the sum of the returns value (or 1 if not-false and not-number)
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
 * Returns the same item as <itm> where each member went through <fct>
 */
function map(itm, fct) {
	var rv = isArray(itm)?[]:{};
	for(var i in itm) if(cstmNdx(i, itm)) 
		rv[i] = mapCb(fct, i, itm[i]);
	return rv;
}


/**
 * Returns the same item as <itm> where each member went through <fct>
 * Each members returning an empty value are not added
 */
function maf(itm, fct) {
	var rv = isArray(itm)?[]:{};
	for(var i in itm) if(cstmNdx(i, itm)) {
		var ndx = reTyped(i); 
		var trv = mapCb(fct, i, itm[i]);
		if('undefined'!= typeof trv && null!== trv) {
			if('number'== typeof ndx) rv.push(trv);
			else rv[ndx] = trv;
		}
	}
	return rv;
}

function escapeHTML(str) {
   var div = document.createElement('div');
   var text = document.createTextNode(str);
   div.appendChild(text);
   return div.innerHTML;
};

//Is <o> an empty association ? (beside the values contained in array <b>) 
function isEmpty(o, b) {
	for(var i in o) if(!b || !b.contains(reTyped(i))) return false;
	return true;
}

//If a string is '5', get it as the number 5
function reTyped(v) {
	if('string'!= typeof v) return v;
	if((new RegExp('^(\\d+)$', 'g')).exec(v)) return parseInt(v);
	return v;
}

//The array of keys of association <ass>
function keys(ass) {
	var rv = [];
	for(var i in ass) if(cstmNdx(i, ass)) rv.push(i);
	return rv;
}

//The array of values of association <ass>
function vals(ass) {
	var rv = [];
	for(var i in ass) if(cstmNdx(i, ass)) rv.push(ass[i]);
	return rv;
}

//If elements of <t> are tables, they become part of <t>
// [ 1, [2, [3, 4]], 5 ] ==> [ 1, 2, 3, 4, 5 ]
function oneFlatTable(t) {
	var rv = [];
	for(var i=0; i<t.length; ++i)
		if(isArray(t[i])) rv = rv.concat(oneFlatTable(t[i]));
		else rv.push(t[i]);
	return rv;
}

//Compare arrays
function arrCmp(a, b) {
	if(a.length != b.length) return false;
	for(var i=0; i<a.length; ++i) if(a[i] != b[i]) return false;
	return true;
}

//arguments to Array()
function arrg(args, ndx) {
	var rv = [];
	for(var i=(ndx||0); i<args.length; ++i) rv.push(args[i]);
	return rv;
}

function beArrg(args, ndx) {
	if(!ndx) ndx = 0;
	if(ndx >= args.length) return [];
	if(1+ndx== args.length && isArray(args[ndx])) return clone1(args[ndx]);
	return arrg(args, ndx);
}

function merge(a, b, cb) {
	for(var i in b) if(cstmNdx(i, a)) a[i] = cb?cb(a[i],b[i], i):b[i];
	if(cb) for(var i in a) if('undefined'== typeof b[i]) a[i] = cb(a[i], null, i);
	return a; 
}

[].indexOf || (Array.prototype.indexOf = function(v){
       for(var i = this.length; i-- && this[i] !== v;);
       return i;
});
[].contains || (Array.prototype.contains = function(v){ return -1< this.indexOf(v); });

[].pushs || (Array.prototype.pushs = function(){
	for(var j=0; j<arguments.length; ++j) {
		var o = arguments[j];
		if(this===o)
			throw nul.internalException('Catenating self')
		for(var i=0; i<o.length; ++i) this.push(o[i]);
	}
	return this; 
});

[].union || (Array.prototype.union = function(){
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

[].added || (Array.prototype.added = function(v){
	var rv = clone1(this);
	rv.unshift(v);
	return rv; 
});

/**
 * Returns an array whose elements are the return values of <fct> taken for each item of <itm>
 * <fct> return an array of element to add in the return list
 */
[].mar || (Array.prototype.mar = function(fct) {
	var rv = [];
	for(var i in this) if(cstmNdx(i)) rv.pushs(mapCb(fct, i, this[i]));
	return rv;
});

pinf = Number.POSITIVE_INFINITY;
ninf = Number.NEGATIVE_INFINITY;
