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
		this.alreadyBuilt({isSet: false});
	},
	
//////////////// nul.obj.defined implementation

	unified: function(o, klg) {
		if('lambda'!= o.expression) return;
		//TODO1: " (a => b) = c " peut aussi être a = b = c
		return new nul.obj.lambda(
			klg.unify(this.point, o.point),
			klg.unify(this.image, o.image));
	},
	
//////////////// nul.expression implementation

	expression: 'lambda',
	components: ['point', 'image'],
});
