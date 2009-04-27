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
	solve: function(xpr) {
		var rv = [], tryed, cn;
		
		for(cn=0; tryed=nul.solve.tryed(xpr.clone(), cn); ++cn) try {
			if(nul.debug.assert) assert(xpr.contains('[[]|'), 'Try if choice');
			if(tryed.arCtxName) delete tryed.arCtxName;
			nul.debug.log('solve')(nul.debug.lcs.collapser('Trying'),tryed);
			tryed = nul.solve.solve(tryed);
			rv.pushs(tryed);
			nul.debug.log('solve')(nul.debug.lcs.endCollapser('Tried', 'Tried'),
				tryed);
		} catch(err) { if(nul.failure!= err) throw nul.exception.notice(err); }
		if(0< cn) return rv;
		return [xpr];
	},
	tryed: function(xpr, cn) {
		var rv, klg = xpr.enter();
		try {
			rv = xpr.browse({
				clone: 'itm',
				name: 'solve try',
				browse: true,
				cn: cn,
				klg: klg,
				before: function(xpr) {
					if(!this.browse /*|| ('{}'==xpr.charact && this.klg)*/)
						throw nul.browse.abort;
					if(xpr.possibility) {
						this.browse = false;
						nul.debug.log('solve')('Choose',[cn, 'out of', xpr]);
						var rv = xpr.possibility(this.cn, this.klg);
						if(rv) return rv;
						this.cn = 'end';
					} 
				},
				finish: function(xpr, chgd, orig) {
					if(!this.browse && 'end'!= this.cn)
						return xpr;
				},
			});
		} finally {
			rv = klg.leave(rv);
		}
		return rv;
	}
};