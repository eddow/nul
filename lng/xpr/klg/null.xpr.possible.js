/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**
 * A possible value; refering a value and a condition
 */
nul.xpr.possible = Class.create(nul.expression, {
	initialize: function(value, knowledge) {
		if(!knowledge) knowledge = nul.xpr.knowledge.always;
		nul.obj.use(value); nul.xpr.use(knowledge, nul.xpr.knowledge);
		this.value = value;
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
	 */
	unified: function(o) {
		var klg = this.knowledge.modifiable();
		return klg.wrap(klg.unify(this.value, o));
	},
	
	/**
	 * Determine wether the resolution engine can change anything
	 * @return {bool}
	 */
	distribuable: function() {
		return !!this.knowledge.ior3.length;
	},
	
	/**
	 * Use the resolution engine : make severa possibles without ior3
	 * @return {array(nul.xpr.possible)}
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
	
	expression: 'possible',
	components: ['value','knowledge'],
	chew: function() {
		return this.knowledge.modifiable().wrap(this.value);
	},	
	fix: function($super) {
		assert(this.knowledge, 'Possible now always has a knowledge');
		return $super();
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

nul.xpr.failure = new (Class.create(nul.expression, {
	initialize: function() { this.alreadyBuilt(); },
	expression: 'possible',
	components: [],
	distribuable: function() { return true; },
	distribute: function() { return []; }
}))();

/**
 * Have a possible for sure. Made with nul.xpr.knowledge.always if an object is given
 * @param {nul.xpr.possible or nul.xpr.object} o
 */
nul.xpr.possible.cast = function(o) {
	if('possible'== o.expression) return o;
	return new nul.xpr.possible(o);
};
