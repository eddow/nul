/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.obj.empty = Class.create(nul.obj.noThroughSet, {
	has: function(o) {
		return [];
	}
});

nul.obj.whole = Class.create(nul.obj.noThroughSet, {
	has: function(o) {
		return [nul.fuzzy(o)];
	}
});

nul.obj.number = Class.create(nul.obj.noThroughSet, {
	has: function(o) {
		if('number'== o.type) return [nul.fuzzy(o)];
		if(o.attr) return [];
	}
});

nul.obj.range = Class.create(nul.obj.noThroughSet, {
	initialise: function(lwr, upr) {
		this.lower = lwr;
		this.upper = upr;
	},
	has: function(o) {
		if(!o.attr) return;
		if('number'!= o.type ||
			o.value < this.lower ||
			o.value > this.upper)
				return [];
		return [nul.fuzzy(o)];
	}
});