/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**
 * A list of conditions and fuzziness reduction.
 */
nul.xpr.knowledge = Class.create(nul.expression, {
	initialize: function(klgName) {
 		//Create new objects each time
        this.locals = this.emptyLocals();
        this.veto = [];
 		this.eqCls = [];		//Array of equivalence classes.
 		this.access = {};		//Access from an obj.ndx to an eq class it's in.
 		this.ior3 = [];	//List of unchoosed IOR3
 		this.name = klgName || ++nul.xpr.knowledge.nameSpace;
 		//this.mult = 1;	//TODO0: 'mult' optimisation
 	},

//////////////// privates

	/**
	 * Modify eqCls and set accesses
	 */
 	accede: function(ec, ecNdx) {
		this.modify(); nul.xpr.use(ec, nul.xpr.knowledge.eqClass);

		if('undefined'== typeof ecNdx) ecNdx = this.eqCls.length;
		if(ec) ec = ec.placed(this);
		if(ec) {
			for(var n in this.access) if(this.access[n] == ecNdx) delete this.access[n];
	 		this.eqCls[ecNdx] = ec;
			var eqs = this.eqCls[ecNdx].equivls;
			for(var unfd in eqs) if(cstmNdx(unfd))
				this.access[eqs[unfd]] = ecNdx;
		}
		else this.unaccede(ecNdx);
		return ec;
 	},
 	
	/**
	 * The eqCls of index 'ndx' has been removed : change access
	 */
	unaccede: function(ecNdx) {
		try { return this.eqCls[ecNdx]; }
		finally {
			this.eqCls.splice(ecNdx, 1);
			for(var i in this.access)
				if(this.access[i] > ecNdx) --this.access[i];
				else if(this.access[i] == ecNdx) delete this.access[i];
		}
	},
 	
 	/**
 	 * Begin modification of an equivalence class
 	 * @param {nul.obj} obj Object whose information is brought
 	 * @return equivalence class to re-add to the knowledge
 	 */
	inform: function(obj) {
		this.modify();
		
		var ndx = this.access[obj];
		if('number'== typeof ndx) return this.unaccede(ndx).modifiable();
 		return new nul.xpr.knowledge.eqClass(obj);
	},
 	
 	/**
 	 * Add the given equivalence classes in this knowledge
 	 * @param {array(nul.xpr.knowledge.eqClass)} eqCls
 	 * @throws nul.failure
 	 */
 	addEqCls: function(eqCls) {
 		nul.xpr.use(eqCls, nul.xpr.knowledge.eqCls);
 		for(var ec in eqCls) if(cstmNdx(ec) && eqCls[ec]) this.unify(eqCls[ec]);
 	},
 	
 	/**
 	 * Remove any information about locals or ior3s that are not refered anymore
 	 * @param {nul.dependance.usage} deps
 	 * remove all access before : these are not preserved
 	 */
 	pruned: function(value) {
 		this.modify();
 		var i;
 		var vdps = new nul.dependance();
		
		vdps.also(value.dependance());
		for(var i in this.ior3) if(cstmNdx(i) && this.ior3[i]) vdps.also(this.ior3[i].dependance());
		vdps = this.localNeed(vdps.usage(this).local);

		//Remove useless equivalence class specifications
		for(var c=0; c<this.eqCls.length;) {
			this.eqCls[c] = this.eqCls[c].pruned(this, vdps);
			if(!this.eqCls[c]) this.eqCls.splice(c,1);
			else ++c;
		} 
 		
 		var deps = this.usage(value);
 		/*TODO0: 'mult' optimisation
		//Remove unrefered ior3 tautologies, affect the 'mult' property 
 		for(i=0; i<this.ior3.length; ++i) if(!deps.ior3[i]) {
 			var nior3 = this.ior3[i].modifiable();
 			if(nior3.unrefer()) this.ior3[i] = nior3.built().placed(this);
 		}
 		
 		//Remove trailing empty ior3s (not more to preserve indexes)
 		while(this.ior3.length && !this.ior3[this.ior3.length-1]) this.ior3.pop();
 		*/
 		this.useIor3Choices(deps.ior3);
 		
 		//Remove trailing unrefered locals (not more to preserve indexes)
		while(this.nbrLocals() && !deps.local[this.nbrLocals()-1]) this.freeLastLocal();
 		this.useLocalNames(deps.local);
 		return this;
 	}.describe('Prune', function(value) {
		return this.name+': ' + value.dbgHtml() + ' ; ' + this.dbgHtml();
	}),
 	
 	/**
 	 * Gets the dependance of an hypothetic possible while this knowledge is not summarised.
 	 */
 	usage: function(value) {
 		//TODO0: use summary if possible.
		var rv = new nul.dependance();
		var comps = value?[value]:[];
		comps.pushs(this.eqCls, this.ior3);
		for(var c=0; c<comps.length; ++c)
			rv.also(comps[c].dependance());
		return rv.use(this);
	},

	/**
	 * Make the need envelope of locals.
	 * If at least 'lcls' are needed to determine a value, then determine which locals are needed
	 * to determine a value, for this knowledge, regarding the equivalence classes
	 * @param {association(ndx: any)} lcls List of needed locals at least
	 * @return {association(ndx: true)} lcls List of needed locals
	 */
	localNeed: function(lcls) {
		lcls = map(lcls,function() { return 3; });
		var toNeed = keys(lcls);
		///1: calculate influences
		var max = function(a,b) { return !a?b:!b?a:a>b?a:b; };
		/**
		 * Change the list of local needs and determine which local is discovered needed
		 * knowing that local 'ndx' is needed 'infl' (infl = 1(belong) or 2(equival))
		 * @param {index} ndx Local index
		 * @param {association(ndx:influence)} infl Influence = 1: something belongs to this local. 2: Something is equived to this local
		 * @param {association(ndx:need)} lcls how locals are already known to be needed
		 * @return {array[index]} Locals freshly disvorered to be needed
		 */
		var influence = function(infl, lcls) {
/*(infl[ndx] \ lcls[ndx] :	('>' means 'more than 2')
 * 			0	1	2	>
 * 		1	1	1	>	>
 * 		2	2	>	>	>
 */
 			var rv = [];
 			for(var ndx in infl)
				if( (1!= lcls[ndx] || 1!= infl[ndx]) &&	
					(!lcls[ndx] || 2>= lcls[ndx]) &&
					(2< (lcls[ndx] = (lcls[ndx]||0)+infl[ndx])) )
						rv.push(ndx);
			return rv;
		};
		//TODO1: need opposition
		var lclInfl = {};	//nx => {ndx: [0, 1, 2]}
		//	0: no need
		//	1: define content
		//	2: define equivalence
		for(var c=0; c<this.eqCls.length; ++c) {
			var ec = this.eqCls[c];
			var elms = ec.summary('components');
			var extInfl = false;
			
			//Compute influence from other knowledge.
			// If influence from several elements, influence the whole class
			// If influence from only one element, influence the class without that element 
			for(var e in elms) if(cstmNdx(e)) {
				if(elms[e].dependance().otherThan(this)) {
					extInfl = extInfl?true:e;
					if(true=== extInfl) break;
				}
			}
			//If this refer to something defined by its attributes
			if(true!== extInfl && !isEmpty(ec.attribs,[''])) extInfl = extInfl?true:'attribs:*';
			//If this refer to something equaled in absolute
			if(true!== extInfl && this.eqCls[c].eqvlDefined()) extInfl = extInfl?true:'equivls:0';
			//If this refer to something beblonging in absolute
			if(true!== extInfl && this.eqCls[c].blngDefined()) extInfl = extInfl?true:'belongs:0';
			
			if(extInfl) //If this refer to something defined in another context
				toNeed.pushs(influence(ec.influence(this, extInfl), lcls));
			if(true!== extInfl) for(var e in elms) if(cstmNdx(e)) {
				//var usg = elms[e].dependance().usage(this).local;
				//For each usage of this element, influence each other usage of the eqclass
				for(var srcNdx in elms[e].dependance().usage(this).local)
					lclInfl[srcNdx] = ec.influence(this, e, extInfl, lclInfl[srcNdx]);
			}
		}
		//2: use influence to need all influenced locals
		while(toNeed.length)
			toNeed.pushs(influence(lclInfl[toNeed.shift()], lcls));
		return map(lcls,function(i, o) { return 3<=o; });
	},
	
  	/**
 	 * Know that all the arguments are unifiable
 	 * Modifies the knowledge
 	 * @param {nul.xpr.object} and {nul.xpr.knowledge.eqCls}
 	 * @return {nul.xpr.knowledge.eqCls} unsummarised
 	 * @throws nul.failure
 	 */
 	unification: function() { 	
 		var toUnify = beArrg(arguments);
 		this.modify(); nul.xpr.use(toUnify);
 		var dstEqCls = new nul.xpr.knowledge.eqClass();
 		var alreadyEqd = {}, alreadyBlg = {};
 		var toBelong = [];
 		var abrtVal = nul.xpr.knowledge.cloneData(this);	//Save datas in case of failure
 		try {
	 		while(toUnify.length || toBelong.length) {
	 			while(toUnify.length) {
		 			var v = toUnify.shift();
		 			if('undefined'!= typeof this.access[v]) {
		 				v = this.access[v];
		 				var ec = this.eqCls[v];
		 				this.unaccede(v);
	 					v = ec;
		 			}
		 			if(!v) {}
		 			else if('eqCls'== v.expression) {
		 				toUnify.pushs(v.equivls);
						toBelong.pushs(v.belongs);
						toUnify.pushs(dstEqCls.hasAttr(v.attribs, this));
		 			} else if(!alreadyEqd[v]) {
		 				toUnify.pushs(dstEqCls.isEq(v, this));
		 				alreadyEqd[v] = true;
		 			}
		 		}
		 		if(toBelong.length) {
		 			var unf = dstEqCls.equivls[0];
		 			if(nul.debug.assert) assert(unf, 'Has some value when time to belong');
		 			var s = toBelong.shift();
					var chx = s.has(unf);
					if(chx) {
						switch(chx.length) {
						case 0:
							nul.fail('Unification failed');
						case 1:
							if('possible'== chx[0].expression) {
								toUnify.push(this.merge(chx[0].knowledge, chx[0].value));
								//TODO0: Reset unification, to do it knowing the newly brought knowledge
								//useful ??!?
								
								alreadyEqd = {};
								alreadyBlg = {};
								toUnify.pushs(dstEqCls.equivls);
								toBelong.pushs(dstEqCls.belongs);
								dstEqCls.equivls = [];
								dstEqCls.belongs = [];
							} else toUnify.push(chx[0]);
							break;
						default:
							var vals = [];
							var klgs = [];
							map(chx, function() {
								var p = nul.xpr.possible.cast(this);
								var klg = p.knowledge.modifiable();
								klg.unify(p.value, unf);
								klgs.push(klg.built());
							});
					 		this.ior3.push(new nul.xpr.knowledge.ior3(klgs));
						}					
					}
					else if(!alreadyBlg[s]) {
						alreadyBlg[s] = true;
						dstEqCls.isIn(s, this);
					}
		 		}
	 		}
 		} catch(err) {
 			nul.xpr.knowledge.cloneData(abrtVal, this);
 			throw nul.exception.notice(err);
 		}
		nul.debug.log('Knowledge')('EqCls '+this.name, dstEqCls.equivls);
		return dstEqCls;
 	}.describe('Unification', function() {
 		return map(beArrg(arguments), function() { return this.dbgHtml(); }).join(' = ');
 	}),
 	
 //////////////// publics

 	/**
 	 * Gets a value out of these choices
 	 * @param {array} choices of nul.xpr.possible
 	 * @return nul.xpr.object
 	 */
 	hesitate: function(choices) {
 		this.modify();
		switch(choices.length) {
		case 0:
			nul.fail('No choices');
		case 1:
			return choices[0].valueKnowing(this);
		default:
			var vals = [];
			var klgs = [];
			map(choices, function() {
				var p = nul.xpr.possible.cast(this);
				vals.push(p.value);
				klgs.push(p.knowledge);
			});
			try { return new nul.obj.ior3(this.name, this.ior3.length, vals); }
	 		finally { this.ior3.push(new nul.xpr.knowledge.ior3(klgs)); }
		}
	},
 	
 	/**
 	 * Know all what klg knows
 	 * @return {nul.xpr.object} Value expressed under this knowledge
 	 * @throws {nul.failure}
 	 */
 	merge: function(klg, val) {
 		if(nul.xpr.knowledge.never== klg) nul.fail('Merging failure');
 		if(nul.xpr.knowledge.always== klg) return val;
 		
 		this.modify(); nul.xpr.use(klg, nul.xpr.knowledge);

 		var brwsr = new nul.xpr.knowledge.stepUp(klg, this.name, this.ior3.length, this.nbrLocals());
		
 		this.concatLocals(klg);
		klg = brwsr.browse(klg);

		this.addEqCls(klg.eqCls);
		this.ior3.pushs(klg.ior3);
 		this.veto.pushs(klg.veto);
 		
 		if(val) return brwsr.browse(val);
 	},

 	/**
 	 * Know that all the arguments are unifiable
 	 * Modifies the knowledge
 	 * @param {nul.xpr.object} and {nul.xpr.knowledge.eqCls}
 	 * @return nul.xpr.object The replacement value for all the given values
 	 * @throws nul.failure
 	 */
 	unify: function(a, b) {
 		return this.unification(beArrg(arguments)).taken(this);
 	},
 	 	
	/**
 	 * Know that 'e' is in the sets 'ss'.
 	 * Modifies the knowledge
 	 * @return The replacement value for 'e' or nothing if inclusion failed.
 	 * @throws nul.failure
 	 */
 	belong: function(e, ss) {
 		this.modify(); nul.obj.use(e); nul.obj.use(ss);
		
 		ss = beArrg(arguments, 1);
 		if(!ss.length) return e;
 		var dstEC = this.inform(e);
 		for(var s in ss) if(cstmNdx(s)) dstEC.isIn(ss[s], this);
 		return dstEC.taken(this);
 	},
 	
 	/**
 	 * States that 'e.anm = vl'
 	 * @param {nul.xpr.object} e
 	 * @param {string} anm
 	 * @param {nul.xpr.object} vl
 	 * @return {nul.xpr.object}
 	 * @throws {nul.failure}
 	 */
 	attribute: function(e, anm, vl) {
 		this.modify(); nul.obj.use(e); nul.obj.use(vl);
 		var attrs = {};
 		if(vl) attrs[anm] = vl;
 		else attrs = anm;
 		
 		var ec = new nul.xpr.knowledge.eqClass(e, attrs).built();
 		return this.unify(ec);
 	},

	/**
	 * Brings a knowledge in opposition
	 */
	oppose: function(klg) {
		this.modify(); nul.xpr.use(klg, nul.xpr.knowledge);
		if(klg.veto && klg.veto.length) {
			klg = klg.modifiable();
			while(klg.veto.length) this.merge(klg.veto.pop());
			klg = klg.built();
		}
		if(0< klg.minXst()) nul.fail('Opposition : ', klg);
		if(nul.xpr.knowledge.never!= klg) this.veto.push(klg);
		return this;
	},
	 
 	/**
 	 * Get a pruned possible
 	 * @param {nul.xpr.object} value
	 * @return nul.xpr.possible or  nul.xpr.object
 	 */
 	wrap: function(value) {
 		this.modify(); nul.obj.use(value);
		var representer = new nul.xpr.knowledge.eqClass.represent(this.eqCls);
		
		for(var i=0; i<this.eqCls.length;) {
			var nec = representer.subBrowse(this.eqCls[i]);
			if(nul.browser.bijectif.unchanged == nec) ++i;
			else {
				this.unaccede(i);
				nec = this.unification(nec).built();
				if(nec) this.accede(nec);
				representer = new nul.xpr.knowledge.eqClass.represent(this.eqCls);
				nul.debug.log('Represent')('Representation', this);
				i = 0;
			}
		}

//TODO0: represent sur ior3s : useful or post-resolution ?
		value = representer.browse(value);
		
		var opposition = this.veto;
		this.veto = [];
		while(opposition.length)
			this.oppose(representer.browse(opposition.shift()));
 		this.pruned(value);
 		
 		return new nul.xpr.possible(value, this.built());
 	}.describe('Wrapping', function(value) {
 		//TODO4: standardise the knowledge name in logs
		return this.name+': ' + value.dbgHtml() + ' ; ' + this.dbgHtml();
	}),

//////////////// Existence summaries

	maxXst: nul.summary('maxXst'), 	
	minXst: nul.summary('minXst'), 	
	sum_maxXst: function() {
		var rv = 1;
		for(var h in this.ior3) if(cstmNdx(h))
			rv *= this.ior3[h].maxXst();
		return rv;
	},
	sum_minXst: function() {
		if(this.eqCls.length || this.veto.length) return 0;
		var rv = 1;
		for(var h in this.ior3) if(cstmNdx(h))
			rv *= this.ior3[h].minXst();
		return rv;
	},

	sum_index: function() {
		return this.indexedSub(this.name, this.eqCls, this.ior3);
	},
	
//////////////// nul.expression implementation
	
	expression: 'klg',
	components: ['eqCls','ior3','veto'],
	modifiable: function($super) {
		var rv = $super();
		rv.eqCls = [];
		rv.access = {};
		for(var i=0; i<this.eqCls.length; ++i)
			rv.accede(this.eqCls[i], i);
		rv.ior3 = clone1(rv.ior3);
		rv.locals = clone1(rv.locals);
		rv.veto = clone1(rv.veto);
		return rv;
	},
	
	chew: function($super) {
		var nwEqCls = this.eqCls;
		var nwOppstn = this.veto;
		this.veto = [];
		this.eqCls = [];
		this.access = {};
		this.addEqCls(nwEqCls);
		while(nwOppstn.length) this.oppose(nwOppstn.shift());
		return $super();
	},
	
 	built: function($super) {
		delete this.access;
		//if(0== this.mult) return nul.xpr.knowledge.never;
 		if(this.isFixed()) return nul.xpr.knowledge.always; 
 		return $super();
 	},
 	isFixed: function() {
 		return (!this.eqCls.length && !this.nbrLocals() && !this.ior3.length && !this.veto.length);
 	},
});

