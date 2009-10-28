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
	 * @param {String} srcKlgRef The knowledge name whose space the expression is taken of
	 * @param {nul.xpr.knowledge} dstKlg The knowledge whose space the expression is taken to
	 */
	initialize: function($super, srcKlgRef, dstKlg) {
		this.table = {};
		this.forbid = {};
		this.table[srcKlgRef] = {
			klgRef: dstKlg.name,
			deltaIor3ndx: dstKlg.ior3.length,
			deltaLclNdx: dstKlg.nbrLocals(),
			prime: true
		};
		$super('StepUp');
	},
	enterKlg: function(klg) {
		if(klg && !klg.special && !this.table[klg.name]) {
			if(nul.debug.assert) assert(!this.forbid[klg.name], 'Knowledge already used before entering');
			this.table[klg.name] = { klgRef: ++nul.xpr.knowledge.nameSpace };
			for(var v in this.veto) if(cstmNdx(v)) this.enterKlg(this.veto[v]);
			for(var i in this.ior3) if(cstmNdx(i))
				for(var c in this.ior3[i].choices) if(cstmNdx(c))
					this.enterKlg(this.ior3[i].choices[c]);
		}
	},
	enter: function($super, xpr) {
		if('possible'== xpr.expression) this.enterKlg(xpr.knowledge);
		if('klg'== xpr.expression) this.enterKlg(xpr);
		return $super(xpr);
	},
 	forceBuild: function(xpr) { return 'klg'== xpr.expression && !xpr.special; },
	/**
	 * If a self-ref was planned, make it in the newly built expression.
	 */
	build: function($super, xpr) {
		if('klg'== xpr.expression && !xpr.special) {
			if(nul.debug.assert) assert(this.table[xpr.name], 'Only leave entered knowledge');
			xpr.name = this.table[xpr.name].klgRef;
		}
		return $super(xpr);
	},	
	/**
	 * Changes locals and ior3 to refer the new context
	 */
	transform: function(xpr) {
		var dst;
		if(dst = this.table[xpr.klgRef]) switch(xpr.expression) {
		case 'local': return new nul.obj.local(dst.klgRef, xpr.ndx+(dst.deltaLclNdx||0), xpr.dbgName);
		case 'ior3': return new nul.obj.ior3(dst.klgRef, xpr.ndx+(dst.deltaIor3ndx||0), xpr.values);
		} else if(['local','ior3'].contains(xpr.expression))
			this.forbid[xpr.klgRef] = true;
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
	 * @param {nul.xpr.knowledge.eqClass} eqc
     * @return {nul.xpr.knowledge.eqClass | nul.browser.bijectif.unchanged}
	 */
	subBrowse: function(eqc) {
		nul.xpr.use(eqc, 'nul.xpr.knowledge.eqClass');
        this.protect = [];
        for(var i=0; i<eqc.equivls.length; ++i) this.protect[eqc.equivls[i]] = eqc.equivls[i];
        try { return this.recursion(eqc); }
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
 	//forceBuild: function(xpr) { return xpr.setSelfRef || 'klg'== xpr.expression; },
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
