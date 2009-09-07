/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.possibles = function(lst, cklg) {
	var rv = [];
	lst = beArrg(arguments);
	for(var i=0; i<lst.length; ++i)
		if(lst[i].fuzzy) rv.push(lst[i]);	//TODO: use cklg?
		else rv.push(new nul.fuzzy(lst[i], cklg));
	return merge(rv, {
		/**
		 * Gets the possibles objects that can be unified to this and to vl
		 * @return new possibles object
		 */
		and: function(itm) {
			var itms = beArrg(arguments);
			var rv = nul.possibles();
			for(var i=0; i < this.length; ++i) for(var j=0; j < itm.length; ++j)
				rv.maybe(this[i].merge(itm[j]));
			return rv;
		},
		/**
		 * Gets the possibles objects that can be unified to this or to vl
		 * @return new possibles object
		 */
		or: function(itm) {
			var rv = nul.possibles();
			rv.maybe(this);
			rv.maybe(beArrg(arguments));
			return rv;
		},
		/**
		 * Modify this possibles object, knowing that it can be vl too
		 * @return new possibles object
		 */
		maybe: function(itm) {
			if(!vl) return;
			this.pushs(beArrg(arguments));
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

/**
 * <pss> is an association containing 'possibles'
 * <fct> is called for each tuple of object in the possibles (one from each possibles) : assoc.<fct>( <klg> )
 * <fct> returns a JsNulObj, a JsNulKlg, a JsNulFuzzyObj, an array of these or a JsNulPossibles
 * When <fct> returns a knowledge in its items, it is expected that this knowledge already knows
 * what <klg> knew.
 */
nul.possibles.map = function(pss, fct) {
	var kys = keys(pss);
	var ndx = map(kys, function() { return 0; });
	var mxs = map(kys, function(i, ky) { return pss[key].length; });
	var rv = nul.possibles();
	var incndx;
	while(true) {
		var klgs = nul.possibles(new nul.knowledge());
		var obj = isArray(pss)?[]:{};
		//List of the fuzzies involved for this combinatin
		map(kys, function(i, ky) {
			var fzy = pss[ky][ndx[i]];
			obj[ky] = fzy.value;
			klgs.and((fct&&fzy.value)?fzy.knowledge():fzy);
		});
		if(fct) for(var i = 0; i < klgs.length; ++i)
			rv.maybe(nul.possibles(fct.apply(obj, klgs[i]), klgs[i]));
		else rv.maybe(klgs);
		//increment indexes
		for(incndx=0; incndx<kys.length; ++incndx) {
			if(++ndx[incndx] < mxs[incndx]) break;
			ndx[incndx] = 0;
		}
	} while(incndx < kys.length)
	return rv;
};