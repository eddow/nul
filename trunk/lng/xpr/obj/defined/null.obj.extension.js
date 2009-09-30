/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.obj.extension = Class.create(nul.obj.defined, {
	initialize: function(attr) {
		nul.obj.use(vals(attr));
		this.attr = attr||{};
		this.ndx = ++nul.obj.extension.nameSpace;
		this.alreadyBuilt({
			index: this.indexedSub(this.extensionNdx),
		});
	},

//////////////// nul.xpr.object implementation

	has: function($super, o, klg) {
		var rv = [];
		if(this.attr[' ']) rv.pushs(this.attr[' '].has(o, klg));
		return rv.pushs($super());
	},

//////////////// nul.expression implementation

	expression: 'extension',
});