nul.xpr.knowledge.stepUp = Class.create(nul.browser.bijectif, {
	initialize: function($super, srcKlg, dstKlgRef, deltaIor3ndx, deltaLclNdx) {
		this.srcKlg = srcKlg;
		this.dstKlgRef = dstKlgRef;
		this.deltaIor3ndx = deltaIor3ndx || 0;
		this.deltaLclNdx = deltaLclNdx || 0;
		$super('StepUp');
	},
	transform: function(xpr) {
		if('local'== xpr.expression && this.srcKlg.name == xpr.klgRef )
			return new nul.obj.local(this.dstKlgRef, xpr.ndx+this.deltaLclNdx, xpr.dbgName);
		if('ior3'== xpr.expression && this.srcKlg.name  == xpr.klgRef )
			return new nul.obj.ior3(this.dstKlgRef, xpr.ndx+this.deltaIor3ndx, xpr.values);
		return nul.browser.bijectif.unchanged;
	},
});

/**
 * Private use !
 * Cone thedata from a knowledge (or a save object) to another knowledge (or a save object)
 */
nul.xpr.knowledge.cloneData = function(src, dst) {
	if(!dst) dst = {};
	dst.eqCls = clone1(src.eqCls);
	dst.access = clone1(src.access);
	dst.ior3 = clone1(src.ior3);
	dst.locals = clone1(src.locals);
	return dst;	
};

