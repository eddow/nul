/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.klg.ior3 = new JS.Class(nul.expression, /** @lends nul.klg.ior3# */{
	/**
	 * Represent a list of possible knowledges 
	 * @extends nul.expression
	 * @constructs
	 * @param {nul.xpr.knowledge[]} choices The possible cases
	 */
	initialize: function(choices) {
		this.choices = map(choices);
		if(!this.choices[0].isA(nul.klg.ncndtnl)) this.choices.unshift(nul.klg.never);
		this.alreadyBuilt();
	},

//////////////// Existence summaries

	maxXst: nul.summary('maxXst'), 	
	minXst: nul.summary('minXst'), 	
	sum_maxXst: function() {
		var rv = 0;
		for(var h in ownNdx(this.choices))
			rv += this.choices[h].maxXst();
		return rv;
	},
	sum_minXst: function() {
		var rv = 0;
		for(var h in ownNdx(this.choices))
			rv += this.choices[h].minXst();
		return rv;
	},

//////////////// nul.expression implementation

	/** @constant */
	expression: 'ior3',
	/** @constant */
	components: {'choices': {type: 'nul.xpr.knowledge', bunch: true}},
	built: function() {
		if(nul.debug.assert) assert(this.choices.length, 'IOR3 Always has a first unconditional');
		this.choices = nul.solve.ior3(this.choices);
		for(var c=1; this.choices[c];)
			if(!this.choices[c].isA(nul.klg.ncndtnl)) ++c;
			else {
				this.choices[0].add(this.choices[c]);
				this.choices.splice(c,1);
			}
		if(nul.klg.never== this.choices[0]) this.choices.shift();
		return this.callSuper();
	}
});