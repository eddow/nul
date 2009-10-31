/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.obj.node = Class.create(nul.obj.defined, /** @lends nul.obj.node# */{
	/**
	 * XML node : tag, attributes and list content. There are no restrictions on content and/or attributes.
	 * @extends nul.obj.defined
	 * @constructs
	 * @param {String} tag The tagName of the XML node
	 * @param {nul.xpr.object[String]} attributes The named attributes
	 * @param {nul.xpr.object[]} content The list of contained elements
	 */
	initialize: function($super, tag, attributes, content) {
		this.tag = tag;
		this.attributes = attributes || {};
		this.attributes[''] = new nul.obj.litteral.string(tag);
		this.content = content || [];
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

//////////////// nul.xpr.object implementation

	subHas: function(o, attrs) {
		throw 'not implememted';	//TODO 2: node.has
	},

//////////////// nul.expression implementation

	/** @constant */
	expression: 'node',
	/** @constant */
	components: {
		'attributes': {type: 'nul.xpr.object', bunch: true},
		'content': {type: 'nul.xpr.object', bunch: true}
	}
});
