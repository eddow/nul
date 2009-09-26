/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/*TODO4: ndx system :
 * Two different knowledge should be recognised even if :
 * - their knowledge name is different, so their locals wear a different klgName
 * - their variables are ordered differently
*/

/**
 * Define an object that is a value of a local
 */
nul.obj.local = Class.create(nul.obj.undefined, {
	initialize: function(klgRef, ndx) {
		this.klgRef = klgRef;
		this.ndx = ndx;
		this.alreadyBuilt({
			index: this.indexedSub(this.klgRef, this.ndx),
		});
	},

//////////////// public

	/**
	 * Retrieve the name of the local to display it.
	 * @param {array(nul.xpr.knowledge)} ctx
	 * @return string
	 */
	 dbgName: function(ctx) {
		return !ctx[this.klgRef]?'':
			ctx[this.klgRef].dbgName(this.ndx);
	},
	
	sum_dependance: function($super) {
		return new nul.dependance(this);
	},
	
//////////////// nul.expression implementation

	expression: 'local',
});