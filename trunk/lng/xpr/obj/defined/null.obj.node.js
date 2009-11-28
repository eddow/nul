/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.obj.node = new JS.Class(nul.obj.hc, /** @lends nul.obj.node# */{
	/**
	 * XML node : tag, attributes and list content. There are no restrictions on content and/or attributes.
	 * @extends nul.obj.defined
	 * @constructs
	 * @param {String} tag The tagName of the XML node
	 * @param {nul.xpr.object[String]} attributes The named attributes
	 * @param {nul.xpr.object[]} content The list of contained elements
	 */
	initialize: function(tag, attributes, content) {
		this.tag = tag;
		var dupProp = null;
		this.attributes = attributes || {};
		for(var anm in this.attributes)
			if('function'== typeof this.attributes[anm]) {
				if(!dupProp) dupProp = $o.clone(this.properties);
				dupProp[anm] = this.attributes[anm];
				delete this.attributes[anm];
			}
		if(dupProp) this.properties = dupProp;

		this.content = content || nul.obj.empty;	//TODO 2: assert content #set
		nul.obj.use(this.content, 'nul.obj.list');
		
		return this.callSuper(null);
	},

//////////////// nul.obj.defined implementation

	//TODO C
	subUnified: function(o, klg) {
		if('node'!= o.expression) nul.fail(o, ' not a node');
		var nattrs = merge(this.attributes, o.attributes, function(a, b, i) {
			if(!a || !b) nul.fail('Attribute not common : '+i);
			return klg.unify(a, b); 
		});
		return new nul.obj.node(this.tag, nattrs, klg.unify(this.content, o.content));
	},
	//TODO C
	properties: {
		'': function() { return new nul.obj.litteral.string(this.tag); },
		'# ': function(klg) { return this.content.attribute('# ', klg); }
	},
	
	recursion: function() { return this.content.recursion(); },

	/**
	 * @param {document} doc
	 * @return {XMLElement}
	 * @throw {nul.ex.semantic}
	 * TODO 2 returns Element
	 */
	XML: function(doc) {
		var rv = doc.createElement(this.tag);
		for(var a in this.attributes) {
			//TODO 3: check a as attribute name
			if(!this.attributes[a].isA(nul.obj.litteral.string))
				nul.ex.semantic('XML', 'This doesnt fit for XML attribute', this.attributes[a]);
			rv.setAttribute(a, this.attributes[a].value);
		}
		var lst = this.content.listed();
		for(var c=0; lst[c]; ++c)
			rv.appendChild(lst[c].XML(doc));
		return rv;
	},

//////////////// nul.obj.hc implementation

	/**
	 * Gets a node from a selector. The selector can be :
	 * TODO 3- a string tag name (simple CSS selector)
	 * - another node as a template
	 * @param {nul.obj.defined} key
	 */
	seek: function(key) {
		switch(key.expression) {
		case 'node':
			return nul.obj.node.relativise(key, this.listed());
		default:
			nul.ex.semantic('NODE', 'NODE elements can only be indexed [by CSS selector or ]by defaulting node', key);
		}
	},
	
	/**
	 * List the content
	 * @return {nul.xpr.possible[]}
	 */
	listed: function() {
		return this.content.listed();
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
		var klg;
		if(obj.isA(nul.xpr.possible)) {
			klg = obj.knowledge;
			obj = obj.value;
		} else klg = nul.klg.always;
		nul.obj.is(obj, 'nul.obj.defined');
		if(tpl.tag == obj.tag) {
			var rAtt = $o.clone(obj.attributes);
			klg = klg.modifiable();
			merge(rAtt, obj.properties, function(a, b, n) { return a || obj.attribute(n); });
			merge(rAtt, tpl.attributes, function(a, b, n) { return a || b; });
			merge(rAtt, tpl.properties, function(a, b, n) { return a || tpl.attribute(n); });
			var trv = klg.newLocal(tpl.tag);
			klg.attributed(trv, rAtt);
			return klg.wrap(trv);
		}
	});
	//TODO 3: manage 'content'
}.describe('Relativise');