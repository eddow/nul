/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

//TODO D

nul.data.page = new nul.data.context(
	'page', 0,
	/** @lends nul.data.page# */{
	query: function(obj) {
		var brwsr = new nul.data.pageReader();
		return brwsr.browse(obj);
	}
});

nul.data.pageReader = Class.create(nul.browser.bijectif, {
	initialize: function($super) {
		$super();
	},
	transform: function(xpr) {
		if('data'== xpr.expression && nul.data.page== xpr.source.context)
			return nul.data.dom.document;
		return nul.browser.bijectif.unchanged;
	}
});

/**
 * The data-source provide basic data queries : select, insert, update, delete.
 */
nul.data.onPage = new nul.data(nul.data.page, 'document');

nul.data.dom = Class.create(nul.data.container, {
	initialize: function($super, element) {
		this.element = $(element);
		$super();
	},
//////////////// nul.obj.defined implementation

	subUnified: function(o, klg) {
		//TODO 2
	},
	intersect: function(o, klg) {
		//TODO 2
	},

//////////////// nul.xpr.object implementation

	retrieve: function(key, desc, attrs) {
		if('string'!= key.expression) throw nul.semanticException('DOM', 'DOM elements can only be indexed by CSS selector');
		var els = this.element.select(key.value);	//cf prototype.js
		return map(els, function() { return new nul.data.dom(this); });
	},
	select: function(desc, attrs) {
		//TODO 2
	},

//////////////// nul.expression implementation

	expression: 'dom'
});

nul.data.dom.document = new nul.data.dom(document.documentElement);
	
nul.load.placeHolders = function(doc) {
	nul.globals.document = new nul.obj.data(nul.data.onPage);	//TODO 3: use 'doc' instead of global
};
