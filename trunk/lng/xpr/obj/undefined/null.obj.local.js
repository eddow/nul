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
	initialize: function(fzns, ndx) {
		this.fzns = fzns;
		this.ndx = ndx;
		this.summarise({
			index: this.indexedSub(this.fzns.name, this.ndx),
		});
	},

//////////////// public

	dbgName: function() {
		return this.fzns.dbgName(this.ndx) || '';
	},
	
	sum_lclDep: function($super) {
		return nul.specifyDep($super(), this.fzns.name, this.ndx);
	},
//////////////// nul.expression implementation

	type: 'local',
});