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
		this.choices = map(choices);
		if(!this.choices[0].unconditional) this.choices.unshift(nul.klg.never);
		this.alreadyBuilt();
	},

//////////////// Existence summaries

	maxXst: nul.summary('maxXst'), 	
	minXst: nul.summary('minXst'), 	
	sum_maxXst: function() {
		var rv = 0;
		for(var h in this.choices) if(cstmNdx(h))
			rv += this.choices[h].maxXst();
		return rv;
	},
	sum_minXst: function() {
		var rv = 0;
		for(var h in this.choices) if(cstmNdx(h))
			rv += this.choices[h].minXst();
		return rv;
	},

//////////////// nul.expression implementation

	/** @constant */
	expression: 'ior3',
	/** @constant */
	components: {'choices': {type: 'nul.xpr.knowledge', bunch: true}},
	built: function($super) {
		for(var c=1; this.choices[c];)
			if(!this.choices[c].unconditional) ++c;
			else {
				this.choices[0].add(this.choices[c]);
				this.choices.splice(c,1);
			}
		return $super();
	}
});