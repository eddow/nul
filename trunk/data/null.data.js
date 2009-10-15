/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**
 * The data-source provide basic data queries : select, insert, update.
 */
nul.data = Class.create({
	/**
	 * Creates a single object (INSERT)
	 * @param {nul.xpr.possible} p
	 * @return {nul.xpr.object} created object
	 */
	create: function(p) { throw 'Abstract'; },
	/**
	 * Deletes one or several object (DELETE)
	 * @param {nul.xpr.possible} p
	 * @return {nul.xpr.possible} deleted object(s)
	 * note: returns the same than a query - but the object are not present in the data source anymore
	 */
	remove: function(p) { throw 'Abstract'; },
	/**
	 * Queries one or several object (SELECT)
	 * @param {nul.xpr.possible} p
	 * @return {nul.xpr.possible} selected object(s)
	 */
	query: function(p) { throw 'Abstract'; },
	/**
	 * Modifies one or several object (UPDATE)
	 * @param {nul.xpr.possible} src
	 * @param {nul.xpr.possible} dst
	 * @return {nul.xpr.possible} Modified object(s)
	 */
	modify: function(src, dst) { throw 'Abstract'; },
	
	/**
	 * {string} Context name
	 * Server name or such
	 */
	context: null,	//Abstract
	/**
	 * {string} Index in this context
	 * URL path, object ID, ...
	 */
	index: null	//Abstract
});

nul.data.query = function(obj) {
	nul.obj.use(obj);
	//TODO2
};

nul.data.querier = Class.create(nul.browser.bijectif, {
	initialize: function($super) {
		this.klgs = [];
	},
	prepare: function(xpr) {
		if('possible'== xpr.expression) {
			var nklg = xpr.knowledge.modifiable();
			nklg.merge(this.klgs[0]);
			this.klgs.unshift(nklg);
		}
	},
	transform: function(xpr) {
		if('possible'== xpr.expression)
			this.klgs.shift();
	}
});
