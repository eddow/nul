/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**
 * Create a fuzzy object
 * nul.fuzzy(JsNulObj, JsNulKlg) creates a fuzzy object from one NUL object and a knowledge
 */
nul.fuzzy = function(obj, klg) {
	//if(obj && !klg) klg = default fixed knowledge
	var rv = {
		knowledge: klg,
		object: obj,
		fuzzy: true,
	};
	if(obj) return merge(rv, {
		minXst: 8,		//TODO : klg.eqClasses ? 0 : 1
		maxXst: 8, 		//TODO : klg.locals ? inf : 1
		fixed: !klg,	//TODO || !(klg.locals || klg.eqClasses)

		/**
		 * Gets the fuzzy objects that can be unified to this and to vl
		 * @param vl Either a NUL fuzzy object, either a NUL object
		 * @return new fuzzy object
		 */
		unify: function(vl) {
			var klg = vl.fuzzy?this.knowledge.merge(vl.knowledge):this.knowledge.clone();
			var obj = klg.unify(this.object, vl.fuzzy?vl.object:vl);
			return nul.fuzzy(obj, klg);
		},
	});
	return merge(rv, { 
		minXst: 0,
		maxXst: 0,
		fixed: false,
		/**
		 * Gets the fuzzy objects that can be unified to this and to vl
		 * @return this object : the failed fuzzy
		 */
		unify: function(vl) { return this; }
	});
};
