/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.data.page = new (Class.create(nul.data.context,{
	name: 'page',
	query: function(obj) {
		var brwsr = new nul.data.pageQuerier();
		return brwsr.browse(obj);
	}
}))();

nul.data.pageQuerier = Class.create(nul.browser.bijectif, {
	initialize: function($super) {
		$super();
	},
	transform: function(xpr) {
		if('data'== xpr.expression && nul.data.page== xpr.source.context)
			return nul.read(outerHTML(xpr.source.element));
		return nul.browser.bijectif.unchanged;
	}
});

/**
 * The data-source provide basic data queries : select, insert, update, delete.
 */
nul.data.onPage = Class.create(nul.data, {
	initialize: function($super, element) {
		this.element = $(element);
		this.index = this.element.id;
		$super();
	},
	create: function(p) {
		
	},
	remove: function(p) {
		
	},
	query: function(p) {
		
	},
	modify: function(src, dst) {
		
	},
	context: nul.data.page,
	distance: 0
});

nul.load.placeHolders = function(doc) {
	var elms = arrg(this.getElementsByTagName('nul'));
	var places = [];
	for(var e in elms) if(cstmNdx(e))
		places.push(new nul.obj.lambda(
			nul.obj.litteral.make(elms[e].id),
			new nul.obj.data(new nul.data.onPage(elms[e]))
		));
	nul.globals.element = nul.obj.pair.list(null, places);
};
