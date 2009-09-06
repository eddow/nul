/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.obj.hcSet = Class.create(nul.obj.defined, {
	unify: function(o) { return o.type== this.type; },
	ndx: function() { return '['+this.type+']'; },
});

nul.obj.empty = Class.create(nul.obj.hcSet, {
	type: 'empty',
	intersect: function(o) {
		return [this];
	},
	has: function(o) {
		return [];
	}
});

nul.obj.whole = Class.create(nul.obj.hcSet, {
	type: 'whole',
	intersect: function(o) {
		return [o];
	},
	has: function(o) {
		return [nul.fuzzy(o)];
	}
});

nul.obj.number = Class.create(nul.obj.hcSet, {
	type: 'number',
	intersect: function(o) {
		if('range'== o.type) return o;
	},
	has: function(o) {
		if('number'== o.type) return nul.possibles([o]);
		if(o.attr) return [];
	}
});

nul.obj.string = Class.create(nul.obj.hcSet, {
	type: 'string',
	has: function(o) {
		if('string'== o.type) return nul.possibles([o]);
		if(o.attr) return [];
	}
});

nul.obj.range = Class.create(nul.obj.hcSet, {
	type: 'range',
	intersect: function(o) {
		if('number'== o.type) return this;
		if('range'== o.type) {
			var lwr = this.lower<o.lower?o.lower:this.lower;
			var upr = this.upper>o.upper?o.upper:this.upper;
			if(lwr > upr) return [];
			return new nul.obj.range(lwr, upr);
		}
	},
	unify: function(o) {
		return 'range'== o.type &&	//TODO4: compare with sets defined in extension?
			this.lower == o.lower &&
			this.upper == o.upper;
	},
	initialise: function(lwr, upr) {
		this.lower = lwr || ninf;
		this.upper = upr || pinf;
	},
	has: function(o) {
		if(!o.attr) return;
		if('number'!= o.type ||
			o.value < this.lower ||
			o.value > this.upper ||
			!nul.isJsInt(o.value) )
				return [];
		return nul.possibles([o]);
	},
	ndx: function() { return '[range:'+this.lower+'|'+this.upper+']'; },
});