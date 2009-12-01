/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.klg.stepUp = new JS.Class(nul.browser.bijectif, /** @lends nul.klg.stepUp# */{
	/**
	 * @extends nul.browser.bijectif
	 * @constructs
	 * @param {String} srcKlgRef The knowledge name whose space the expression is taken of
	 * @param {nul.xpr.knowledge} dstKlg The knowledge whose space the expression is taken to
	 */
	initialize: function(srcKlgRef, dstKlg) {
		var nl = dstKlg.nbrLocals();
		this.toNode = function() {
			return $('<span />')
				.append($.text('StepUp from '))
				.append($('<span />').text(srcKlgRef))
				.append($.text(' to '))
				.append($('<span />').text(dstKlg.name))
				.append($.text(' whom has '))
				.append($('<span />').text(nl))
				.append($.text(' locals'));				
		};
		this.table = {};
		this.forbid = {};
		this.table[srcKlgRef] = {
			klgRef: dstKlg.name,
			deltaLclNdx: dstKlg.nbrLocals(),
			prime: true
		};
		this.callSuper('StepUp', null);
	},
	enterKlg: function(klg) {
		if(klg && !klg.isA(nul.klg.ncndtnl) && !this.table[klg.name]) {
			if(nul.debugged) nul.assert(!this.forbid[klg.name], 'Knowledge already used before entering');
			this.table[klg.name] = { klgRef: nul.execution.name.gen('klg') };
			for(var v in ownNdx(this.veto)) this.enterKlg(this.veto[v]);
			for(var i in ownNdx(this.ior3))
				for(var c in ownNdx(this.ior3[i].choices))
					this.enterKlg(this.ior3[i].choices[c]);
		}
	},
	enter: function(xpr) {
		if('possible'== xpr.expression) this.enterKlg(xpr.knowledge);
		if('klg'== xpr.expression) this.enterKlg(xpr);
		return this.callSuper();
	},
 	forceBuild: function(xpr) { return 'klg'== xpr.expression && !xpr.isA(nul.klg.ncndtnl); },
	/**
	 * If a self-ref was planned, make it in the newly built expression.
	 */
	build: function(xpr) {
		if('klg'== xpr.expression && !xpr.isA(nul.klg.ncndtnl)) {
			if(nul.debugged) nul.assert(this.table[xpr.name], 'Only leave entered knowledge');
			xpr.name = this.table[xpr.name].klgRef;
		}
		return this.callSuper();
	},	
	/**
	 * Changes locals to refer the new context
	 */
	transform: function(xpr) {
		var dst;
		if('local'== xpr.expression) {
			if(dst = this.table[xpr.klgRef]) return new nul.obj.local(dst.klgRef, xpr.ndx+(dst.deltaLclNdx||0), xpr.dbgName).from(xpr);
			this.forbid[xpr.klgRef] = true;
		}
		return nul.browser.bijectif.unchanged;
	}
});

nul.klg.represent = new JS.Class(nul.browser.bijectif, /** @lends nul.klg.represent# */ {
	/**
	 * Special browser to modifies an expression, replacing any occurrence of an object that appears in an equivalence class
	 * by the equivalence class representant
	 * @extends nul.browser.bijectif
	 * @constructs
	 * @param {Access} access The access to use to replace values
	 */
	initialize: function(klg) {
		if(nul.action) {
			this.toNode = function() {
				return $('<span />')
					.append($.text('Representing with '))
					.append(this.klg.toNode());				
			};
			this.klg = klg;
		}
		nul.klg.is(klg);
		this.tbl = klg.info();
		this.dbgName = klg.name;
		this.callSuper('Representation');
		this.prepStack = [];
	},
	/**
	 * Used to browse an equivalence class. As each equivalence class appear in the replacement table, they should be protected not to have
	 * their whole components replaced by the only representant.
	 * @param {nul.klg.eqClass} eqc
     * @return {nul.klg.eqClass|nul.browser.bijectif.unchanged}
	 */
	subBrowse: function(eqc) {
		nul.xpr.use(eqc, 'nul.klg.eqClass');
        this.protect = {};
        for(var i=0; i<eqc.equivls.length; ++i)
        	this.protect[eqc.equivls[i]] = eqc.equivls[i];
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
    	if(this.tbl[xpr] && this.tbl[xpr].represent() != xpr) return this.tbl[xpr].represent();
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
	enter: function(xpr) {
		this.prepStack.unshift(xpr);
		if(this.changeable(xpr)) return false;

		return this.callSuper();
	},
	leave: function(xpr) {
		if('klg'== xpr.expression) {
			var chd = xpr.modifiable();
			if(chd.define(this.tbl).length) return chd.built();
		}
		return this.callSuper();
	},
 	//forceBuild: function(xpr) { return 'klg'== xpr.expression; },
	/**
	 * If a self-ref was planned, make it in the newly built expression.
	 */
	build: function(xpr) {
		if(xpr.setSelfRef) {
			xpr.selfRef = xpr.setSelfRef;
			delete xpr.setSelfRef;
			delete this.prepStack[0].setSelfRef;
		}

		if('klg'== xpr.expression) {
			xpr.reAccede().define(this.tbl);
			return xpr.built();
		}
		
		return this.callSuper();
	},
	/**
	 * Manage the prepStack in case of failure
	 */
	abort: function(xpr) {
		this.prepStack.shift();
		return this.callSuper();
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

		if(nul.debugged && evl.hasChanged) nul.debugged.info('Represent')('Replacement', this.dbgName, evl.changed, xpr, p);
		return evl.changed;
	}
});
