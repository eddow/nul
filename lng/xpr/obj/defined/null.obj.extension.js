/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.obj.extension = Class.create(nul.obj.defined, {
	initialize: function(attr) {
		this.attr = attr||{};
		this.ndx = ++nul.obj.extension.nbr;
	},

//////////////// nul.xpr implementation

	type: 'extension',
	build_ndx: function() { return '[o'+this.extensionNdx+']'; },
});