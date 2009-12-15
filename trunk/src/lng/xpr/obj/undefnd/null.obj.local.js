/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
//#requires: src/lng/xpr/obj/undefnd/null.obj.undefnd

nul.obj.local = new JS.Class(nul.obj.undefnd, /** @lends nul.obj.local# */{
	/**
	 * @class Define an object that has a local unknown value
	 * @constructs
	 * @extends nul.obj.undefnd
	 * @param {String} klgRef The knowledge this local applies to
	 * @param {String} ndx The index of this local in the knowledge local-space
	 * @param {String} dbgName A string to draw as the name of this variable for debug info
	 */
	initialize: function(klgRef, ndx, dbgName) {
		if(nul.debugged) nul.assert(dbgName, 'Local has name if debug enabled');
		this.callSuper();
		
		/**
		 * The knowledge this local applies to
		 * @type String
		 */
		this.klgRef = klgRef;
		/**
		 * The index of this choice in the knowledge local-space
		 * @type String
		 */
		this.ndx = ndx;
		/**
		 * A string to draw as the name of this variable for debug info
		 * @type String
		 */
		this.dbgName = dbgName;
		if(dbgName && ('_'== dbgName || 
				('&'== dbgName.substr(0,1) && '&rarr;'!= dbgName.substr(0,6))))
			this.anonymous = true;
		this.alreadyBuilt({
			index: this.indexedSub(this.klgRef, this.ndx)
		});
	},

////////////////nul.expression implementation

	/** Specific dependance computation for locals */
	sum_dependance: function() { return new nul.dependance(this); },
	
	/** @constant */
	expression: 'local',
	/**
	 * Change the string debug-names used.
	 * @param {String} dbgName A string to draw as the name of this variable for debug info
	 */
	invalidateTexts: function(dbgName) {
		if(nul.debugged) nul.assert(dbgName, 'Local has name if debug enabled'); 
		this.dbgName = dbgName;
		this.callSuper();
	}
});
//TODO 3: Surligner le self-ref content dans l'html
/**
 * Helper to create a local that specify 'myself' for the given expression
 * @param {String} ndx
 * @param {String} dbgName A string to draw as the name of this variable for debug info
 * @return {nul.obj.local}
 */
nul.obj.local.self = function(ndx, dbgName) {
	return new nul.obj.local(
			nul.obj.local.self.ref,
			ndx || nul.execution.name.gen('obj.local.self'),
			dbgName || '&uArr;');
};

/** @constant */
nul.obj.local.self.ref = '&crarr;';
