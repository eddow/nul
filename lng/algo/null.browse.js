/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.browser = Class.create(/** @lends nul.browser# */{
	/**
	 * Generic expression browsing
	 * @constructs
	 * @param {String} desc Text description (used mainly for benchmarking)
	 */
	initialize: function(desc) {
		this.description = desc;
	},

	/**
	 * Called when the sub-browsing of the expression failed.
	 * @param {nul.expression} xpr
	 * @return {nul.expression | null} Some value if the failure should be overriden by a value returned 
	 */
	abort: function(xpr) { if(xpr.failure) return xpr.failure; },
	/**
	 * Called before to browse an expression
	 * @return {boolean} Weither to browse sub-expressions or not
	 */
	enter: function(xpr) { return xpr; },
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
			var sbx = this.enter(xpr);
			if(sbx) for(var comp in sbx.components)
				if(sbx.components[comp].bunch) {
					var brwsr = this;
					bwsd[comp] = map(sbx[comp], function(i, o) { return brwsr.recursion(o); });
				} else
					bwsd[comp] = this.recursion(sbx[comp], comp);
			return this.makeRV(xpr, bwsd);
		} catch(err) {
			nul.failed(err);
			xpr = this.abort(xpr);
			if(xpr) return xpr;
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
 	}
});

nul.browser.cached = Class.create(nul.browser, /** @lends nul.browser.cached# */{
	/**
	 * A browser that cache returns value in the expression JS object
	 * @constructs
	 * @extends nul.browser
	 * @param {String} desc Text description (used mainly for benchmarking)
	 */
	initialize: function($super, desc) {
		this.name = 'browseCache' + nul.execution.name.gen('browser.cached');
		this.cachedExpressions = [];
		$super(desc);
	},
	
	/**
	 * Determine weither to use cache for an expression.
	 */
	cachable: function(xpr) { return true; },
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
	 * Recursion function over an expression
	 */
	recursion: function($super, xpr) {
		if(!xpr) return nul.browser.bijectif.unchanged;
		if(!this.cachable(xpr)) return $super(xpr);
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
 	}
});

/**
 * @class A browser that gives one other expression or the same expression
 * @extends nul.browser.cached
 */
nul.browser.bijectif = Class.create(nul.browser.cached, /** @lends nul.browser.bijectif# */{
	/**
	 * Transform an expression without recursion.
	 * @return nul.expression or nul.browser.bijectif.unchanged
	 */
	transform: function(xpr) { throw 'abstract'; },
	recursion: function($super, xpr) {
		var evl = new nul.browser.bijectif.evolution(xpr);
		evl.receive($super(evl.value));
		return evl.changed;
 	},
 	/**
 	 * Called when an expression was modified
 	 * SHOULD return an expression (no 'unchanged')
 	 */
 	build: function(xpr) { return xpr.chew(); },
 	/**
 	 * Determine weither this expression should be modifialbe() and chew() even if elements didn't change
 	 * @param {nul.xpr.expression} xpr
 	 * @return {Boolean}
 	 */
 	forceBuild: function(xpr) { return false; },
 	/**
 	 * Called when an expression was not modified
 	 * @param {nul.xpr.expression} xpr
 	 * @return {nul.xpr.expression|nul.browser.bijectif.unchanged}
 	 */
 	leave: function(xpr) { return nul.browser.bijectif.unchanged; },
	/**
	 * Transform this expression that already had bee browsed.
	 * @return Either a new object or 'null' if nothing changed
	 */
	makeRV: function(xpr, bwsd) {
		var evl = new nul.browser.bijectif.evolution(xpr);
		var mod = nul.browser.bijectif.merge(evl.value, bwsd);
		if(!mod && this.forceBuild(evl.value)) mod = evl.value.modifiable();
		if(mod) evl.receive(this.build(mod));	//Here are built modifiabled expressions
		else evl.receive(this.leave(evl.value));
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
	}
});

//////////////// Bijectif browser statics

/**
 * Helper to merge an expression and browsing results
 * @function
 * @param {nul.expression} xpr The expression to merge
 * @param {Association(nul.expression)} bwsd The browsed components results
 */
nul.browser.bijectif.merge = function(xpr, bwsd) {
	var mod;
	for(var c in bwsd) {
		var nwItm = bwsd[c];
		if(xpr.components[c].bunch) {
			//bwsd[c] contient des null-s et des valeurs
			if(nul.browser.bijectif.unchanged != nul.browser.bijectif.firstChange(nwItm)) {
				//If at least one non-null return value,
				nwItm = merge(nwItm, xpr[c], nul.browser.bijectif.firstChange);
			} else nwItm = nul.browser.bijectif.unchanged;
		}
		if(nul.browser.bijectif.unchanged!= nwItm) {
			if(!mod) mod = xpr.modifiable();
			mod[c] = nwItm;
		}
	}
	return mod;
};

/**
 * Value meaning the browse returned the same expression
 * @constant
 */
nul.browser.bijectif.unchanged = 'Just the same';

nul.browser.bijectif.evolution = Class.create( /** @lends nul.browser.bijectif.evolution# */{
	/**
	 * @class An evolution object, where an expression is changed step by step
	 * @constructs
	 * @param {nul.expression} xpr The first step of the evolution
	 */
	initialize: function(xpr) {
		/**
		 * The value as an expression
		 * @type nul.expression
		 */
		this.value = xpr;
		/**
		 * The value as a changement
		 * @type nul.expression|nul.browser.bijectif.unchanged
		 */
		this.changed = nul.browser.bijectif.unchanged;
		/**
		 * Weither the value changed
		 * @type Boolean
		 */
		this.hasChanged = false;
	},
	/**
	 * Describe the next step of this evolution
	 * @param {nul.expression} xpr The next value this evolution steps through
	 */
	receive: function(xpr) {
		if(nul.browser.bijectif.unchanged== xpr) return;
		this.hasChanged = true;
		this.changed = this.value = xpr;
		if(xpr) nul.xpr.use(xpr);
	}
});
nul.browser.bijectif.firstChange = function(vals, b) {
	if(b) vals = [vals, b];
	for(var i in ownNdx(vals))
		if(vals[i] != nul.browser.bijectif.unchanged)
			return vals[i];
	return nul.browser.bijectif.unchanged;
};

