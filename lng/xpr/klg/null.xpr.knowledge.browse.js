/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.xpr.knowledge.stepUp = Class.create(nul.browser.bijectif, /** @lends nul.xpr.knowledge.stepUp# */{
	/**
	 * @extends nul.browser.bijectif
	 * @constructs
	 * @param {nul.xpr.knowledge} srcKlg The knowledge whose space the expression is taken of
	 * @param {String} dstKlgRef The knowledge whose space the expression is taken to
	 */
	initialize: function($super, srcKlg, dstKlg) {
		this.srcKlg = srcKlg;
		this.dstKlgRef = dstKlg.name;
		this.deltaIor3ndx = dstKlg.ior3.length;
		this.deltaLclNdx = dstKlg.nbrLocals();
		$super('StepUp');
	},
	/**
	 * Changes locals and ior3 to refer the new context
	 */
	transform: function(xpr) {
		if('local'== xpr.expression && this.srcKlg.name == xpr.klgRef )
			return new nul.obj.local(this.dstKlgRef, xpr.ndx+this.deltaLclNdx, xpr.dbgName);
		if('ior3'== xpr.expression && this.srcKlg.name  == xpr.klgRef )
			return new nul.obj.ior3(this.dstKlgRef, xpr.ndx+this.deltaIor3ndx, xpr.values);
		return nul.browser.bijectif.unchanged;
	}
});

nul.xpr.knowledge.represent = Class.create(nul.browser.bijectif, /** @lends nul.xpr.knowledge.represent# */ {
	/**
	 * Special browser to modifies an expression, replacing any occurrence of an object that appears in an equivalence class
	 * by the equivalence class representant
	 * @extends nul.browser.bijectif
	 * @constructs
	 * @param {Access} access The access to use to replace values
	 */
	initialize: function($super, access) {
		this.tbl = access;
		$super('Representation');
		this.prepStack = [];
	},
	/**
	 * Used to browse an equivalence class. As each equivalence class appear in the replacement table, they should be protected not to have
	 * their whole components replaced by the only representant.
	 */
	subBrowse: function(xpr) {
		nul.xpr.use(xpr, nul.xpr.knowledge.eqClass);
        this.protect = [];
        for(var i=0; i<xpr.equivls.length; ++i) this.protect[xpr.equivls[i]] = xpr.equivls[i];
        try { return this.recursion(xpr); }
        finally {
            for(var i in this.protect) this.uncache(this.protect[i]);
            delete this.protect;
        }
    },
    /**
     * Retrieve, if any, the replacement value for this expression along the replacement table\
     * @param {nul.expression} xpr
     * @return {nul.expression | null}
     */
    tableTransform: function(xpr) {
    	if(this.tbl[xpr] && this.tbl[xpr].equivls[0] != xpr) return this.tbl[xpr].equivls[0];
    },
    /**
     * Only cache if it doesn't appear in the replacement table.\
     * If it does appear, the replacement can be different from one time to another becauyse of protection.
     */
	cachable: function(xpr) {
		return !this.tableTransform(xpr);
	},
	/**
	 * Decide if the value can be changed along the replacement table or not.
     * @param {nul.expression} xpr
     * @return {Boolean}
	 */
	changeable: function(xpr) {
		return this.tableTransform(xpr) && (!this.protect || !this.protect[xpr] || 2<this.prepStack.length);
	},
	/**
	 * Only enter if we don't have a replacement value directly in the access table
	 */
	enter: function($super, xpr) {
		this.prepStack.unshift(xpr);
		if(this.changeable(xpr)) return false;

		return $super(xpr);
	},
	/**
	 * If a self-ref was planned, make it in the newly built expression.
	 */
	build: function($super, xpr) {
		if(xpr.setSelfRef) {
			xpr.selfRef = xpr.setSelfRef;
			delete xpr.setSelfRef;
			delete this.prepStack[0].setSelfRef;
		}

		if('klg'== xpr.expression) xpr.define(this.tbl);
		
		return $super(xpr);
	},
	/**
	 * Change an expression into another along the table. Mark a selfRef to do if needed.
	 */
	transform: function(xpr) {
		var p = this.prepStack.shift();
		var evl = new nul.browser.bijectif.evolution(xpr);
		if(this.changeable(evl.value)) evl.receive(this.tableTransform(xpr));
		//If I'm replacing a value by an expression that contains this value, just don't
		var n = this.prepStack.indexOf(evl.value);
		if(-1< n) {
			evl.receive(nul.obj.local.self(evl.value.selfRef || evl.value.setSelfRef));
			this.prepStack[n].setSelfRef = evl.value.ndx;
		}

		if(evl.hasChanged) nul.debug.log('Represent')('', 'Representation', evl.changed, xpr, p);
		return evl.changed;
	}
});