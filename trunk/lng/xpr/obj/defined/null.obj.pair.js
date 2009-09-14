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
	initialize: function(first, second, fzns, klg) {
		var fuzObj;
		if('fuzzy'== first.type) {
			if(nul.debug.assert) assert(!klg, 'Either give a pair a fuzzy, either an object and a knowledge');
			first = (fuzObj = first).value;
			klg = fuzObj.knowledge;
		} else fuzObj = null;
		while('ior3'== first.type && first.cklg== klg && !klg.eqCls.length) {
			ops = clone1(first.choices);
			while(1< ops.length) second = new nul.obj.pair(ops.pop(), second, fzns);
			first = (fuzObj = ops[0]).value;
			klg = fuzObj.knowledge;
		}
		this.first = fuzObj || new nul.obj.fuzzy(first, klg);
		this.second = second;
		this.fuzziness = fzns;
		this.summarie();
	},
	flat: function() { return this.summary('flat'); },
	//TODO2: flat should be a 'summary'
	sum_flat: function() {
		var rv = [];
		var brwsr = this;
		do {
			rv.push(brwsr.first);
			brwsr = brwsr.second;
		} while('pair'== brwsr.type);
		if('&phi;'!= brwsr.type) rv.follow = brwsr;
		return rv;
	},

//////////////// nul.obj implementation

	has: function(o, klg) {
			//TODO3: make a tree of fixed values (=> ram db)
		var brwsr = this;
		var rv = [];
		do {
			/* TODO1
			var op = brwsr.first;
			if(op.fuzzy) op = op.stepUp(klg);
			rv.push(klg.unify(op, o));
			brwsr = brwsr.second;*/
		} while('pair'== brwsr.type);
		rv.pushs(brws.has(o, klg));
		return rv;
	},

//////////////// nul.obj.defined implementation

	attr: {	
		'& ': function(op, klg) {
			if(op.first.fixed()) return op.first;
			//if(1<= op.first.minXst()) return [op.first];	//TODO3: ?
			//if(pinf<= op.first.minXst() && op.first.enumerableExistence)
			// 	return [nul.possible(op.first.firstExistence())];	// &{ N x [] 'oui' } = 0
		},
		'* ': function(op, klg) {
			//if(pinf<= op.first.minXst() && op.first.enumerableExistence)
			// 	return [nul.possible(op[first.next])];	// *{ N x [] 'oui' } = { [2..pinf] x [] 'oui' }
			if(pinf<= op.first.minXst()) return op;	// *{ Q x [] 'oui' } = { Q x [] 'oui' }
			if(op.first.fixed()) return op.second;
		},
	},

//////////////// nul.xpr implementation

	type: 'pair',
	components: ['first', 'second'],
	is_set: function() { return this.second.is('set'); },
	is_list: function() {
		return this.first.fixed && this.second.is('list');
	},
});
