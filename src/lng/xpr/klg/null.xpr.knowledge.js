/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
//#uses: src/lng/xpr/klg/nul.klg.ior3, src/lng/xpr/klg/nul.klg.eqCls, src/lng/xpr/klg/nul.klg.browse, src/lng/xpr/klg/nul.klg.algo

nul.xpr.knowledge = new JS.Class(nul.expression, /** @lends nul.xpr.knowledge# */{
	/**
	 * @class Represent a bunch of information about locals and absolute values.
	 * @extends nul.expression
	 * @constructs
	 * @param {String} klgName [optional] Knowledge name
	 */
	initialize: function(klgName, n, x) {
		this.callSuper(null);
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
 		 * @type nul.klg.eqClass[]
 		 */
 		this.eqCls = [];		//Array of equivalence classes.
 		/**
 		 * List of all the object this knowledge knows (their index is the key) about and the equivalence class they belong to
 		 * @type Access
 		 */
 		this.access = {};		//{nul.xpr.object} object => {nul.klg.eqClass} eqClass
 		/**
 		 * List of all the ior3s that still have to be choosen
 		 * @type nul.klg.ior3[]
 		 */
 		this.ior3 = [];			//List of unchoosed IOR3
 		/**
 		 * Unique name given to the knowledge
 		 * @type String
 		 */
 		this.name = klgName || nul.execution.name.gen('klg');
		if('undefined'== typeof n) n = 1;
		if('undefined'== typeof x) x = n;
		if(!n.expression) n = { minMult:n, maxMult: x };
		this.minMult = n.minMult;
		this.maxMult = n.maxMult;
 	},

	//TODO C
	arythm: function(op, n, x) {
		this.modify();
		if(!n.expression) n = { minMult:n, maxMult: x || n };
		this.minMult = eval(this.minMult + op + n.minMult);
		this.maxMult = eval(this.maxMult + op + n.maxMult);
	},
	//TODO C
	add: function(n, x) { return this.arythm('+', n, x); },
	//TODO C
	mul: function(n, x) { return this.arythm('*', n, x); },

	/**
	 * Retrieve the equivalence class that describe obj
	 * @param {nul.xpr.object|null} obj
	 * @return {nul.xpr.eqClass|null} if obj was specified
	 * @return {nul.xpr.eqClass[String]} if obj was not specified
	 */
	info: function(obj) {
		var atbl = this.summarised?this.summarised.access:this.access;
		return obj?atbl[obj]:atbl;
	},
	
//////////////// privates
 	
 	/**
 	 * Remove the 'access' data used for knowledge modification.
 	 * Debug asserts
 	 */
 	clearAccess: function() {
 		if(!this.access) return;
		if(nul.debugged) {
			for(var i in ownNdx(this.access))
				nul.assert(this.access[i].summarised && 0<= this.eqCls.indexOf(this.access[i]),
		 			'Knowledge access consistence');
			for(var i in ownNdx(this.eqCls))
				for(var e in ownNdx(this.eqCls[i].equivls))
					nul.assert(this.access[this.eqCls[i].equivls[e]] === this.eqCls[i],
		 				'Knowledge access consistence');
		}
		delete this.access;
 	},
 	
	/**
	 * Modify eqCls and set accesses
	 */
 	accede: function(ec) {
		this.modify(); nul.xpr.use(ec, 'nul.klg.eqClass');
		if(ec) ec = ec.placed(this);
		if(ec) {
	 		this.eqCls.push(ec);
			for(var unfd in ownNdx(ec.equivls)) {
				if(nul.debugged) nul.assert(!this.access[ec.equivls[unfd]], 'No double access');
				this.access[ec.equivls[unfd]] = ec;
			}
		}
		return ec;
 	},
 	
	/**
	 * Free ec from this.eqCls if it's not free
	 * @param {nul.klg.eqClass} ec
	 * @return {nul.klg.eqClass} ec
	 */
	freeEC: function(ec) {
 		if(!ec.summarised) return ec;
		var i = this.eqCls.indexOf(ec);
 		if(nul.debugged) nul.assert(0<=i, 'Unaccede accessed class');
		this.eqCls.splice(i, 1);
 		var rv = ec.modifiable();
		for(var i in this.access) if(this.access[i] === ec) this.access[i] = rv;
 		return rv;
 	},

	/**
	 * Own ec from this.eqCls
	 * @param {nul.klg.eqClass} ec
	 * @return {nul.klg.eqClass} ec
	 */
	ownEC: function(ec) {
		var rec = ec.built().placed(this);
		if(rec) this.eqCls.push(rec);
		else this.unaccede(ec);
 	},

 	/**
	 * The eqCls ec is removed : remove access and remove from classes
	 * @param {nul.klg.eqClass} ec
	 * @return {nul.klg.eqClass} ec
	 */
	removeEC: function(ec) {
 		this.modify(); nul.xpr.use(ec, 'nul.klg.eqClass');
		var i = this.eqCls.indexOf(ec);
 		if(nul.debugged) nul.assert(0<=i, 'Unaccede accessed class');
		this.eqCls.splice(i, 1);
		return this.unaccede(ec);
	},
	
 	/**
	 * The eqCls ec has been removed : remove access
	 * @param {nul.klg.eqClass} ec
	 * @return {nul.klg.eqClass} ec
	 */
	unaccede: function(ec) {
 		this.modify(); nul.xpr.is(ec, nul.klg.eqClass);
 		//TODO O: only goes through the access of ec' equivalents
		for(var i in this.access) if(this.access[i] === ec) delete this.access[i];
		return ec;
	},
 	
 	/**
 	 * Add the given equivalence classes in this knowledge
 	 * @param {nul.klg.eqClass[]} eqCls
 	 * @throws {nul.ex.failure}
 	 */
 	addEqCls: function(eqCls) {
 		for(var ec in ownNdx(eqCls)) this.unify(nul.xpr.use(eqCls[ec], 'nul.klg.eqClass'));
 	},
 	
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
			var rv = this.newLocal('&otimes;');
			var klgs = [];
			map(choices, function() {
				var p = this;
				var klg;
				if(p.isA(nul.xpr.possible)) {
					klg = p.knowledge.modifiable();
					nul.klg.mod(klg);
					p = p.value;
				} else klg = new nul.xpr.knowledge();				
				klg.unify(p, rv);
				klgs.push(klg.built());	//TODO 2: prune ?
			});
	 		this.ior3.push(new nul.klg.ior3(klgs));
	 		return rv;
		}
	}.describe('Hesitation'),
 	
 	/**
 	 * Know all what klg knows
 	 * @param {nul.xpr.knowledge} klg
 	 * @param {nul.xpr.object} val [optional] Value to modify too
 	 * @return {nul.xpr.object} Value expressed under this knowledge if 
 	 * @return {nul.klg.stepUp} Browser to parse further values if no value were specified
 	 * @throws {nul.ex.failure}
 	 */
 	merge: function(klg, val) {
 		if(nul.klg.never== klg) nul.fail('Merging failure');
 		this.mul(klg);
 		if(klg.isA(nul.klg.ncndtnl)) return val;
 		
 		this.modify(); nul.klg.use(klg);

 		var brwsr = new nul.klg.stepUp(klg.name, this);
		
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
 	 * @param {nul.xpr.object} and {nul.klg.eqClass}
 	 * @return nul.xpr.object The replacement value for all the given values
 	 * @throws {nul.ex.failure}
 	 */
 	unify: function(a, b) {
 		return this.unification(beArrg(arguments)).represent();
 	},
 	 	
	/**
 	 * Know that 'e' is in the sets 'ss'.
 	 * Modifies the knowledge
 	 * @return The replacement value for 'e' or nothing if inclusion failed.
 	 * @throws {nul.ex.failure}
 	 */
 	belong: function(e, ss) {
 		ss = beArrg(arguments, 1);
 		this.modify(); nul.obj.use(e);
		
 		var ec = new nul.klg.eqClass(e);
 		ec.belongs = ss;
 		return this.unify(ec.built());
 	},
 	
 	/**
 	 * States that 'e.anm = vl'
 	 * @param {nul.xpr.object} e
 	 * @param {String} anm
 	 * @param {nul.xpr.object} vl
 	 * @return {nul.xpr.object}
 	 * @throws {nul.ex.failure}
 	 */
 	attributed: function(e, anm, vl) {
 		this.modify(); nul.obj.use(e);
 		var attrs = {};
 		if(vl) attrs[anm] = vl;
 		else attrs = anm;
 		
 		var ec = new nul.klg.eqClass(e, attrs).built();
 		return this.unify(ec);
 	},

 	/**
 	 * Retrieve the attributes stated for 'e'
 	 * @param {nul.xpr.object} e
 	 * @return {nul.xpr.object[]}
 	 * @throws {nul.ex.failure}
 	 */
 	attributes: function(e) {
 		nul.obj.use(e);
 		if(e.isA(nul.obj.defined)) return e.attribute;	//TODO 2 : Special defined case : list needed
		var ec = this.access[e];
		if(!ec) return {};
 		return ec.attribs;
 	},
 	
 	/**
 	 * Retrieve the attribute we know for 'e'
 	 * @param {nul.xpr.object} e
 	 * @param {nul.xpr.String} anm
 	 * @return {nul.xpr.object} The attribute 'anm' stated for e 
 	 * @return {null} There is no information about this attribute 
 	 * @throws {nul.ex.failure}
 	 */
 	attribute: function(e, anm) {
 		nul.obj.use(e);
 		if(e.isA(nul.obj.defined)) return e.attribute(anm, this);
		var ec = this.info(e);
		if(ec && ec.attribs[anm]) return ec.attribs[anm];
		var rv = this.newLocal('&rarr;'+anm);
		this.attributed(e, anm, rv);
		return rv;
 	},
 	
 	/**
 	 * Simplifies oneself knowing the attribute table
 	 * @param {access} dTbl
 	 * @return {String[]} The list of used attributions : xpr indexes
 	 */
 	define: function(acsTbl) {
		this.modify();
		var rv = [];
//		return rv;
		acsTbl = $o.clone(acsTbl);
		var used;
		do {
			used = false;
			for(var v in this.access) {
				if(acsTbl[v]) {
					var ownClass = !!this.access[v].summarised;	//TODO 4: une interface pour pas trimballer un boolean ownClass a l'air
					var nec = this.freeEC(this.access[v]);
					if(nec.define(acsTbl[v], this)) {
						rv.push(v);
						used = true;
					}
					//for(var a in nec.attribs) 
					//	if(nul.obj.local.is(nec.attribs[a]) && nul.obj.local.self.ref == nec.attribs[a].klgRef)
					//		delete nec.attribs[a];
					if(ownClass) this.ownEC(nec);
					delete acsTbl[v];
					break;
				}
			}
		} while(used);
		return rv;
 	}.describe('Sub-knowledge definition'),
 	
	/**
	 * Brings a knowledge in opposition
	 * @param {nul.xpr.knowledge} klg
	 * @throws {nul.ex.failure}
	 */
	oppose: function(klg) {
		this.modify(); nul.klg.use(klg);
		if(0< klg.minXst()) nul.fail('Opposition : ', klg);
		if(nul.klg.never!= klg) this.veto.push(klg);
		return this;
	},

//////////////// Existence summaries

	/**
	 * <a href="http://code.google.com/p/nul/wiki/Summary">Summary</a>: Maximum existance cases of this knowledge
	 * @function
	 * @return {Number}
	 */
	maxXst: nul.summary('maxXst'), 	
	/**
	 * <a href="http://code.google.com/p/nul/wiki/Summary">Summary</a>: Minimum existance cases of this knowledge
	 * @function
	 * @return {Number}
	 */
	minXst: nul.summary('minXst'), 	
	/** <a href="http://code.google.com/p/nul/wiki/Summary">Summary</a> computation of {@link maxXst} */
	sum_maxXst: function() {
		if(0<this.nbrLocals()) return pinf;
		var rv = 1;
		for(var h in ownNdx(this.ior3))
			rv *= this.ior3[h].maxXst();
		return rv * this.maxMult;
	},
	/** <a href="http://code.google.com/p/nul/wiki/Summary">Summary</a> computation of {@link minXst} */
	sum_minXst: function() {
		if(this.eqCls.length || this.veto.length) return 0;
		if(0<this.nbrLocals()) return pinf;
		var rv = 1;
		for(var h in ownNdx(this.ior3))
			rv *= this.ior3[h].minXst();
		return rv * this.minMult;
	},

	/** <a href="http://code.google.com/p/nul/wiki/Summary">Summary</a> computation of {@link index} */
	sum_index: function() {
		return this.indexedSub(this.name);
	},
	
//////////////// nul.expression implementation
	
	/** @constant */
	expression: 'klg',
	/** @constant */
	components: {
		'eqCls': {type: 'nul.klg.eqClass', bunch: true},
		'ior3': {type: 'nul.klg.ior3', bunch: true},
		'veto': {type: 'nul.xpr.knowledge', bunch: true}
	},

	/**
	 * Re-built the access for the new modifiable knowledge.
	 */
	modifiable: function() {
		var rv = this.callSuper();
		rv.eqCls = [];
		rv.access = {};
		for(var i in ownNdx(this.eqCls)) rv.accede(this.eqCls[i]);
		return rv;
	},
	
	/**
	 * Clone taking care to shallow clone access and locals (not refered as components)
	 */
	clone: function() {
		var rv = this.callSuper(beArrg(arguments));
		if(rv.access) rv.access = $o.clone(rv.access);
		rv.locals = this.emptyLocals();
		rv.concatLocals(this);
		return rv;
	},

	/**
	 * When equivalence classes were modified by a browser, re-accede them for the access to be valid and for equivalence class to be consistant.
	 */
	reAccede: function() {
		var nwEqCls = this.eqCls;
		var nwOppstn = this.veto;
		this.veto = [];
		this.eqCls = [];
		this.access = {};
		this.addEqCls(nwEqCls);
		while(nwOppstn.length) this.oppose(nwOppstn.shift());
		return this;
	},

	/**
	 * Reaccede the equivalence classes and build.
	 */
	chew: function() {
		this.reAccede();
		return this.callSuper();
	},
	
	/**
	 * Remove the redundant values. Ensure that the structured is simplified at maximum (no 1-choice IOR3 and no veto's vetos)
	 */
	simplify: function() {
		this.modify();
		//Reduce vetos of vetos into ior3s
		var veto;
		for(var v=0; veto = this.veto[v];)
			if(veto.veto.length) {
				this.veto.splice(v, 1);
				//TODO 4: care about multiplicity 
				var unvetoed = veto.modify();
				unvetoed.veto = [];
				
				var choices = map(veto.veto, function() {
					return unvetoed.clone().merge(this).built();
				});
				var tklg = new nul.xpr.knowledge();
				tklg.oppose(unvetoed.built());
				choices.push(tklg);
				
				this.ior3.push(new nul.klg.ior3(choices));
			} else ++v;

		//Reduce IOR3s : if one has one choice, just merge this choice and forget about ior3
 		for(i=0; this.ior3[i];) switch(this.ior3[i].choices.length) {
 		case 0: nul.ex.internal('IOR3 Always has a first unconditional');
 		case 1:
 			this.merge(this.ior3[0]);
 			this.ior3.splice(i, 1);
 			break;
 		default: ++i; break;
 		}
 		return this;
	},
	
	/**
	 * {@link simplify} and regular build. Return an unconditional global if not conditional.
	 */
 	built: function() {
 		this.simplify();
		var acs = this.access;
		this.clearAccess();
 		if(
 				!this.isA(nul.klg.ncndtnl) &&	//This is not already an unconditional
 				!this.eqCls.length &&			//There are no equivalence/belonging/attribute constraints
 				!this.nbrLocals() &&			//There are no locals involved
 				!this.ior3.length &&			//There are no choices to make
 				!this.veto.length &&			//Nothing oppose to this knowledge
 				this.minMult == this.maxMult)	//This is not an undefined knowledge
 			return nul.klg.unconditional(this.minMult);
 		//if(this.minMult < this.maxMult) this.undefined = nul.execution.name.gen('klg.undefined');
 		//No need : name differenciate different knowledges already
 		var rv = this.callSuper();
 		if(rv === this) rv.summarised.access = acs;
 		return rv;
 	}
});

if(nul.action) nul.localsMdl = new JS.Module(/** @lends nul.xpr.knowledge# */{
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
 		if('undefined'== typeof ndx) ndx = this.locals.length;
		this.locals[ndx] = name;
 		return new nul.obj.local(this.name, ndx, name);
 	}
 	
}); else nul.localsMdl = new JS.Module(/** @ignore */{
	/** @ignore */
	useLocalNames: function() {},
	/** @ignore */
	emptyLocals: function() { return 0; },
	/** @ignore */
	concatLocals: function(klg) { this.locals += klg.locals; },
	/** @ignore */
	freeLastLocal: function() { --this.locals; },
	/** @ignore */
	nbrLocals: function() { return this.locals; },
	/** @ignore */
 	newLocal: function(name, ndx) {
 		if('undefined'== typeof ndx) ndx = this.locals++;
 		return new nul.obj.local(this.name, ndx);
 	}
});

nul.xpr.knowledge.include(nul.localsMdl);
