/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.xpr.knowledge = Class.create(nul.expression, /** @lends nul.xpr.knowledge# */{
	/**
	 * Represent a bunch of information about locals and absolute values.
	 * @extends nul.expression
	 * @constructs
	 * @param {String} klgName [optional] Knowledge name
	 */
	initialize: function(klgName) {
 		/**
 		 * Describe the used localspace
 		 * @type String[]
 		 */
        this.locals = this.emptyLocals();
 		/**
 		 * List of all the knowledge that oppose to this knowledge satisfaction
 		 * @type nul.xpr.knowledge[]
 		 */
        this.veto = [];
 		/**
 		 * List of equivalence classes this knowledge assert
 		 * @type nul.xpr.knowledge.eqClass[]
 		 */
 		this.eqCls = [];		//Array of equivalence classes.
 		/**
 		 * List of all the object this knowledge knows (their index is the key) about and the equivalence class they belong to
 		 * @type Access
 		 */
 		this.access = {};		//{nul.xpr.object} object => {nul.xpr.knowledge.eqClass} eqClass
 		/**
 		 * List of all the ior3s that still have to be choosen
 		 * @type nul.xpr.knowledge.ior3[]
 		 */
 		this.ior3 = [];			//List of unchoosed IOR3
 		/**
 		 * Unique name given to the knowledge
 		 * @type String
 		 */
 		this.name = klgName || ++nul.xpr.knowledge.nameSpace;
 		//this.mult = 1;	//TODO O: 'mult' optimisation
 	},

//////////////// privates

 	/**
 	 * Remove the 'access' data used for knowledge modification.
 	 * Debug asserts
 	 */
 	clearAccess: function() {
 		if(!this.access) return;
		if(nul.debug.assert) {
			for(var i in this.access) if(cstmNdx(i))
				assert(this.access[i].summarised && 0<= this.eqCls.indexOf(this.access[i]),
		 			'Knowledge access consistence');
			for(var i in this.eqCls) if(cstmNdx(i))
				for(var e in this.eqCls[i].equivls) if(cstmNdx(e))
					assert(this.access[this.eqCls[i].equivls[e]] === this.eqCls[i],
		 				'Knowledge access consistence');
		}
		delete this.access;
 	},
 	
	/**
	 * Modify eqCls and set accesses
	 */
 	accede: function(ec) {
		this.modify(); nul.xpr.use(ec, 'nul.xpr.knowledge.eqClass');
		if(ec) ec = ec.placed(this);
		if(ec) {
	 		this.eqCls.push(ec);
			for(var unfd in ec.equivls) if(cstmNdx(unfd)) {
				if(nul.debug.assert) assert(!this.access[ec.equivls[unfd]], 'No double access');
				this.access[ec.equivls[unfd]] = ec;
			}
		}
		return ec;
 	},
 	
	/**
	 * Free ec from this.eqCls if it's not free
	 * @param {nul.xpr.knowledge.eqClass} ec
	 * @return {nul.xpr.knowledge.eqClass} ec
	 */
	freeEC: function(ec) {
		if(!ec.summarised) return ec;
		var i = this.eqCls.indexOf(ec);
 		if(nul.debug.assert) assert(0<=i, 'Unaccede accessed class')
		this.eqCls.splice(i, 1);
 		var rv = ec.modifiable();
		for(var i in this.access) if(this.access[i] === ec) this.access[i] = rv;
 		return rv;
 	},

 	/**
	 * The eqCls ec is removed : remove access and remove from classes
	 * @param {nul.xpr.knowledge.eqClass} ec
	 * @return {nul.xpr.knowledge.eqClass} ec
	 */
	removeEC: function(ec) {
 		this.modify(); nul.xpr.use(ec, 'nul.xpr.knowledge.eqClass');
		var i = this.eqCls.indexOf(ec);
 		if(nul.debug.assert) assert(0<=i, 'Unaccede accessed class')
		this.eqCls.splice(i, 1);
		return this.unaccede(ec);
	},
	
 	/**
	 * The eqCls ec has been removed : remove access
	 * @param {nul.xpr.knowledge.eqClass} ec
	 * @return {nul.xpr.knowledge.eqClass} ec
	 */
	unaccede: function(ec) {
 		this.modify(); nul.xpr.is(ec, nul.xpr.knowledge.eqClass);
 		//TODO O: only goes through the access of ec' equivalents
		for(var i in this.access) if(this.access[i] === ec) delete this.access[i];
		return ec;
	},
 	
 	/**
 	 * Begin modification of an equivalence class
 	 * @param {nul.xpr.object} obj Object whose information is brought
 	 * @return equivalence class to re-add to the knowledge
 	 */
	inform: function(obj) {
		this.modify(); nul.obj.use(obj);
		
		var ec = this.access[obj];
		if(ec) return this.freeEC(ec);
 		return new nul.xpr.knowledge.eqClass(obj);
	},
 	
 	/**
 	 * Add the given equivalence classes in this knowledge
 	 * @param {nul.xpr.knowledge.eqClass[]} eqCls
 	 * @throws {nul.failure}
 	 */
 	addEqCls: function(eqCls) {
 		for(var ec in eqCls) if(cstmNdx(ec)) this.unify(nul.xpr.use(eqCls[ec], 'nul.xpr.knowledge.eqClass'));
 	},
 	
 	/**
 	 * Remove any information about locals or ior3s that are not refered anymore
 	 * @param {nul.dependance.usage} deps
 	 * remove all access before : these are not preserved
 	 */
 	pruned: function(value) {
 		this.modify();
		this.clearAccess();
 		var vdps = new nul.dependance();
		
		vdps.also(value.dependance());
		for(var i in this.ior3) if(cstmNdx(i) && this.ior3[i]) vdps.also(this.ior3[i].dependance());
		for(var i in this.veto) if(cstmNdx(i) && this.veto[i]) vdps.also(this.veto[i].dependance());
		vdps = this.localNeed(vdps.usage(this).local);

		//Remove useless equivalence class specifications
		for(var c=0; c<this.eqCls.length;) {
			this.eqCls[c] = this.eqCls[c].pruned(this, vdps);
 			/*if(this.eqCls[c] && !this.eqCls[c].belongs.length && (!this.eqCls[c].equivls.length || 
				(1== this.eqCls[c].equivls.length && isEmpty(this.eqCls[c].attribs,''))))
					this.eqCls[c] = null;
 			if(this.eqCls[c] && !this.eqCls[c].equivls.length && isEmpty(this.eqCls[c].attribs,'') && 1== this.eqCls[c].belongs.length && this.eqCls[c].blngDefined()) {
 				if('&phi;'== this.eqCls[c].belongs[0].expression) nul.fail("&phi; is empty");
 				this.eqCls[c] = null;
 			}*/
			if(!this.eqCls[c]) this.eqCls.splice(c,1);
			else ++c;
		} 
 		
 		var deps = this.usage(value);
 		/*TODO O: 'mult' optimisation
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
 		//TODO O: use summary if possible.
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
		var toNeed = Object.keys(lcls);
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
		var lclInfl = {};	//nx => {ndx: [0, 1, 2]}
		//	0: no need
		//	1: define content
		//	2: define equivalence
		for(var c=0; c<this.eqCls.length; ++c) {
			var ec = this.eqCls[c];
			var elms = [];
			elms.pushs(ec.equivls);
			elms.pushs(ec.belongs);
			var extInfl = false;
			
			//Compute influence from other knowledge.
			// If influence from several elements, influence the whole class
			// If influence from only one element, influence the class without that element 
			for(var e in elms) if(cstmNdx(e) &&
				('local'!= elms[e].expression || this.name!= elms[e].klgRef)) {
					extInfl = extInfl?true:e;
					if(true=== extInfl) break;
				}
			//If this refer to something defined by its attributes
			if(true!== extInfl && !isEmpty(ec.attribs,'')) extInfl = extInfl?true:'attribs:*';
			//If this refer to something equaled in absolute
			if(true!== extInfl && this.eqCls[c].eqvlDefined()) extInfl = extInfl?true:'equivls:0';
			//If this refer to something beblonging in absolute
			if(true!== extInfl && this.eqCls[c].blngDefined()) extInfl = extInfl?true:'belongs:0';
			
			if(extInfl) //If this refer to something defined in another context
				toNeed.pushs(influence(ec.influence(this, extInfl), lcls));
			if(true!== extInfl) for(var e in elms) if(cstmNdx(e)) {
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
 	 * @param {nul.xpr.object} and {nul.xpr.knowledge.eqClass}
 	 * @return {nul.xpr.knowledge.eqClass} unsummarised (if in a higher-stack level unification) or summarised
 	 * @throws {nul.failure}
 	 */
 	unification: function() { 	
 		var toUnify = beArrg(arguments);
 		this.modify();
 		var dstEqCls = new nul.xpr.knowledge.eqClass();
 		var alreadyBlg = {};	//TODO 3: make a 'belong' this.access ?
 		var toBelong = [];
 		var ownClass = true;
 		try {
	 		while(toUnify.length || toBelong.length) {
	 			while(toUnify.length) {
		 			var v = toUnify.shift();
		 			nul.xpr.use(v);
		 			if(this.access[v]) {
		 				v = this.access[v];
		 				if(dstEqCls=== v) {}
		 				else if(!v.summarised) {	//If not summarised, then it's a class built in another unification higher in the stack
		 					ownClass = false;
		 					this.unaccede(dstEqCls);
		 					dstEqCls.merged = v;
		 					v = dstEqCls;
		 					dstEqCls = v.merged;
		 				}
		 				else this.removeEC(v);
		 			}
		 			if(dstEqCls=== v) {}
		 			else if('eqCls'== v.expression) {
		 				toUnify.pushs(v.equivls);
						toBelong.pushs(v.belongs);
						dstEqCls.hasAttr(v.attribs, this);
		 			} else {
		 				this.access[v] = dstEqCls;
		 				dstEqCls.isEq(v, this);
		 			}
		 		}
		 		if(toBelong.length) {
		 			var unf = dstEqCls.equivls[0];
		 			var s = toBelong.shift();
		 			if(!isEmpty(dstEqCls.attribs) && !unf && s.defined) {
		 				unf = this.newLocal(nul.understanding.rvName);
						this.access[unf] = dstEqCls;
		 				dstEqCls.equivls.unshift(unf);
		 			}
		 			var attrs = dstEqCls.attribs;
		 			if('lambda'== unf.expression) attrs = this.attributes(unf.image);
					var chx = (unf&&s.defined)?s.has(unf, attrs):false;
					if(chx) {
						unf = this.hesitate(chx);
						delete this.access[dstEqCls.equivls[0]];
						this.access[dstEqCls.equivls[0] = unf] = dstEqCls;
					}
					else if(!alreadyBlg[s]) {
						alreadyBlg[s] = true;
						dstEqCls.isIn(s, this);
					}
		 		}
	 		}
	 		if(ownClass) dstEqCls.built();
 		} catch(err) {
 			throw nul.exception.notice(err);
 		}
		return dstEqCls;
 	}.describe('Unification', function() {
 		return map(beArrg(arguments), function() { return this.dbgHtml(); }).join(' = ');
 	}),
 	
 //////////////// publics

 	/**
 	 * Gets a value out of these choices
 	 * @param {nul.xpr.possible[]} choices of nul.xpr.possible
 	 * @return nul.xpr.object
 	 */
 	hesitate: function(choices) {
 		choices = beArrg(arguments);
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
 		//if(nul.debug.assert) assert(!klg.ior3.length, 'Merge only uniques')
 		
 		this.modify(); nul.xpr.use(klg, 'nul.xpr.knowledge');

 		var brwsr = new nul.xpr.knowledge.stepUp(klg.name, this);
		
 		this.concatLocals(klg);

		klg = brwsr.browse(klg);
		
		this.addEqCls(klg.eqCls);
		this.ior3.pushs(klg.ior3);
 		this.veto.pushs(klg.veto);
 		
 		if(val) return brwsr.browse(val);
 		return brwsr;
 	},

 	/**
 	 * Know that all the arguments are unifiable
 	 * Modifies the knowledge
 	 * @param {nul.xpr.object} and {nul.xpr.knowledge.eqClass}
 	 * @return nul.xpr.object The replacement value for all the given values
 	 * @throws {nul.failure}
 	 */
 	unify: function(a, b) {
 		return this.unification(beArrg(arguments)).taken(this);
 	},
 	 	
	/**
 	 * Know that 'e' is in the sets 'ss'.
 	 * Modifies the knowledge
 	 * @return The replacement value for 'e' or nothing if inclusion failed.
 	 * @throws {nul.failure}
 	 */
 	belong: function(e, ss) {
 		ss = beArrg(arguments, 1);
 		this.modify(); nul.obj.use(e);
		
 		if(!ss.length) return e;
 		var dstEC = this.inform(e);
 		for(var s in ss) if(cstmNdx(s)) dstEC.isIn(nul.obj.use(ss[s]), this);
 		return this.accede(dstEC.built()).equivls[0];
 	},
 	
 	/**
 	 * States that 'e.anm = vl'
 	 * @param {nul.xpr.object} e
 	 * @param {String} anm
 	 * @param {nul.xpr.object} vl
 	 * @return {nul.xpr.object}
 	 * @throws {nul.failure}
 	 */
 	attributed: function(e, anm, vl) {
 		this.modify(); nul.obj.use(e);
 		var attrs = {};
 		if(vl) attrs[anm] = vl;
 		else attrs = anm;
 		
 		var ec = new nul.xpr.knowledge.eqClass(e, attrs).built();
 		return this.unify(ec);
 	},

 	/**
 	 * Retrieve the attributes stated for 'e'
 	 * @param {nul.xpr.object} e
 	 * @return {nul.xpr.object[]}
 	 * @throws {nul.failure}
 	 */
 	attributes: function(e) {
 		nul.obj.use(e);
 		if(e.defined) return e.attribute;	//TODO 2 : cas special du defined : il faut une liste
		var ec = this.access[e];
		if(!ec) return {};
 		return ec.attribs;
 	},
 	
 	/**
 	 * Simplifies oneself knowing the attribute table
 	 * @param {access} dTbl
 	 * @return {String[]} The list of used attributions : xpr indexes
 	 */
 	define: function(acsTbl) {
		this.modify();
		var rv = [];
		acsTbl = clone1(acsTbl);
		var used;
		do {
			used = false;
			for(var v in this.access) {
				if(acsTbl[v]) {
					var nec = this.access[v].modifiable();
					if(nec.define(acsTbl[v], this)) {
						this.removeEC(this.access[v]);
						this.accede(nec.built());
						rv.push(v);
						used = true;
					}
					delete acsTbl[v];
					break;
				}
			}
		} while(used);
		return rv;
 	},
 	
	/**
	 * Brings a knowledge in opposition
	 * @param {nul.xpr.knowledge} klg
	 * @throws {nul.failure}
	 */
	oppose: function(klg) {
		this.modify(); nul.xpr.use(klg, 'nul.xpr.knowledge');
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
	 * @return {nul.xpr.possible}
	 * @throws {nul.failure}
 	 */
 	wrap: function(value) {
 		this.modify(); nul.obj.use(value);
		var representer = new nul.xpr.knowledge.represent(this);
		nul.debug.log('Represent')(this.name, 'Knowledge', this);
		for(var i=0; i<this.eqCls.length;) {
			var ec = this.eqCls[i];
			var dlc = nul.debug.lc;
			var nec = representer.subBrowse(ec);
			if(nul.browser.bijectif.unchanged == nec) ++i;
			else {
				value = representer.browse(value);
				this.removeEC(ec)
				nec = this.unify(nec);
				
				//this.unification has effect on other equivalence classes that have to change in the representer
				representer.invalidateCache();
				
				nul.debug.log('Represent')(this.name, 'Knowledge', this);
				i = 0;
			}
		}

		//TODO O: represent sur ior3s : useful or we let it post-resolution ?
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
		return this.indexedSub(this.name);
	},
	
//////////////// nul.expression implementation
	
	/** @constant */
	expression: 'klg',
	/** @constant */
	components: {
		'eqCls': {type: 'nul.xpr.knowledge.eqClass', bunch: true},
		'ior3': {type: 'nul.xpr.knowledge.ior3', bunch: true},
		'veto': {type: 'nul.xpr.knowledge', bunch: true}
	},
	modifiable: function($super) {
		var rv = $super();
		nul.xpr.knowledge.cloneData(this, rv);
		rv.eqCls = [];
		rv.access = {};
		for(var i in this.eqCls) if(cstmNdx(i)) rv.accede(this.eqCls[i]);
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
		this.clearAccess();
		//if(0== this.mult) return nul.xpr.knowledge.never;
 		if(this.isFixed() && nul.xpr.knowledge.always) return nul.xpr.knowledge.always; 
 		return $super();
 	},
 	isFixed: function() {
 		return (!this.eqCls.length && !this.nbrLocals() && !this.ior3.length && !this.veto.length);
 	}
});

/**
 * Private use !
 * Cone the data from a knowledge (or a save object) to another knowledge (or a save object)
 */
nul.xpr.knowledge.cloneData = function(src, dst) {
	if(!dst) dst = {};
	if(dst.accede) {
		dst.access = {};
		for(var i in this.eqCls) if(cstmNdx(i)) dst.accede(this.eqCls[i]);
	} else dst.eqCls = clone1(src.eqCls);
	dst.ior3 = clone1(src.ior3);
	dst.locals = clone1(src.locals);
	dst.veto = clone1(src.veto);
	return dst;	
};

if(nul.debug) merge(nul.xpr.knowledge.prototype, /** @lends nul.xpr.knowledge# */{

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
			else for(var l = 0; l<keep[i].length; ++l)		//TODO O: useful ? locals should have correct dbgName now
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
 		if(Object.isUndefined(ndx)) ndx = this.locals.length;
		this.locals[ndx] = name;
 		return new nul.obj.local(this.name, ndx, name)
 	}
 	
}); else merge(nul.xpr.knowledge.prototype, {
	useIor3Choices: function() {},
	useLocalNames: function() {},
	emptyLocals: function() { return 0; },
	concatLocals: function(klg) { this.locals += klg.locals; },
	freeLastLocal: function() { --this.locals; },
	nbrLocals: function() { return this.locals; },
 	newLocal: function(name, ndx) {
 		if(Object.isUndefined(ndx)) ndx = this.locals++;
 		return new nul.obj.local(this.name, ndx)
 	}
});

nul.xpr.knowledge.special = Class.create(nul.xpr.knowledge, /** @lends nul.xpr.knowledge.special# */{
	special: true,
	/**
	 * Special knowledge
	 * @extends nul.xpr.knowledge
	 * @constructs
	 * @param {hash} comps Components
	 */
	initialize: function(comps) {
		merge(this, comps);
		this.alreadyBuilt();
	},
	expression: 'klg',
	
	components: {},
	ior3: [],
	eqCls: [],
	veto: [],
	isFixed: function() { return 1== this.on; },
	minXst: function() { return this.on; },
	maxXst: function() { return this.on; }
});

/**
 * Special knowledge meaning something that is never verified
 */
nul.xpr.knowledge.never = nul.xpr.knowledge.prototype.failure = new nul.xpr.knowledge.special({
	name: 'Never',
	modifiable: function() { nul.fail('No fewer than never'); },
	wrap: function(value) { return nul.xpr.failure; },
	on: 0
});

/**
 * Special knowledge meaning something that is always verified
 */
nul.xpr.knowledge.always = new nul.xpr.knowledge.special({
	name: 'Always',
	modifiable: function() { return new nul.xpr.knowledge(); },
	wrap: function(value) { return new nul.xpr.possible.cast(value); },
	on: 1
});

nul.xpr.knowledge.unification = function(objs) {
	objs = beArrg(arguments);
	var klg = new nul.xpr.knowledge();
	klg.unify(objs);
	return klg.built();
};
