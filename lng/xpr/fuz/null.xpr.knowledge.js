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
nul.xpr.knowledge = Class.create(nul.xpr.fuzzy, {
	initialize: function($super, fzns) {
 		$super(fzns);
 		//Create new objects each time
 		this.eqCls = [];		//Array of equivalence classes.
 		this.access = {};		//Access from an obj.ndx to an eq class it's in.
 		this.hesitations = [];	//List of unchoosed IOR3
 	},

//////////////// privates

 	/**
 	 * Creates an equivalence class
 	 */
 	newEqClass: function(v) {
 		this.modify();
 		var rv = new nul.xpr.knowledge.eqClass();
 		this.eqCls.push(rv);
 		if(v) {
 			rv.isEq(v);
 			this.accede(this.eqCls.length - 1);
 		}
 		return rv;
 	},
 	accede: function(ecNdx, ec) {
 		this.modify();
		var eqs = (ec || this.eqCls[ecNdx]).equivalents();
		for(var unfd in eqs) if(cstmNdx(unfd))
			this.access[eqs[unfd]] = dstEqClsNdx;
 	},
 	
//////////////// internals

 	/**
 	 * Copy the infos of klg in here.
 	 */
 	copy: function(klg) {
 		this.modify();
 		this.eqCls = klg.eqCls;
 		this.access = klg.access;
 		this.hesitations = klg.hesitations;
 		this.name = klg.name;	//TODO2: let or not ?
 		return this;
 	},
 	
 	/**
 	 * Register an IOR3 for this knowledge
 	 */
 	hesitate: function(choices) {
 		this.hesitations.push(choices);
 	},
 	
//////////////// publics

 	/**
 	 * Move the local-space so it merge with the local-space of klg.
 	 * TODO: Also rename extension objects
 	 * @param fzns nul.xpr.fuzziness
 	 * @return boolean success
 	 */
 	stepUp: function(fzns) {
 		if(nul.debug.assert) assert(this.fzns.name != fzns.name, 'stepUp effectively chage fuzziness')
 		fzns.modify();
 		var brwsr = new nul.browser.stepUp(this.name, fzns.name, fzns.locals.length);
 		fzns.locals.pushs(this.locals);
 		return brwsr.browse(this) || this; 
 	},
 	
 	/**
 	 * Know all what klg knows
 	 * Note: share the fuziness with klg
 	 * @return boolean Success
 	 */
 	merge: function(klg) {
 		this.modify();
 		if(nul.debug.assert) assert(this.fzns===klg.fzns, 'Merged knowledge share fuzziness')
 		for(var ec in klg.eqCls) if(cstmNdx(ec)) {
 			var unf = this.unify(klg.eqCls[ec].equivalents()), blg = null;
 			if(unf) blg = this.belong(unf, klg.eqCls[ec].belongs);
 			if(!blg) return false;
 		}
 		return toAdd.value||true;
 	},

 	/**
 	 * Know that all the arguments are unifiable
 	 * Modifies the knowledge
 	 * @param JsNulObj or JsNulFuzzyObj
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
 			if(a[i].fuzzy) a[i] = a[i].stepUp(this);
 			if('undefined'!= typeof this.access[a[i]]) eqClss[this.access[a[i]]] = true;
 			else solos.push(a[i]);
 		}	//TODO2: null.obj.extension management
 		eqClss = keys(eqClss);
 		var dstEqClsNdx = (0+eqClss[0]) || this.eqCls.length;
 		var dstEqCls = eqClss.length?
 			this.eqCls[eqClss.shift()]:
 			this.newEqClass();
 		if(trys(eqClss, function(i, eqx) {
	 			try { return this.eqCls[eqClss[eqx]].mergeTo(dstEqCls); }
	 			finally { this.eqCls[eqClss[eqx]] = null; }
	 		}) ||
			trys(solos, function() { return dstEqCls.isEq(this); }))
			nul.fail('Unification', a)
		this.accede(dstEqClsNdx);
		return dstEqCls.good();
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
 		this.modify();
 		ss = beArrg(arguments, 1);
 		var asrtSets = [];
 		for(var s in ss) if(cstmNdx(s)) {
 			var fltrd = ss[s].has(e, this);
 			if(fltrd) e = fltrd;
 			else asrtSets.push(ss[s]);
 		}
 		if(asrtSets.length) {
	 		var dstEC = this.access[e]?
	 			this.eqCls[this.access[e]]:
	 			this.newEqClass(e);
	 		for(var s in ss) if(cstmNdx(s)) dstEC.isIn(s);
 		}
 		return e;
 	},

//////////////// nul.xpr.fuzzy summaries

	sum_maxXst: function() {
		var rv = 1;
		for(var h in this.hesitations) if(cstmNdx(h))
			rv *= this.hesitations[h].maxXst();
		return rv;
	},
	sum_minXst: function() {
		if(this.eqCls.length) return 0;
		var rv = 1;
		for(var h in this.hesitations) if(cstmNdx(h))
			rv *= this.hesitations[h].minXst();
		return rv;
	},
	sum_isFixed: function() { return !this.hesitations.length && !this.eqCls.length; },

//////////////// nul.xpr implementation
	
	type: 'klg',
	components: ['eqCls'],
});

nul.xpr.knowledge.eqClass = Class.create(nul.xpr, {
	initialize: function(klg) {
		this.knowledge = klg;
	},
	prototyp: null,
	values: [],
	belongs: [],
	/**
	 * Gets a good way to represent the values of this equivalence class
	 */
	good: function() {
		return this.prototyp || this.values[0];
	},
	/**
	 * Gets a list of all the items that are declared equivalent here
	 */
	equivalents: function() {
		return this.prototyp?this.values.added(this.prototyp):this.values;
	},
	/**
	 * Add an object in the equivalence.
	 * @param o JsNulObj object to add
	 * @return bool failure
	 */
	isEq: function(o) {
 		this.modify();
		if(o.isDefined()) {
			if(this.prototyp) {
				var unf = this.prototyp.unify(o, this.knowledge);
				if(!unf) return true;
				if(true!== unf) this.prototyp = unf;
			} else this.prototyp = o;
		} else this.values.push(o);
	},
	/**
	 * Add an object as a belongs.
	 * @param o JsNulObj object that belongs the class
	 * @return bool failure
	 */
	isIn: function(s) {
 		this.modify();
		//TODO3 : virer les intersections
		this.belongs.push(s);
	},
	/**
	 * Add this to another whole equivalence class
	 * @param o JsNulEqClass
	 * @return bool failure
	 */
	mergeTo: function(c) {
 		c.modify();
		var rv = this.prototyp?c.isEq(this.prototyp):false;
		return rv ||
			trys(this.values, function() { return c.isEq(this); }) ||
			trys(this.belongs, function() { return c.isIn(this); });
	},
	
//////////////// nul.xpr.fuzzy implementation

 	built: function() {
 		for(ec in this.eqCls) ec.summarise();
 		this.summarise();
 		return this.isFixed()?null:this;
 	},

//////////////// nul.xpr implementation
	
	type: 'eqCls',
	components: ['prototyp', 'values', 'belongs'],
});
