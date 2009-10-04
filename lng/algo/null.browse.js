/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.browser = Class.create({
	initialize: function(desc) {
		this.description = desc;
	},
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
				if(nul.xpr.bunch(xpr[comp])) {
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
 		var brwsr = this;
 		return nul.execution.benchmark.measure(this.description+' browse', function() { 
 			return brwsr.recursion(xpr);
 		});
 	},
});

/**
 * A browser that cache returns value in the expression JS object
 */
nul.browser.cached = Class.create(nul.browser, {
	initialize: function($super, desc) {
		this.name = 'browseCache' + ++nul.browser.cached.nameSpace;
		this.cachedExpressions = [];
		$super(desc);
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
		if(this.cachedExpressions)
			while(this.cachedExpressions.length)
				this.uncache(this.cachedExpressions.pop());
		
	},
	/**
	 * Called before to browse an expression
	 * @return nothing
	 */
	prepare: function(xpr) {},
	/**
	 * Recursion function over an expression
	 */
	recursion: function($super, xpr) {
		if(!xpr) return nul.browser.bijectif.unchanged;
		if(!xpr[this.name]) {
			this.prepare(xpr);
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
	 * Transform an expression without recursion.
	 * @return nul.expression or nul.browser.bijectif.unchanged
	 */
	transform: function(xpr) { throw 'abstract'; },
	recursion: function($super, xpr) {
		var evl = new nul.browser.bijectif.evolution(xpr);
		//evl.receive(this.prepare(evl.value));
		evl.receive($super(evl.value));
		return evl.changed;
 	},
	/**
	 * Transform this expression that already had bee browsed.
	 * @return Either a new object or 'null' if nothing changed
	 */
	makeRV: function(xpr, bwsd) {
		var evl = new nul.browser.bijectif.evolution(xpr);
		var mod = nul.browser.bijectif.merge(evl.value, bwsd);
		if(mod) evl.receive(mod.chew());	//Here are built modifiabled expressions
		evl.receive(this.transform(evl.value));
		return evl.changed;
	},
 	/**
 	 * Entry point of browsing
 	 */
 	browse: function($super, xpr) {
		var evl = new nul.browser.bijectif.evolution(xpr);
		evl.receive($super(evl.value));
		return evl.value;
	},
});


/**
 * Gives one other expression or the same expression - chew until the result is unchanged
 */
nul.browser.chewer = Class.create(nul.browser.bijectif, {
	//TODO0: another condition than to try to re-browse and to see if changed?
	makeRV: function($super, xpr, bwsd) {
		var rv = $super(xpr, bwsd);
		if(nul.browser.bijectif.unchanged== rv) return rv;
		var nrv = this.recursion(rv);
		return (nul.browser.bijectif.unchanged== nrv)?rv:nrv;
	},
});

//////////////// Bijectif browser statics

nul.browser.bijectif.merge = function(xpr, bwsd) {
	var mod;
	for(var c in bwsd) {
		var nwItm = bwsd[c];
		if(nul.xpr.bunch(xpr[c])) {
			nwItm[''] = nul.browser.bijectif.unchanged;
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
nul.browser.bijectif.firstChange = function(vals, b) {
	if(b) vals = [vals, b];
	for(var i in vals) if(cstmNdx(i,vals))
		if(vals[i] != nul.browser.bijectif.unchanged)
			return vals[i];
	return nul.browser.bijectif.unchanged;
};

