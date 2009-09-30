/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.obj.pair = Class.create(nul.obj.defined, {
	/**
	 * @param {nul.xpr.possible} first
	 * @param {nul.xpr.object} second
	 */
	initialize: function(first, second) {
		//Note if a klg is given, its fuziness belong to this pair' first
		nul.xpr.use(first); nul.obj.use(second);
		this.first = first;
		this.second = second;
		this.chew();
		//this.alreadyBuilt();
	},
	
//////////////// Summary
	
	listed: nul.summary('listed'),

	sum_listed: function() {
		var rv = [];
		var brwsr = this;
		do {
			rv.push(brwsr.first);
			brwsr = brwsr.second;
		} while('pair'== brwsr.expression);
		if('&phi;'!= brwsr.expression) rv.follow = brwsr;
		return rv;
	},

//////////////// nul.xpr.object implementation

	has: function(o) {
		this.use(); nul.obj.use(o);
		//TODO3: summarise a tree of fixed values (=> ram db)
		//make a table fct also
		var rv = [];
		try {
			var trv = nul.xpr.possible.unification(this.first, o);
			if(nul.debug.assert && 'possible'== this.first.expression)
				assert(!trv.dependance().usages[this.first.knowledge.name],
					'Out of knowledge, no more deps');
			rv.push(trv);
		} catch(err) { nul.failed(err); }
		return rv.pushs(this.second.having(o));
	},

//////////////// nul.obj.defined implementation

	unified: function(o, klg) {
		if('pair'!= o.expression) nul.fail(o, ' not a pair');
		if('possible'!= this.first.expression && 'possible'!= o.first.expression)
			return new nul.obj.pair(
				klg.unify(this.first, o.first),
				klg.unify(this.second, o.second));
		//TODO4: unifier les possibles
	},
	
//////////////// nul.expression implementation

	expression: 'pair',
	components: ['first', 'second'],
	sum_isList: function() {
		return this.first.object && this.second.isList();
	},
	chew: function() {
		if('possible'== this.first.expression) {
			var ops = nul.solve(this.first);
			this.first = ops.shift();
			while(ops.length) {
				var op = ops.pop();
				this.second = new nul.obj.pair(op, this.second);
			}
		}
		return this.built();
	},	
});
