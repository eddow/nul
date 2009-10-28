/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.xpr.object = Class.create(nul.expression, /** @lends nul.xpr.object# */{
	/**
	 * Object
	 * @extends nul.expression
	 * @constructs
	 */
	initialize: function($super) {
		$super();
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
	 * Return a list of possibles[nul.xpr.possible] 'o' once it is known that 'o' is in this 'set'
	 * @param {nul.xpr.object} o
	 * @param {nul.xpr.knowledge} klg
	 * @return {nul.xpr.knowledge[]}
	 * /
	having: function(o) {
		var klg = new nul.xpr.knowledge();
		klg.belong(o, this);
		return [klg.wrap(o)];
	},*/	
	/**
	 * Abstract defined also by nul.xpr.possible
	 */
	valueKnowing: function(klg) { return this; },
	
////////////////	Generic summary providers
	
	/** @private */
	sum_dependance: function($super) {
		var rv = $super();
		if(this.selfRef) {
			if(nul.debug.assert) assert(
					rv.usages[nul.obj.local.self.ref] &&
					rv.usages[nul.obj.local.self.ref].local[this.selfRef],
					'Self-reference consistence.');
			delete rv.usages[nul.obj.local.self.ref].local[this.selfRef];
			if(!rv.usages[nul.obj.local.self.ref].local.length)
				delete rv.usages[nul.obj.local.self.ref];
		}
		return rv;
	},
	
////////////////	Internals

	/**
	* Change self sub-representations. Either to change the self-context index or to modify it by another known value
	* @param {any} newSelf
	* @param {any} selfRef The actual self reference to replace (this one if none specified)
	* If newSelf is a {nul.xpr.object}, it will replace the self-references
	* If not, it will be considered as a new self index
	*/
	reself: function(newSelf, selfRef) {
		if(!this.selfRef && !selfRef) return this;
		var rv = new nul.xpr.object.reself(selfRef || this.selfRef, newSelf).browse(this);
		if(nul.debug.assert) assert(this.expression == rv.expression || ('pair'== this.expression && '&phi;'== rv.expression),
				'Reselfing doesnt modify the definition');
		return rv;
	}
});

nul.xpr.object.reself = Class.create(nul.browser.bijectif, /** @lends nul.xpr.object.reself# */{
	/**
	 * A browser to change the self-referant locals in an object definition
	 * @constructs
	 * @extends nul.browser.bijectif
	 * @param {String} selfRef The self-reference to replace
	 * @param {nul.xpr.object|String} trgt The replacement value. If a string, will be a self-reference local.
	 */
	initialize: function($super, selfRef, trgt) {
		this.selfRef = selfRef;
		if(!trgt.expression) this.newRef = trgt;
		this.trgt = trgt.expression?trgt:nul.obj.local.self(trgt);
		$super('SelfRef');
	},
	/**
	 * Removes or change the self-reference of this expression if it was self-refered
	 * @param {nul.expression} xpr
	 */
	build: function($super, xpr) {
		if(xpr.selfRef == this.selfRef) {
			if(this.newRef) xpr.selfRef = this.newRef;
			else delete xpr.selfRef;
		}
		return $super(xpr);
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
	are: function(x, t) { return nul.xpr.are(x,t||'nul.xpr.object'); },
	is: function(x, t) { return nul.xpr.is(x,t||'nul.xpr.object'); },
	use: function(x, t) { return nul.xpr.use(x,t||'nul.xpr.object'); },
	mod: function(x, t) { return nul.xpr.mod(x,t||'nul.xpr.object'); }
};
