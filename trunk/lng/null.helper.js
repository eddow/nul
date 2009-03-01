/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
 
//Gets weither this object is an array [] and not an object {}
function isArray(itm) {
	return itm && null!= itm &&
		typeof(itm) == 'object' &&
		typeof itm.length === 'number' &&
		!itm.propertyIsEnumerable('length') &&
		typeof itm.splice === 'function';
}

var cloneStack = [];
//Duplicate <myObj> and its components
function clone(myObj) {
	if(null== myObj || typeof(myObj) != 'object') return myObj;
	if(nul.debug.assert) assert(!cloneStack.contains(myObj), 'Clone not re-entrant'); 
	cloneStack.push(myObj);
	try { return map(myObj, function() { return clone(this); }); }
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
	for(var i in itm) if(itm[i]!= [][i]) if(rv = fct(itm[i], i)) return rv;
}
//Returns the same item as <itm> where each member went through <fct>
function map(itm, fct) {
	var rv = isArray(itm)?[]:{};
	for(var i in itm) if(itm[i]!= [][i]) rv[i] = fct.apply(itm[i], [i, itm[i]]);
	return rv;
}

function escapeHTML(str) {
   var div = document.createElement('div');
   var text = document.createTextNode(str);
   div.appendChild(text);
   return div.innerHTML;
};

var mathSymbols = {
'>': '&gt;',
'<': '&lt;',
'>=': '&ge;',
'<=': '&le;',
};
function mathSymbol(s) {
	if(mathSymbols[s]) return mathSymbols[s];
	return s;
}

//Is <o> an empty association ?
function isEmpty(o) {
	for(var i in o) return false;
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

//Get <arr> shifted with <itm> but don't modify <arr>
function unshifted(itm, arr) {	//TODO: virer les unshifted inutiles (après les clones)
	arr = clone1(arr);
	arr.unshift(itm);
	return arr;
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

//a = a.concat(o) : side-effect
function seConcat(a, o) {
	if(a===o) throw nul.internalException('seConcatening self')
	for(var i=0; i<o.length; ++i) a.push(o[i]);
	return a;
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

[].indexOf || (Array.prototype.indexOf = function(v){
       for(var i = this.length; i-- && this[i] !== v;);
       return i;
});
[].contains || (Array.prototype.contains = function(v){ return -1< this.indexOf(v); });

[].clone || (Object.prototype.clone = function(){ return clone(this); });
//[].clone1 || (Object.prototype.clone1 = function(){ return clone1(this); });	//TODO?
[].map || (Object.prototype.map = function(f){ return map(this,f); });
