/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/


/* Stupid first-choice is tryed algorithm.
 * variants can be :
 *  - Take the choice that involve most other choices in dependances
 *  - 'AI' choice ?
 */ 
nul.solve = {
	/**
	 * Get an expression containing(?) IOR3s.
	 * Returns a list of expressions without IOR3s.
	 */
	solve: function(xpr, ctxName) {
		/*var rv = nul.solve.subSolve(xpr, ctxName);
		for(var i=1; i<rv.length; ++i) if(rv[i].used) {
			var ncn = nul.xpr.fuzzy.createCtxName();
			var tt = {};
			for(var n in rv[i].used)
				tt[nul.xpr.local.ndx(n, rv[i].ctxName)] =
					new nul.xpr.local(ncn, n, rv[i].locals[n]);
			rv[i] = rv[i].contextualise(tt);
			rv[i].ctxName = ncn;
		}
		return rv;
	},
	subSolve: function(xpr, ctxName) {*/
		var rv = [], tryed, cn;
		
		for(cn=0; tryed=nul.solve.tryed(xpr.clone(), cn, ctxName); ++cn) try {
			if(nul.debug.assert) assert(xpr.contains('[[]|'), 'Try if choice');
			nul.debug.log('solve')(nul.debug.lcs.collapser('Trying'),tryed);
			tryed = nul.solve.solve(tryed, ctxName);
			rv.pushs(tryed);
			nul.debug.log('solve')(nul.debug.lcs.endCollapser('Tried', 'Tried'),
				tryed);
		} catch(err) { if(nul.failure!= err) throw nul.exception.notice(err); }
		if(0< cn) return rv;
		return [xpr];
	},
	tryed: function(xpr, cn, ctxName) {
		if(xpr.browse(new nul.browse.solve(cn, ctxName))) return xpr.enter().leave(xpr);
	}
};