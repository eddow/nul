/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**
 * Defined an object that can be several one, on a choice
 * TODO: comment link w/ knowledge
 */
nul.obj.ior3 = Class.create(nul.obj.undefined, {
	initialize: function(klg, ndx, items) {
		nul.obj.use(items);
		this.klg = klg;
		this.values = items;
		this.ndx = ndx;
		this.summarise();
	},

//////////////// nul.expression summaries

	sum_index: function() {
		return this.indexedSub(this.klg.name, this.ndx, this.values);
	},
	sum_ior3dep: function($super) {
		//TODO1: if is defined(this.ndx)
		return nul.specifyDep($super(), this.klg.name, this.ndx);
	},
//////////////// nul.expression implementation
	
	type: 'ior3',
	components: ['values'],
});