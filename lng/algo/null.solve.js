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
 * @param fz 
 * @return array(nul.xpr.object) Objects can be fuzzy
 */
nul.solve = function(fz) {
	return [fz];	//TODO1
	fz.use();

	if('fuzzy'!= fz.type || !fz.knowledge.hesitations.length) return [fz];
	var cases = [];
	var hes = fz.knowledge.hesitations;
	for(var h in hes) if(cstmNdx(h)) {
		if(nul.debug.assert) assert(hes[h].klg == fz.knowledge,
			'ior3 reference knowledge has the hesitations');
		cases[h] = nul.solve.ior3(hes[h].choices);
	}
	
	var ndx = map(cases, function() { return 0; });
	var rv = [];
	var incndx;
	do {
		var tries = [], tried;
		var klg = fz.knowledge.modifiable();
		try {
			for(var i=0; i<ndx.length; ++i) {
				tried = cases[i][ndx[i]];
				if('fuzzy'== tried.type) {
					klg.merge(tried.knowledge);
					tried = tried.value;
				}
				tries.push(tried);
			}
			tried = new nul.browser.solve(klg, tries).browse(fz);
			if(nul.debug.assert) assert(tried, 'Solving try always modify : if not, no hesitations !');
			rv.push(tried);
		} catch(err) { nul.failed(err); }
	    //increment indexes
		for(incndx=0; incndx<cases.length; ++incndx) {
			if(++ndx[incndx] < cases[incndx].length) break;
			ndx[incndx] = 0;
		}
	} while(incndx < cases.length);
	return rv;
};

/**
 * Interface function of Solver.
 * Distribute sub-fuzzies
 * @param array(nul.xpr.object)
 * @return array(nul.xpr.object) Each element of the returned arrays contain no ior3
 */
nul.solve.ior3 = function(fzs) {
	var rv = [];
	for(var c in fzs) if(cstmNdx(c)) rv.pushs(nul.solve(fzs[c]));
	return rv;
};

nul.browser.solve = Class.create(nul.browser.bijectif, {
	initialize: function(klg, tries) {
		this.klg = klg;
		this.replace = {};
		for(var i=0; i<tries.length; ++i)
			this.replace[klg.hesitations[i]] = tries[i];
	},
	transform: function(xpr) {
		return this.replace[xpr];
	},
});