/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.obj = Class.create({
	components: [],
	modd: function(inm, vl) {
		var rv = clone1(this), brwsr = rv;
		inm = inm.split('.');
		while(1<inm.length) {
			var uinm = inm.unshift();
			brwsr = brwsr[uinm] = clone1(rv[uinm]);
		}
		brwsr[uinm[0]] = vl;
		return rv;
	},
	getd: function(inm) {
		var rv = clone1(this), brwsr = rv;
		inm = inm.split('.');
		while(1<inm.length) {
			var uinm = inm.unshift();
			brwsr = brwsr[uinm] = clone1(rv[uinm]);
		}
		return brwsr[uinm[0]];
	},
});

nul.obj.defined = Class.create(nul.obj, {
	valAttr: function(anm) {
		var avl = this.attr[anm];
		if(!avl) return;
		if('function'!= typeof(avl)) return nul.possibles(avl);
		return avl(this);
	},
	fctAttr: function(anm, op) {
		var avl = this.attr[anm];
		if(!avl) return;
		if('function'!= typeof(avl)) return nul.possibles(/*TODO*/);
		return avl(this, op);
	},
	//Default functions through attributes
	has: function(o) {
		if(this.attr[' ']) return this.fctAttr(' ', o);
	},
	through: function(o) {
		return [];	//TODO: has 
	},
	defined: function() { return this; },
	initialise: function(attr) {
		this.attr = attr||{};
	}
});

/**
 * All defined objects that define a set of objects (that are not pairs)
 * So, these sets never returns anything taken through
 */
nul.obj.noThroughSet = Class.create(nul.obj.defined, {
	through: function(o) { return []; }
});