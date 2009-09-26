/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.obj.hcSet = Class.create(nul.obj.defined, {
	initialize: function() {
		this.alreadyBuilt({
			isSet: true,
		});
	},
});

merge(nul.obj.empty = new nul.obj.hcSet(), {
	intersect: function(o) {
		return [this];
	},
	has: function(o) {
		return [];
	},

//////////////// nul.expression implementation

	expression: '&phi;',
});

merge(nul.obj.whole = new nul.obj.hcSet(), {
	intersect: function(o) {
		return [o];
	},
	has: function(o) {
		return [o];
	},

//////////////// nul.expression implementation

	expression: 'any',
});

merge(nul.obj.number = new nul.obj.hcSet(), {
	intersect: function(o) {
		if('range'== o.expression) return o;
	},
	has: function(o) {
		if('number'== o.expression) return [o];
		if(o.isDefined()) return [];
	},

//////////////// nul.expression implementation

	expression: '&#x211a;',
});

nul.obj.string = Class.create(nul.obj.hcSet, {
	has: function(o) {
		if('string'== o.expression) return [o];
		if(o.isDefined()) return [];
	},

//////////////// nul.expression implementation

	expression: 'str',
});

nul.obj.bool = Class.create(nul.obj.hcSet, {
	has: function(o) {
		if('boolean'== o.expression) return [o];
		if(o.isDefined()) return [];
	},

//////////////// nul.expression implementation

	expression: 'bool',
});

nul.obj.range = Class.create(nul.obj.hcSet, {
	intersect: function(o) {
		if('number'== o.expression) return this;
		if('range'== o.expression) {
			var lwr = this.lower<o.lower?o.lower:this.lower;
			var upr = this.upper>o.upper?o.upper:this.upper;
			if(lwr > upr) return [];
			return new nul.obj.range(lwr, upr);
		}
	},
	initialize: function($super, lwr, upr) {
		this.lower = lwr || ninf;
		this.upper = upr || pinf;
		$super();
	},
	has: function(o) {
		if(!o.isDefined()) return;
		if('number'!= o.expression) return [];
		if(!nul.isJsInt(o.value)) return [];
		if( o.value < this.lower || o.value > this.upper) return [];
		return [o];
	},

//////////////// nul.expression implementation

	expression: 'range',
	sum_index: function() { return this.indexedSub(this.lower, this.upper); },
});