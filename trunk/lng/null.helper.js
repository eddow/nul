/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
 
//Gets weither this object is an array [] and not an object {}
function isArray(itm) {
	return itm &&
		typeof(itm) == 'object' &&
		typeof itm.length === 'number' &&
		!itm.propertyIsEnumerable('length') &&
		typeof itm.splice === 'function';
}

var cloneStack = [];
//Duplicate <myObj> and its components
function clone(myObj) {
	if(null== myObj || typeof(myObj) != 'object' || myObj.ownerDocument) return myObj;
	if(nul.debug.assert) assert(!cloneStack.contains(myObj), 'Clone not re-entrant'); 
	cloneStack.push(myObj);
	try { return map(myObj, function(i, o) { return clone(o); }); }
	finally { cloneStack.pop(myObj); }
}

//Duplicate <myObj> ut components are just references
function clone1(myObj) {
	if(null== myObj || typeof(myObj) != 'object') return myObj;
	return map(myObj, function(i,o) { return o; });
}

//If <a> then <a> else <b>
function iif(a, b) {
	return ('undefined'== (typeof a) || null=== a)?b:a;
}

//Returns the first of <itm> for which the function <fct> returned a value evaluated to true
function trys(itm, fct) {
	var rv;
	for(var i in itm) if(itm[i]!= [][i] || 'undefined'== typeof [][i])
		if(rv = fct.apply(
			['object','function'].contains(typeof itm[i])?itm[i]:null,
			[reTyped(i), itm[i]])) return rv;
}
//Returns the same item as <itm> where each member went through <fct>
function map(itm, fct) {
	var rv = isArray(itm)?[]:{};
	for(var i in itm) if(itm[i]!= [][i] || 'undefined'== typeof [][i]) 
		rv[i] = fct.apply(
			['object','function'].contains(typeof itm[i])?itm[i]:null,
			[reTyped(i), itm[i]]);
	return rv;
}

function escapeHTML(str) {
   var div = document.createElement('div');
   var text = document.createTextNode(str);
   div.appendChild(text);
   return div.innerHTML;
};

//Is <o> an empty association ? (<b>eside the values contained in array <b>) 
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
	for(var i in ass) rv.push(i);
	return rv;
}

//The array of valuess of association <ass>
function vals(ass) {
	var rv = [];
	for(var i in ass) rv.push(ass[i]);
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
function arrg(args) {
	var rv = [];
	for(var i=0; i<args.length; ++i) rv.push(args[i]);
	return rv;
}

function beArrg(args) {
	if(1!= args.length) return arrg(args);
	if(!isArray(args[0])) return [args[0]];
	return args[0];
}

function merge(a, b, cb) {
	for(var i in b) a[i] = cb?cb(a[i],b[i], i):b[i];
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
		if(this===o) throw nul.internalException('Catenating self')
		for(var i=0; i<o.length; ++i) this.push(o[i]);
	}
	return this; 
});
//[].clone1 || (Object.prototype.clone1 = function(){ return clone1(this); });	//TODO?
[].map || (Object.prototype.map = function(f){ return map(this,f); });
