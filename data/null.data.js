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
	initialize: function(context, index) {
		/**
		 * @type {nul.data.context}
		 */
		this.context = context;
		/**
		 * @type string
		 * Index in this context : URL path, server, ...
		 */
		this.index = index;
	}
});

nul.data.container = Class.create(nul.obj.defined, /** @lends nul.data.container# */{
	/**
	 * The data-source provide basic data queries : select, insert, update.
	 * @constructs
	 * @extends nul.obj.defined
	 */
	initialize: function($super) {
		this.alreadyBuilt();
		return $super();
	},
	
	subHas: function(o, attrs) {
		if('lambda'== o.expression) { 
			if(o.point.defined) {
				var rv = this.retrieve(o.point, o.image, attrs);
				if(!rv) return;
				return map(rv, function() { return new nul.obj.lambda(o.point, this) });	//TODO 2: le fils devrait refournir le point
			}
		} else if(o.defined || !isEmpty(attrs))
			return this.select(o, attrs);
	},
	
});

nul.data.context = Class.create(/** @lends nul.data.context# */{
	/**
	 * The data-source provide basic data queries : select, insert, update.
	 * @constructs
	 */
	initialize: function(name, distance, fcts) {
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
		this.distance = distance;
		merge(this,fcts);
	},

	toString: function() { return this.name; },

	/**
	 * Gets an object image no more dependant from this context
	 * @param {nul.xpr.object} obj
	 * @return {nul.xpr.object}
	 * @throws {nul.failure}
	 */
	query: function(obj) { throw 'Abstract'; }
});

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
