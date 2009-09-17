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
	initialize: function(fznsName, lclNdx, dbgName) {
		this.fznsName = fznsName;
		this.lclNdx = lclNdx;
		this.dbgName = dbgName;
		this.summarise({
			index: this.indexedSub(this.fznsName, this.lclNdx),
		});
	},

//////////////// nul.expression implementation

	type: 'local',
});