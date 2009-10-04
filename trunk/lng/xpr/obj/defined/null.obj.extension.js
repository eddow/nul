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
		this.attr = attr?merge([], attr):[];
		this.extensionNdx = ++nul.obj.extension.nameSpace;
		this.alreadyBuilt({
			index: this.indexedSub(this.extensionNdx),
		});
	},

//////////////// nul.obj.defined implementation

	attribute: function(an) {
		return this.attr[an];
	},

	unified: function(o, klg) {
		if('extension'== o.expression)
		{
			return new nul.obj.extension(merge(this.attr, o.attr, function(a, b) {
				if(a && b) return klg.unify(a, b);
				return a || b;
			}));
		}
		for(var an in this.attr) if(cstmNdx(an, this.attr)) {
			var oa = o.attribute(an);
			if(nul.debug.assert)assert(oa, 'defined non-extension has defined attribute')
			klg.unify(this.attr[an], oa);
		}
		return o;
	},
	
//////////////// nul.xpr.object implementation

/*	has: function($super, o, klg) {
		var rv = [];
		if(this.attr[' ']) rv.pushs(this.attr[' '].has(o, klg));
		return rv.pushs($super());
	},*/

//////////////// nul.expression implementation

	expression: 'extension',
	components: ['attr'],
});