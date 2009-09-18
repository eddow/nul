/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**
 * Defined an object that is an attribute of another object
 */
nul.obj.attribute = Class.create(nul.obj.undefined, {
	initialize: function(ofo, anm) {
		nul.obj.use(ofo);
		this.ofObject = ofo;
		this.attributeName = anm;
		this.summarise();
	},

//////////////// nl.xpr implementation

	type: 'attribute',
	sum_index: function() { return this.indexedSub(this.ofObject, this.attributeName); },
	components: ['ofObject'],
});