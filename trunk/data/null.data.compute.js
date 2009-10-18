/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

//TODO 2: R-O (query), CML (insert), R/W (modify), XC (delete) data sources 
/**
 * The data-source provide basic data queries : select, insert, update, delete.
 */
nul.data.compute = Class.create(nul.data, {
	initialize: function($super, index, query) {
		this.query = query;
		this.index = index;
		$super();
	},
	context: 'compute',
	distance: 100
});
