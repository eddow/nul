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
	},
	
	/**
	 * Retrieve an object from a data-point
	 * @param {any} prm Parameter given to the querier
	 * @return {nul.data.container}
	 */
	extract: function(prm) { throw 'abstract'; }
});

nul.data.container = Class.create(nul.obj.defined, /** @lends nul.data.container# */{
	/**
	 * The data-source provide basic data queries : select, insert, update.
	 * @constructs
	 * @extends nul.obj.defined
	 */
	initialize: function($super, singleton) {
		if(singleton) merge(this, singleton);
		this.alreadyBuilt();
		return $super();
	},
	
	retrieve: function(pnt, img, att) { throw nul.semanticException('CNT', this.expression+' cannot retrieve items'); },
	select: function(obj, att) { throw nul.semanticException('CNT', this.expression+' cannot select items'); },
	
	subHas: function(o, attrs) {
		if('lambda'== o.expression && isEmpty(o.point.dependance().usages)) return this.retrieve(o.point, o.image, attrs);
		else if(!isEmpty(attrs)) return this.select(o, attrs);
	}
});

/**
 * The data-source filters on the local computer
 * @class
 * @extends nul.data.container
 */
nul.data.container.local = Class.create(nul.data.container, /** @lends nul.data.container.local# */{
	seek: function(key) { throw nul.semanticException('CNT', this.expression+' cannot retrieve items'); },
	list: function() { throw nul.semanticException('CNT', this.expression+' cannot select items'); },
	
	retrieve: function(pnt, img, att) {
		return nul.data.container.local.filter(
				this.seek(pnt),
				img, att,
				function(v) { return new nul.obj.lambda(pnt, v); }
			);
	},
	select: function(obj, att) {
		return nul.data.container.local.filter(this.list(), obj, att);
	}
});

nul.data.container.local.filter = function(objs, exp, att, wrp) {
	if(!isArray(objs)) objs = [objs];
	return maf(objs, function(n, orv) {
		try {
			if(nul.data.is(orv)) orv = new nul.obj.data(orv);
			var klg = new nul.xpr.knowledge();
			var vl = klg.unify(orv, exp);
			vl = klg.attributed(vl, att);
			if(wrp) vl = wrp(vl);
			return klg.wrap(vl);
		} catch(e) { nul.failed(e); }
	});
};

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
	},
	
	/**
	 * Build a querier to browse and replace 'data' object from an expression.
	 * @param {any} the parameter given to 'extract' functions
	 * @return {nul.browser.bijectif}
	 */
	querier: function(prm) {
		return new nul.data.querier(this, prm);
	}
});

merge(nul.data, /** @lends nul.data */{
	query: function(obj) {
		nul.obj.use(obj);
		var usg = obj.dependance().usages;
		if(usg['compute']) obj = nul.data.compute.query(obj);
		while(!isEmpty(usg)) {
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