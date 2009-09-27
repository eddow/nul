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
	 * Unify two defined objects
	 */
	unified: function(o, klg) {
		this.use(); nul.obj.use(o); nul.xpr.mod(klg, nul.xpr.knowledge);
		
		if(o.toString() != this.toString()) nul.fail(this, ' does not unify to ', o);
		return this;
	},
});
