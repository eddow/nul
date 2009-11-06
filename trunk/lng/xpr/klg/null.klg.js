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
	unconditional: function(min, max, name) {
		if('klg'== min.expression) {
			max = min.maxMult;
			min = min.minMult;
		}
		if(nul.debug.assert) assert(max >= min, 'Ordered knowledge constraints');
		if(!nul.klg.unconditionals[min+'-'+max])
			nul.klg.unconditionals[min+'-'+max] = new nul.klg.unconditionalInstance(min, max, name);
		return nul.klg.unconditionals[min+'-'+max];
	},
	unconditionals: {},
	unconditionalInstance: Class.create(nul.xpr.knowledge, /** @lends nul.klg.unconditionalInstance# */{
		unconditional: true,
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
		expression: 'klg',
		modifiable: function() {
			if(0== this.maxMult) nul.fail('No fewer than never');
			return new nul.xpr.knowledge(null, this.minMult, this.maxMult);
		},
		
		components: {},
		ior3: [],
		eqCls: [],
		veto: [],
		isFixed: function() { return true; },	//The conditions are fixed
		minXst: function() { return this.minMult; },
		maxXst: function() { return this.maxMult; }
	})
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
