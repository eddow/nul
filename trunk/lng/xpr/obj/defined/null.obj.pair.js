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
		if('possible'== first.type) {
			first.use();
			var ops = nul.solve(first);
			first = ops.shift();
			while(ops.length) {
				var op = ops.pop();
				second = new nul.obj.pair(op, second);
			}
		}
		this.first = first;
		this.second = second;
		this.alreadyBuilt();
	},
	
//////////////// Summary
	
	listed: nul.summary('listed'),

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

//////////////// nul.xpr.object implementation

	has: function(o) {
		this.use(); nul.obj.use(o);
		//TODO3: summarise a tree of fixed values (=> ram db)
		//make a table fct also
		var rv = [];
		try { rv.push( nul.xpr.possible.unification(this.first, o) ); }
		catch(err) { nul.failed(err); }
		return rv.pushs(this.second.has(o));
	},

//////////////// nul.obj.defined implementation

	unified: function(o, klg) {
		if('pair'!= o.type) return;
		if('possible'!= this.first.type && 'possible'!= o.first.type)
			return new nul.obj.pair(
				klg.unify(this.first, o.first),
				klg.unify(this.second, o.second));
		//TODO: autres cas que valeurs fixes
	},
	
//////////////// nul.expression implementation

	type: 'pair',
	components: ['first', 'second'],
	sum_isSet: function() { return this.second.isSet(); },
	sum_isList: function() {
		return this.first.object && this.second.isList();
	},
});
