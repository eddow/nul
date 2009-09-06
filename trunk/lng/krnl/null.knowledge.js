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
 		//TODO1
 	},
 	/**
 	 * Know that 'e' is in the set 's'.
 	 * Modifies the knowledge
 	 * @return The replacement value for both 'e' or nothing if unification failed.
 	 */
 	belong: function(s, e) {
 		//TODO1
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
});