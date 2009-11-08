/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**
 * Interface function of Solver.
 * Gets a distributed list of knowledges that don't contains ior3 anymore
 * @param {nul.xpr.knowledge} klg
 * @return array(nul.xpr.knowledge)
 */
nul.solve = function() {
	this.modify()
	if(!this.ior3.length) return [this];
	var jgmnt = map(this.eqCls);
	var jgEC = map(this.eqCls);
	jgmnt.pushs(this.veto);
	for(var v=0; this.veto[v]; ++v) jgEC.pushs(this.veto[v].eqCls);
	var jdps = new nul.dependance();
	for(var j=0; jgmnt[j]; ++j) jdps.also(jgmnt[j].dependance());
	
	var better = {enth:0};
	for(var i=0; this.ior3[i]; ++i) for(var j=0; this.ior3[i].choices[j]; ++j) {
		var thisEnth = nul.solve.information(jdps, jgmnt, jgEC, this.ior3[i].choices[j], this);
		if(thisEnth > better.enth) better = { cases: i, choice: j, enth: thisEnth };
	}
	if(!better.enth) return [this];	//No way to bring infos by distributing ... TODO O: modify 'distribuable' ?

	var rv = [];

	try {
		var choosen = this.clone();		//The case when the choice is taken
		choosen.ior3.splice(better.cases, 1);
		choosen.merge(this.ior3[better.cases].choices[better.choice]);
		rv.pushs(nul.solve.apply(choosen));
	} catch(e) { nul.failed(e); }
	if(nul.debug.assert) assert(2<= this.ior3[better.cases].choices.length, 'Choice length always at least 2')
	try {
		if(2== this.ior3[better.cases].choices.length) {
			this.merge(this.ior3[better.cases].choices[1-better.choice]);
			this.ior3.splice(better.cases, 1);
		} else {
			var nior3 = this.ior3[better.cases].modifiable();
			nior3.choices.splice(better.choice, 1);
			this.ior3[better.cases] = nior3.built();
		}
		rv.pushs(nul.solve.apply(this));
	} catch(e) { nul.failed(e); }
	return rv;
}.describe('Resolution', function() {
	return this.dbgHtml();
});

/**
 * @param {nul.xpr.knowledge[]} chxs
 */
nul.solve.ior3 = function(chxs) {
	return chxs.mar(chxs[0].distributed);
};

/**
 * Find out how much information is brought to the components of jgmnt by a choice made in ior3
 * @param {nul.dependance} dps Dependance of jgmnt
 * @param {nul.expression[]} jgmnt List of expression for which information can be brought
 * @param {nul.klg.eqClass[]} jgEc List of eqClass appearing in the jugment
 * @param {nul.xpr.knowledge} choice A choice to make
 * @param {nul.xpr.knowledge} klg The knowledge the choice is made in
 */
nul.solve.information = function(dps, jgmnt, jgEC, choice, klg) {
	nul.klg.mod(klg); nul.klg.use(choice);
	nul.xpr.are(jgmnt);
	var jUsage = dps.usage(klg);
	var cUsage = choice.dependance().usage(klg);
	var aClsns = 0;
//1- local enthropy : more locals are shared, more enthropy is shared
	if(!isEmpty(choice.dependance().usage(klg).local)) ++aClsns;	//TODO 4: other than 0 or 1 if dependances
//2- common values attributions
	//TOTEST
	var acs = choice.summarised.access || {};
	for(var ec=0; jgEC[ec]; ++ec) {
		var attr = map(jgEC[ec].attribs, function() { return [this]; });
		for(var eq=0; jgEC[ec].equivls[eq]; ++eq) {
			var cEC = acs[jgEC[ec].equivls[eq]];
			if(cEC) {
				for(var a in cEC.attribs) {
					if(!attr[a]) {
						attr[a] = [];
						--aClsns;	//?
					}
					if(!attr[a].include(cEC.attribs[a])) {
						attr[a].push(cEC.attribs[a]);
						++aClsns;
					}
				}
			}
		}
	}
	return aClsns;
};