/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.obj.pair = Class.create(nul.obj.defined, {
	/**
	 * @param first Either JsNulObj, either JsNulFuzzyObj
	 * @param second JsNulObj
	 * @param klg If <first> is JsNulObj, this is the parent knowledge
	 */
	initialise: function(first, second, klg) {
		this.first = first.fuzzy?first:new nul.fuzzy(first, new nul.knowledge(klg));	//TODO2: if first.fuzzy & fklg given?
		this.second = second;
	},

//////////////// nul.obj implementation

	type: 'pair',

	has: function(o, klg) {
			//TODO3: make a tree of fixed values (=> ram db)
		var brwsr = this;
		var rv = new nul.possibles(klg);
		do {
			rv.maybe(brwsr.first.stepUp(klg).unify(o));
			brwsr = brwsr.second;
		} while(this[' ']== brwsr.attr[' ']);
		return rv.maybe(brws.attr[' '](o, klg));
	},

	unify: function(o, klg) {
		if('pair'!= o.type) return;
		var f = this.first.unify(o.first), s;
		if(f) s = klg.unify(this.second, o.second);
		if(s) return new nul.obj.pair(f, s);
	},

//////////////// nul.obj.defined implementation

	attr: {	
		'& ': function(op, klg) {
			if(op.first.fixed()) return [op.first];
			//if(1<= op.first.minXst()) return [op.first];	//TODO3: ?
			//if(pinf<= op.first.minXst() && op.first.enumerableExistence)
			// 	return [nul.possible(op.first.firstExistence())];	// &{ N x [] 'oui' } = 0
		},
		'* ': function(op, klg) {
			//if(pinf<= op.first.minXst() && op.first.enumerableExistence)
			// 	return [nul.possible(op[first.next])];	// *{ N x [] 'oui' } = { [2..pinf] x [] 'oui' }
			if(pinf<= op.first.minXst()) return new nul.possibles(klg, [op]);	// *{ Q x [] 'oui' } = { Q x [] 'oui' }
			if(op.first.fixed()) return new nul.possibles(klg, [op.second]);
		},
	},

//////////////// nul.xpr implementation

	ndx: function() {
		return'[pair:' +
			this.first.ndx() + '|' +
			this.second.ndx() + '|' +
			']';
	},

	components: ['first', 'second'],
	
});
