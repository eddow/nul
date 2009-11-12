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
	this.modify();
	var toDistr = [this];
	var rv = [];
	
	while(toDistr.length) {
		var tdst = toDistr.shift().simplify();
		if(!tdst.ior3.length) rv.push(tdst);
		else if(1== tdst.ior3.length) {	//if only one ior3s
			var c;
			for(var c=0; tdst.ior3[0].choices[c+1]; ++c) {
				var tried = tdst.clone();
				tried.ior3 = [];
				try {
					tried.merge(tdst.ior3[0].choices[c]);
					toDistr.push(tried);
				} catch(e) { nul.failed(e); }
			}
			var rmnng = tdst.ior3[0].choices[c];
			tdst.ior3 = [];
			try {
				tdst.merge(rmnng);
				toDistr.push(tdst);
			} catch(e) { nul.failed(e); }
		} else {	//if some ior3s
			var jgmnt = map(tdst.eqCls);
			var jgEC = map(tdst.eqCls);
			jgmnt.pushs(tdst.veto);
			for(var v=0; tdst.veto[v]; ++v) jgEC.pushs(tdst.veto[v].eqCls);
			var jdps = new nul.dependance();
			for(var j=0; jgmnt[j]; ++j) jdps.also(jgmnt[j].dependance());
			
			var better = {enth:0};
			for(var i=0; tdst.ior3[i]; ++i) for(var j=0; tdst.ior3[i].choices[j]; ++j) {
				var thisEnth = nul.solve.information(jdps, jgmnt, jgEC, tdst.ior3[i].choices[j], tdst);
				if(thisEnth > better.enth) better = { cases: i, choice: j, enth: thisEnth };
			}
			if(!better.enth) rv.push(tdst);	//No way to bring infos by distributing ... TODO O: modify 'distribuable' ?
			else {	//if some information can be brouhht
		
				nul.debug.log('Resolution')('','Possibility', tdst.ior3[better.cases].choices[better.choice]);
			
				try {
					var choosen = tdst.clone();		//The case when the choice is taken
					choosen.ior3.splice(better.cases, 1);
					choosen.merge(tdst.ior3[better.cases].choices[better.choice]);
					toDistr.push(choosen);
				} catch(e) { nul.failed(e); }
				if(nul.debug.assert) assert(2<= tdst.ior3[better.cases].choices.length, 'Choice length always at least 2');
				try {
					if(2== tdst.ior3[better.cases].choices.length) {
						tdst.merge(tdst.ior3[better.cases].choices[1-better.choice]);
						tdst.ior3.splice(better.cases, 1);
					} else {
						var nior3 = tdst.ior3[better.cases].modifiable();
						nior3.choices.splice(better.choice, 1);
						tdst.ior3[better.cases] = nior3.built();
					}
					toDistr.push(tdst);
				} catch(e) { nul.failed(e); }
			}
		}
	}
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
	//TODO O: Trial - real study should be made
	nul.klg.mod(klg); nul.klg.use(choice);
	nul.xpr.are(jgmnt);
	var jUsage = dps.usage(klg);
	var cUsage = choice.dependance().usage(klg);
//1- local enthropy : more locals are shared, more enthropy is shared
	var lclSharePoints = 0;
	if(!isEmpty(choice.dependance().usage(klg).local)) ++lclSharePoints;	//TODO 4: other than 0 or 1 if dependances
//2- equivalence class merging 
	var merger = [];
	var mergePoints = 0;
	for(var ec=0; choice.eqCls[ec]; ++ec) {
		merger.push([]);
		for(var eq=0; choice.eqCls[ec].equivls[eq]; ++eq) {
			var klga = klg.access[choice.eqCls[ec].equivls[eq]];
			if(klga) merger[ec].push(klga);
		}
		mergePoints += Math.pow(2, merger[ec].length);
	}
//3- attributes collision	
	var aClsnsPoints = 0;	
	//TOTEST
	var acs = choice.summarised.access || {};
	for(var ec=0; jgEC[ec]; ++ec) {
		var attr = map(jgEC[ec].attribs, function() { return [this]; });
		for(var eq=0; jgEC[ec].equivls[eq]; ++eq) {
			var cEC = acs[jgEC[ec].equivls[eq]];
			if(cEC) {
				var n = choice.eqCls.indexOf(cEC);
				var agrp = [cEC.attribs];
				for(var mec=0; merger[n][mec]; ++mec) agrp.push(merger[n][mec].attribs);
				for(var ag=0; agrp[ag]; ++ag) for(var a in agrp[ag]) {
					if(!attr[a]) {
						attr[a] = [];
						--aClsnsPoints;	//?
					}
					if(!attr[a].include(cEC.attribs[a])) {
						attr[a].push(cEC.attribs[a]);
						++aClsnsPoints;
					}
				}
			}
		}
	}
	return lclSharePoints+aClsnsPoints+mergePoints;
};