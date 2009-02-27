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
		if(!xpr.flags.fuzzy) return [xpr];
		var rv = [], tryed;
		for(var cn=0; tryed=nul.solve.tryed(xpr, cn); ++cn) try {
			rv = rv.concat(nul.solve.solve(tryed.evaluate()||tryed));
		} catch(err) { nul.exception.notice(err); if(nul.failure!= err) throw err; }
		assert(0!= cn, 'Solutions');
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