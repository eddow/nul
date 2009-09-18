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
	initialize: function(fznsName) {
		if(nul.debug.assert) this.fznsName = fznsName;
 		//Create new objects each time
 		this.eqCls = [];		//Array of equivalence classes.
 		this.access = {};		//Access from an obj.ndx to an eq class it's in.
 		this.ior3 = [];	//List of unchoosed IOR3
 		this.name = ++nul.xpr.knowledge.nbr;
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
 	 * @param obj nul.obj or int Object whose information is brought or eqCls index
 	 * @return nul.xpr.knowledge.eqClass
 	 */
	inform: function(ndx) {
		this.modify();
		
		var obj;
		if(ndx && ndx.expression) ndx = this.access[obj=ndx];
		if(ndx || 0=== ndx) return new nul.xpr.knowledge.eqClass(this, ndx, this.eqCls[ndx]);

 		var rv = new nul.xpr.knowledge.eqClass(this, ndx);
 		this.eqCls.push(rv);
 		if(obj) rv.isEq(obj);
 		return rv;
	},
 	
//////////////// publics

 	/**
 	 * Gets a value out of these choices
 	 * @param choices Array of nul.xpr.possible
 	 * @return nul.xpr.object nul.obj.ior3 indeed
 	 */
 	hesitate: function(choices) {
 		this.modify();
		switch(choices.length) {
		case 0:
			nul.fail('No more choices');
		case 1:
			this.merge(choices[0].knowledge);
			return choices[0].value;
		default:
			var vals = [];
			var klgs = [];
			map(choices, function() {
				vals.push(this.value);
				klgs.push(this.knowledge);
			});
			try { return new nul.obj.ior3(this.name, vals, this.ior3.length); }
	 		finally { this.ior3.push(new nul.xpr.knowledge.ior3(klgs)); }
		}
	},
 	
 	/**
 	 * Move the local-space so it merge with the local-space of klg.
 	 * TODO: Also rename extension objects
 	 * @param fzns nul.xpr.fuzziness
 	 * @return boolean success
 	 */
 	stepUp: function(fzns, val) {
		this.use();
		
 		if(nul.debug.assert) assert(this.fuzziness.name != fzns.name, 'stepUp effectively chage fuzziness');
 		var brwsr = new nul.xpr.knowledge.stepUp
 			(this.fuzziness.name, fzns.name, fzns.locals.length);
 		fzns.locals.pushs(this.fuzziness.locals);
 		var rv = brwsr.browse(this) || this.modifiable();
 		return val?new nul.xpr.possible(brwsr.browse(val), rv):rv;
 	},
 	
 	/**
 	 * Know all what klg knows
 	 * Note: share the fuziness with klg
 	 * @return nul.xpr.knowledge
 	 * @throws nu.failure
 	 */
 	merge: function(klg, val) {
 		this.modify(); klg.use();
 		if(nul.debug.assert) assert(this.fznsName==klg.fuzziness.name, 'Merged knowledge share fuzziness');

 		var brwsr = nul.xpr.knowledge.ior3merge(klg.name, this.name, this.ior3.length);
		klg = brwsr.browse(klg);

 		for(var ec in klg.eqCls) if(cstmNdx(ec) && klg.eqCls[ec]) {
 			var unf = this.unify(klg.eqCls[ec].equivalents), blg = null;
 			if(unf) blg = this.belong(unf, klg.eqCls[ec].belongs);
 			if(!blg) return nul.fail('Knowledge merging');
 		}
		this.ior3.pushs(klg.ior3);
 		
 		return val?new nul.xpr.possible(brwsr.browse(val), this):this;
 	},

 	/**
 	 * Know that all the arguments are unifiable
 	 * Modifies the knowledge
 	 * @param JsNulObj
 	 * @return JsNulObj The replacement value for all the given values
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
	 			try { return this.eqCls[eqClss[eqx]].mergeTo(dstEqCls); }
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
 	 * Know that 'e' is in the set 's'.
 	 * Modifies the knowledge
 	 * @return The replacement value for 'e' or nothing if inclusion failed.
 	 * @throws nul.failure
 	 */
 	belong: function(e, ss) {
 		this.modify(); e.use();
		
 		ss = beArrg(arguments, 1);
 		var dstEC = this.inform(e);
 		for(var s in ss) if(cstmNdx(s)) dstEC.isIn(ss[s]);
 		return dstEC.taken();
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
		if(nul.debug.assert) rv.fznsName = rv.fuzziness.name;
		rv.eqCls = clone1(rv.eqCls);
		rv.access = clone1(rv.access);
		rv.ior3 = clone1(rv.ior3);
		return rv;
	},
 	built: function($super, fzns) {
		//TODO: vider les eqCls vides
		if(!fzns) {
			//Built a context that has been 'modifiable'
			if(nul.debug.assert) assert(this.fuzziness, 'Build a modified or give a fuzziness');
			var rv = new nul.xpr.knowledge(this.fuzziness.name);
			this.summarise();
			rv.merge(this);
			return rv.built(this.fuzziness);
		}
 		if(nul.debug.assert) {
 			assert(this.fznsName==fzns.name, 'Promised fuzziness arrived');
 			delete this.fznsName;
 		}
 		this.fuzziness = fzns;
 		if(trys(this.eqCls, function(ndx, obj) { return !!obj; }) &&
 			!fzns.locals.length && !this.ior3.length) return; 
 		return $super();
 	},
});

nul.xpr.knowledge.stepUp = Class.create(nul.browser.bijectif, {
	initialize: function(srcFznsName, dstFznsName, deltaLclNdx) {
		this.srcFznsName = srcFznsName;
		this.dstK = dstFznsName;
		this.deltaLclNdx = deltaLclNdx;
	},
	transform: function(xpr) {
		if('local'== xpr.type && this.srcFznsName== xpr.fznsName)
			return new nul.obj.local(this.dstFznsName, 
				'number'== typeof xpr.lclNdx ?
					xpr.lclNdx+this.deltaLclNdx :
					xpr.lclNdx,
				xpr.dbgName)
	},
});

nul.xpr.knowledge.ior3merge = Class.create(nul.browser.bijectif, {
	initialize: function(srcKlgName, dstklgName, deltaNdx) {
		this.srcKlgName = srcKlgName;
		this.dstklgName = dstklgName;
		this.deltaNdx = deltaNdx;
	},
	transform: function(xpr) {
		if('ior3'== xpr.type && this.srcKlgName== xpr.klgName)
			return new nul.obj.ior3(this.dstklgName, xpr.ior3ndx+this.deltaNdx, xpr.values);
	},
});