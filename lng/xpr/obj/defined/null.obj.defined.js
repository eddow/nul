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
	 * @param fzns nul.fuzziness
	 * @param anm string
	 * @return nul.obj or nothing if unknown
	 */
	valAttr: function(fzns, anm) {
		var avl = this.attr[anm];
		if(!avl) return;
		if('function'!= typeof(avl)) return avl;
		return avl(this, fzns);
	},
	/**
	 * Gets a functional attribute
	 * @param fzns nul.fuzziness
	 * @param anm string
	 * @param op nul.obj
	 * @return nul.obj or nothing if unknown
	 * @throws nul.failure
	 */
	fctAttr: function(fzns, anm, op) {
		var avl = this.attr[anm];
		if(!avl) return;
		if('function'!= typeof(avl)) return op.through(avl, fzns);
		return avl(this, op, fzns);
	},
	/**
	 * Return 'o' once it is known that 'o' is in this 'set'
	 * @param fzns nul.fuzziness
	 * @param o nul.obj
	 * @return nul.obj or nothing if unknown
	 * @throws nul.failure
	 */
	has: function(o, fzns, klg) {
		if(this.attr[' ']) return this.fctAttr(fzns, ' ', o);
	},
	
	/**
	 * Unify two defined objects
	 */
	unified: function(o, klg) {
		if(o.toString() != this.toString()) nul.fail(this, ' does not unify to ', o);
		return this;
	},
});
