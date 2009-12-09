/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
//=requires: /src/lng/xpr/obj/defined/null.obj.defined

nul.obj.pair = new JS.Class(nul.obj.list, /** @lends nul.obj.pair# */{
	/**
	 * @class Pair used to build lists : a head and a tail.
	 * @extends nul.obj.list
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
		this.callSuper();
	},
	
//////////////// Summary
	
	/**
	 * Summary: Specific pair summary to retrieve the list corresponding to the trailing pair values.
	 * @function
	 * @returns {nul.xpr.possible[]}
	 */
	listed: nul.summary('listed'),

	/**
	 * Summary calculation of 
	 * @function
	 * @returns {nul.xpr.possible[]}
	 */
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

	/**
	 * Try to unify elements
	 * @param {nul.xpr.object} o
	 * @param {nul.xpr.knowledge} klg
	 * @return {nul.xpr.object}
	 */
	subUnified: function(o, klg) {
		if('&phi;'== o.expression) {
			klg.oppose(this.first.knowledge);
			return klg.unify(this.second, o);
		}
		if('pair'!= o.expression) nul.fail(o, ' not a pair');
		if(this === o) return true;
		if(this.first.knowledge === o.first.knowledge)
			return (new nul.obj.pair(
				klg.unify(this.first.value, o.first.value),
				klg.unify(this.second, o.second))).built();
		nul.debugged.warn('error')('Pair fuzzy comparison not yet implemented');
		if(this.toString() === o.toString()) return true;
		nul.fail(o, ' not unifiable pair');
	},
	
	/**
	 * Extract an object o that fit one of these possibles (either the first possible, either subHas from second)
	 * @param {nul.xpr.object} o
	 * @param {nul.xpr.object[]} attrs
	 * @return {nul.xpr.object[]|nul.xpr.possible[]}
	 */
	subHas: function(o, attrs) {
		this.use(); nul.obj.use(o);
		//TODO 2: use attrs?
		//TODO 3: summarise a tree of fixed values (=> ram db)
		//make a table fct also
		var rv = [];
		try { rv.push(this.first.extract(o)); }
		catch(err) { nul.failed(err); }
		return rv.pushs(this.second.having(o, attrs));
	},

//////////////// nul.xpr.object implementation

	/** @constant */
	properties: {
		'$ ': function() {
			return this.recursion();
		},
		'# ': function(klg) {
			var flw = klg.attribute(this.second, '# ');
			var mn = this.first.knowledge.minXst();
			var mx = this.first.knowledge.maxXst();
			var tl; 
			if(mn == mx) tl = new nul.obj.litteral.number(mn);
			else {
				tl = klg.newLocal('#');
				klg.belong(tl, new nul.obj.range(mn, mx));
			}
			return new nul.obj.operation.Nary('+', [tl, flw]);
		},
		'': function() { return nul.obj.litteral.tag.set; }
	},

//////////////// nul.expression implementation

	/** @constant */
	expression: 'pair',
	/** @constant */
	components: {
		'first': {type: 'nul.xpr.possible', bunch: false},
		'second': {type: 'nul.xpr.object', bunch: false}
	},
	/**
	 * <a href="http://code.google.com/p/nul/wiki/Summary">Summary</a>: Weither this pair is a list
	 * @function
	 * @return {Boolean}
	 */
	isList: nul.summary('isList'),
	/** <a href="http://code.google.com/p/nul/wiki/Summary">Summary</a> computation of {@link isList} */
	sum_isList: function() {
		return this.first.knowledge.isA(nul.klg.ncndtnl) && (!this.second.isList || this.second.isList());
	},
	/** Build this set so that it is a following of pairs which values are most simplified as possible */
	built: function() {
		if(this.first.distribuable()) {
			var dList = this.first.distribute();
			if(1!= dList.length) return nul.obj.pair.list(this.second, dList);
			this.first = dList[0];
		}
		return this.callSuper();
	},
	
	/** <a href="http://code.google.com/p/nul/wiki/Summary">Summary</a> computation of {@link recursion} */
	sum_recursion: function() {
		if(!this.selfRef) this.selfRef = nul.execution.name.gen('obj.local.self');
		var rv = [];
		for(var p=this; p.isA(nul.obj.pair); p=p.second)
			rv.pushs(p.first.knowledge.modifiable().sumRecursion(this.selfRef, [], p.first.value));
		return nul.obj.pair.list(null, rv);
	}

});

/**
 * Helper to create triling pairs from a list
 * @param flw Trail of this list. Will be the empty set if not specified
 * @param elms The elements that will be the 'first' of each pairs.
 * @return {nul.obj.pair} The built pair
 * @throws {nul.ex.failure}
 */
nul.obj.pair.list = function(/**nul.xpr.object|null*/flw, /**nul.xpr.possible[]*/elms) {
	elms = beArrg(arguments, 1);
	var rv = flw || nul.obj.empty;
	while(elms.length) {
		var elm = elms.pop();
		nul.xpr.use(elm);
		rv = (new nul.obj.pair(elm, rv)).built();
	}
	return rv;
};