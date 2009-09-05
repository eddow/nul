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
			//note: if one of the item has minXst = pinf, replace by nul.obj.whole
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

/**
 * <pss> is an association containing 'possibles'
 * <fct> is called for each tuple of object in the possibles (one from each possibles)
 * <fct> returns a JsNulObj
 */
nul.possibles.map = function(pss, fct) {
	var kys = keys(pss);
	var ndx = map(kys, function() { return 0; });
	var mxs = map(kys, function(i, ky) { return pss[key].length; });
	var rv = nul.possibles();
	var incndx;
	while(true) {
		var klg = nul.knowledge();
		var obj = isArray(pss)?[]:{};
		//List of the fuzzies involved for this combinatin
		map(kys, function(i, ky) {
			var fzy = pss[ky][ndx[i]];
			klg.merge(fzy.knowledge);
			obj[ky] = fzy.object;
		});
		rv.maybe(fct.apply(obj, klg), klg);
		//increment indexes
		for(incndx=0; incndx<kys.length; ++incndx) {
			if(++ndx[incndx] < mxs[incndx]) break;
			ndx[incndx] = 0;
		}
	} while(incndx < kys.length)
	return rv;
};