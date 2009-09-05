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
nul.possibles = function(lst) {
	var rv = [];
	lst = beArrg(arguments);
	for(var i=0; i<lst.length; ++i)
		if(lst[i].fuzzy) rv.push(lst[i]);
		else rv.push(nul.fuzzy(lst[i]));
	return merge(rv, {
		/**
		 * Gets the possibles objects that can be unified to this and to vl
		 * @param vl NulObj, NulFuzzyObj or NulPossibles
		 * @param klg NulKlg iif vl is NulObj
		 * @return new possibles object
		 */
		and: function(vl, klg) {
			vl = nul.possibles.asLst(vl, klg);
			var rv = nul.possibles();
			for(var i=0; i < this.length; ++i) for(var j=0; j < vl.length; ++j) {
				var klg = this[i].knowledge.merge(vl[j].knowledge);
				var obj = klg.unify(this[i].object, vl[j].object);
				rv.maybe(obj, klg);
			}
			return rv;
		},
		/**
		 * Gets the possibles objects that can be unified to this or to vl
		 * @param vl NulObj, NulFuzzyObj or NulPossibles
		 * @param klg NulKlg iif vl is NulObj
		 * @return new possibles object
		 */
		or: function(vl, klg) {
			var rv = nul.possibles();
			rv.maybe(this);
			rv.maybe(vl, klg);
			return rv;
		},
		/**
		 * Modify this possibles object, knowing that it can be vl too
		 * @param vl NulObj, NulFuzzyObj or NulPossibles
		 * @param klg NulKlg iif vl is NulObj
		 * @return new possibles object
		 */
		maybe: function(vl, klg) {
			if(!vl) return;
			this.pushs(nul.possibles.asLst(vl, klg));
		},
		set: function() {
			//note: if one of the item has minXst = inf, replace by nul.obj.whole
			var rv = nul.obj.empty();
			for(var i = this.length-1; i>= 0; --i )
				rv = nul.obj.pair(this[i], rv);
			return rv;
		}
	});
};

nul.possibles.asLst = function(vl, klg) {
	if(!vl) return;
	if(!isArray(vl)) {
		if(!vl.fuzzy) vl = nul.fuzzy(vl, klg);
		vl = [vl];
	}
};