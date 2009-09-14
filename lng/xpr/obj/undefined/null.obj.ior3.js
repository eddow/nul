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
		
		this.choices = items.mar(function() {
			if(nul.debug.assert) assert('fuzzy'== this.type, 'Only fuzzy values are given to ior3')
			if('ior3'== this.value.type && this.value.cklg== cklg) {
				//TODO2: flatten
			}
			return [this];
		});
		this.cklg = cklg;
		this.summarise({
			isFixed: false,
		});
	},
	
//////////////// nul.xpr.fuzzy implementation

	built: function(fzns) {
		if(!this.choices.length) nul.fail('No more choices');
		if(1== this.choices.length) {
			this.cklg.merge(this.choices[0].knowledge);
			return this.choices[0].value;
		}
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