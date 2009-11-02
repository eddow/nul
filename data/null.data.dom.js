/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**
 * The context of AJAX-accessible items
 * @class Singleton
 * @extends nul.data.context
 */
nul.data.dom = new nul.data.context('DOM', 10);

nul.data.dom.url = Class.create(nul.data,/** @lends nul.data.dom.url# */{
	/**
	 * @constructs
	 * @extends nul.data
	 * @param {URL | XMLdocument} doc
	 */
	initialize: function($super, doc) {
		this.document = doc;
		this.extract = new nul.data.dom.element($(doc.documentElement));
		$super(nul.data.dom, doc.documentURI);
	}
});

nul.data.dom.element = Class.create(nul.data.container.local, /** @lends nul.data.dom.element */{
	/**
	 * A NUL object corresponding to a DOM element (XML or HTML)
	 * @constructs
	 * @extends nul.data.container.local
	 * @param {HTMLElement} element
	 */
	initialize: function($super, element) {
		this.element = $(element);
		if(!this.element.nulId) this.element.nulId = nul.execution.name.gen('element.nulId');
		$super();
		this.tag = this.element.tagName;
		this.properties = {
			'': function() { return new nul.obj.litteral.string(this.element.tagName); },
			'# ': function() { return new nul.obj.litteral.number(this.element.childNodes.length); }
		};
		for(var a=0; this.element.attributes[a]; ++a) this.properties[this.element.attributes[a].name] = function(klg, anm) {
			return new nul.obj.litteral.string(this.element.getAttribute(anm)); };
	},
////////////////nul.data.container.local implementation
	
	/**
	 * Gets a node from a selector. The selector can be :
	 * - a string CSS selector (only for HTML element) 
	 * - a string tag name (simple CSS selector)
	 * - another node as a template
	 * @param {nul.obj.defined} key
	 */
	seek: function(key) {
		switch(key.expression) {
		case 'string':
			//TODO 2: essayer avec getElementsByTagName si en profondeur et simple CSS selector
			if(!this.element.select) throw nul.semanticException('DOM', 'Element is not HTML - no CSS selection');
			var els = this.element.select(key.value);	//cf prototype.js
			return map(els, function() { return new nul.data.dom.element(this); });
		case 'node':
			return nul.obj.node.relativise(key, this.list());
		default:
			throw nul.semanticException('DOM', 'DOM elements can only be indexed by CSS selector or by defaulting node');
		}
	},
	
	/**
	 * List all the sub-nodes as nul objects
	 * @return {nul.xpr.object[]}
	 */
	list: function() {
		var rv = [];
		for(var chld = this.element.firstChild; chld; chld = chld.nextSibling) switch(chld.nodeName) {
			case '#text': rv.push(new nul.obj.litteral.string(chld.data)); break;
			default: rv.push(new nul.data.dom.element(chld)); break;
		}
		return rv;
	},

//////////////// nul.expression implementation

	expression: 'dom',
	sum_index: function() { return this.indexedSub(this.element.nulId); }
});

/**
 * Creates DOM and XML globals
 */
nul.load.dom = function() {
	nul.globals.document = new nul.data.dom.url(this).object;
	/**
	 * The 'xml' global
	 * @class Singleton
	 * @extends nul.data.container.local
	 */
	nul.globals.xml = new nul.data.container.local(/** @lends nul.globals.xml# */{
		//TODO C
		seek: function(pnt) {
			if('string'!= pnt.expression) throw nul.semanticException('AJAX', 'Ajax retrieve XML documents from a string URL');
			return nul.data.container.extern(pnt.value,
					function(t) { return new nul.data.dom.url(t.responseXML); } );
		},
		//TODO 2: list nodes that fit for xml : string attributes and XMLnode/text content
	});
};
