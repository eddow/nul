/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.obj.hcSet = Class.create(nul.obj.defined, {
	unify: function(o) { return o.type== this.type; },
	
//////////////// nul.xpr implementation

	is_set: true,
	toText: function(txtr) { return this.type; },
});

merge(nul.obj.empty = new nul.obj.hcSet(), {
	intersect: function(o) {
		return [this];
	},
	has: function(o, klg) {
		return [];
	},

//////////////// nul.xpr implementation

	type: '&phi;',
});

merge(nul.obj.whole = new nul.obj.hcSet(), {
	intersect: function(o) {
		return [o];
	},
	has: function(o, klg) {
		return [nul.xpr.fuzzy(o, klg)];
	},

//////////////// nul.xpr implementation

	type: 'any',
});

merge(nul.obj.number = new nul.obj.hcSet(), {
	intersect: function(o) {
		if('range'== o.type) return o;
	},
	has: function(o, klg) {
		if('number'== o.type) return nul.possibles([o], klg);
		if(o.attr) return [];
	},

//////////////// nul.xpr implementation

	type: '&#x211a;',
});

nul.obj.string = Class.create(nul.obj.hcSet, {
	has: function(o, klg) {
		if('string'== o.type) return nul.possibles([o], klg);
		if(o.attr) return [];
	},

//////////////// nul.xpr implementation

	type: 'str',
});

nul.obj.range = Class.create(nul.obj.hcSet, {
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
	initialize: function(lwr, upr) {
		this.lower = lwr || ninf;
		this.upper = upr || pinf;
	},
	has: function(o, klg) {
		if(!o.attr) return;
		if('number'!= o.type ||
			o.value < this.lower ||
			o.value > this.upper ||
			!nul.isJsInt(o.value) )
				return [];
		return nul.possibles([o], klg);
	},

//////////////// nul.xpr implementation

	type: 'range',
	//TODO2: draw real range  
	toText: function(txtr) { return '&#x2124;'; },
	build_ndx: function() { return '[range:'+this.lower+'|'+this.upper+']'; },
});