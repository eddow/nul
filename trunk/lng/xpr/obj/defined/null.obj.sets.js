/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.obj.hcSet = Class.create(nul.obj.defined, {
	initialize: function() {
		this.summarise({
			isSet: true,
		});
	},
});

merge(nul.obj.empty = new nul.obj.hcSet(), {
	intersect: function(o) {
		return [this];
	},
	has: function(o, klg) {
		nul.fail(this.type,' contains nothing!');
	},

//////////////// nul.xpr implementation

	type: '&phi;',
});

merge(nul.obj.whole = new nul.obj.hcSet(), {
	intersect: function(o) {
		return [o];
	},
	has: function(o, klg) {
		return o;
	},

//////////////// nul.xpr implementation

	type: 'any',
});

merge(nul.obj.number = new nul.obj.hcSet(), {
	intersect: function(o) {
		if('range'== o.type) return o;
	},
	has: function(o, klg) {
		if('number'== o.type) return o;
		if(o.c()) nul.fail(o, ' is not a number');
	},

//////////////// nul.xpr implementation

	type: '&#x211a;',
});

nul.obj.string = Class.create(nul.obj.hcSet, {
	has: function(o, klg) {
		if('string'== o.type) return o;
		if(o.isDefined()) nul.fail(o, ' is not a string');
	},

//////////////// nul.xpr implementation

	type: 'str',
});

nul.obj.bool = Class.create(nul.obj.hcSet, {
	has: function(o, klg) {
		if('boolean'== o.type) return o;
		if(o.isDefined()) nul.fail(o, ' is not a boolean');
	},

//////////////// nul.xpr implementation

	type: 'bool',
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
	initialize: function(lwr, upr) {
		this.lower = lwr || ninf;
		this.upper = upr || pinf;
	},
	has: function(o, klg) {
		if(!o.isDefined()) return;
		if('number'!= o.type) nul.fail(o, ' is not a number');
		if(!nul.isJsInt(o.value)) nul.fail(o, ' is not an integer');
		if( o.value < this.lower || o.value > this.upper) nul.fail(o, ' is not in the range');
		return o;
	},

//////////////// nul.xpr implementation

	type: 'range',
	sum_index: function() { return this.indexedSub(this.lower, this.upper); },
});