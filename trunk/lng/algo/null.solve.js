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
 * @version TODO O: a real resolution engine ! :)
 * @version TODO 3: BIG optimisation : solve first sons, then the root
 */
nul.solve = function(fz) {
	var onceKior3 = new nul.xpr.knowledge.ior3([nul.xpr.knowledge.always]);
		
	nul.xpr.use(fz, nul.xpr.possible);
	var cases = fz.knowledge.ior3;
	var ndx = map(cases, function() { return 0; });
	var rv = [];
	var incndx = 0;
	while(incndx < cases.length) {
		var klg = fz.knowledge.modifiable();
		try {
			var merger = [];
			for(var i=0; i<ndx.length; ++i) {
				klg.ior3[i] = onceKior3;
				merger[i] = klg.merge(cases[i].choices[ndx[i]]);
			}
			if(klg.ior3.length == ndx.length) klg.ior3 = [];	//No imported ior3 from kior3s by merges
			var slvr = new nul.solve.browser(fz.knowledge, ndx, merger);
			slvr = slvr.browse(klg.built()).modifiable().wrap(slvr.browse(fz.value));
			nul.debug.log('Resolution')('','Possibility', slvr);
			rv.push(slvr);
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

nul.solve.browser = Class.create(nul.browser.bijectif, /** @lends nul.solve.browser# */{
	/**
	 * A browser to create an expression based on a choice in all the ior3-s
	 * @constructs
	 * @extends nul.browser.bijectif
	 * @param {nul.xpr.knowledge} klg
	 * @param {Number[]} tries The indexes of the possibility to take
	 * @param {nul.browser.bijectif} merger The browser to use on the tried values
	 */
	initialize: function($super, klg, tries, merger) {
		this.klg = klg;
		this.tries = tries;
		this.merger = merger;
		$super('Resolution');
	},
	/**
	 * If xpr is an ior3, give the choosen object out of it
	 * @param {nul.expression} xpr
	 */
	transform: function(xpr) {
		if('ior3'== xpr.expression && this.klg.name == xpr.klgRef	///Xpr is a ior of this knowledge 
				&& xpr.ndx<this.tries.length)	//Xpr is a tested one, not a newly imported one
			return !this.merger[xpr.ndx]? xpr.values[this.tries[xpr.ndx]] :
					this.merger[xpr.ndx].browse(xpr.values[this.tries[xpr.ndx]]);
		return nul.browser.bijectif.unchanged;
	}
});