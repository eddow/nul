/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.xpr.object = Class.create(nul.expression, {
	object: true,
	through: function(o) {
		//TODO2: return o[this]
	},
	/**
	 * Return a list of possibles[nul.xpr.possible] 'o' once it is known that 'o' is in this 'set'
	 * @param o nul.xpr.object
	 * @param klg nul.xpr.knowledge
	 * @return array(nul.xpr.object or nul.xpr.possible)
	 */
	has: function(o) {
		var klg = new nul.xpr.knowledge();
		klg.belong(o, this);
		return [new nul.xpr.possible(o, klg.built('clean')).built()];
	},
});

nul.obj = {
	are: nul.debug.are('object'),
	is: function(x, t) {
		nul.debug.is('object')(x);
		if(t) {
			t = t.prototype.type;
			(function() { return x.type == t; }.asserted('Expected "'+t+'" object'));
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