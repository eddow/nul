/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

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
	context: 'page'
});

nul.load.placeHolders = function(doc) {
	var elms = arrg(this.getElementsByTagName('nul:place'));
	var places = [];
	for(var e in elms) if(cstmNdx(e))
		places.push(new nul.obj.lambda(
			nul.obj.litteral.make(elms[e].id),
			new nul.obj.data(new nul.data.onPage(elms[e]))
		));
	nul.globals.element = nul.obj.pair.list(null, places);
};
