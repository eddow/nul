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
	solve: function(ctxd) {
		if(!ctxd.flags.fuzzy) return [ctxd];
		var rv = [], tryed;
		for(var cn=0; tryed=nul.solve.tryed(ctxd, cn); ++cn) try {
			rv = rv.concat(nul.solve.solve(tryed.evaluate()||tryed));
		} catch(err) { if(nul.failure!= err) throw err; }
		if(0== cn) return [ctxd]
		return rv;
	}.describe(function(ctxd) { return 'Solve '+ctxd.toHTML(); }),
	tryed: function(ctxd, cn) {
		return ctxd.browse({
			name: 'solve try',
			browse: true,
			cn: cn,
			before: function(ctxd) {
				if(!this.browse ||
					nul.actx.isC(ctxd,'{}')) throw nul.ctxd.noBrowse;
				if([':','[]'].contains(ctxd.charact)) {
					this.browse = false;
					if(this.cn < ctxd.components.length)
						return ctxd.components[this.cn].stpUp(clone1(ctxd.locals));
				} 
			},
			finish: function(ctxd, chgd) {
				if(chgd) return ctxd.summarised();
			}
		});
	}
};