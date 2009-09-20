/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

//TODO2: use "usage" to clean knowledge ...
/**
 * A possible value; refering a value and a condition
 */
nul.xpr.possible = Class.create(nul.expression, {
	initialize: function(value, knowledge) {
		this.value = value;
		this.knowledge = knowledge;
	},

//////////////// public

	/**
	 * 'klg' now knows all what this possible knows
	 * @param klg nul.xpr.knowledge destination knowledge
	 * @return nul.xpr.object This modified value (to refer the new knowledge)
	 */
	stepUp: function(klg) {
		return klg.merge(this.knowledge, this.value);
	},
	
//////////////// nul.expression summaries

	sum_dependance: function($super) {
		var rv = $super();
		this.usage = rv.usage(this.knowledge);
		return rv;
	},

//////////////// nul.expression implementation
	
	type: 'possible',
	components: ['value','knowledge'],
	built: function($super) {
		//TODO1
		/*if(this.knowledge) {
			this.dependance();
			this.knowledge = this.knowledge.prune(this.usage);
		}*/
		if(!this.knowledge) return this.value;
		
		return $super();
	},	
});

/**
 * Create a possible out of a unification
 * @param p nul.xpr.object or nul.xpr.possible
 * @param o nul.xpr.object
 * @return nul.xpr.object or nul.xpr.possible
 */
nul.xpr.possible.unification = function(p, o) {
	var v, klg;
	if('possible'== p.type) {
		v = p.value;
		klg = p.knowledge.modifiable();
	} else {
		v = p;
		klg = new nul.xpr.knowledge();
	}
	v = klg.unify(v, o);
	return new nul.xpr.possible(v, klg.built('clean'));
};