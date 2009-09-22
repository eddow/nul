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
        if(nul.debug) this.locals = [];
        else this.locals = 0;
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
 	
 	valBrowsed: function(brwsr, val, rv) {
 		return val?(new nul.xpr.possible(brwsr.browse(val), rv)).built():rv;
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
			this.merge(choices[0].knowledge);
			return choices[0].value;
		default:
			var vals = [];
			var klgs = [];
			map(choices, function() {
				if('possible'== this.type) {
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

 		if(nul.debug) this.locals.pushs(klg.locals);
 		else klg.locals += klg.locals;

 		var brwsr = new nul.xpr.knowledge.stepUp(klg, this, this.ior3.length, this.locals.length);
		
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
		return dstEqCls.taken();
 	}.describe(function() {
 		return 'Unification : ' +
 			map(beArrg(arguments), function() { return this.toHtml(); }).join(' = ');
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
 	 * Remove any information about locals or ior3s that are not refered anymore
 	 * @param {nul.dependance} deps
 	 * @return nul.xpr.knowledge
 	 */
 	prune: function(deps) {
 		//TODO1
 		return this;
 	},
 	
//////////////// Locals management

	concat: function(klg) {
	},
	
	/**
	 * Get the debug name of a local
	 */
	dbgName: function(ndx) {
		if(nul.debug) return this.locals[ndx];
	},

	/**
	 * Register a new local
	 */
 	newLocal: function(name, ndx) {
 		if('undefined'== typeof ndx)
 			ndx = nul.debug?this.locals.length:(this.locals++);
		if(nul.debug) this.locals[ndx] = name;
 		return new nul.obj.local(this.name, ndx)
 	},
	
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
	sum_isFixed: function() { return !this.ior3.length && !this.eqCls.length; },

	sum_index: function() {
		return this.indexedSub(this.name, this.eqCls, this.ior3);
	},

//////////////// nul.expression implementation
	
	type: 'klg',
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
	/**
	 * @param {bool} clean True when it is sure no equivalence class can be simplified or crossed
	 */
 	built: function($super, clean) {
		if(!clean) {
			//rechew the knowledge. Perhaps an item in the equivalence class was replaced.
			var nwEqCls = this.eqCls;
			this.eqCls = [];
			this.access = {};
			this.addEqCls(nwEqCls);
			//TODO1: repasser les belongs par xpr.has(o)
		}
		for(var i=0; i<this.eqCls.length;)
			if(this.eqCls[i]) ++i;
			else this.eqCls.splice(i,1);
		delete this.access;	//If no delete, redo the index after this.eqCls.splice
 		if(!this.eqCls.length && !this.locals.length && !this.ior3.length) return; 
 		return $super();
 	},

});

nul.xpr.knowledge.stepUp = Class.create(nul.browser.bijectif, {
	initialize: function($super, srcKlg, dstKlg, deltaIor3ndx, deltaLclNdx) {
		this.srcKlg = srcKlg;
		this.dstklg = dstKlg;
		this.deltaIor3ndx = deltaIor3ndx;
		this.deltaLclNdx = deltaLclNdx;
		$super();
	},
	transform: function(xpr) {
		//TODO2: use klg only instead of klg.name ?
		if('local'== xpr.type && this.srcKlg.name == xpr.klgRef )
			return new nul.obj.local(this.dstKlg.name, 
				'number'== typeof xpr.ndx ?
					xpr.ndx+this.deltaLclNdx :
					xpr.ndx);
		if('ior3'== xpr.type && this.srcKlg.name  == xpr.klgRef )
			return new nul.obj.ior3(this.dstklg.name, xpr.ndx+this.deltaIor3ndx, xpr.values);
		return nul.browser.bijectif.unchanged;
	},
});
