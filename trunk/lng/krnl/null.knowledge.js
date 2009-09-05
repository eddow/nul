/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

 nul.knowledge = function(prnt) {
 	return {
 		name: ++nul.knowledge.ndx,
 		locals: [],	//dbgNames, could remember just the length (as an int) if no debug info needed
	 	prnt: prnt,
	 	eqClasses: [],	//Array of equivalence classes.
	 	access: {},		//Access from an obj.ndx to an eq class he's in
	 	/**
	 	 * Know all what 'klg' knows
	 	 * @return A new knowledge who knows both these knowledge.
	 	 */
	 	merge: function(klg) {
	 		//TODO
	 	},
	 	/**
	 	 * Know that all the arguments are unifiable
	 	 * Modifies the knowledge
	 	 * @return JsNulObj The replacement value for all the values or nothing if unification failed.
	 	 */
	 	unify: function(a, b) {
	 		var a = beArrg(arguments);
	 		//TODO
	 	},
	 	/**
	 	 * Know that 'e' is in the set 's'.
	 	 * Modifies the knowledge
	 	 * @return The replacement value for both 'e' or nothing if unification failed.
	 	 */
	 	belong: function(s, e) {
	 		//TODO
	 	},
	 	//TODO: end the changes to the parent, so he can notify with more discovered consequent knowledge.
	 	local: function(name, ndx) {
	 		if('undefined'== typeof ndx) {
	 			ndx = this.locals.length;
	 			this.locals.push(name);
	 		}
	 		return new nul.obj.local(this.name, ndx, name)
	 	},
	}; 	
};