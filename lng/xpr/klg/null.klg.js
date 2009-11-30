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
	unconditional: function(mul, name) {
		if(!nul.klg.unconditionals[mul])
			nul.klg.unconditionals[mul] = new nul.klg.ncndtnl(name, mul);
		return nul.klg.unconditionals[mul];
	},
	//TODO C
	unconditionals: {},
	//TODO C
	ncndtnl: new JS.Class(nul.xpr.knowledge, /** @lends nul.klg.ncndtnl# */{
		/**
		 * Unconditional knowledge : only characterised by a min/max existence, no real knowledge, condition
		 * @extends nul.xpr.knowledge
		 * @constructs
		 * @param {Number} min
		 * @param {Number} max
		 */
		initialize: function(name, mul) {
			this.callSuper(name || ('['+ (mul==pinf?'&infin;':mul.toString()) +']'));
	        /*this.locals = this.emptyLocals();
			this.minMult = mul;
			this.maxMult = mul;
			this.name = name || ('['+ (mul==pinf?'&infin;':mul.toString()) +']');*/
			this.alreadyBuilt();
		},
		//TODO C
		modifiable: function() {
			if(0== this.maxMult) nul.fail('No fewer than never');
			//TODO 1: origin management ?
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
nul.klg.never = new nul.klg.unconditional(0, 'Never');

/**
 * Unconditional knowledge meaning something that is always verified
 */
nul.klg.always = new nul.klg.unconditional(1, 'Always');


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

nul.xpr.knowledge.include({failure: nul.klg.never});
