/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.xpr.fuzzy = Class.create(nul.xpr.knowledge, {
	initialise: function(obj, klg) {
		this.value = obj;
		if(nul.debug.assert) assert(klg, 'Fuzzy built on knowledge');
		this.copy(klg);
	},
	/**
	 * Retrieve the knowledge part only of this fuzzy
	 */
	knowledge: function() {
		return new nul.xpr.knowledge(this.prnt).copy(this);		
	},

//////////////// nul.klg implementation

	/**
	 * Unify the 'vl' to the current fuzzy value in it's knowledge 
	 */
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
 		var rv = new nul.possibles(klg);
 		if(klg.value) for(var i = 0; i<klgs.length; ++i)
 			rv.maybe(klgs[i].unify(obj));
 		else for(var i = 0; i<klgs.length; ++i)
 			rv.maybe(new nul.xpr.fuzzy(obj, klgs[i]));
 		return rv;
 	},

//////////////// nul.xpr implementation

	type: 'fuzzy',	
	toString: function($super) {
		var klgStr = $super();
		if(!klgStr.length) return this.value.toString();
		return this.value.toString() + '; ' + klgStr;
	},
	ndx: function($super) {
		return '[fuzzy:' +
			this.value.ndx() + '|' +
			$super() + ']';
	},
	components: ['eqCls', 'value'],		//TODO: sth to abstract knowledge components !
});
