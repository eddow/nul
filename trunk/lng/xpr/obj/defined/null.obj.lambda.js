/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.obj.lambda = new JS.Class(nul.obj.defined, /** @lends nul.obj.lambda# */{
	/**
	 * Represents the application of a point to an image.
	 * @example point &rArr; image
	 * @constructs
	 * @extends nul.obj.defined
	 * @param {nul.xpr.object} point
	 * @param {nul.xpr.object} image
	 */
	initialize: function(point, image) {
		/** @type nul.xpr.object */
		this.point = point;
		/** @type nul.xpr.object */
		this.image = image;
		this.callSuper();
		this.alreadyBuilt();
	},

//////////////// nul.obj.defined implementation

	/**
	 * Lambdas have no attributes
	 * @throws {nul.ex.failure}
	 */
	attribute: function() { nul.fail('Lambdas have no attributes'); },
	
	/**
	 * Unify component by component
	 * @param {nul.obj.defined} o The other object to unify to
	 * @param {nul.xpr.knowledge} klg
	 * @returns {nul.obj.lambda} The lambda of unified components
	 * @throws {nul.ex.failure}
	 */
	subUnified: function(o, klg) {
		if('lambda'!= o.expression) nul.fail(o, ' not a lambda');
		return new nul.obj.lambda(
			klg.unify(this.point, o.point),
			klg.unify(this.image, o.image));
	},

	/**
	 * Lambdas contain nothing
	 * @throws {nul.ex.failure}
	 */
	subHas: function() { nul.fail('Lambdas contains nothing'); },
		
//////////////// nul.expression implementation

	/** @constant */
	expression: 'lambda',
	/** @constant */
	components: {
		'point': {type: 'nul.xpr.object', bunch: false},
		'image': {type: 'nul.xpr.object', bunch: false}
	}
});
