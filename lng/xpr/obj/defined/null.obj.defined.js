/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.obj.defined = Class.create(nul.obj, {
	valAttr: function(klg, anm) {
		var avl = this.attr[anm];
		if(!avl) return;
		if('function'!= typeof(avl)) return new nul.possibles(klg, avl);
		return avl(this, klg);
	},
	fctAttr: function(klg, anm, op) {
		var avl = this.attr[anm];
		if(!avl) return;
		if('function'!= typeof(avl)) return nul.possibles.map(klg, {fct: avl}, function(klg) {
			return op.through(this.fct);
		});
		return avl(this, op, klg);
	},
	//Default functions through attributes
	has: function(o, klg) {
		if(this.attr[' ']) return this.fctAttr(' ', o);
	},
});
