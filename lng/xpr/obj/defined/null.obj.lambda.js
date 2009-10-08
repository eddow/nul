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
	 * Specify this belongs ot a set (not a function).
	 * Build a possible value where point=image in 's'
	 * @param {nul.xpr.object} s
	 * @return nul.xpr.possible
	 */
	isInSet: function(s) {
		var klg = new nul.xpr.knowledge();
		return klg.wrap(klg.hesitate(s.having(klg.unify(this.point, this.image))));
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
		//TODO3
	},
		
//////////////// nul.expression implementation

	expression: 'lambda',
	components: ['point', 'image'],
	placed: function($super, prnt) {
		if(this.point.toString() == this.image.toString())
			//TODO0 Knowledge can bring this info too
			return this.point;	//TODO4: another comparison?
		return $super(prnt);
	},
});
