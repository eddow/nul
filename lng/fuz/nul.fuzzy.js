/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.fuzzy = Class.create(nul.knowledge, {
	initialise: function(obj, klg) {
		this.value = obj;
		if(klg) this.copy(klg);
	},
	unify: function($super, vl) {
		var vl = beArrg(arguments, 1);
		vl.unshift(this.value);
		return $super(vl);
	},
 	/**
 	 * Know all what 'klg' knows
 	 * @return possibles knowledge who knows both these knowledge.
 	 */
 	merge: function($super, klg) {
 		var klgs = $super(klg);
 		var obj = this.value;
 		var rv = nul.possibles();
 		if(klg.value) for(var i = 0; i<klgs.length; ++i)
 			rv.maybe(klgs[i].unify(obj));
 		else for(var i = 0; i<klgs.length; ++i)
 			rv.maybe(new nul.fuzzy(obj, klgs[i]));
 		return rv;
 	},
	/**
	 * Retrieve the knowledge part only of this fuzzy
	 */
	knowledge: function() {
		return new nul.knowledge().copy(this);		
	},
	ndx: function($super) {
		return '[fuzzy:' +
			this.value.ndx() + '|' +
			$super() + ']';
	}
});
