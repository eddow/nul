/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.obj.pair = Class.create(nul.obj.defined, /** @lends nul.obj.pair# */{
	/**
	 * Pair used to build lists : a head and a tail.
	 * @extends nul.obj.defined
	 * @constructs
	 * @param {nul.xpr.possible} first List head
	 * @param {nul.xpr.object} second List tail
	 */
	initialize: function(first, second) {
		nul.xpr.use(first); nul.obj.use(second);
		/** @type nul.xpr.possible */
		this.first = nul.xpr.possible.cast(first);
		/** @type nul.xpr.object */
		this.second = second;
	},
	
//////////////// Summary
	
	/**
	 * Summary: Specific pair summary to retrieve the list corresponding to the trailing pair values.
	 * @function
	 * @returns {nul.xpr.possible[]}
	 */
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

	//TODO C
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
	
	//TODO C
	subHas: function(o) {
		this.use(); nul.obj.use(o);
		
		//TODO 3: summarise a tree of fixed values (=> ram db)
		//make a table fct also
		var rv = [];
		try { rv.push(this.first.extract(o)); }
		catch(err) { nul.failed(err); }
		return rv.pushs(this.second.having(o));
	},

//////////////// nul.xpr.object implementation

	/** @constant */
	attributes: {
		//TODO3: length, &, *, head, tail, ...
	},

//////////////// nul.expression implementation

	/** @constant */
	expression: 'pair',
	/** @constant */
	components: ['first', 'second'],
	sum_isList: function() {
		return this.first.knowledge.isFixed() && this.second.isList();
	},
	/** Build this set so that it is a following of pairs which values are most simplified as possible */
	built: function($super) {
		if(!this.first.distribuable()) return $super();
		return nul.obj.pair.list(this.second, this.first.distribute());
	}
});

/**
 * Helper to create triling pairs from a list
 * @param {nul.xpr.object|null} flw Trail of this list. Will be the empty set if not specified
 * @param {nul.xpr.possible[]} elms The elements that will be the 'first' of each pairs.
 * @returns {nul.obj.pair} The built pair
 * @throws {nul.failure}
 */
nul.obj.pair.list = function(flw, elms) {
	elms = beArrg(arguments, 1);
	nul.xpr.use(elms);
	var rv = flw?flw:nul.obj.empty;
	while(elms.length) {
		var elm = elms.pop();
		rv = (new nul.obj.pair(elm, rv)).built();
	}
	return rv;
};