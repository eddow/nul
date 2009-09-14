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
	initialize: function(first, second, klg) {
		var fuzObj;
		if('fuzzy'== first.type) {
			if(nul.debug.assert) assert(!klg, 'Either give a pair a fuzzy, either an object and a knowledge');
			first = (fuzObj = first).value;
			klg = fuzObj.knowledge;
		} else fuzObj = null;
		while('ior3'== first.type && first.cklg== klg && !klg.eqCls.length) {
			var ops = clone1(first.choices);
			while(1< ops.length) second = new nul.obj.pair(ops.pop(), second);
			first = (fuzObj = ops[0]).value;
			klg = fuzObj.knowledge;
		}
		this.first = fuzObj || klg?new nul.obj.fuzzy(first, klg):first;
		this.second = second;
		this.summarise();
	},
	listed: function() { return this.summary('listed'); },
	//TODO2: flat should be a 'summary'
	sum_listed: function() {
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

	has: function(o, fzns, klg) {
		//TODO3: summarise a tree of fixed values (=> ram db)
		var brwsr = this;
		var rv = [];
		do {
			var op = brwsr.first;
			var tklg = new nul.xpr.knowledge(fzns.name);
			try {
				rv.push(new nul.obj.fuzzy(
					tklg.unify(('fuzzy'== op.type)?op.stepUp(fzns, tklg):op, o),
					tklg.built(fzns)));
			} catch(err) {
				if(nul.failure!= err) throw nul.exception.notice(err);
			}
			brwsr = brwsr.second;
		} while('pair'== brwsr.type);
		//TODO1: follow
		return new nul.obj.ior3(klg, rv).built(fzns);
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

	/*unified: function(o, klg) {
		if('pair'!= o.type) nul.fail(this, ' does not unify to ', o);
		//TODO1
	},*/
	
//////////////// nul.xpr implementation

	type: 'pair',
	components: ['first', 'second'],
	sum_isSet: function() { return this.second.isSet(); },
	sum_isList: function() {
		return ('fuzzy'!= this.first.type) && this.second.isList();
	},
});
