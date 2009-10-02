/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.browser = Class.create({
	initialize: function() {},
	/**
	 * Called after sub-element browsing
	 * @param {association} bwsd An assocation of the components browsed mapping the result of the browsing
	 * @param {nul.expression} xpr The xpr given to this function
	 * @return Whatever this browse function should return
	 */
	makeRV: function(xpr, bwsd) { throw 'abstract'; },
	/**
	 * Recursion function over an expression
	 */
	recursion: function(xpr) {
		if(!xpr) return nul.browser.bijectif.unchanged;
		try {
			nul.xpr.use(xpr);
			
			var bwsd = {};
			for(var comp in xpr.components) if(cstmNdx(comp)) {
				comp = xpr.components[comp];
				if(isArray(xpr[comp])) {	//TODO0: catch failure; make xpr.failure() ? useful for ior3 - unolved
					var brwsr = this;
					bwsd[comp] = map(xpr[comp], function(i, o) { return brwsr.recursion(o); });
				} else
					bwsd[comp] = this.recursion(xpr[comp], comp);
			}
			return this.makeRV(xpr, bwsd);
		} catch(err) {
			nul.failed(err);
			if(xpr.failure) return xpr.failure;
			throw err;
		}
 	},
 	/**
 	 * Entry point of browsing
 	 */
 	browse: function(xpr) {
 		return this.recursion(xpr);
 	},
});

/**
 * A browser that cache returns value in the expression JS object
 */
nul.browser.cached = Class.create(nul.browser, {
	initialize: function($super) {
		this.invalidateCache();
		$super();
	},
	/**
	 * Remove the cache info from an object
	 */
	uncache: function(xpr) {
		delete xpr[this.name];
	},
	/**
	 * Destroy the cache of returned expression
	 */
	invalidateCache: function() {
		if(!this.cachedExpressions)
			this.name = 'browseCache' + ++nul.browser.cached.nameSpace;
		if(this.cachedExpressions)
			while(this.cachedExpressions.length)
				this.uncache(this.cachedExpressions.pop());
		this.cachedExpressions = [];
	},
	/**
	 * Recursion function over an expression
	 */
	recursion: function($super, xpr) {
		if(!xpr) return nul.browser.bijectif.unchanged;
		if(!xpr[this.name]) {
			xpr[this.name] = $super(xpr);
			this.cachedExpressions.push(xpr);
		}
 		return xpr[this.name];
 	},
 	/**
 	 * Entry point of browsing
 	 */
 	browse: function($super, xpr) {
 		try { return $super(xpr); }
 		finally { this.invalidateCache(); }
 	},
});

/**
 * Gives one other expression or the same expression
 */
nul.browser.bijectif = Class.create(nul.browser.cached, {
	/**
	 * Change the expression to browse if needed
	 */
	prepare: function(xpr) { return nul.browser.bijectif.unchanged; },
	/**
	 * Transform this expression that already had bee browsed.
	 * @return Either a new object or 'null' if nothing changed
	 */
	makeRV: function(xpr, bwsd) {
		var evl = new nul.browser.bijectif.evolution(xpr);
		evl.receive(this.prepare(evl.value));
		var mod = nul.browser.bijectif.merge(evl.value, bwsd);
		if(mod) evl.receive(mod.chew());
		evl.receive(this.transform(evl.value));
		return evl.changed; 
	},
 	/**
 	 * Entry point of browsing
 	 */
 	browse: function($super, xpr) {
 		return nul.browser.bijectif.firstChange($super(xpr), xpr);
	},
});

//////////////// Bijectif browser statics

nul.browser.bijectif.merge = function(xpr, bwsd) {
	var mod;
	for(var c in bwsd) {
		var nwItm = bwsd[c];
		if(isArray(nwItm)) {
			//bwsd[c] contient des null-s et des valeurs
			if(nul.browser.bijectif.unchanged != nul.browser.bijectif.firstChange(nwItm))
				//If at least one non-null return value,
				nwItm = merge(nwItm, xpr[c], nul.browser.bijectif.firstChange);
			else nwItm = nul.browser.bijectif.unchanged;
		}
		if(nul.browser.bijectif.unchanged!= nwItm) {
			if(!mod) mod = xpr.modifiable();
			mod[c] = nwItm;
		}
	}
	return mod;
};

nul.browser.bijectif.unchanged = 'bijectif.unchanged';
nul.browser.bijectif.evolution = Class.create({
	initialize: function(xpr) {
		this.value = xpr;
		this.changed = nul.browser.bijectif.unchanged;
	},
	receive: function(xpr) {
		if(nul.browser.bijectif.unchanged== xpr) return;
		this.changed = this.value = xpr;
		if(xpr) nul.xpr.use(xpr);
	},
});
nul.browser.bijectif.firstChange = function(vals) {
	vals = beArrg(arguments);
	for(var i = 0; i<vals.length; ++i)
		if(vals[i] != nul.browser.bijectif.unchanged)
			return vals[i];
	return nul.browser.bijectif.unchanged;
};

