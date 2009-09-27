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
 		this.eqCls = [];		//Array of equivalence classes.
 		this.access = {};		//Access from an obj.ndx to an eq class it's in.
 		this.ior3 = [];	//List of unchoosed IOR3
 		this.name = klgName || ++nul.xpr.knowledge.nameSpace;
 		this.mult = 1;
 	},

//////////////// privates

	/**
	 * Modify eqCls and set accesses
	 */
 	accede: function(ecNdx, ec) {
		this.modify();
 		if(ec) ec.use();
		
 		this.eqCls[ecNdx] = ec;
		for(var n in this.access) if(this.access[n] == ecNdx) delete this.access[n];
		if(ec) {
			var eqs = this.eqCls[ecNdx].equivalents;
			for(var unfd in eqs) if(cstmNdx(unfd))
				this.access[eqs[unfd]] = ecNdx;
		}
		return ec;
 	},
 	
 	/**
 	 * Begin modification of an equivalence class
 	 * @param {nul.obj or int} obj Object whose information is brought or eqCls index
 	 * @return nul.xpr.knowledge.eqClass
 	 */
	inform: function(ndx) {
		this.modify();
		
		var obj;
		if(ndx && ndx.expression) ndx = this.access[obj=ndx];
		if(ndx || 0=== ndx) return new nul.xpr.knowledge.eqClass(this, ndx, this.eqCls[ndx]);

 		var rv = new nul.xpr.knowledge.eqClass(this, this.eqCls.length);
 		this.eqCls.push(rv);
 		if(obj) rv.isEq(obj);
 		return rv;
	},
 	
 	/**
 	 * Add the given equivalence classes in this knowledge
 	 * @param {array(nul.xpr.knowledge.eqClass)} eqCls
 	 * @throws nul.failure
 	 */
 	addEqCls: function(eqCls) {
 		nul.xpr.use(eqCls, nul.xpr.knowledge.eqCls);
 		for(var ec in eqCls) if(cstmNdx(ec) && eqCls[ec]) {
 			var unf = this.unify(eqCls[ec].equivalents), blg = null;
 			if(unf) blg = this.belong(unf, eqCls[ec].belongs);
 			if(!blg) return nul.fail('Knowledge chewing');
 		}
 	},
 	
 	/**
 	 * Remove any information about locals or ior3s that are not refered anymore
 	 * @param {nul.dependance.usage} deps
 	 */
 	pruned: function(value) {
 		this.modify();
 		var i;
 		var deps = this.usage(value);
 		
 		//Remove eqCls members that are alone to refer a local
 		for(i in deps.local) if(1== deps.local[i].number)	//If the local 'i' is refered one
 			for(var c=0; c<this.eqCls.length;)
 				if(this.eqCls[c].dependance().usage(this).local[i]) {
 					this.eqCls[c] = this.eqCls[c].unused(new nul.obj.local(this.name, 0+i));
 					if(this.eqCls[c]) ++c;
 					else this.eqCls.splice(c, 1);
 					deps = this.usage(value);	//TODO4: perhaps not needed to recompute all
 				} else ++c;
 		
		//Remove unrefered ior3 tautologies, affect the 'mult' property 
 		for(i=0; i<this.ior3.length; ++i) if(!deps.ior3[i]) {
 			var nior3 = this.ior3[i].modifiable();
 			if(nior3.unrefer()) this.ior3[i] = nior3.built().placed(this);
 		}
 		
 		//Remove trailing empty ior3s (not more to preserve indexes)
 		while(this.ior3.length && !this.ior3[this.ior3.length-1]) this.ior3.pop();
 		this.useIor3Choices(deps.ior3);
 		
 		//Remove trailing unrefered locals (not more to preserve indexes)
		while(this.nbrLocals() && !deps.local[this.nbrLocals()-1]) this.freeLastLocal();
 		this.useLocalNames(deps.local);
 	},
 	
 	/**
 	 * Gets the dependance of an hypothetic possible while this knowledge is not summarised.
 	 */
 	usage: function(value) {
		var rv = new nul.dependance();
		var comps = [];
		comps.pushs(this.eqCls, this.ior3, [value]);
		for(var c=0; c<comps.length; ++c)
			rv.also(comps[c].dependance());
		return rv.usage(this);
	},
 
 //////////////// publics

 	/**
 	 * Gets a value out of these choices
 	 * @param {array} choices of nul.xpr.possible
 	 * @return nul.xpr.object nul.obj.ior3 indeed
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
				if('possible'== this.expression) {
					vals.push(this.value);
					klgs.push(this.knowledge);
				} else {
					vals.push(this);
					klgs.push(null);
				}
			});
			try { return new nul.obj.ior3(this.name, this.ior3.length, vals); }
	 		finally { this.ior3.push(new nul.xpr.knowledge.ior3(klgs)); }
		}
	},
 	
 	/**
 	 * Know all what klg knows
 	 * @return nul.xpr.knowledge
 	 * @throws nul.failure
 	 */
 	merge: function(klg, val) {
 		this.modify(); nul.xpr.use(klg, nul.xpr.knowledge);

 		var brwsr = new nul.xpr.knowledge.stepUp(klg, this, this.ior3.length, this.nbrLocals());
		
 		this.concatLocals(klg);
		klg = brwsr.browse(klg);

		this.addEqCls(klg.eqCls);
		this.ior3.pushs(klg.ior3);
 		
 		if(val) return brwsr.browse(val);
 	},

 	/**
 	 * Know that all the arguments are unifiable
 	 * Modifies the knowledge
 	 * @param {nul.xpr.object}
 	 * @return nul.xpr.object The replacement value for all the given values
 	 * @throws nul.failure
 	 */
 	unify: function(a, b) {
 		this.modify();
 		var a = beArrg(arguments);
 		//1- a are JnNulObj : gathering eqClasses so that we have a list of eqClasses to merge and a list
 		// of solo objects
 		var eqClss = {};
 		var solos = [];
 		for(var i=0; i<a.length; ++i) {
 			if('undefined'!= typeof this.access[a[i]]) eqClss[this.access[a[i]]] = true;
 			else solos.push(a[i]);
 		}	//TODO2: null.obj.extension management
 		eqClss = keys(eqClss);
 		var dstEqCls = this.inform(eqClss[0]);
 		if(eqClss.length) eqClss.shift();
 		if(trys(eqClss, function(i, eqx) {
	 			try { return dstEqCls.merge(this.eqCls[eqClss[eqx]]); }
	 			finally { this.eqCls[eqClss[eqx]] = null; }
	 		}) ||
			trys(solos, function() { return dstEqCls.isEq(this); }))
			nul.fail('Unification', a)
		nul.debug.log('Knowledge')('neq',
			dstEqCls.prototyp || '&phi;',
			dstEqCls.values);
		return dstEqCls.taken();
 	}.describe('Unification', function() {
 		return map(beArrg(arguments), function() { return this.dbgHtml(); }).join(' = ');
 	}),
 	
 	 	
	/**
 	 * Know that 'e' is in the sets 'ss'.
 	 * Modifies the knowledge
 	 * @return The replacement value for 'e' or nothing if inclusion failed.
 	 * @throws nul.failure
 	 */
 	belong: function(e, ss) {
 		this.modify(); e.use(); nul.obj.use(ss);
		
 		ss = beArrg(arguments, 1);
 		if(!ss.length) return e;
 		var dstEC = this.inform(e);
 		for(var s in ss) if(cstmNdx(s)) dstEC.isIn(ss[s]);
 		return dstEC.taken();
 	},

 	/**
 	 * Get a pruned possible
 	 * @param {nul.xpr.object} value
	 * @return nul.xpr.possible or  nul.xpr.object
 	 */
 	wrap: function(value) {
 		this.modify(); nul.obj.use(value);
 		
 		//Represent equivalence classes in values and eqCls
 		for(var i=0; i<this.eqCls.length; ++i) {
 			var representer = this.eqCls[i].represent();
 			value = representer.browse(value)
 			for(var j=0; j<this.eqCls.length; ++j) if(i!=j)
 				this.eqCls[j] = nul.browser.bijectif.firstChange(
 					representer.recursion(this.eqCls[j]), this.eqCls[j]);
 		}
 		
 		this.unaccede();
 		this.pruned(value);
 		
 		var klg = this.chew();
 		if(klg.isFixed()) return value;
 		return new nul.xpr.possible(value, klg);
 	}.describe('Wrapping', function(value) {
		return value.dbgHtml();// + ' ; ' + this.dbgHtml();
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
		if(this.eqCls.length) return 0;
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
	components: ['eqCls','ior3'],
	modifiable: function($super) {
		var rv = $super();
		rv.eqCls = [];
		rv.access = {};
		for(var i=0; i<this.eqCls.length; ++i)
			rv.accede(i, this.eqCls[i]);
		rv.ior3 = clone1(rv.ior3);
		return rv;
	},
	
	chew: function($super) {
		var nwEqCls = this.eqCls;
		this.eqCls = [];
		this.access = {};
		this.addEqCls(nwEqCls);
			//TODO3: repasser les belongs par xpr.has(o)
		return $super();
	},
	
	/**
	 * Forget the accesses and remove empty equivalence classes.
	 */
	unaccede: function() {
		delete this.access;
		this.eqCls = maf(this.eqCls);
	},
	
	/**
	 * @param {bool} clean True when it is sure no equivalence class can be simplified or crossed
	 */
 	fix: function($super) {
 		this.unaccede();
 		return $super();
 	},
 	isFixed: function() {
 		return (!this.eqCls.length && !this.nbrLocals() && !this.ior3.length);
 	},
	placed: function($super, prnt) {
 		if(this.isFixed()) return; 
		return $super(prnt);
	},

});

