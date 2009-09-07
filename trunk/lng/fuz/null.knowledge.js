/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

 nul.knowledge = Class.create({
	fuzzy: true,
 	initialise: function(prnt) {
 		this.prnt = prnt;
		this.name = ++nul.knowledge.ndx;
 	},
	locals: [],	//dbgNames, could remember just the length (as an int) if no debug info needed
 	eqCls: [],	//Array of equivalence classes.
 	access: {},		//Access from an obj.ndx to an eq class he's in
 	/**
 	 * Copy the infos of klg in here.
 	 */
 	copy: function(klg) {
 		this.locals = klg.locals;
 		this.eqCls = klg.eqCls;
 		this.access = klg.access;
 		this.name = klg.name;
 		return this;
 	},
 	/**
 	 * Creates an equivalence class
 	 */
 	newEqClass: function(v) {
 		var rv = new nul.knowledge.eqClass();
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
 	 * Know all what 'klg' knows
 	 * @return possibles knowledge who knows both these knowledge.
 	 */
 	merge: function(klg) {
 		//TODO1 : klg MAY be a fuzzy
 	},
 	/**
 	 * Know that all the arguments are unifiable
 	 * Modifies the knowledge
 	 * @return JsNulObj The replacement value for all the values or nothing if unification failed.
 	 */
 	unify: function(a, b) {
 		var a = beArrg(arguments);
 		//1- a are JnNulObj : gathering eqClasses so that we have a list of eqClasses to merge and a list
 		// of solo objects
 		var eqClss = {};
 		var solos = [];
 		for(var i=0; i<a.length; ++i) {
 			var ndx = a.ndx();
 			if(this.access[ndx]) eqClss[this.access[ndx]] = true;
 			else solo.push(a);
 		}	//TODO2: byAttr management
 		eqClss = keys(eqClss);
 		var dstEqCls = eqClss.length?
 			this.eqCls[eqClss.shift()]:
 			this.newEqClass();
 		var failure = trys(eqClss, function(i, eqx) {
	 			try { return this.eqCls[eqClss[eqx]].mergeTo(dstEqCls); }
	 			finally { this.eqCls[eqClss[eqx]] = null; }
	 		}) ||
			trys(solo, function() { return dstEqCls.isEq(this); });
 		if(!failure) return dstEqCls.good();
 		delete this.locals;
 		delete this.eqCls;
 		delete this.access;
 	},
	/**
 	 * Know that 'e' is in the set 's'.
 	 * Modifies the knowledge
 	 * @return The replacement value for both 'e' or nothing if unification failed.
 	 */
 	belong: function(s, e) {
 		var ndx = e.ndx();
 		var dstEC = this.access[ndx]?
 			this.eqCls[this.access[ndx]]:
 			this.newEqClass(e);
 		dstEC.isIn(s);
 	},
 	//TODO2: end the changes to the parent, so he can notify with more discovered consequent knowledge.
 	local: function(name, ndx) {
 		if('undefined'== typeof ndx) {
 			ndx = this.locals.length;
 			this.locals.push(name);
 		}
 		return new nul.obj.local(this.name, ndx, name)
 	},
	maxXst: function() { return this.locals.length?pinf:1; },
	minXst: function() { return this.eqCls.length?0:this.maxXst(); },
	fixed: function() { return !this.locals.length && !this.eqCls.length; },
	ndx: function() {
		return nul.knowledge.eqClass.ndx(this.eqClass,'klg');	
	},
});

nul.knowledge.eqClass = Class.create({
	initialise: function(klg) {
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
	ndx: function() {
		return '[eqCls:'+
			(this.prototyp?this.prototyp.ndx():'[]') + '|' +
			nul.knowledge.eqClass.ndx(this.values, 'values') + '|' +
			nul.knowledge.eqClass.ndx(this.belongs, 'belongs') + ']';
	},
});

nul.knowledge.eqClass.ndx = function(ary, p) {
	ary = ary.maf(function(i, obj) { if(obj) return obj.ndx(); });
	ary.sort();
	return '['+p+':'+ary.join('|')+']';
};