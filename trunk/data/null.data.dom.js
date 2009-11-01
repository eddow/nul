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
		if('string'== typeof doc) {
			throw 'not implemented'; //TODO 2: load external XML file where doc==url
		}
		this.document = doc;
		this.extract = new nul.data.dom.element($(doc.documentElement));
		$super(nul.data.dom, doc.documentURI);
	}
});

nul.data.dom.element = Class.create(nul.data.container.local, {
	initialize: function($super, element) {
		this.element = $(element);
		$super();
		this.properties = {
			'': function() { return new nul.obj.litteral.string(this.element.tagName); },
			'# ': function() { return new nul.obj.litteral.number(this.element.childNodes.length); }
		};
		for(var a=0; this.element.attributes[a]; ++a) this.properties[this.element.attributes[a].name] = function(klg, anm) {
			return new nul.obj.litteral.string(this.element.getAttribute(anm)); };
	},
//TODO 1: sum_index
////////////////nul.data.container.local implementation
	
	//TODO C
	seek: function(key) {
		switch(key.expression) {
		case 'string':
			//TODO 2: essayer avec getElementsByTagName si en profondeur et simple CSS selector
			if(!this.element.select) throw nul.semanticException('DOM', 'Element is not HTML - no CSS selection');
			var els = this.element.select(key.value);	//cf prototype.js
			return map(els, function() { return new nul.data.dom.element(this); });
		case 'node':
			//TODO 1: utiliser nextSibling
			//TODO 1: utiliser une fonction filter speciale sur l'idee <n/> / <n/>
			var pot = $A(this.element.childNodes);
			var rv = [];
			for(var p in pot) if(cstmNdx(p)) if(pot[p].tagName == key.tag) {
				var te = $(pot[p].cloneNode(true));
				rv.push(new nul.data.dom.element(te));
			}
			return rv;
		default:
			throw nul.semanticException('DOM', 'DOM elements can only be indexed by CSS selector or by defaulting node');
		}
	},
	
	//TODO C
	list: function() {
		//TODO 1: utiliser nextSibling
		return map($A(this.element.childNodes), function() {
			switch(this.nodeName) {
			case '#text': return new nul.obj.litteral.string(this.data); 
			default: return new nul.data.dom.element(this);
			}
		});
	},

//////////////// nul.expression implementation

	expression: 'dom'
});

nul.load.placeHolders = function() {
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
