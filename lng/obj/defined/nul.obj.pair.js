/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.obj.pair = Class.create(nul.obj.defined, {
	initialise: function(first, second, fklg) {
		this.first = first.fuzzy?first:nul.fuzzy(first, fklg);	//TODO: if first.fuzzy & fklg given?
		this.second = second;
	},
	has: function(o) {
			//TODO: make a tree of fixed values (=> ram db)
		var brwsr = this;
		var rv = nul.possibles();
		do {
			rv.maybe(brwsr.first.unify(o));
			brwsr = brwsr.second;
		} while(this[' ']== brwsr.attr[' ']);
		return rv.maybe(brws.attr[' '](o, klg));
	},
	attr: {	
		'& ': function(op) {
			if(op.first.fixed) return [op.first];
			//if(1<= op.first.minXst(op.fklg)) return [op.first];	//TODO: ?
			//if(pinf<= op.first.minXst(op.fklg) && op.first.enumerableExistence)
			// 	return [nul.possible(op.first.firstExistence())];	// &{ N x [] 'oui' } = 0
		},
		'* ': function(op) {
			//if(pinf<= op.first.minXst(op.fklg) && op.first.enumerableExistence)
			// 	return [nul.possible(op[first.next])];	// *{ N x [] 'oui' } = { [2..pinf] x [] 'oui' }
			if(pinf<= op.first.minXst) return [nul.fuzzy(op)];	// *{ Q x [] 'oui' } = { Q x [] 'oui' }
			if(op.first.fixed) return [nul.fuzzy(op.second)];
		},
	},
	components: ['second'],
});
