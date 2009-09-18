/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.browser = Class.create({
	/**
	 * Called before sub-element browsing
	 * @param xpr The expression that is going to be browsed
	 * @return Either nothing either a replacement expression to browse
	 */
	prepare: function(xpr) {},
	/**
	 * Called after sub-element browsing
	 * @param ppd The prepared expression
	 * @param bwsd An assocation of the components browsed mapping the result of the browsing
	 * @param xpr The xpr given to this function
	 * @return Whatever this browse function should return
	 */
	makeRV: function(xpr, bwsd, ppd) {},
	browse: function(xpr) {
		if(!xpr) return;
		nul.xpr.use(xpr);
		
		var bwsd = {};
		var ppd = this.prepare(xpr);
		var tob = ppd || xpr;
		if(nul.debug.assert) assert(tob.expression, 'Only expressions are browsed');
 		for(var comp in tob.components) if(cstmNdx(comp)) {
 			comp = tob.components[comp];
 			if(isArray(xpr[comp])) {
 				var brwsr = this;
 				bwsd[comp] = map(xpr[comp], function() { return brwsr.browse(this); });
 			} else
 				bwsd[comp] = this.browse(xpr[comp]);
 		}
 		return this.makeRV(xpr, bwsd, ppd);
 	}
});

/**
 * Gives one other expression (or null if just the same)
 */
nul.browser.bijectif = Class.create(nul.browser, {
	/**
	 * Transform this expression that already had bee browsed.
	 * @return Either a new object or 'null' if nothing changed
	 */
	transform: function(xpr) {},
	makeRV: function(xpr, bwsd, ppd) {
		//xpr -(preparation)> ppd -(browse)> mod -(transform)> trn
		//ppd iif preparation modification
		//mod iif browse modification
		//trn iif transform modification
		var mod, base = ppd || xpr;
		for(var c in bwsd) {
			var nwItm = bwsd[c];
			if(isArray(nwItm)) {
				//bwsd[c] contient des null-s et des valeurs
				if(trys(nwItm, function(ndx, obj) { return !!obj; }))
					//If at least one non-null return value,
					nwItm = merge(nwItm, base[c], function(a, b) { return a||b; });
				else nwItm = null;
			}
			if(nwItm) {
				if(!mod) mod = base.modifiable();
				mod[c] = nwItm;
			}
		}
		if(mod) mod = mod.built();
		var trn = this.transform(mod || ppd || xpr);
		return trn || mod || ppd; 
	}
});

