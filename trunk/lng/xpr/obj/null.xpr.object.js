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
	has: function(o) {
		var klg = new nul.xpr.knowledge();
		klg.belong(o, this);
		return [klg.wrap(o)];
	},
	
	/**
	 * Abstract defined also by nul.xpr.possible
	 */
	valueKnowing: function(klg) { return this; },
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
		if(!isArray(x)) x = [x];
		if(nul.debug.assert) map(x, function(i, o) {
			nul.obj.is(o, t);
			o.use();
		});
	},
	
	mod: function(x, t) {
		if(!isArray(x)) x = [x];
		if(nul.debug.assert) map(x, function(i, o) {
			nul.obj.is(o, t);
			o.modify();
		});
	},
};