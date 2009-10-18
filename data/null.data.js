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
	 * {nul.data.context} Context
	 * Server or such
	 */
	context: null,	//Abstract
	/**
	 * {string} Index in this context
	 * URL path, object ID, ...
	 */
	index: null,	//Abstract
	/**
	 * Number stating how intimate the local script is to the data source.
	 * 0 = total intimacy, 100 = no intimacy at all
	 * Query always try to solve by querying the most intimate dataSource
	 */
	distance: null	//Abstract

});

nul.data.are = nul.debug.are('context');
nul.data.is = nul.debug.is('context');

nul.data.context = Class.create({
	/**
	 * {string} Context name
	 * Server name or such
	 */
	name: null,	//Abstract
	
	toString: function() { return this.name; },
	
	/**
	 * Gets an object image no more dependant from this context
	 * @param {nul.xpr.object} obj
	 * @return {nul.xpr.object}
	 * @throw nul.failure
	 */
	query: function(obj) { throw 'Abstract'; }
});

nul.data.context.are = nul.debug.are('query');
nul.data.context.is = nul.debug.is('query');

nul.data.query = function(obj) {
	nul.obj.use(obj);
	var usg;
	//TODO O: try to query to compute at least once first - but perhaps each time indeed
	while(!isEmpty(usg = obj.dependance().usages)) {
		var chsdCtx;
		for(var d in usg) if(cstmNdx(d)) {
			var ctx = nul.dependance.contexts[d];
			nul.data.context.is(ctx);
			if(!chsdCtx || ctx.context.distance < chsdCtx.distance)
				chsdCtx = ctx;
		}
		//chsdCtx is fixed as minimum distance
		nul.data.context.is(chsdCtx);
		obj = chsdCtx.query(obj);	
	}
	return obj;
};
