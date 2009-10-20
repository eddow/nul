/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.obj.node = Class.create(nul.obj.defined, {
	initialize: function($super, tag, attrs, content) {
		this.attributes = nul.xpr.beBunch(attrs);
		this.tag = tag;
		this.content = content;
		this.alreadyBuilt();
		$super();
	},
//////////////// nul.obj.defined implementation

	subUnified: function(o, klg) {
		if('node'!= o.expression) nul.fail(o, ' not a node');
		var nattrs = merge(this.attributes, o.attributes, function(a, b, i) {
			if(!a || !b) nul.fail('Attribute not common : '+i);
			return klg.unify(a, b); 
		});
		return new nul.obj.node(nattrs);
	},
	intersect: function(o, klg) {
		return this.unified(o, klg);
	},

//////////////// nul.xpr.object implementation

	subHas: function(o) {
		if(this.content) return this.content.having(o);
	},

//////////////// nul.expression implementation

	expression: 'node',
	components: ['attributes','content']
});