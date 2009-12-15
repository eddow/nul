/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
//#requires: src/lng/xpr/klg/null.xpr.knowledge

/**
 * Knowledge management helpers
 * @namespace
 */
nul.klg = /** @lends nul.klg */{
	/**
	 * Create or get an already-built unconditional
	 * @param {Number} mul Multiplicity
	 * @param {String} name Used only when creation is needed
	 * @return {nul.klg.ncndtnl}
	 */
	unconditional: function(mul, name) {
		if(!nul.klg.unconditionals[mul])
			nul.klg.unconditionals[mul] = new nul.klg.ncndtnl(name, mul);
		return nul.klg.unconditionals[mul];
	},
	/**
	 * To avoid doubles, keep the built unconditionals in this table
	 * @type {nul.klg.ncndtnl[]}
	 */
	unconditionals: {},

	ncndtnl: new JS.Class(nul.xpr.knowledge, /** @lends nul.klg.ncndtnl# */{
		/**
		 * @class Unconditional knowledge : only characterised by a min/max existence without real knowledge, condition
		 * @extends nul.xpr.knowledge
		 * @constructs
		 * @param {Number} mul Multiplicity
		 */
		initialize: function(name, mul) {
			this.callSuper(name || ('['+ (mul==pinf?'&infin;':mul.toString()) +']'), mul);
			this.alreadyBuilt();
		},
		/**
		 * Create a brand new knowledge out of the sole multiplicity information
		 */
		modifiable: function() {
			if(0== this.maxMult) nul.fail('No fewer than never');
			return new nul.xpr.knowledge(null, this.minMult, this.maxMult).from(this);
		},
		
		/** @constant */
		components: {},
		/** @constant */
		ior3: [],
		/** @constant */
		eqCls: [],
		/** @constant */
		veto: [],
		/**
		 * The minimum existance multiplicity is constant
		 * @return {Number}
		 */
		minXst: function() { return this.minMult; },
		/**
		 * The maximum existance multiplicity is constant
		 * @return {Number}
		 */
		maxXst: function() { return this.maxMult; }
	}),
	
	//TODO 4: if(!nul.debugged) replace are/is/... by $.id
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
 * @throws {nul.ex.failure}
 */
nul.klg.has = function(o, val) {
	var klg = new nul.xpr.knowledge();
	return [klg.wrap(klg.unify(o, val))];
};

nul.xpr.knowledge.include({failure: nul.klg.never});
