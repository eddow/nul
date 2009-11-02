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
		 * Describe the dependance that are kept even if it never appears
		 * @type Number
		 */
		this.rocks = new nul.dependance();
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
 		//this.mult = 1;	//TODO O: 'mult' optimisation
 	},

//////////////// privates

 	/**
 	 * Called when this knowledge leads to impossibility
 	 */
 	impossible: function() {},
 	
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
		this.modify(); nul.xpr.use(ec, 'nul.klg.eqClass');
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
	 * @param {nul.klg.eqClass} ec
	 * @return {nul.klg.eqClass} ec
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
	 * @param {nul.klg.eqClass} ec
	 * @return {nul.klg.eqClass} ec
	 */
	removeEC: function(ec) {
 		this.modify(); nul.xpr.use(ec, 'nul.klg.eqClass');
		var i = this.eqCls.indexOf(ec);
 		if(nul.debug.assert) assert(0<=i, 'Unaccede accessed class')
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
 	 * Begin modification of an equivalence class
 	 * @param {nul.xpr.object} obj Object whose information is brought
 	 * @return equivalence class to re-add to the knowledge
 	 */
	inform: function(obj) {
		this.modify(); nul.obj.use(obj);
		
		var ec = this.access[obj];
		if(ec) return this.freeEC(ec);
 		return new nul.klg.eqClass(obj);
	},
 	
 	/**
 	 * Add the given equivalence classes in this knowledge
 	 * @param {nul.klg.eqClass[]} eqCls
 	 * @throws {nul.failure}
 	 */
 	addEqCls: function(eqCls) {
 		for(var ec in eqCls) if(cstmNdx(ec)) this.unify(nul.xpr.use(eqCls[ec], 'nul.klg.eqClass'));
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
		rv.also(this.rocks);
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
				if(nul.xpr.possible.is(p)) {
					klg = p.knowledge.modifiable();
					nul.xpr.mod(klg, 'nul.xpr.knowledge')
					p = p.value;
				} else klg = new nul.xpr.knowledge();				
				klg.unify(p, rv);
				klgs.push(klg.built());	//TODO 2: prune ?
			});
	 		this.ior3.push(new nul.klg.ior3(klgs));
	 		return rv;
		}
	},
 	
 	/**
 	 * Know all what klg knows
 	 * @param {nul.xpr.knowledge} klg
 	 * @param {nul.xpr.object} val [optional] Value to modify too
 	 * @return {nul.xpr.object} Value expressed under this knowledge if 
 	 * @return {nul.klg.stepUp} Browser to parse further values if no value were specified
 	 * @throws {nul.failure}
 	 */
 	merge: function(klg, val) {
 		if(nul.klg.never== klg) nul.fail('Merging failure');
 		if(nul.klg.always== klg) return val;
 		
 		this.modify(); nul.xpr.use(klg, 'nul.xpr.knowledge');

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
 	 * @throws {nul.failure}
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
 	 * Retrieve the attribute we know for 'e'
 	 * @param {nul.xpr.object} e
 	 * @param {nul.xpr.String} anm
 	 * @return {nul.xpr.object} The attribute 'anm' stated for e 
 	 * @return {null} There is no information about this attribute 
 	 * @throws {nul.failure}
 	 */
 	attribute: function(e, anm) {
 		nul.obj.use(e);
 		if(e.defined) return e.attribute(anm, this);
		var ec = this.access[e];
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
		return rv;	//TODO 2
		acsTbl = map(acsTbl);
		var used;
		do {
			used = false;
			for(var v in this.access) {
				if(acsTbl[v]) {
					var nec = this.removeEC(this.access[v]).modifiable();
					if(nec.define(acsTbl[v], this)) {
						//rv.push(v);
						used = true;
					}
					this.accede(nec.built());
					//this.unify(acsTbl[v], this.access[v]);
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
		if(nul.klg.never!= klg) this.veto.push(klg);
		return this;
	},

//////////////// Existence summaries

	maxXst: nul.summary('maxXst'), 	
	minXst: nul.summary('minXst'), 	
	sum_maxXst: function() {
		if(0<this.nbrLocals()) return pinf;
		var rv = 1;
		for(var h in this.ior3) if(cstmNdx(h))
			rv *= this.ior3[h].maxXst();
		return rv;
	},
	sum_minXst: function() {
		if(this.eqCls.length || this.veto.length) return 0;
		if(0<this.nbrLocals()) return pinf;
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
		'eqCls': {type: 'nul.klg.eqClass', bunch: true},
		'ior3': {type: 'nul.klg.ior3', bunch: true},
		'veto': {type: 'nul.xpr.knowledge', bunch: true}
	},
	modifiable: function($super) {
		var rv = $super();
		rv.locals = map(this.locals);
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
		//if(0== this.mult) return nul.klg.never;
 		if(this.isFixed() && nul.klg.always) return nul.klg.always; 
 		return $super();
 	},
 	isFixed: function() {
 		return (!this.eqCls.length && !this.nbrLocals() && !this.ior3.length && !this.veto.length);
 	}
});

if(nul.debug) nul.xpr.knowledge.addMethods(/** @lends nul.xpr.knowledge# */{

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
 	
}); else nul.klg.addMethods( /** @ignore */{
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

/**
 * Knowledge management helpers
 * @namespace
 */
nul.klg = {
	special: Class.create(nul.xpr.knowledge, /** @lends nul.klg.special# */{
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
	})
};
/**
 * Special knowledge meaning something that is never verified
 */
nul.klg.never = new nul.klg.special({
		name: 'Never',
	modifiable: function() { nul.fail('No fewer than never'); },
	wrap: function(value) { return nul.xpr.failure; },
	on: 0
});
/**
 * Special knowledge meaning something that is always verified
 */
nul.klg.always = new nul.klg.special({
	name: 'Always',
	modifiable: function() { return new nul.xpr.knowledge(); },
	wrap: function(value) { return new nul.xpr.possible.cast(value); },
	on: 1
});

/**
 * Return the knowledge knowing all that ops are equal
 */
nul.klg.unification = function(objs) {
	objs = beArrg(arguments);
	var klg = new nul.xpr.knowledge();
	klg.unify(objs);
	return klg.built();
};

/**
 * Return the wrapped singleton when o is val
 * @param {nul.xpr.object} o
 * @param {nul.xpr.object} val
 * @return {nul.xpr.possible[]}
 * @throws {nul.failure}
 */
nul.klg.has = function(o, val) {
	var klg = new nul.xpr.knowledge();
	return [klg.wrap(klg.unify(o, val))];
};

nul.xpr.knowledge.addMethods({failure: nul.klg.never});