nul.xpr.knowledge.stepUp = Class.create(nul.browser.bijectif, {
	initialize: function($super, srcKlg, dstKlg, deltaIor3ndx, deltaLclNdx) {
		this.srcKlg = srcKlg;
		this.dstKlg = dstKlg;
		this.deltaIor3ndx = deltaIor3ndx;
		this.deltaLclNdx = deltaLclNdx;
		$super();
	},
	transform: function(xpr) {
		//TODO2: use klg only instead of klg.name ?
		if('local'== xpr.expression && this.srcKlg.name == xpr.klgRef )
			return new nul.obj.local(this.dstKlg.name, 
				'number'== typeof xpr.ndx ?
					xpr.ndx+this.deltaLclNdx :
					xpr.ndx,
					xpr.dbgName);
		if('ior3'== xpr.expression && this.srcKlg.name  == xpr.klgRef )
			return new nul.obj.ior3(this.dstKlg.name, xpr.ndx+this.deltaIor3ndx, xpr.values);
		return nul.browser.bijectif.unchanged;
	},
});

if(nul.debug) merge(nul.xpr.knowledge.prototype, {

	/**
	 * Use the ior3 choices to textualise ior3 references.
	 */
	useIor3Choices: function(keep) {
		for(var i=0; i<this.ior3.length; ++i)
			if(keep[i]) for(var l = 0; l<keep[i].length; ++l)
				keep[i][l].invalidateTexts(this.ior3[i]);
	},

	/**
	 * Remove the names of the unused locals.
	 * Use the local names to textualise locals references.
	 */
	useLocalNames: function(keep) {
		for(var i=0; i<this.locals.length; ++i)
			if(!keep[i]) this.locals[i] = null;
			else for(var l = 0; l<keep[i].length; ++l)		//TODO4: useful ? locals should have correct dbgName now
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