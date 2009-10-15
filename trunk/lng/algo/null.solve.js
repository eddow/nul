/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**
 * TODO0: a real resolution engine ! :)
 * Interface function of Solver.
 * Gets a distributed list of fuzzies that don't contains ior3 anymore
 * @param {nul.xpr.possible} fz
 * @return array(nul.xpr.possible)
 */
nul.solve = function(fz) {
	nul.xpr.is(fz, nul.xpr.possible);
	var cases = fz.knowledge.ior3;
	var ndx = map(cases, function() { return 0; });
	var rv = [];
	var incndx = 0;
	while(incndx < cases.length) {
		var klg = nul.xpr.knowledge.always;
		try {
			var merger = [];
			for(var i=0; i<ndx.length; ++i) {
				if(nul.xpr.knowledge.always== klg) {
					klg = fz.knowledge.modifiable();
					klg.ior3 = [];
				}
				if(cases[i].choices[ndx[i]]) merger[i] = klg.merge(cases[i].choices[ndx[i]]);
			}
			rv.push((new nul.solve.browser(fz.knowledge, ndx, merger))
				.browse(klg.wrap(fz.value)));
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
	initialize: function($super, klg, tries, merger) {
		this.klg = klg;
		this.tries = tries;
		this.merger = merger;
		$super('Resolution');
	},
	transform: function(xpr) {
		if('ior3'== xpr.expression && this.klg.name == xpr.klgRef)
			return !this.merger[xpr.ndx]? xpr.values[this.tries[xpr.ndx]] :
					this.merger[xpr.ndx].browse(xpr.values[this.tries[xpr.ndx]]);
		return nul.browser.bijectif.unchanged;
	}
});