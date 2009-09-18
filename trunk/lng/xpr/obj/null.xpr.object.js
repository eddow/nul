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