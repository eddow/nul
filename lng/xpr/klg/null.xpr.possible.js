/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.xpr.possible = Class.create(nul.expression, /** @lends nul.xpr.possible# */{
	/**
	 * A value associated with a knowledge : A value that can be unified to several different defined object, along some conditions.
	 * @extends nul.expression
	 * @constructs
	 * @param {nul.xpr.object} value
	 * @param {nul.xpr.knowledge} knowledge
	 */
	initialize: function(value, knowledge) {
		if(!knowledge) knowledge = nul.xpr.knowledge.always;
		nul.obj.use(value); nul.xpr.use(knowledge, 'nul.xpr.knowledge');
		/** @type nul.xpr.object */
		this.value = value;
		/** @type nul.xpr.knowledge */
		this.knowledge = knowledge;
		this.alreadyBuilt();
	},

//////////////// public

	/**
	 * 'klg' now knows all what this possible knows
	 * @param {nul.xpr.knowledge} klg destination knowledge
	 * @return nul.xpr.object This modified value (to refer the new knowledge)
	 */
	valueKnowing: function(klg) {
		return klg.merge(this.knowledge, this.value);
	},
	
	/**
	 * Returns a possible, this unified to o.
	 * @param {nul.xpr.object} o
	 * @return {nul.xpr.possible}
	 * @throws {nul.failure}
	 */
	extract: function(o) {
		//var klg = this.knowledge.modifiable();
		var klg = new nul.xpr.knowledge();
		//Merge because we need to create a new context reference in case of half-recursion
		var rv = klg.wrap(klg.unify(klg.merge(this.knowledge, this.value), o));
		if(nul.debug.assert)
			assert(!rv.dependance().usages[klg.name],
				'Out of knowledge, no more deps');
		return rv;
	}.describe('Extraction', function(o) {
		return [o, this];
	}),
	
	/**
	 * Determine wether the resolution engine can distribute anything
	 * @return {Boolean}
	 */
	distribuable: function() {
		return !!this.knowledge.ior3.length;
	},
	
	/**
	 * Use the resolution engine : make several possibles without ior3
	 * @return {nul.xpr.possible[]}
	 */
	distribute: function() {
		if(this.knowledge.ior3.length) return nul.solve(this);
		return [this];
	},
	
//////////////// nul.expression summaries

	sum_dependance: function($super) {
		var rv = $super();
		this.usage = rv.use(this.knowledge);
		return rv;
	},

//////////////// nul.expression implementation
	
	/** @constant */
	expression: 'possible',
	/** @constant */
	components: {
		'value': {type: 'nul.xpr.object', bunch: false},
		'knowledge': {type: 'nul.xpr.knowledge', bunch: false}
	},
	chew: function() {
		return this.knowledge.modifiable().wrap(this.value);
	},

////////////////	Internals

	/**
	* Change self references to the given self-refered object
	* @param {any} slf The object that is a self-reference
	*/
	beself: function(slf, selfRef) {
		return new nul.xpr.object.reself(selfRef || slf.selfRef, slf).browse(this);
	}
});

nul.xpr.failure = new (Class.create(nul.xpr.possible, /** @lends nul.xpr.failure# */{
	/**
	 * Specific possible that never give any value.
	 * @extends nul.xpr.possible
	 * @constructs
	 * @class Singleton
	 */
	initialize: function() { this.alreadyBuilt(); },
	/** @constant */
	expression: 'possible',
	/** @constant */
	components: {},
	distribuable: function() { return true; },
	distribute: function() { return []; }
}))();

/**
 * Have a possible for sure. Made with nul.xpr.knowledge.always if an object is given
 * @param {nul.xpr.possible | nul.xpr.object} o
 */
nul.xpr.possible.cast = function(o) {
	if('possible'== o.expression) return o;
	return new nul.xpr.possible(o);
};
