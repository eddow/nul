/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.obj.hcSet = Class.create(nul.obj.defined, {
	initialize: function() {
		this.alreadyBuilt();
	},
	
	/**
	 * Consider this set is not a transformation
	 */
	has: function($super, o) {
		nul.obj.use(o);
		if(o.isInSet) return [o.isInSet(this)];
		if(o.defined) return [];
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
	expression: '&phi;',
}))();

nul.obj.number = new (Class.create(nul.obj.hcSet, {
	intersect: function(o) {
		if('range'== o.expression) return o;
	},
	has: function($super, o) {
		if('number'== o.expression) return [o];
		return $super(o);
	},
	expression: '&#x211a;',
}))();

nul.obj.string = new (Class.create(nul.obj.hcSet, {
	has: function($super, o) {
		if('string'== o.expression) return [o];
		return $super(o);
	},
	expression: 'str',
}))();

nul.obj.bool = new (Class.create(nul.obj.hcSet, {
	has: function($super, o) {
		if('boolean'== o.expression) return [o];
		return $super(o);
	},
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
		this.lower = lwr?parseInt(lwr):ninf;
		this.upper = upr?parseInt(upr):pinf;
		$super();
	},
	has: function($super, o) {
		if(!o.defined || 'number'!= o.expression) return $super(o);
		if(!nul.isJsInt(o.value)) return [];
		if( o.value < this.lower || o.value > this.upper) return [];
		return [o];
	},

//////////////// nul.obj.defined implementation

	unified: function(o, klg) {
		this.use(); nul.obj.use(o); nul.xpr.mod(klg, nul.xpr.knowledge);
		
		if('range'== o.expression) return (o.lower==this.lower && o.upper==this.upper);
		if('pair'!= o.expression) nul.fail(this, ' is not a range');
		if(ninf== this.lower) nul.fail(this, ' has no first');
		//TODO0: warn if(pinf== this.upper) : queue infinie
		klg.unify(new nul.obj.litteral(this.lower), o.first.value);
		klg.unify(
			(this.lower == this.upper) ?
				nul.obj.empty :
				new nul.obj.range(this.lower+1, this.upper),
			o.second);
		return this;
	},

//////////////// nul.expression implementation

	expression: 'range',
	sum_index: function() { return this.indexedSub(this.lower, this.upper); },
});

nul.globals.Q = nul.obj.number;
nul.globals.str = nul.obj.string;
nul.globals.bool = nul.obj.bool;
