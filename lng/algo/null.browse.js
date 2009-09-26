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
		nul.xpr.use(xpr);
		
		var bwsd = {};
 		for(var comp in xpr.components) if(cstmNdx(comp)) {
 			comp = xpr.components[comp];
 			if(isArray(xpr[comp])) {
 				var brwsr = this;
 				bwsd[comp] = map(xpr[comp], function(i, o) { return brwsr.recursion(o); });
 			} else
 				bwsd[comp] = this.recursion(xpr[comp]);
 		}
 		return this.makeRV(xpr, bwsd);
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
		this.cachedExpressions = [];
		this.name = 'browseCache' + ++nul.browser.cached.nameSpace;
		$super();
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
 		finally {
 			while(this.cachedExpressions.length)
 				delete this.cachedExpressions.pop()[this.name];
 		}
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
		var mod, base = nul.browser.bijectif.firstChange(this.prepare(xpr), xpr);
		for(var c in bwsd) {
			var nwItm = bwsd[c];
			if(isArray(nwItm)) {
				//bwsd[c] contient des null-s et des valeurs
				if(nul.browser.bijectif.unchanged != nul.browser.bijectif.firstChange(nwItm))
					//If at least one non-null return value,
					nwItm = merge(nwItm, base[c], nul.browser.bijectif.firstChange);
				else nwItm = nul.browser.bijectif.unchanged;
			}
			if(nul.browser.bijectif.unchanged!= nwItm) {
				if(!mod) mod = base.modifiable();
				mod[c] = nwItm;
			}
		}
		mod = mod?mod.chew():xpr;
		var trn = mod?this.transform(mod):null;
		if(trn && nul.browser.bijectif.unchanged!= trn) nul.xpr.use(trn);
		return nul.browser.bijectif.firstChange(trn, mod); 
	},
 	/**
 	 * Entry point of browsing
 	 */
 	browse: function($super, xpr) {
 		return nul.browser.bijectif.firstChange($super(xpr), xpr);
	},
});

//////////////// Bijectif browser statics

nul.browser.bijectif.unchanged = 'bijectif.unchanged';
nul.browser.bijectif.firstChange = function(vals) {
	vals = beArrg(arguments);
	for(var i = 0; i<vals.length; ++i)
		if(vals[i] != nul.browser.bijectif.unchanged)
			return vals[i];
	return nul.browser.bijectif.unchanged;
};

