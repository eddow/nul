/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.obj.hc = new JS.Class(nul.obj.defined, /** @lends nul.obj.hc# */{
	/**
	 * The objects that is defined in javascript, along functions and/or set listing.
	 * @constructs
	 * @extends nul.obj.defined
	 * @param {Object} singleton Sub-class definition. Used when sub-classment is made for a singleton, to avoid new Class.create()()
	 */
	initialize: function(singleton) {
		if(singleton) this.extend(singleton);
		this.alreadyBuilt();
		return this.callSuper();
	},
	
	/**
	 * Abstract : Retrieve a value from a key (use the container as a function, key is the argument)
	 * @param {nul.obj.defined} key
	 * @return {nul.xpr.object|nul.data|nul.xpr.possible[]}
	 */
	seek: function(key) { nul.ex.semantic('CNT', this.expression+' cannot retrieve items', this); },
	/**
	 * Abstract : List the direct values of this set (the values that are not lambdas)
	 * @return {nul.xpr.object|nul.data|nul.xpr.possible[]}
	 */
	listed: function() { nul.ex.semantic('CNT', this.expression+' cannot select items', this); },
	
	/**
	 * {@link nul.obj.hc.filter} the {@link nul.obj.hc#.seek} along the expected object to select
	 * @param {nul.obj.defined} pnt 'Arguments' of the function call. Have no dependance.
	 * @param {nul.xpr.object} img 'Return value' of the function call.
	 * @param {nul.xpr.object[String]} att Attributes of the 'return value' of the function call.
	 * @return {nul.xpr.possible[]}
	 */
	retrieve: function(pnt, img, att) {
		return nul.obj.hc.filter(
				this.seek(pnt),
				img, att,
				function(v) { return new nul.obj.lambda(pnt, v); }
			);
	},
	/**
	 * {@link nul.obj.hc.filter} the {@link nul.obj.hc#.list} along the expected object to select
	 * @param {nul.xpr.object} obj 'Return value' of the function call.
	 * @param {nul.xpr.object[String]} att Attributes of the 'return value' of the function call.
	 * @return {nul.xpr.possible[]}
	 */
	select: function(obj, att) {
		return nul.obj.hc.filter(this.listed(), obj, att);
	},	
	
	/**
	 * Delegate extraction to specific function-call or listing
	 * @param {nul.xpr.object} o
	 * @param {nul.xpr.object[]} attrs
	 * @return {nul.xpr.object[]|nul.xpr.possible[]}
	 */
	subHas: function(o, attrs) {
		if(o.isA(nul.obj.lambda) && isEmpty(o.point.dependance().usages)) return this.retrieve(o.point, o.image, attrs);
		else if((o.isA(nul.obj.defined) && !o.isA(nul.obj.lambda)) || !isEmpty(attrs)) return this.select(o, attrs);
	}
});

/**
 * Used to bind pure data obj.hc can give to a knowledge and, therefore, possibles.
 * @param {nul.xpr.object|nul.data|nul.xpr.possible[]} objs The given objects
 * @param {nul.xpr.object} exp The expected object
 * @param {nul.xpr.object[String]} exp The attributes of the expected object
 * @param {function(any) nul.xpr.object} wrp Function used to build a return object out of 'exp' for instance 
 */
nul.obj.hc.filter = function(objs, exp, att, wrp) {
	if(!$.isArray(objs)) objs = [objs];
	return maf(objs, function(n, orv) {
		try {
			if(orv.isA(nul.data)) orv = orv.object;
			var klg;
			if(orv.isA(nul.xpr.possible)) {
				klg = orv.knowledge.modifiable();
				nul.klg.mod(klg);
				orv = orv.value;
			} else klg = new nul.xpr.knowledge();
			nul.obj.use(orv);
			var vl = klg.unify(orv, exp);
			vl = klg.attributed(vl, att);
			if(wrp) vl = wrp(vl);
			return klg.wrap(vl);
		} catch(e) { nul.failed(e); }
	});
};
