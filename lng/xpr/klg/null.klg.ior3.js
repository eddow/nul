/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.klg.ior3 = Class.create(nul.expression, /** @lends nul.klg.ior3# */{
	/**
	 * Represent a list of possible knowledges 
	 * @extends nul.expression
	 * @constructs
	 * @param {nul.xpr.knowledge[]} choices The possible cases
	 */
	initialize: function(choices) {
		this.choices = choices;
		this.add = 0;
		this.alreadyBuilt();
	},

//////////////// Existence summaries

	maxXst: nul.summary('maxXst'), 	
	minXst: nul.summary('minXst'), 	
	sum_maxXst: function() {
		var rv = 0;
		for(var h in this.choices) if(cstmNdx(h))
			rv += this.choices[h].maxXst();
		return rv+this.add;
	},
	sum_minXst: function() {
		var rv = 0;
		for(var h in this.choices) if(cstmNdx(h))
			rv += this.choices[h].minXst();
		return rv+this.add;
	},

//////////////// nul.expression implementation

	/** @constant */
	expression: 'ior3',
	/** @constant */
	components: {'choices': {type: 'nul.xpr.knowledge', bunch: true}},
	placed: function($super, prnt) {
		nul.xpr.mod(prnt, 'nul.xpr.knowledge');
 		if(!this.choices.length) {	//TODO O: 'mult' optimisation
 			prnt.mult *= this.mult;
 			return;
 		} 
		return $super(prnt);
	}
});