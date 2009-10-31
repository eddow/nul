/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.xpr.knowledge.ior3 = Class.create(nul.expression, /** @lends nul.xpr.knowledge.ior3# */{
	/**
	 * Represent a list of possible knowledges 
	 * @extends nul.expression
	 * @constructs
	 * @param {nul.xpr.knowledge[]} choices The possible cases
	 */
	initialize: function(choices) {
		this.choices = choices;
		//this.mult = 0;	//TODO O: 'mult' optimisation
		this.alreadyBuilt();
	},

//////////////// Internal

	/**
	 * Specify this cases are not refered by any nul.obj.ior3
	 * @return {bool} weither something changed
	 */
	unrefer: function() {	//TODO O: 'mult' optimisation
		var ol = this.choices.length;
		for(var j=0; j<this.choices.length;) 
			if(!this.choices[j]) {
				++this.mult;
				this.choices.splice(j, 1);
			} else ++j;
		return ol != this.choices.length;
	},

//////////////// Existence summaries

	maxXst: nul.summary('maxXst'), 	
	minXst: nul.summary('minXst'), 	
	sum_maxXst: function() {
		var rv = 1;
		for(var h in this.ior3) if(cstmNdx(h))
			rv *= this.ior3[h].maxXst();
		return rv;
	},
	sum_minXst: function() {
		if(this.eqCls.length) return 0;
		var rv = 1;
		for(var h in this.ior3) if(cstmNdx(h))
			rv *= this.ior3[h].minXst();
		return rv;
	},

//////////////// nul.expression implementation

	/** @constant */
	expression: 'kior3',
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