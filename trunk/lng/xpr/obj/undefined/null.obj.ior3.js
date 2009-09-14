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
nul.obj.ior3 = Class.create(nul.xpr.fuzzy, nul.obj.undefined, {
	initialize: function(cklg, items) {
		this.choices = items;
		this.cklg = cklg;
	},
	
//////////////// nul.xpr.fuzzy implementation

	built: function() {
		if(1== this.choices.length) return this.choices[0];
		this.cklg.hesitate(this);
		return this;
	},

//////////////// nul.xpr.fuzzy summaries

	sum_maxXst: function() {
		var rv = 0;
		for(var c in this.choices) if(cstmNdx(c)) {
			if(!this.choices[c].fuzzy) ++rv;
			else rv += this.choices[c].maxXst();
		}
		return rv;
	},
	sum_minXst: function() {
		var rv = 0;
		for(var c in this.choices) if(cstmNdx(c)) {
			if(!this.choices[c].fuzzy) ++rv;
			else rv += this.choices[c].minXst();
		}
		return rv;
	},
	
//////////////// nul.xpr implementation
	
	type: 'ior3',
	components: ['choices'],
});