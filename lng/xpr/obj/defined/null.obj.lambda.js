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

//////////////// nul.obj.defined implementation

	attribute: function(an) { nul.fail('Lambdas have no attributes'); },
	
	subUnified: function(o, klg) {	//TODO1: if index == index, don't fuss with subs !
		if('lambda'!= o.expression) nul.fail(o, ' not a lambda');
		return new nul.obj.lambda(
			klg.unify(this.point, o.point),
			klg.unify(this.image, o.image));
	},

//////////////// nul.xpr.object implementation

	subHas: function() { nul.fail('Lambdas contains nothing'); },
		
//////////////// nul.expression implementation

	expression: 'lambda',
	components: ['point', 'image'],
	placed: function($super, prnt) {
		/*if(this.point.toString() == this.image.toString())
			//TODO O Knowledge can bring this info too
			return this.point;	//TODO4: another comparison?*/
		return $super(prnt);
	}
});

nul.obj.lambda.make = function(p, i, klg) {
	return new nul.obj.lambda(p, i);
	var eqKlg = new nul.xpr.knowledge();
	var eqV, lmbd = new nul.obj.lambda(p, i);
	try { eqV = eqKlg.unify(p, i); }
	catch(err) {
		nul.failed(err);	//No way to unify
		return lmbd;
	}
	eqV = eqKlg.wrap(eqV);
	eqKlg = eqV.knowledge;
	if('Always'== eqKlg.name) return eqV.value;
	var dfKlg = new nul.xpr.knowledge(), dfV;
	try { dfV = dfKlg.oppose(eqKlg).wrap(lmbd); }
	catch(err) { nul.failed(err); assert(false, 'eqKlg is not "Always"'); }
	return klg.hesitate(eqV, dfV);
};