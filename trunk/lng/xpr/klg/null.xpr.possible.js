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
	
//////////////// nul.expression summaries

	sum_dependance: function($super) {
		var rv = $super();
		this.usage = rv.use(this.knowledge);
		return rv;
	},

//////////////// nul.expression implementation
	
	expression: 'possible',
	components: ['value','knowledge'],
	fix: function($super) {
		if(!this.knowledge) return this.value;
		return $super();
	},
});

/**
 * Create a possible out of a unification
 * @param {nul.xpr.possible} p
 * @param {nul.xpr.object} o
 * @return nul.xpr.object or nul.xpr.possible
 */
nul.xpr.possible.unification = function(p, o) {
	var v, klg;
	if('possible'== p.expression) {
		v = p.value;
		klg = p.knowledge.modifiable();
	} else {
		v = p;
		klg = new nul.xpr.knowledge();
	}
	v = klg.unify(v, o);
	return klg.wrap(v);
};