/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**
 * Defined an object that can be several one, on a choice
 */
nul.obj.ior3 = Class.create(nul.obj.undefined, {
	initialize: function(klgRef, ndx, items) {
		nul.obj.use(items);
		this.klgRef = klgRef;
		this.values = items;
		this.ndx = ndx;
		this.alreadyBuilt();
	},

//////////////// public

	/**
	 * Gather the list of values as 'possible' thanks to the associated the knowledge.
	 * @param {array(nul.xpr.knowledge)} ctx
	 * @return array(nul.xpr.possible)
	 */
	possibles: function() {
		if(!this.choices) return this.values;
		var rv = [];
		for(var i=0; i<this.values.length; ++i)
			rv.push(nul.xpr.possible.ifKlg(this.values[i], this.choices[i]));
		return rv;
	},
	
//////////////// nul.expression summaries

	sum_index: function() {
		return this.indexedSub(this.klgRef, this.ndx, this.values);
	},
	sum_dependance: function($super) {
		return $super().ior3dep(this);
	},
	
//////////////// nul.expression implementation
	
	expression: 'ior3',
	components: ['values'],
	invalidateTexts: function($super, chxs) {
		this.choices = chxs;
		if(nul.debug.assert) assert(this.values.length == this.choices.length,
			'IOR3 has same values as the correspondant knowledge entry')
		$super();
	},
});