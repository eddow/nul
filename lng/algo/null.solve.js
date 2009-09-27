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
 * @param {nul.xpr.possible} fz
 * @return array(nul.xpr.possible)
 */
nul.solve = function(fz) {
	nul.xpr.is(fz, nul.xpr.possible);

	if(!fz.knowledge.ior3.length) return [fz];
	
	var cases = fz.knowledge.ior3;
	var ndx = map(cases, function() { return 0; });
	var rv = [];
	var incndx = 0;
	while(incndx < cases.length) {
		var klg = null;
		try {
			for(var i=0; i<ndx.length; ++i) {
				if(!klg) {
					klg = fz.knowledge.modifiable();
					klg.ior3 = [];
				}
				if(cases[i].choices[ndx[i]]) klg.merge(cases[i].choices[ndx[i]]);
			}
			rv.push((new nul.solve.browser(fz.knowledge, ndx))
				.browse(
					!klg?fz:
					(new nul.xpr.possible(fz.value, klg.built())).built()
				));
		} catch(err) { nul.failed(err); }
	    //increment indexes
		for(incndx=0; incndx<cases.length; ++incndx) {
			if(++ndx[incndx] < cases[incndx].choices.length) break;
			ndx[incndx] = 0;
		}
	}
	return rv;
}.describe('Resolution', function() {
	return map(beArrg(arguments), function() { return this.dbgHtml(); }).join(' &#9633; ');
});

/**
 * Interface function of Solver.
 * Distribute sub-fuzzies
 * @param {array(nul.xpr.possible)} fzs
 * @return array(nul.xpr.possible) Each element of the returned arrays contain no ior3
 */
nul.solve.ior3 = function(fzs) {
	var rv = [];
	for(var c in fzs) if(cstmNdx(c)) rv.pushs(nul.solve(fzs[c]));
	return rv;
};

nul.solve.browser = Class.create(nul.browser.bijectif, {
	initialize: function($super, klg, tries) {
		this.klg = klg;
		this.tries = tries;
		$super();
	},
	transform: function(xpr) {
		if('ior3'== xpr.type && this.klg.name == xpr.klgRef)
			return xpr.values[this.tries[xpr.ndx]];
		return nul.browser.bijectif.unchanged;
	},
});