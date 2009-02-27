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
	solve: function(xpr) {
		if(!xpr.flags.fuzzy) return {solved:[xpr], fuzzy:[]};
		var rv = {solved:[], fuzzy:[]}, tryed, cn;
		for(cn=0; tryed=nul.solve.tryed(xpr.clone(), cn); ++cn) try {
			var ss = nul.solve.solve(tryed.evaluate()||tryed);
			rv.solved = rv.solved.concat(ss.solved);
			rv.fuzzy = rv.fuzzy.concat(ss.fuzzy);
		} catch(err) { if(nul.failure!= err) throw nul.exception.notice(err); }
		if(0== cn) rv.fuzzy.push(xpr);
		return rv;
	}.describe(function(xpr) { return 'Solve '+xpr.toHTML(); }),
	tryed: function(xpr, cn) {
		return xpr.browse({
			name: 'solve try',
			browse: true,
			cn: cn,
			before: function(xpr) {
				if(!this.browse ||
					'{}'==xpr.charact) throw nul.browse.abort;
				if([':','[]'].contains(xpr.charact)) {
					this.browse = false;
					if(this.cn < xpr.components.length)
						return xpr.components[this.cn].stpUp(clone1(xpr.locals));
				} 
			},
			finish: function(xpr, chgd) {
				if(chgd) return xpr.summarised();
			}
		});
	}
};