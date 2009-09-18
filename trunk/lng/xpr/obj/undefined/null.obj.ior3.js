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
	initialize: function(klgName, items, ior3ndx) {
		nul.obj.use(items);
		this.klgName = klgName;
		this.values = items;
		this.ior3ndx = ior3ndx;
		this.summarise();
	},

//////////////// nul.expression summaries

	sum_index: function() {
		return this.indexedSub(this.klgName, this.ior3ndx, this.values);
	},

//////////////// nul.expression implementation
	
	type: 'ior3',
	components: ['values'],
});