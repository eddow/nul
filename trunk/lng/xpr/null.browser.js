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
		var bwsd = {};
		var ppd = this.prepare(xpr);
		var tob = ppd || xpr;
 		for(comp in tob.components) {
 			comp = tob.components[comp];
 			//TODO1: comp may be array
 			bwsd[comp] = this.browse(xpr[comp]);
 		}
 		return this.makeRV(xpr, bwsd, ppd);
 	}
});

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
		var mod = null;
		for(c in bwsd) if(bwsd[c]) {
			if(!mod) mod = clone1(ppd || xpr);
			mod[c] = bwsd[c];
		}
		var trn = this.transform(mod || ppd || xpr);
		return trn || mod || ppd; 
	}
});

nul.browser.stepUp = Class.create(nul.browser.bijectif, {
	initialise: function(srcKlgName, dstKlgName, deltaLclNdx) {
		this.srcKlgName = srcKlgName;
		this.dstKlgName = dstKlgName;
		this.deltaLclNdx = deltaLclNdx;
	},
	transform: function(xpr) {
		if('local'== xpr.type && this.srcKlgName== xpr.klgName)
			return new nul.obj.local(dstKlgName, 
				'number'== typeof xpr.lclNdx ?
					xpr.lclNdx+this.deltaLclNdx :
					xpr.lclNdx,
				xpr.dbgName)
	},
});