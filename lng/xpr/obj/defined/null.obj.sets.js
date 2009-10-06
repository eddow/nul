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
	},
	
//////////////// nul.obj.defined implementation

	attributes: {
		'# ': function() { return nul.obj.litteral.make(pinf); },
	},

});

nul.obj.empty = new (Class.create(nul.obj.hcSet, {
	intersect: function(o) {
		nul.fail('No intersection with ', this);
	},
	has: function(o) {
		return [];
	},
	
	expression: '&phi;',
	
//////////////// nul.obj.defined implementation

	attributes: {
		'# ': function() { return nul.obj.litteral.make(0); },
	},
	
}))();

nul.obj.number = new (Class.create(nul.obj.hcSet, {
	intersect: function($super, o, klg) {
		if('range'== o.expression) return o;
		return $super(o, klg);
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
	intersect: function($super, o, klg) {
		if('range'== o.expression) {
			var lwr = this.lower<o.lower?o.lower:this.lower;
			var upr = this.upper>o.upper?o.upper:this.upper;
			if(lwr > upr) return [];
			return new nul.obj.range(lwr, upr);
		}
		return $super(o, klg);
	},
	initialize: function($super, lwr, upr) {
		this.lower = lwr?parseInt(lwr):ninf;
		this.upper = upr?parseInt(upr):pinf;
		$super();
	},
	has: function($super, o) {
		if(this.lower==this.upper && !o.defined) {
			//TODO3: return "o=nbr[this.bound]"
		}
		if(!o.defined || 'number'!= o.expression) return $super(o);
		if(!nul.isJsInt(o.value)) return [];
		if( o.value < this.lower || o.value > this.upper) return [];
		return [o];
	},

//////////////// nul.obj.defined implementation

	unified: function(o, klg) {
		this.use(); nul.obj.use(o); nul.xpr.mod(klg, nul.xpr.knowledge);
		
		if('range'== o.expression) return (o.lower==this.lower && o.upper==this.upper);
		if('pair'!= o.expression) nul.fail(o, ' is not a range nor a pair');
		if(ninf== this.lower) nul.fail(this, ' has no first');
		//TODO0: warn if(pinf== this.upper) : queue infinie
		klg.unify(nul.obj.litteral.make(this.lower), o.first.value);
		klg.unify(
			(this.lower == this.upper) ?
				nul.obj.empty :
				new nul.obj.range(this.lower+1, this.upper),
			o.second);
		return this;
	},

	attributes: {
		'# ': function() {
			if(ninf== this.lower || pinf== this.upper)
				return nul.obj.litteral.make(pinf);
			return nul.obj.litteral.make(this.upper-this.lower+1);
		},
	},

//////////////// nul.expression implementation

	expression: 'range',
	sum_index: function() { return this.indexedSub(this.lower, this.upper); },
});

nul.globals.Q = nul.obj.number;
nul.globals.str = nul.obj.string;
nul.globals.bool = nul.obj.bool;
