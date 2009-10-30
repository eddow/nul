/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.obj.hcSet = Class.create(nul.obj.defined, /** @lends nul.obj.hcSet */{
	/**
	 * A set hard-coded in javascript
	 * @extends nul.obj.defined
	 * @constructs
	 */
	initialize: function() {
		this.alreadyBuilt();
	},
	
	/**
	 * Consider this set is not a transformation
	 */
	subHas: function(o, att, typeAttr) {
		nul.obj.use(o);
		if(o.defined) return [];
		if(!att[''] || 'string'!= att[''].expression || typeAttr != att[''].value) {
			var klg = new nul.xpr.knowledge();
			klg.attributed(o, '', new nul.obj.litteral.string(typeAttr));
			klg.belong(o, this);
			return [klg.wrap(o)];
		}
	},
	
//////////////// nul.obj.defined implementation

	/** @constant */
	attributes: {
		'# ': function() { return nul.obj.litteral.make(pinf); }
	}
});

/**
 * Empty set : &phi;
 * @class Singleton
 * @extends nul.obj.hcSet
 */
nul.obj.empty = new (Class.create(nul.obj.hcSet, /** @lends nul.obj.empty# */{
	intersect: function(o) {
		nul.fail('No intersection with ', this);
	},
	subHas: function() { return []; },
	
	/** @constant */
	expression: '&phi;',
	
//////////////// nul.obj.defined implementation

	/** @constant */
	attributes: {
		'# ': function() { return nul.obj.litteral.make(0); }
	}
	
}))();

/**
 * Set of number litterals
 * @class Singleton
 * @extends nul.obj.hcSet
 */
nul.obj.number = new (Class.create(nul.obj.hcSet, /** @lends nul.obj.number# */{
	intersect: function($super, o, klg) {
		if('range'== o.expression) return o;
		return $super(o, klg);
	},
	subHas: function($super, o, att) {
		if('number'== o.expression) return [o];
		return $super(o, att, '#number');
	},
	/** @constant */
	expression: '&#x211a;'
}))();

/**
 * Set of string litterals
 * @class Singleton
 * @extends nul.obj.hcSet
 */
nul.obj.string = new (Class.create(nul.obj.hcSet, /** @lends nul.obj.string# */{
	subHas: function($super, o, att) {
		if('string'== o.expression) return [o];
		return $super(o, att, '#text');
	},
	expression: 'text'
}))();

/**
 * Set of boolean litterals
 * @class Singleton
 * @extends nul.obj.hcSet
 */
nul.obj.bool = new (Class.create(nul.obj.hcSet, /** @lends nul.obj.bool# */{
	subHas: function($super, o, att) {
		if('boolean'== o.expression) return [o];
		return $super(o, att, '#boolean');
	},
	/** @constant */
	expression: 'bool'
}))();

nul.obj.range = Class.create(nul.obj.hcSet, /** @lends nul.obj.range# */{
	/**
	 * A range of integer numbers
	 * @extends nul.obj.hcSet
	 * @constructs
	 * @param {Number} lwr Lower bound of the set (or nothing for no bound)
	 * @param {Number} upr Upper bound of the set (or nothing for no bound)
	 */
	initialize: function($super, lwr, upr) {
		this.lower = lwr?parseInt(lwr):ninf;
		this.upper = upr?parseInt(upr):pinf;
		$super();
	},
	intersect: function($super, o, klg) {
		if('range'== o.expression) {
			var lwr = this.lower<o.lower?o.lower:this.lower;
			var upr = this.upper>o.upper?o.upper:this.upper;
			if(lwr > upr) return [];
			return new nul.obj.range(lwr, upr);
		}
		return $super(o, klg);
	},
	subHas: function($super, o, att) {
		if(this.lower==this.upper && !o.defined) {
			//TODO 3: return "o=nbr[this.bound]"
		}
		if(!o.defined || 'number'!= o.expression) return $super(o, att, '#number');
		if(!nul.isJsInt(o.value)) return [];
		if( o.value < this.lower || o.value > this.upper) return [];
		return [o];
	},

//////////////// nul.obj.defined implementation

	subUnified: function(o, klg) {
		this.use(); nul.obj.use(o); nul.xpr.mod(klg, 'nul.xpr.knowledge');
		
		if('range'== o.expression) return (o.lower==this.lower && o.upper==this.upper);
		if('pair'!= o.expression) nul.fail(o, ' is not a range nor a pair');
		if(ninf== this.lower) nul.fail(this, ' has no first');
		//TODO O: warn if(pinf== this.upper) : queue infinie
		klg.unify(nul.obj.litteral.make(this.lower), o.first.value);
		klg.unify(
			(this.lower == this.upper) ?
				nul.obj.empty :
				new nul.obj.range(this.lower+1, this.upper),
			o.second);
		return this;
	},

	/** @constant */
	attributes: {
		'# ': function() {
			if(ninf== this.lower || pinf== this.upper)
				return nul.obj.litteral.make(pinf);
			return nul.obj.litteral.make(this.upper-this.lower+1);
		}
	},

//////////////// nul.expression implementation

	/** @constant */
	expression: 'range',
	sum_index: function() { return this.indexedSub(this.lower, this.upper); }
});

nul.globals.Q = nul.obj.number;
nul.globals.Z = new nul.obj.range();
nul.globals.N = new nul.obj.range(0);
nul.globals.text = nul.obj.string;
nul.globals.bool = nul.obj.bool;
