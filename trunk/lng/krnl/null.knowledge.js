/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

 nul.knowledge = function(prnt) {
 	this.prnt = prnt;
 	this.eqClasses = [];	//Array of nul.knowledge.eqClass
 	this.access = {};	//Access from an obj.ndx to an eq class he's in
 	/**
 	 * Know all what 'klg' knows
 	 * @return A new knowledge who knows both these knowledge.
 	 */
 	this.merge = function(klg) {
 		//TODO
 	},
 	/**
 	 * Know that all the arguments are unifiable
 	 * Modifies the knowledge
 	 * @return JsNulObj The replacement value for all the values or nothing if unification failed.
 	 */
 	this.unify = function(a, b) {
 		var a = beArrg(arguments);
 		//TODO
 	};
 	/**
 	 * Know that 'e' is in the set 's'.
 	 * Modifies the knowledge
 	 * @return The replacement value for both 'e' or nothing if unification failed.
 	 */
 	this.belong = function(s, e) {
 		//TODO
 	};
 	//TODO: end the changes to the parent, so he can notify with more discovered consequent knowledge.
};

nul.knowledge.eqClass = function() {
	this.eq = [];	//List of equivalent objects
	this.ins = []; 	//List of sets the value (of the equivalence class) is in
}