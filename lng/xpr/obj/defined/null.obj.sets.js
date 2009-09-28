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
	
	/**
	 * Consider this set is not a transformation
	 */
	has: function($super, o) {
		nul.obj.use(o);
		if(o.isInSet) return [o.isInSet(this)];
		if(o.isDefined()) return [];
		return $super(o);
	}
});

nul.obj.empty = new (Class.create(nul.obj.hcSet, {
	intersect: function(o) {
		return [this];
	},
	has: function(o) {
		return [];
	},

//////////////// nul.expression implementation

	expression: '&phi;',
}))();

nul.obj.whole = new (Class.create(nul.obj.hcSet, {
	intersect: function(o) {
		return [o];
	},
	has: function(o) {
		return [o];
	},

//////////////// nul.expression implementation

	expression: 'any',
}))();

nul.obj.number = new (Class.create(nul.obj.hcSet, {
	intersect: function(o) {
		if('range'== o.expression) return o;
	},
	has: function($super, o) {
		if('number'== o.expression) return [o];
		return $super(o);
	},

//////////////// nul.expression implementation

	expression: '&#x211a;',
}))();

nul.obj.string = new (Class.create(nul.obj.hcSet, {
	has: function($super, o) {
		if('string'== o.expression) return [o];
		return $super(o);
	},

//////////////// nul.expression implementation

	expression: 'str',
}))();

nul.obj.bool = new (Class.create(nul.obj.hcSet, {
	has: function($super, o) {
		if('boolean'== o.expression) return [o];
		return $super(o);
	},

//////////////// nul.expression implementation

	expression: 'bool',
}))();

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
	has: function($super, o) {
		if(!o.isDefined() || 'number'!= o.expression) return $super(o);
		if(!nul.isJsInt(o.value)) return [];
		if( o.value < this.lower || o.value > this.upper) return [];
		return [o];
	},

//////////////// nul.expression implementation

	expression: 'range',
	sum_index: function() { return this.indexedSub(this.lower, this.upper); },
});

nul.globals.Q = nul.obj.number;
nul.globals.string = nul.obj.string;
nul.globals.bool = nul.obj.bool;
