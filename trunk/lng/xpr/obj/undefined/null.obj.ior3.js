/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.obj.ior3 = Class.create(nul.obj.undefined, /** @lends nul.obj.ior3# */{
	/**
	 * Define an object that have several several values, on a choice
	 * @constructs
	 * @extends nul.obj.undefined
	 * @param {String} klgRef The knowledge this local applies to
	 * @param {String} ndx The index of this choice in the knowledge choice-space
	 * @param {nul.xpr.object[]} items The possible values this one can take
	 */
	initialize: function(klgRef, ndx, items) {
		/**
		 * The knowledge this local applies to
		 * @type String
		 */
		this.klgRef = klgRef;
		/**
		 * The possible values this one can take
		 * @type nul.xpr.object[]
		 */
		this.values = items;
		/**
		 * The index of this choice in the knowledge choice-space
		 * @type String
		 */
		this.ndx = ndx;
		this.alreadyBuilt();
	},

//////////////// public

	/**
	 * Gather the list of values as 'possible' thanks to the associated the knowledge.
	 * @param {nul.xpr.knowledge[]} ctx
	 * @return {nul.xpr.possible[]}
	 */
	possibles: function() {
		if(!this.choices) return this.values;
		var rv = [];
		for(var i=0; i<this.values.length; ++i)
			rv.push(new nul.xpr.possible(this.values[i], this.choices[i]));
		return rv;
	},
	
//////////////// nul.expression summaries

	/** Specific index computation for ior3 */
	sum_index: function() {
		return this.indexedSub(this.klgRef, this.ndx);
	},
	/** Specific dependance computation for ior3 */
	sum_dependance: function($super) {
		return $super().ior3dep(this);
	},
	
//////////////// nul.expression implementation
	
	/** @constant */
	expression: 'ior3',
	/** @constant */
	components: {'values': {type: 'nul.xpr.object', bunch: true}},
	/**
	 * Change the string debug-names used.
	 * @param {String} dbgName A string to draw as the name of this variable for debug info
	 */
	invalidateTexts: function($super, chxs) {
		this.choices = chxs;
		if(nul.debug.assert) assert(this.values.length == this.choices.length,
			'IOR3 has same values as the correspondant knowledge entry')
		$super();
	}
});