/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.xpr.object = new JS.Class(nul.expression, /** @lends nul.xpr.object# */{
	/**
	 * Object
	 * @extends nul.expression
	 * @constructs
	 */
	initialize: function() {
		this.callSuper(null);
	},

	/**
	 * Return a list of possibles[nul.xpr.possible] 'o' once it is known that 'o' is in this 'set'
	 * @param {nul.xpr.object} o
	 * @param {nul.xpr.knowledge} klg
	 * @return {nul.xpr.possible[]}
	 */
	having: function(o) {
		var klg = new nul.xpr.knowledge();
		klg.belong(o, this);
		return [klg.wrap(o)];
	},
	
	/**
	 * Abstract defined also by nul.xpr.possible
	 */
	valueKnowing: function(klg) { return this; },
	
////////////////	Generic summary providers
	
	/** @private */
	sum_dependance: function() {
		var rv = this.callSuper();
		if(this.selfRef) {
			if(rv.usages[nul.obj.local.self.ref] && rv.usages[nul.obj.local.self.ref].local[this.selfRef]) {
				delete rv.usages[nul.obj.local.self.ref].local[this.selfRef];
				if(isEmpty(rv.usages[nul.obj.local.self.ref].local))
					delete rv.usages[nul.obj.local.self.ref];
			} else delete this.selfRef;
		}
		return rv;
	}
});

nul.xpr.object.reself = new JS.Class(nul.browser.bijectif, /** @lends nul.xpr.object.reself# */{
	/**
	 * A browser to change the self-referant locals in an object definition
	 * @constructs
	 * @extends nul.browser.bijectif
	 * @param {String} selfRef The self-reference to replace
	 * @param {nul.xpr.object|String} trgt The replacement value. If a string, will be a self-reference local.
	 */
	initialize: function(selfRef, trgt) {
		this.selfRef = selfRef;
		if(!trgt.expression) this.newRef = trgt;
		this.trgt = trgt.expression?trgt:nul.obj.local.self(trgt);
		this.callSuper('SelfRef');
	},
	/**
	 * Removes or change the self-reference of this expression if it was self-refered
	 * @param {nul.expression} xpr
	 */
	build: function(xpr) {
		if(xpr.selfRef == this.selfRef) {
			if(this.newRef) xpr.selfRef = this.newRef;
			else delete xpr.selfRef;
		}
		return this.callSuper();
	},
	/**
	 * Gets a replacement value if xpr is a concerned self-reference
	 * @param {nul.expression} xpr
	 */
	transform: function(xpr) {
		if('local'== xpr.expression && nul.obj.local.self.ref == xpr.klgRef && xpr.ndx == this.selfRef)
			return this.trgt;
		return nul.browser.bijectif.unchanged;
	}
});

/** @namespace Objects helper */
nul.obj = {
	/**
	 * Assert: 'x' are a collection of objects of type 't'
	 * @param {nul.object[]} x
	 * @param {String} t JS type name
	 */
	are: function(x, t) { return nul.xpr.are(x,t||'nul.xpr.object'); },
	/**
	 * Assert: 'x' is an object of type 't'
	 * @param {nul.object} x
	 * @param {String} t JS type name
	 */
	is: function(x, t) { return nul.xpr.is(x,t||'nul.xpr.object'); },
	/**
	 * Assert: 'x' is an object of type 't'. 'x' is summarised.
	 * @param {nul.object} x
	 * @param {String} t JS type name
	 */
	use: function(x, t) { return nul.xpr.use(x,t||'nul.xpr.object'); },
	/**
	 * Assert: 'x' is an object of type 't'. 'x' is not summarised.
	 * @param {nul.object} x
	 * @param {String} t JS type name
	 */
	mod: function(x, t) { return nul.xpr.mod(x,t||'nul.xpr.object'); }
};
