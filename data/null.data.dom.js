/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

//TODO D

nul.data.dom = new nul.data.context('DOM');

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
	},
//TODO 1: sum_index
////////////////nul.data.container.local implementation
	
	seek: function(key) {
		switch(key.expression) {
		case 'string':
			if(!this.element.select) throw nul.semanticException('DOM', 'Element is not HTML - no CSS selection');
			var els = this.element.select(key.value);	//cf prototype.js
			return map(els, function() { return new nul.data.dom.element(this); });
		case 'node':
			var pot = $A(this.element.childNodes);
			var rv = [];
			for(var p in pot) if(cstmNdx(p)) if(pot[p].tagName == key.tag) {
				var te = $(pot[p].cloneNode(true));
				/*var nattr = clone1(key.attributes);
				for(var a=0; pot[p].attributes[a]; ++a)
					nattr[pot[p].attributes[a].name] = pot[p].attributes[a].value;
				rv.push(new nul.obj.node(key.tag, nattr,
						map(pot[p].childNodes, function() { return new nul.data.dom.element(this); })));*/
				rv.push(new nul.data.dom.element(te));
			}
			return rv;
		default:
			throw nul.semanticException('DOM', 'DOM elements can only be indexed by CSS selector or by defaulting node');
		}
	},
	list: function() {
		return map($A(this.element.childNodes), function() {
			switch(this.nodeName) {
			case '#text': return new nul.obj.litteral.string(this.data); 
			default: return new nul.data.dom.element(this);
			}
		});
	},

////////////////nul.xpr.object.defined implementation

	attribute: function(anm) {
		var pa = this.element.getAttribute(anm);
		if(null=== pa) nul.fail(this, ' has no attribute ', anm);
		return new nul.obj.litteral.string(pa);
	},
	
//////////////// nul.expression implementation

	expression: 'dom'
});

nul.load.placeHolders = function() {
	nul.globals.document = new nul.data.dom.url(this).object;
	nul.globals.xml = new nul.data.container.extern(/** @lends nul.globals.xml# */{
		wrap: function(transport) {
			return new nul.data.dom.url(transport.responseXML);
		}
	});
};
