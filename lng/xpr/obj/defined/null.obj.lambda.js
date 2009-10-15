/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.obj.lambda = Class.create(nul.obj.defined, {
	/**
	 * @param {nul.xpr.object} point
	 * @param {nul.xpr.object} image
	 */
	initialize: function(point, image) {
		this.point = point;
		this.image = image;
		this.alreadyBuilt();
	},
	
//////////////// public

	/**
	 * Specify this belongs to a set (not a function).
	 * Build a possible value where point=image in 's'
	 * @param {nul.xpr.object} s
	 * @return nul.xpr.possible
	 */
	isInSet: function(s) {
		var klg = new nul.xpr.knowledge();
		return klg.wrap(klg.hesitate(s.having(klg.unify(this.point, this.image))));
	},

	/**
	 * Specify this belongs to a set (not a function).
	 * Build a possible value where point=image in 's'
	 * @param {nul.xpr.object} p Domain / Lambda set (optional)
	 * @param {nul.xpr.object} i Image set
	 * @return nul.xpr.possible
	 */
	isInFct: function(p, i) {
		var l;
		if(i) l = new nul.obj.lambda(p, i);
		else {
			l = p;
			p = l.point;
			i = l.image;
		}
		var klg = new nul.xpr.knowledge();
		var kSep = new nul.xpr.knowledge();	//a=>b in A=>B iif a in A and b in B
		var vSep = kSep.wrap(
				new nul.obj.lambda(
						kSep.hesitate(p.having(this.point)),
						kSep.hesitate(i.having(this.image)) )
				);
		var vMut = this.isInSet(l);	//a=>b in A=>B iif (a=b) in A=>B
		return klg.wrap(klg.hesitate(vSep, vMut));
	},

//////////////// nul.obj.defined implementation

	attribute: function(an) { nul.fail('Lambdas have no attributes'); },
	
	unified: function(o, klg) {
		if('lambda'!= o.expression) nul.fail(o, ' not a lambda');
		return new nul.obj.lambda(
			klg.unify(this.point, o.point),
			klg.unify(this.image, o.image));
	},

//////////////// nul.xpr.object implementation

	has: function($super, o) {
		if(!o.defined) return $super(o);
		if('lambda'!= o.expression) {
			var klg = new nul.xpr.knowledge();
			return klg.wrap(klg.hesitate(this.point.having(klg.hesitate(this.image.having(o)))));
		}
		return o.isInFct(this);
	},
		
//////////////// nul.expression implementation

	expression: 'lambda',
	components: ['point', 'image'],
	placed: function($super, prnt) {
		if(this.point.toString() == this.image.toString())
			//TODO0 Knowledge can bring this info too
			return this.point;	//TODO4: another comparison?
		return $super(prnt);
	}
});
