/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.obj.defined = Class.create(nul.xpr.object, {
	summarise: function($super, smr) {
		$super(smr);
	},
	defined : true,
	
//////////////// public

	/**
	 * Unify two defined objects
	 * @return nul.obj.defined
	 * @throws nul.failure
	 */
	unified: function(o, klg) {
		this.use(); nul.obj.use(o); nul.xpr.mod(klg, nul.xpr.knowledge);
		
		if(o.toString() != this.toString()) nul.fail(this, ' does not unify to ', o);
		return true;
	},
	
	/**
	 * Intersect two defined objects
	 * @return nul.obj.defined
	 * @throws nul.failure
	 */
	intersect: function(o, klg) {
		this.use(); nul.obj.use(o); nul.xpr.mod(klg, nul.xpr.knowledge);
		
		if(o.toString() != this.toString()) nul.fail(this, ' does not intersect with ', o);
		return true;
	},
	
	/**
	 * Retrieve an attribute
	 * @param {string} an Attribute Name
	 * @return {nul.xpr.object}
	 * @throws {nul.failure}
	 */
	attribute: function(an) {
		var af = this.attributes[an];
		if(!af) {
			if(' '!= an) nul.fail(this, 'doesnt have the attribute "'+an+'"');
			return this;	//TODO4: useful ?
		}
		return ('function'== typeof af)?af.apply(this):af;
	},

});
