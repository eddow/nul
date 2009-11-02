/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

//TODO 2: should perhaps override nul.data.container.local ?
// node[template]
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
		var dupProp = null;
		this.attributes = attributes || {};
		for(var anm in this.attributes)
			if('function'== typeof this.attributes[anm]) {
				if(!dupProp) dupProp = map(this.properties);
				dupProp[anm] = this.attributes[anm];
				delete this.attributes[anm];
			}
		if(dupProp) this.properties = dupProp;
		if(nul.debug.assert) assert(!content || nul.obj.empty==content || 'pair'== content.expression,
				'Content of a nodae must be pair or empty');
		this.content = content || nul.obj.empty;	//TODO 2: assert content #set
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
		return new nul.obj.node(this.tag, nattrs, klg.unify(this.content, o.content));
	},

	properties: {
		'': function() { new nul.obj.litteral.string(this.tag); },
		'# ': function(klg) { return this.content.attribute('# ', klg); }
	},

//////////////// nul.xpr.object implementation

	subHas: function(o, attrs) {
		return this.content.having(o, attrs);
	},

//////////////// nul.expression implementation

	/** @constant */
	expression: 'node',
	/** @constant */
	components: {
		'attributes': {type: 'nul.xpr.object', bunch: true},
		'content': {type: 'nul.xpr.object', bunch: false}
	}
});

/**
 * If the template and the node have the same tag, returns an object who :
 * - have all the attributes fixed like obj
 * - have the attributes fixed by tpl and not obj fixed to the value specified by tpl (default value system)
 * - is undefined and, therefore can have other attributes
 * @param {nul.obj.defined} tpl Template
 * @param {nul.obj.defined[]} objs Objects
 * @return {nul.obj.possible[]}
 */
nul.obj.node.relativise = function(tpl, objs) {
	nul.obj.is(tpl, 'nul.obj.defined');
	return maf(objs, function(n, obj) {
		nul.obj.is(obj, 'nul.obj.defined');
		if(tpl.tag == obj.tag) {
			var rAtt = map(obj.attributes);
			var klg = new nul.xpr.knowledge();
			merge(rAtt, obj.properties, function(a, b, n) { return a || b.apply(obj, [klg, n]); });
			merge(rAtt, tpl.attributes, function(a, b, n) { return a || b; });
			merge(rAtt, tpl.properties, function(a, b, n) { return a || b.apply(tpl, [klg, n]); });
			var trv = klg.newLocal(tpl.tag);
			klg.attributed(trv, rAtt);
			return klg.wrap(trv);
		}
	});
	//TODO 3: manage 'content'
}