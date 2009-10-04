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
	},

//////////////// nl.expression implementation

	expression: 'attribute',
	sum_index: function() { return this.indexedSub(this.ofObject, this.attributeName); },
	components: ['ofObject'],
	built: function($super) {
		var av;
		if(this.ofObject.defined) av = this.ofObject.attribute(this.attributeName);
		if(av) return av;
		return $super();
	},
});

nul.obj.attribute.take = function(o, a) {
	return (new nul.obj.attribute(o, a)).built();
};
