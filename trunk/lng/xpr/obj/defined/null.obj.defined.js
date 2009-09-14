/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.obj.defined = Class.create(nul.obj, {
	summarise: function($super, smr) {
		var ownSmr = { isDefined: true };
		$super(smr?merge(ownSmr,smr):ownSmr);
	},
	/**
	 * Gets an attribute
	 * @param klg nul.xpr.knowledge
	 * @param anm string
	 * @return nul.obj or nothing if unknown
	 */
	valAttr: function(klg, anm) {
		var avl = this.attr[anm];
		if(!avl) return;
		if('function'!= typeof(avl)) return avl;
		return avl(this, klg);
	},
	/**
	 * Gets a functional attribute
	 * @param klg nul.xpr.knowledge
	 * @param anm string
	 * @param op nul.obj
	 * @return nul.obj or nothing if unknown
	 * @throws nul.failure
	 */
	fctAttr: function(klg, anm, op) {
		var avl = this.attr[anm];
		if(!avl) return;
		if('function'!= typeof(avl)) return op.through(avl, klg);
		return avl(this, op, klg);
	},
	/**
	 * Return 'o' once it is known that 'o' is in this 'set'
	 * @param o nul.obj
	 * @param klg nul.xpr.knowledge
	 * @return nul.obj or nothing if unknown
	 * @throws nul.failure
	 */
	has: function(o, klg) {
		if(this.attr[' ']) return this.fctAttr(' ', o);
	},
});
