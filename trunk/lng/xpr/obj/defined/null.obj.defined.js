/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.obj.defined = Class.create(nul.xpr.object, {
	summarise: function($super, smr) {
		var ownSmr = { isDefined: true };
		$super(smr?merge(ownSmr,smr):ownSmr);
	},
	/**
	 * Gets an attribute
	 * @param {nul.xpr.knowledge} klg
	 * @param {string} anm
	 * @return nul.xpr.object or nothing if unknown
	 */
	valAttr: function(klg, anm) {
		this.use();
		
		var avl = this.attr[anm];
		if(!avl) return;
		if('function'!= typeof(avl)) return avl;
		return avl(this, klg);
	},
	/**
	 * Gets a functional attribute
	 * @param {nul.xpr.knowledge} klg
	 * @param {string} anm
	 * @param {nul.xpr.object} op
	 * @return nul.xpr.object or nothing if unknown
	 * @throws nul.failure
	 */
	fctAttr: function(klg, anm, op) {
		this.use(); op.use();
		
		var avl = this.attr[anm];
		if(!avl) return;
		if('function'!= typeof(avl)) return op.through(avl, klg);
		return avl(this, op, klg);
	},

	/**
	 * Unify two defined objects
	 */
	unified: function(o, klg) {
		this.use(); nul.obj.use(o); nul.xpr.mod(klg, nul.xpr.knowledge);
		
		if(o.toString() != this.toString()) nul.fail(this, ' does not unify to ', o);
		return this;
	},
});
