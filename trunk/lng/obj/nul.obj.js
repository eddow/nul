/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

//TODO4: pre-calculate ndx()
nul.obj = Class.create({
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
	
	through: function(o) {
		//TODO2: return o[this]
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
		if('function'!= typeof(avl)) return nul.possibles.map({fct: avl}, function(klg) {
			return op.through(this.fct);
		});
		return avl(this, op);
	},
	//Default functions through attributes
	has: function(o) {
		if(this.attr[' ']) return this.fctAttr(' ', o);
	},
});

nul.obj.byAttr = Class.create(nul.obj.defined, {
	type: 'byAttr',
	initialise: function(attr) {
		this.attr = attr||{};
		this.ndx = ++nul.obj.byAttr.nbr;
	},
	ndx: function() { return '[o'+this.byAttrNdx+']'; },
});