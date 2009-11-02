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
	nul.xpr.use(fz, nul.xpr.possible);
	
	var klg = map(fz.knowledge);
	var val = fz.value;
	klg.ior3 = map(klg.ior3);
	//TODO O: a real resolution engine : choose the most optimal ior3 to develop first, the one that'll fail the most and reduce cases to look
	var choices = map(klg.ior3.pop().choices);
	var rv = [];
	while(choices.length) {
		var tklg = klg.modifiable();
		try { 
			var tval = tklg.merge(choices.shift(), val);
			tval = tklg.wrap(tval);
			nul.debug.log('Resolution')('','Possibility', tval);
			rv.pushs(tval.distribute());
		} catch(err) { nul.failed(err); }
	}
	return rv;
}.describe('Resolution', function() {
	return map(beArrg(arguments), function() { return this.dbgHtml(); }).join(' &#9633; ');
});
