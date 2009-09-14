/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**
 * Interface function of Solver.
 * Gets a distributed list of fuzzies that don't contains ior3 anymore
 * @param fz nul.obj.fuzzy
 * @return array(nul.obj) Objects can be fuzzy
 */
nul.solve = function(fz) {
	if('fuzzy'!= fz.type || !fz.knowledge.hesitations.length) return [fz];
	var cases = [];
	var hes = fz.knowledge.hesitations;
	for(var h in hes) if(cstmNdx(h)) {
		if(nul.debug.assert) assert(hes[h].cklg == fz.knowledge,
			'ior3 reference knowledge has the hesitations');
		cases[h] = nul.solve.ior3(hes[h].choices);
	}
	
	var ndx = map(cases, function() { return 0; });
	var rv = [];
	var incndx;
	do {
		var tries = [], tried;
		var klg = fz.knowledge.modifiable();	//TODO1: eqCls clone1 ?
		try {
			for(var i=0; i<ndx.length; ++i) {
				tried = cases[i][ndx[i]];
				if('fuzzy'== tried.type) {
					klg.merge(tried.knowledge);
					tried = tried.value;
				}
				tries.push(tried);
			}
			tried = new nul.browser.solve(klg, tries);
			if(nul.debug.assert) assert(tried, 'Solving try always modify : if not, no hesitations !');
			rv.push(tried);
		} catch(err) { nul.failed(err); }
	    //increment indexes
		for(incndx=0; incndx<kys.length; ++incndx) {
			if(++ndx[incndx] < cases[incndx].length) break;
			ndx[incndx] = 0;
		}
	} while(incndx < kys.length);
	
};

/**
 * Interface function of Solver.
 * Distribute sub-fuzzies
 * @param array(nul.obj)
 * @return array(nul.obj) Each element of the returned arrays contain no ior3
 */
nul.solve.ior3 = function(fzs) {
	var rv = [];
	for(var c in fzs) if(cstmNdx(c)) rv.pushs(nul.solve(fzs[c]));
	return rv;
};