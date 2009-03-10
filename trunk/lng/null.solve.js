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
		if(nul.debug.assert) assert('{}'== xpr.charact, 'We dont solve additions...');
		var rv = {solved:[], fuzzy:[]}, tryed, cn;
		if(!xpr.components) return rv;
		for(cn=0; tryed=nul.solve.tryed(xpr.clone(), cn); ++cn) try {
			if(nul.debug.assert) assert(-1<xpr.ndx.indexOf('[[]|'), 'Try if choice')
			nul.debug.log('solve')(nul.debug.lcs.collapser('Trying'),tryed);
			tryed = nul.solve.solve(tryed.evaluate()||tryed);
			rv.solved.pushs(tryed.solved);
			rv.fuzzy.pushs(tryed.fuzzy);
			nul.debug.log('solve')(nul.debug.lcs.endCollapser('Tried', 'Tried'),
				['solved: ',tryed.solved, ' fuzzies: ', tryed.fuzzy]);
		} catch(err) { if(nul.failure!= err) throw nul.exception.notice(err); }
		if(0== cn) {
			if(xpr.components.value.deps[xpr.ctxName] || xpr.components.length)
				rv.fuzzy.push(xpr);
			else rv.solved.push(xpr.components.value);
		}
		return rv;
	},
	tryed: function(xpr, cn) {
		return xpr.browse({
			clone: 'itm',
			name: 'solve try',
			browse: true,
			cn: cn,
			before: function(xpr) {
				if(!this.browse || ('{}'==xpr.charact && this.kb))
					throw nul.browse.abort;
				if('{}'==xpr.charact) {
					this.kb = nul.kb();
					return xpr.makeFrdm(this.kb);
				}
				if(xpr.possibility) {
					this.browse = false;
					nul.debug.log('solve')('Choose',[cn, 'out of', xpr]);
					var rv = xpr.possibility(this.cn, this.kb);
					if(rv) return rv;
					this.cn = 'end';
				} 
			},
			finish: function(xpr, chgd, orig) {
				if('{}'== orig.charact) {
					this.kb.pop('ctx');
					delete this.kb;
				}
				if(!this.browse && 'end'!= this.cn) return xpr.dirty();
			},
			abort: function(xpr, err, orig) {
				if(nul.browse.abort== err) return xpr.summarised().dirty();
			}
		});
	}
};