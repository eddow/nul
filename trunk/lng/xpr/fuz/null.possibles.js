/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

var arrayClass = Class.create();
arrayClass.prototype = [];

nul.possibles = Class.create(arrayClass, {
	initialize: function(cklg, lst) {
		lst = beArrg(arguments, 1);
		if(nul.debug.assert && lst.klg) assert(lst.klg == cklg, 'Possibles knowledge stays');
		for(var i=0; i<lst.length; ++i)
			if(lst[i].fuzzy) {
				if(nul.debug.assert) assert(lst[i].prnt == cklg, 'Knowledge in possibles list');
				this.push(lst[i]);
			} else this.push(new nul.obj.fuzzy(lst[i], new nul.xpr.knowledge(cklg)));
	},
	/**
	 * Gets the possibles objects that can be unified to this and to vl
	 * @return new possibles object
	 */
	and: function(itm) {
		var itm = beArrg(arguments);
		var rv = new nul.possibles(this.klg);
		for(var i=0; i < this.length; ++i) for(var j=0; j < itm.length; ++j)
			rv.maybe(this[i].merge(itm[j]));
		return rv;
	},
	/**
	 * Gets the possibles objects that can be unified to this or to vl
	 * @return new possibles object
	 */
	or: function(itm) {
		var rv = new nul.possibles(this.klg);
		rv.maybe(this);
		rv.maybe(beArrg(arguments));
		return rv;
	},
	/**
	 * Modify this possibles object, knowing that it can be vl too
	 * @return new possibles object
	 */
	maybe: function(itm) {
		itm = beArrg(arguments);
		if(nul.debug.assert && itm.klg) assert(this.klg == itm.klg, 'Possibles knowledge stays');
		this.pushs(itm);
	},
	set: function() {
		//note: if one of the item has minXst = pinf, replace by nul.obj.whole
		var rv = nul.obj.empty;
		for(var i = this.length-1; i>= 0; --i )
			rv = new nul.obj.pair(this[i], rv);
		return rv;
	}
});

/**
 * <pss> is an association containing 'possibles'
 * <fct> is called for each tuple of object in the possibles (one from each possibles) : assoc.<fct>( <klg> )
 * <fct> returns a JsNulObj, a JsNulKlg, a JsNulFuzzyObj, an array of these or a JsNulPossibles
 * When <fct> returns a knowledge in its items, it is expected that this knowledge already knows
 * what <klg> knew.
 */
nul.possibles.map = function(klg, pss, fct) {
	var kys = keys(pss);
	var ndx = map(kys, function() { return 0; });
	var rv = new nul.possibles(klg);
	var incndx;
	do {
		var klgs = new nul.possibles(klg, new nul.xpr.knowledge(klg));
		var obj = isArray(pss)?[]:{};
		//List of the fuzzies involved for this combinatin
		map(kys, function(i, ky) {
			var fzy = pss[ky][ndx[i]];
			obj[ky] = fzy.value;
			klgs.and((fct&&fzy.value)?fzy.knowledge():fzy);
		});
		if(fct) for(var i = 0; i < klgs.length; ++i)
			rv.maybe(new nul.possibles(klgs[i], fct.apply(obj, [klgs[i]])));
		else rv.maybe(klgs);
		//increment indexes
		for(incndx=0; incndx<kys.length; ++incndx) {
			if(++ndx[incndx] < pss[incndx].length) break;
			ndx[incndx] = 0;
		}
	} while(incndx < kys.length)
	return rv;
};