/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.data = new JS.Class(/** @lends nul.data# */{
	/**
	 * The data-source provide basic data queries : select, insert, update.
	 * @constructs
	 */
	initialize: function(context, index, singleton) {
		if(singleton) this.extend(singleton);
		/**
		 * @type {nul.data.context}
		 */
		if(context) this.context = context;
		/**
		 * @type string
		 * Index in this context : URL path, server, ...
		 */
		if(index) this.index = index;
		/**
		 * @type {nul.obj.data}
		 * The object refering this data
		 */
		this.object = new nul.obj.data(this);
	},
	
	/**
	 * Retrieve an object from a data-point
	 * @param {any} prm Parameter given to the querier
	 * @return {nul.obj.defined}
	 */
	extract: function(prm) { throw 'abstract'; },
	
	extend: /** @lends nul.data */{
		/**
		 * Query what is needed to have the queried state of the object
		 * @param {nul.xpr.object} obj
		 * @return {nul.xpr.object} The same object without dependancies
		 * @throw {nul.ex.failure}
		 * @throw {nul.ex.semantic}
		 */
		query: function(obj) {
			nul.obj.use(obj);
			var usg = obj.dependance().usages;
			while(!isEmpty(usg, 'global')) {
				var chsdCtx = null;
				for(var d in ownNdx(usg)) {
					var ctx = nul.dependance.contexts[d];
					if(nul.debugged) nul.assert(nul.data.context.def(ctx), 'Context queried');
					if(!chsdCtx || ctx.distance < chsdCtx.distance)
						chsdCtx = ctx;
				}
				//chsdCtx is fixed as minimum distance
				if(!chsdCtx) nul.ex.internal('Cannot query : ' + $.keys(usg).join(', '));
				obj = chsdCtx.query(obj);
				usg = obj.dependance().usages;
			}
			return obj;
		},

		querier: new JS.Class(nul.browser.bijectif, /** @lends nul.data.querier */{
			/**
			 * The browser to replace atomic query-dependant values by their queried value
			 * @constructs
			 * @extends nul.browser.bijectif
			 * @param {nul.data.context} context
			 */
			initialize: function(context, prm) {
				this.context = context;
				this.prm = prm;
				this.callSuper('querier:'+context.name);
			},
			/**
			 * Gets the expression-specific queried value if the expression is a data from the queried context
			 */
			transform: function(xpr) {
				if('data'== xpr.expression && this.context.name == xpr.source.context.name)
					return $.isFunction(xpr.source.extract)?xpr.source.extract(this.prm):xpr.source.extract;
				return nul.browser.bijectif.unchanged;
			}
		})
	}
});

nul.data.context = new JS.Class(/** @lends nul.data.context# */{
	/**
	 * The data-source provider
	 * @constructs
	 */
	initialize: function(name, distance, singleton) {
		/**
		 * @type String
		 * Context name : protocol, ...
		 */
		this.name = name;
		/**
		 * Number stating how intimate the local script is to the data source.
		 * 0 = total intimacy, 100 = no intimacy at all
		 * Query always try to solve by querying the most intimate dataSource
		 * @type Number
		 */
		this.distance = distance || 0;
		if(singleton) this.extend(singleton);
	},

	toString: function() { return this.name; },

	/**
	 * Gets an object image no more dependant from this context
	 * @param {nul.xpr.object} obj
	 * @return {nul.browser.bijectif}
	 * @throws {nul.ex.failure}
	 */
	query: function(obj) {
		return this.querier().browse(obj);
	}.describe('Query'),
	
	/**
	 * Build a querier to browse and replace 'data' object from an expression.
	 * @param {any} the parameter given to 'extract' functions
	 * @return {nul.browser.bijectif}
	 */
	querier: function(prm) {
		return new nul.data.querier(this, prm);
	}
});

/**
 * The context used for all computations that doesn't require a connection
 * @class Singleton
 * @extends nul.data.context
 */
nul.data.context.local = new nul.data.context('local');