if(nul.debug) merge(nul.xpr.knowledge.prototype, {

	/**
	 * Use the ior3 choices to textualise ior3 references.
	 */
	useIor3Choices: function(keep) {
		for(var i=0; i<this.ior3.length; ++i)
			if(keep[i]) for(var l = 0; l<keep[i].length; ++l)
				keep[i][l].invalidateTexts(this.ior3[i].choices);
	},

	/**
	 * Remove the names of the unused locals.
	 * Use the local names to textualise locals references.
	 */
	useLocalNames: function(keep) {
		for(var i=0; i<this.locals.length; ++i)
			if(!keep[i]) this.locals[i] = null;
			else for(var l = 0; l<keep[i].length; ++l)		//TODO0: useful ? locals should have correct dbgName now
				keep[i][l].invalidateTexts(this.locals[i]);
	},

	/**
	 * An empty set of managed locals
	 */
	emptyLocals: function() { return []; },

	/**
	 * This knowledge now manage this new knowledge locals too
	 */
	concatLocals: function(klg) { this.locals.pushs(klg.locals); },
	
	/**
	 * Unallocate the last local
	 */
	freeLastLocal: function() { this.locals.pop(); },
	
	/**
	 * Get the number of locals this knowledge manage
	 */
	nbrLocals: function() { return this.locals.length; },
	
	/**
	 * Register a new local
	 */
 	newLocal: function(name, ndx) {
 		if('undefined'== typeof ndx) ndx = this.locals.length;
		this.locals[ndx] = name;
 		return new nul.obj.local(this.name, ndx, name)
 	},
}); else merge(nul.xpr.knowledge.prototype, {
	/**
	 * Use the ior3 choices to textualise ior3 references.
	 */
	useIor3Choices: function() {},
	
	/**
	 * Remove the names of the unused locals
	 */
	useLocalNames: function(keep) {},

	/**
	 * An empty set of managed locals
	 */
	emptyLocals: function() { return 0; },
	
	/**
	 * This knowledge now manage this new knowledge locals too
	 */
	concatLocals: function(klg) { this.locals += klg.locals; },
	
	/**
	 * Unallocate the last local
	 */
	freeLastLocal: function() { --this.locals; },
	
	/**
	 * Get the number of locals this knowledge manage
	 */
	nbrLocals: function() { return this.locals; },
	
	/**
	 * Register a new local
	 */
 	newLocal: function(name, ndx) {
 		if('undefined'== typeof ndx) ndx = this.locals++;
 		return new nul.obj.local(this.name, ndx)
 	},
});

nul.xpr.knowledge.never = nul.xpr.knowledge.prototype.failure = new (Class.create(nul.expression, {
	initialize: function() { this.alreadyBuilt(); },
	expression: 'klg',
	name: 'Failure',
	modifiable: function() { return this; },
	wrap: function(value) { return nul.xpr.failure; },
	components: [],
	minXst: function() { return 0; },
	maxXst: function() { return 0; },
}))();

nul.xpr.knowledge.always = new (Class.create(nul.expression, {
	initialize: function() { this.alreadyBuilt(); },
	expression: 'klg',
	name: 'Always',
	modifiable: function() { return new nul.xpr.knowledge(); },
	wrap: function(value) { return new nul.xpr.possible.cast(value); },
	components: [],
	ior3: [],
	isFixed: function() { return true; },
	minXst: function() { return 1; },
	maxXst: function() { return 1; },
}))();

nul.xpr.knowledge.unification = function(objs) {
	objs = beArrg(arguments);
	nul.obj.use(objs);
	var klg = new nul.xpr.knowledge();
	klg.unify(objs);
	return klg.built();
};