/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.xpr.object = Class.create(nul.expression, {
	object: true,

	/**
	 * Return a list of possibles[nul.xpr.possible] 'o' once it is known that 'o' is in this 'set'
	 * @param {nul.xpr.object} o
	 * @param {nul.xpr.knowledge} klg
	 * @return array(nul.xpr.object or nul.xpr.possible)
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
	
	sum_dependance: function($super) {
		var rv = $super();
		if(this.selfRef) {
			if(nul.debug.assert) assert(
					rv.usages[nul.obj.local.self.name] &&
					rv.usages[nul.obj.local.self.name].local[this.selfRef],
					'Self-reference consistence.');
			delete rv.usages[nul.obj.local.self.name].local[this.selfRef];
			if(!rv.usages[nul.obj.local.self.name].local.length)
				delete rv.usages[nul.obj.local.self.name];
		}
		return rv;
	},
////////////////	Internals

	/**
	* Change self sub-representations. Either to change the self-context index or to modify it by another known value
	* @param {any} newSelf
	* If newSelf is a {nul.xpr.object}, it will replace the self-references
	* If not, it will be considered as a new self index
	*/
	reself: function(newSelf) {
		if(!this.selfRef) return this;
		var rv = new nul.xpr.object.reself(this.selfRef, newSelf).browse(this);
		if(nul.debug.assert) assert(this.expression == rv.expression, 'Reselfing doesnt modify the definition');
		return rv;
	}
});

/**
 * Change the self-referant locals in an object definition
 */
nul.xpr.object.reself = Class.create(nul.browser.bijectif, {
	initialize: function($super, selfRef, trgt) {
		this.selfRef = selfRef;
		if(!trgt.object) this.newRef = trgt;
		this.trgt = trgt.object?trgt:nul.obj.local.self(trgt);
		$super('SelfRef');
	},
	build: function($super, xpr) {
		if(xpr.selfRef == this.selfRef) {
			if(this.newRef) xpr.selfRef = this.newRef;
			else delete xpr.selfRef;
		}
		return $super(xpr);
	},
	transform: function(xpr) {
		if('local'== xpr.expression && nul.obj.local.self.name == xpr.klgRef && xpr.ndx == this.selfRef)
			return this.trgt;
		return nul.browser.bijectif.unchanged;
	}
});

nul.obj = {
	are: nul.debug.are('object'),
	is: function(x, t) {
		nul.debug.is('object')(x);
		if(t) {
			t = t.prototype.expression;
			(function() { return x.expression == t; }.asserted('Expected "'+t+'" object'));
		}
	},
	use: function(x, t) {
		if(!nul.xpr.bunch(x)) x = [x];
		if(nul.debug.assert) map(x, function(i, o) {
			nul.obj.is(o, t);
			o.use();
		});
	},
	
	mod: function(x, t) {
		if(!nul.xpr.bunch(x)) x = [x];
		if(nul.debug.assert) map(x, function(i, o) {
			nul.obj.is(o, t);
			o.modify();
		});
	}
};