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
		this.ofObject = ofo;
		this.attributeName = anm;
	},

//////////////// nul.xpr implementation

	type: 'attr',
	toString: function() {
		return this.ofObject.toString() + '&rarr;' + this.attributeName;
	},
	build_ndx: function() { return '[attr:'+this.ofObject.ndx()+'|'+this.attributeName+']'; },
	components: ['ofObject'],
});