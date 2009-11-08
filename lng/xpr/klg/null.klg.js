/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**
 * Knowledge management helpers
 * @namespace
 */
nul.klg = {
	//TODO C
	unconditional: function(min, max, name) {
		if('klg'== min.expression) {
			max = min.maxMult;
			min = min.minMult;
		}
		if(nul.debug.assert) assert(max >= min, 'Ordered knowledge constraints');
		if(!nul.klg.unconditionals[min+'-'+max])
			nul.klg.unconditionals[min+'-'+max] = new nul.klg.ncndtnl(min, max, name);
		return nul.klg.unconditionals[min+'-'+max];
	},
	//TODO C
	unconditionals: {},
	//TODO C
	ncndtnl: Class.create(nul.xpr.knowledge, /** @lends nul.klg.ncndtnl# */{
		/**
		 * Unconditional knowledge : only characterised by a min/max existence, no real knowledge, condition
		 * @extends nul.xpr.knowledge
		 * @constructs
		 * @param {Number} min
		 * @param {Number} max
		 */
		initialize: function(min, max, name) {
			function htmlN(n) { return n==pinf?'&infin;':n.toString(); }
	        this.locals = this.emptyLocals();
			this.minMult = min;
			this.maxMult = max;
			this.name = name || ('['+htmlN(this.minMult)+((this.minMult==this.maxMult)?'':('-'+htmlN(this.maxMult)))+']');
			this.alreadyBuilt();
		},
		/** @constant */
		expression: 'klg',
		//TODO C
		modifiable: function() {
			if(0== this.maxMult) nul.fail('No fewer than never');
			return new nul.xpr.knowledge(null, this.minMult, this.maxMult);
		},
		
		/** @constant */
		components: {},
		/** @constant */
		ior3: [],
		/** @constant */
		eqCls: [],
		/** @constant */
		veto: [],
		//TODO C
		minXst: function() { return this.minMult; },
		//TODO C
		maxXst: function() { return this.maxMult; }
	}),
	
	/**
	 * Assert: 'x' are a collection of knowledges
	 * @param {nul.object[]} x
	 */
	are: function(x) { return nul.xpr.are(x,'nul.xpr.knowledge'); },
	/**
	 * Assert: 'x' is a knowledge
	 * @param {nul.object} x
	 */
	is: function(x) { return nul.xpr.is(x,'nul.xpr.knowledge'); },
	/**
	 * Assert: 'x' is a knowledge. 'x' is summarised.
	 * @param {nul.object} x
	 */
	use: function(x) { return nul.xpr.use(x,'nul.xpr.knowledge'); },
	/**
	 * Assert: 'x' is a knowledge. 'x' is not summarised.
	 * @param {nul.object} x
	 */
	mod: function(x) { return nul.xpr.mod(x,'nul.xpr.knowledge'); }
};
/**
 * Unconditional knowledge meaning something that is never verified
 */
nul.klg.never = new nul.klg.unconditional(0, 0, 'Never');

/**
 * Unconditional knowledge meaning something that is always verified
 */
nul.klg.always = new nul.klg.unconditional(1, 1, 'Always');


/**
 * Return the knowledge knowing all that ops are equal
 */
nul.klg.unification = function(objs) {
	objs = beArrg(arguments);
	var klg = new nul.xpr.knowledge();
	klg.unify(objs);
	return klg.built();
};

/**
 * Return the wrapped singleton when o is val
 * @param {nul.xpr.object} o
 * @param {nul.xpr.object} val
 * @return {nul.xpr.possible[]}
 * @throws {nul.failure}
 */
nul.klg.has = function(o, val) {
	var klg = new nul.xpr.knowledge();
	return [klg.wrap(klg.unify(o, val))];
};

nul.xpr.knowledge.addMethods({failure: nul.klg.never});
