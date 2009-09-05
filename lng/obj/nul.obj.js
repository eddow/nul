/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.obj = Class.create({
	valAttr: function(anm) {
		var avl = this.attr?this.attr[anm]:null;
		if(!avl) return;
		if('function'!= typeof(avl)) return nu.possibles(avl);
		return avl(this);
	},
	fctAttr: function(anm, op) {
		var avl = this.attr?this.attr[anm]:null;
		if(!avl) return;
		if('function'!= typeof(avl)) return nu.possibles(/*TODO*/);
		return avl(this, op);
	},
});

nul.obj.defined = Class.create(nul.obj, {
	defined: function() { return this; },
	initialise: function(attr) {
		this.attr = attr||{};
	}
});