/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
//#requires: src/data/null.data

/**
 * Singleton
 * @class The context of AJAX-accessible items
 * @extends nul.data.context
 */
nul.data.dom = new nul.data.context('DOM', 10);

nul.data.dom.doc = new JS.Class(nul.data,/** @lends nul.data.dom.doc# */{
	/**
	 * @class Data access to an XML document
	 * @extends nul.data
	 * @param {URL | XMLdocument} doc
	 * @constructs
	 */
	initialize: function(doc) {
		this.document = doc;
		this.extract = new nul.data.dom.element($(doc.documentElement));
		this.callSuper(nul.data.dom, doc.documentURI);
	}
});

nul.data.dom.element = new JS.Class(nul.obj.hc, /** @lends nul.data.dom.element */{
	/**
	 * @class Data access to an XML element
	 * @extends nul.obj.hc
	 * @param {HTMLElement} element
	 * @constructs
	 */
	initialize: function(element) {
		this.element = $(element);
		if(!this.element[0].nulId) this.element[0].nulId = nul.execution.name.gen('element.nulId');
		this.callSuper(null);
		this.tag = this.element[0].tagName;
		this.properties = {
			'': function() { return new nul.obj.litteral.string(this.element[0].tagName); },
			'# ': function() { return new nul.obj.litteral.number(this.element.children().length); }
		};
		for(var a=0; this.element[0].attributes[a]; ++a) this.properties[this.element[0].attributes[a].name] = function(klg, anm) {
			return new nul.obj.litteral.string(this.element.attr(anm)); };
	},
////////////////nul.obj.hc implementation
	
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
			if(!this.element.find) nul.ex.semantic('DOM', 'Element is not HTML - no CSS selection', this, key);
			var els = $.makeArray(this.element.find(key.value));
			return map(els, function() { return new nul.data.dom.element($(this)); });
		case 'node':
			return nul.obj.node.relativise(key, this.listed());
		default:
			nul.ex.semantic('DOM', 'DOM elements can only be indexed by CSS selector or by defaulting node', key);
		}
	},
	
	/**
	 * List all the sub-nodes as nul objects
	 * @return {nul.xpr.object[]}
	 */
	listed: function() {
		var rv = [];
		for(var chld = this.element[0].firstChild; chld; chld = chld.nextSibling) switch(chld.nodeName) {
			case '#text': rv.push(new nul.obj.litteral.string(chld.data)); break;
			default: rv.push(new nul.data.dom.element(chld)); break;
		}
		return rv;
	},

//////////////// nul.expression implementation

	/** @constant */
	expression: 'dom',

	/** <a href="http://code.google.com/p/nul/wiki/Summary">Summary</a> computation of {@link index} */
	sum_index: function() { return this.indexedSub(this.element[0].nulId); }
});

/**
 * Creates DOM and XML globals
 */
nul.load.dom = function() {
	nul.globals.document = new nul.data.dom.doc(this).object;
	/**
	 * Singleton
	 * @class The 'xml' global
	 * @extends nul.obj.hc
	 */
	nul.globals.xml = new nul.obj.hc(/** @lends nul.globals.xml# */{
		/**
		 * Give an XML node out of an URL string
		 * @param {nul.obj.defined} pnt
		 * @return {nul.data.dom.doc} The loaded document
		 */
		seek: function(pnt) {
			if('string'!= pnt.expression) nul.ex.semantic('AJAX', 'Ajax retrieve XML documents only from a string URL', pnt);
			return nul.data.ajax.load(pnt.value,
					function(t) { return new nul.data.dom.doc(t.responseXML); } );
		},
		//TODO 2: list nodes that fit for xml : string attributes and XMLnode/text content
		/** @constant */
		expression: 'xml'
	});
};
nul.load.dom.provide = ['nul.globals'];