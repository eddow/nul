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
		if(','== xpr.charact) return {
			solved:xpr.components,
			fuzzy:xpr.components.follow?[xpr.components.follow]:[]
		};
		var rv = {solved:[], fuzzy:[]}, tryed, cn;
		for(cn=0; tryed=nul.solve.tryed(xpr, cn); ++cn) try {
			tryed = nul.solve.solve(tryed.evaluate()||tryed);
			rv.solved.pushs(tryed.solved);
			rv.fuzzy.pushs(tryed.fuzzy);
		} catch(err) { if(nul.failure!= err) throw nul.exception.notice(err); }
		if(0== cn) rv.fuzzy.push(xpr);
		return rv;
	},
	tryed: function(xpr, cn) {
		return xpr.browse({
			clone: 'itm',
			name: 'solve try',
			browse: true,
			cn: cn,
			enter: 0,
			before: function(xpr) {
				if(!this.browse || ('{}'==xpr.charact && 0<(this.enter++)))
					throw nul.browse.abort;
				if(xpr.possibility) {
					this.browse = false;
					return xpr.possibility(this.cn);
				} 
			},
			finish: function(xpr, chgd) {
				if(chgd) return xpr.summarised().dirty();
			}
		});
	}
};