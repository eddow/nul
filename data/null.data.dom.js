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
		this.index = doc.documentURI;
		this.extract = new nul.data.dom.element($(doc.documentElement));
	},
	
	/** @constant */
	context: nul.data.dom
});

nul.data.dom.element = Class.create(nul.data.container.local, {
	initialize: function($super, element) {
		this.element = $(element);
		$super();
	},

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
				var nattr = {};
				for(var a in key.attributes) {
					var pa = pot[p].getAttribute(a);
					nattr[a] = (null=== pa)?key.attributes[a]:(new nul.obj.litteral.string(pa));
				}
				rv.push(new nul.obj.node(key.tag, nattr));
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
	nul.globals.document = new nul.obj.data(new nul.data.dom.url(this));
	nul.globals.xml = new nul.data.container.local(/** @lends nul.globals.xml */{
		seek: function(key) {
			if('string'!= key.expression) throw nul.semanticException('AJAX', 'Ajax retrieve XML documents from a string URL');
			var rq = new Ajax.Request(key.value, {
				method: 'get',
				asynchronous: false,
				onException: function(rq, x) {
					switch(x.code) {
						case 1012: throw nul.semanticException('AJAX', 'Ajax failure : Not respecting the <a href="http://en.wikipedia.org/wiki/Same_origin_policy">Same Origin Policy</a>');
						default: throw nul.semanticException('AJAX', 'Ajax failure : '+x);
					}
				},
			});
			return [new nul.data.dom.url(rq.transport.responseXML)];
		},
		expression: 'ajax'
	});
};
