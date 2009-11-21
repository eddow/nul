/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

//TODO 3: express these as descendant from nul.obj.hc
nul.obj.hcSet = Class.create(nul.obj.list, /** @lends nul.obj.hcSet */{
	/**
	 * A set hard-coded in javascript
	 * @extends nul.obj.defined
	 * @constructs
	 */
	initialize: function($super) {
		this.alreadyBuilt();
		return $super();
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

	length: pinf,

//////////////// nul.obj.defined implementation

	/** @constant */
	properties: {
		'# ': function() { return nul.obj.litteral.make(this.length); },
		'': function() { return nul.obj.litteral.tag.set; }
	}
});

/**
 * Empty set : &phi;
 * @class Singleton
 * @extends nul.obj.hcSet
 */
nul.obj.empty = new (Class.create(nul.obj.hcSet, /** @lends nul.obj.empty# */{
	listed: function() { return []; },
	
	intersect: function(o) {
		nul.fail('No intersection with ', this);
	},
	subHas: function() { return []; },
	
	/** @constant */
	expression: '&phi;',
//////////////// nul.obj.defined implementation

	/** @constant */
	length: 0
	
}))();


/**
 * Wholistic set : anything
 * @class Singleton
 * @extends nul.obj.hcSet
 */
nul.obj.whole = new (Class.create(nul.obj.hcSet, /** @lends nul.obj.whole# */{
	listed: function() { return []; },
	
	intersect: function(o) {
		return o;
	},
	subHas: function(o) { return [o]; },
	
	/** @constant */
	expression: 'any'
	
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
		if('number'== o.expression) return isFinite(o.value)?[o]:[];
		if(att.text && att.text.defined) {
			if('string'!= att.text.expression) return [];	//The attribute text is not a string
			var nbr = parseInt(att.text.value);
			if(nbr.toString() != att.text.value) return [];	//The attribute text is not a good numeric string
			return nul.klg.has(o, new nul.obj.litteral.number(nbr));
		}
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
		var kt = new nul.xpr.knowledge();
		var kf = new nul.xpr.knowledge();
		return [kt.wrap(kt.unify(nul.obj.litteral.make(true), o)),
		        kf.wrap(kf.unify(nul.obj.litteral.make(false), o)) ];
	},
	/** @constant */
	expression: 'bool',

////////////////	nul.obj.hcSet implementation

	/** @constant */
	length: 2
}))();

nul.obj.range = Class.create(nul.obj.hcSet, /** @lends nul.obj.range# */{
	//TODO 4: solve or XML make them define as extension ?
	/**
	 * A range of integer numbers
	 * @extends nul.obj.hcSet
	 * @constructs
	 * @param {Number} lwr Lower bound of the set (or nothing for no bound)
	 * @param {Number} upr Upper bound of the set (or nothing for no bound)
	 */
	initialize: function($super, lwr, upr) {
		var specBnd = function(s, inf) { return Object.isUndefined(s)?inf:('string'== typeof s)?parseInt(s):s; };
		this.lower = specBnd(lwr, ninf);
		this.upper = specBnd(upr, pinf);
		//if(ninf== this.lower || pinf== this.upper) this.length = pinf;
		//else if(pinf== this.lower) this.length = 0;
		//else this.length = this.upper-this.lower+1;
		
		$super();
	},
	//TODO C
	intersect: function($super, o, klg) {
		if('range'== o.expression) {
			var lwr = this.lower<o.lower?o.lower:this.lower;
			var upr = this.upper>o.upper?o.upper:this.upper;
			if(lwr > upr) return [];
			return new nul.obj.range(lwr, upr);
		}
		return $super(o, klg);
	},
	//TODO C
	subHas: function($super, o, att) {
		if(this.lower==this.upper && !o.defined) {
			//TODO 3: return "o=nbr[this.bound]"
		}
		var nbr = (o.defined)?nul.obj.number.subHas(o, att):false;
		if(!nbr) return $super(o, att, '#number');		//dunno if number
		if(!nbr.length) return [];						//failure to be a number
		o = nbr[0];	//it's a number !
		if(!isJsInt(o.value)) return [];
		if( o.value < this.lower || o.value > this.upper) return [];
		return [o];
	},

//////////////// nul.obj.defined implementation

	//TODO C
	subUnified: function(o, klg) {
		this.use(); nul.obj.use(o); nul.klg.mod(klg);
		
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

//////////////// nul.expression implementation

	/** @constant */
	expression: 'range',
	/** <a href="http://code.google.com/p/nul/wiki/Summary">Summary</a> computation of {@link index} */
	sum_index: function() { return this.indexedSub(this.lower, this.upper); }
});

//TODO C
nul.globals.Q = nul.obj.number;
nul.globals.Z = new nul.obj.range();
nul.globals.N = new nul.obj.range(0);
nul.globals.text = nul.obj.string;
nul.globals.bool = nul.obj.bool;
nul.globals.any = nul.obj.whole;
