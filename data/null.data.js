/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.data = Class.create(/** @lends nul.data# */{
	/**
	 * The data-source provide basic data queries : select, insert, update.
	 * @constructs
	 */
	initialize: function(context, index, singleton) {
		if(singleton) merge(this, singleton);
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
	 * @return {nul.data.container}
	 */
	extract: function(prm) { throw 'abstract'; }
});

merge(nul.data, /** @lends nul.data */{
	query: function(obj) {
		nul.obj.use(obj);
		var usg = obj.dependance().usages;
		while(!isEmpty(usg)) {
			var chsdCtx = null;
			for(var d in usg) if(cstmNdx(d)) {
				var ctx = nul.dependance.contexts[d];
				nul.data.context.is(ctx);
				if(!chsdCtx || ctx.distance < chsdCtx.distance)
					chsdCtx = ctx;
			}
			//chsdCtx is fixed as minimum distance
			nul.data.context.is(chsdCtx);
			obj = chsdCtx.query(obj);
			usg = obj.dependance().usages;
		}
		return obj;
	},

	querier: Class.create(nul.browser.bijectif, {
		initialize: function($super, context, prm) {
			this.context = context;
			this.prm = prm;
			$super();
		},
		transform: function(xpr) {
			if('data'== xpr.expression && this.context.name == xpr.source.context.name)
				return Object.isFunction(xpr.source.extract)?xpr.source.extract(this.prm):xpr.source.extract;
			return nul.browser.bijectif.unchanged;
		}
	}),
	
	/**
	 * Build the object retrieved by index
	 */
	retrieved: function(key, obj, cnstr) {
		if(!isArray(obj)) return new nul.obj.lambda(key, obj);
		return map(obj, function() {
			return new nul.obj.lambda(key, cnstr?(new cnstr(this)):this);
		});
	}
});

nul.data.context = Class.create(/** @lends nul.data.context# */{
	/**
	 * The data-source provide basic data queries : select, insert, update.
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
		if(singleton) merge(this, singleton);
	},

	toString: function() { return this.name; },

	/**
	 * Gets an object image no more dependant from this context
	 * @param {nul.xpr.object} obj
	 * @return {nul.browser.bijectif}
	 * @throws {nul.failure}
	 */
	query: function(obj) {
		return this.querier().browse(obj);
	}.describe('Query', function() {
		return this.name;
	}),
	
	/**
	 * Build a querier to browse and replace 'data' object from an expression.
	 * @param {any} the parameter given to 'extract' functions
	 * @return {nul.browser.bijectif}
	 */
	querier: function(prm) {
		return new nul.data.querier(this, prm);
	}
});
