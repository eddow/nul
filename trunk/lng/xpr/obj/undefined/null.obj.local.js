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
	initialize: function(klgRef, ndx, dbgName) {
		if(nul.debug.assert) assert(dbgName, 'Local has name if debug enabled'); 
		this.klgRef = klgRef;
		this.ndx = ndx;
		this.dbgName = dbgName;
		if(dbgName && ('_'== dbgName || 
				('&'== dbgName.substr(0,1) && '&rarr;'!= dbgName.substr(0,6))))
			this.anonymous = true;
		this.alreadyBuilt({
			index: this.indexedSub(this.klgRef, this.ndx)
		});
	},

////////////////nul.expression implementation

	sum_dependance: function($super) {
		return new nul.dependance(this);
	},
	
	expression: 'local',
	invalidateTexts: function($super, dbgName) {
		if(nul.debug.assert) assert(dbgName, 'Local has name if debug enabled'); 
		this.dbgName = dbgName;
		$super();
	}
});
//TODO 3: Surligner le self-ref content dans l'html
//TODO 2: self-locals redéfinie au stepUp
/**
 * Create a local that specify 'myself' for the given expression
 * @param {nul.expression} xpr
 * @return {nul.obj.local}
 */
nul.obj.local.self = function(ndx) {
	return new nul.obj.local(
			nul.obj.local.self.name,
			ndx || ++nul.obj.local.self.nameSpace,
			'&uArr;')
};

nul.obj.local.self.name = '&crarr;';