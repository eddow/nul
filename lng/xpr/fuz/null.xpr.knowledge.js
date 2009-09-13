/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

 nul.xpr.knowledge = Class.create(nul.xpr, {
	fuzzy: true,
 	initialize: function(prnt) {
 		
 		//Create new objects each time
 		this.locals = [];	//dbgNames, could remember just the length (as an int) if no debug info needed
 		this.eqCls = [];	//Array of equivalence classes.
 		this.access = {};	//Access from an obj.ndx to an eq class it's in.
 		
 		this.prnt = prnt;
		this.name = ++nul.xpr.knowledge.ndx;
 	},
 	/**
 	 * Copy the infos of klg in here.
 	 */
 	copy: function(klg) {
 		this.locals = klg.locals;
 		this.eqCls = klg.eqCls;
 		this.access = klg.access;
 		this.name = klg.name;	//TODO2: let or not ?
 		return this;
 	},
 	/**
 	 * Creates an equivalence class
 	 */
 	newEqClass: function(v) {
 		var rv = new nul.xpr.knowledge.eqClass();
 		this.eqCls.push(rv);
 		if(v) {
 			rv.isEq(v);
 			this.index(this.eqCls.length - 1);
 		}
 		return rv;
 	},
 	index: function(ecNdx) {
 		var ec = this.eqCls[ecNdx];
 		if(ec.prototyp) this.access[ec.prototyp.ndx()] = ecNdx;
 		for(var i=0; i<ec.values.length; ++i)
 			this.access[ec.values[i].ndx()] = ecNdx;
 	},
 	/**
 	 * Move the local-space so it merge with the local-space of klg.
 	 * TODO: Also rename extension objects
 	 * side-effect: new locals in 'klg'
 	 */
 	stepUp: function(klg) {
 		var brwsr = new nul.browser.stepUp(this.name, klg.name, klg.locals.length);
 		klg.locals.pushs(this.locals);
 		return brwsr.browse(this) || this; 
 	},
 	/**
 	 * Know all what 'klg' knows
 	 * @return possibles knowledge who knows both these knowledge.
 	 */
 	merge: function(klg) {
 		var rv = new nul.xpr.knowledge();
 		rv.copy(this);
 		klg = klg.stepUp(rv);
 		for(var ec in klg.eqCls) if(cstmNdx(ec)) {
 			var unf = rv.unify(klg.eqCls[ec].equivalents()), blg = null;
 			if(unf) blg = rv.belong(unf, klg.eqCls[ec].belongs);
 			if(!blg) return [];
 		}
 		if(klg.value) rv.value = klg.value;
 		return [rv];
 	},
 	/**
 	 * Know that all the arguments are unifiable
 	 * Modifies the knowledge
 	 * @param JsNulObj or JsNulFuzzyObj
 	 * @return JsNulObj The replacement value for all the values or nothing if unification failed.
 	 */
 	unify: function(a, b) {
 		var a = beArrg(arguments);
 		//1- a are JnNulObj : gathering eqClasses so that we have a list of eqClasses to merge and a list
 		// of solo objects
 		var eqClss = {};
 		var solos = [];
 		for(var i=0; i<a.length; ++i) {
 			if(a[i].fuzzy) a[i] = this.merge(a[i]).value;
 			var ndx = a[i].ndx();
 			if('undefined'!= typeof this.access[ndx]) eqClss[this.access[ndx]] = true;
 			else solos.push(a[i]);
 		}	//TODO2: null.obj.extension management
 		eqClss = keys(eqClss);
 		var dstEqClsNdx = (0+eqClss[0]) || this.eqCls.length;
 		var dstEqCls = eqClss.length?
 			this.eqCls[eqClss.shift()]:
 			this.newEqClass();
 		var failure = trys(eqClss, function(i, eqx) {
	 			try { return this.eqCls[eqClss[eqx]].mergeTo(dstEqCls); }
	 			finally { this.eqCls[eqClss[eqx]] = null; }
	 		}) ||
			trys(solos, function() { return dstEqCls.isEq(this); });
 		if(!failure) {
 			//Refresh access
 			var eqs = dstEqCls.equivalents();
 			for(var unfd in eqs) if(cstmNdx(unfd))
 				this.access[eqs[unfd].ndx()] = dstEqClsNdx;
 			return dstEqCls.good();
 		}
 		delete this.locals;
 		delete this.eqCls;
 		delete this.access;
 	}.describe(function() {
 		return 'Unification : ' +
 			map(beArrg(arguments), function() { return this.toHtml(); }).join(' = ');
 	}),
	/**
 	 * Know that 'e' is in the set 's'.
 	 * Modifies the knowledge
 	 * @return The replacement value for 'e' or nothing if inclusion failed.
 	 */
 	belong: function(e, ss) {
 		ss = beArrg(arguments, 1);
 		var ndx = e.ndx();
 		var dstEC = this.access[ndx]?
 			this.eqCls[this.access[ndx]]:
 			this.newEqClass(e);
 		for(var s in ss) if(cstmNdx(s)) dstEC.isIn(s);
 	},
 	//TODO2: end the changes to the parent, so he can notify with more discovered consequent knowledge.
 	newLocal: function(name, ndx) {
 		if('undefined'== typeof ndx) {
 			ndx = this.locals.length;
 			this.locals.push(name);
 		}
 		return new nul.obj.local(this.name, ndx, name)
 	},
	maxXst: function() { return this.locals.length?pinf:1; },
	minXst: function() { return this.eqCls.length?0:this.maxXst(); },
	fixed: function() { return !this.locals.length && !this.eqCls.length; },

//////////////// nul.xpr implementation
	
	type: 'klg',
	//TODO: toHtml show locals
	toText: function(txtr) {
		return map(this.eqCls, function() { return this.toText(txtr); }).join('; ');
	},
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
		if(o.attr) {
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
		//TODO3 : virer les intersections
		this.belongs.push(s);
	},
	/**
	 * Add this to another whole equivalence class
	 * @param o JsNulEqClass
	 * @return bool failure
	 */
	mergeTo: function(c) {
		var rv = this.prototyp?c.isEq(this.prototyp):false;
		return rv ||
			trys(this.values, function() { return c.isEq(this); }) ||
			trys(this.belongs, function() { return c.isIn(this); });
	},
	
//////////////// nul.xpr implementation
	
	type: 'eqCls',
	toText: function(txtr) {
		var rv = '('+map(this.equivalents(), function() { return this.toText(txtr); }).join(' = ')+')';
		if(!this.belongs.length) return rv;
		return rv + ' in (' + map(this.belongs, function() { return this.toText(txtr); }).join(', ')+')';
			
	},
	components: ['prototyp', 'values', 'belongs'],
});
