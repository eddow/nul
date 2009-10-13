/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**
 * Refers to a data-source from nul.data...
 */
nul.obj.data = Class.create(nul.obj.defined, {
	initialize: function($super, ds) {
		this.source = ds;
		this.alreadyBuilt();
	},
//////////////// nul.xpr.object implementation

	attributes: {
		//TODO4: '# '
	},

	has: function(o) {},	//Dunno, it depends ...
	
//////////////// nul.expression implementation

	sum_dependance: function($super) {
		return new nul.dependance(this);
	},

	expression: 'data',
	sum_index: function() { return this.indexedSub(this.source.context, this.source.index); },
});
