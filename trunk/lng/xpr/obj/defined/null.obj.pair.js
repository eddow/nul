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
		nul.xpr.use(first); nul.obj.use(second);
		this.first = nul.xpr.possible.cast(first);
		this.second = second;
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

//////////////// nul.obj.defined implementation

	subUnified: function(o, klg) {
		if('&phi;'== o.expression) {
			klg.oppose(this.first.knowledge);
			return klg.unify(this.second, o);
		}
		if('pair'!= o.expression) nul.fail(o, ' not a pair');
		if(this.first.knowledge === o.first.knowledge)
			return (new nul.obj.pair(
				klg.unify(this.first.value, o.first.value),
				klg.unify(this.second, o.second))).built();
		//TODO4: unifier les possibles
		nul.fail(o, ' not unifiable pair');
	},
	
//////////////// nul.xpr.object implementation

	attributes: {
		//TODO3: length, &, *, head, tail, ...
	},

	subHas: function(o) {
		this.use(); nul.obj.use(o);
		
		//TODO 3: summarise a tree of fixed values (=> ram db)
		//make a table fct also
		var rv = [];
		try {
			var trv = this.first.unified(o);
			if(nul.debug.assert)
				assert(!trv.dependance().usages[this.first.knowledge.name],
					'Out of knowledge, no more deps');
			rv.push(trv);
		} catch(err) { nul.failed(err); }
		return rv.pushs(this.second.having(o));
	},

//////////////// nul.expression implementation

	expression: 'pair',
	components: ['first', 'second'],
	sum_isList: function() {
		return this.first.knowledge.isFixed() && this.second.isList();
	},
	built: function($super) {
		if(!this.first.distribuable()) return $super();
		return nul.obj.pair.list(this.second, this.first.distribute());
	}
});

nul.obj.pair.list = function(flw, elms) {
	elms = beArrg(arguments, 1);
	nul.xpr.use(elms);
	var rv = flw?flw:nul.obj.empty;
	while(elms.length) rv = (new nul.obj.pair(elms.pop(), rv)).built();
	return rv;
};