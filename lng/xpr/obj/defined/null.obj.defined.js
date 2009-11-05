/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.obj.defined = Class.create(nul.xpr.object, /** @lends nul.obj.defined# */{
	/**
	 * Defined object : are defined its composition, its attributes, ...
	 * @extends nul.xpr.object
	 * @constructs
	 */
	initialize: function($super) {
		this.cachedProperties = {};
		$super();
	},
	defined : true,
	
//////////////// public

	/**
	 * Unify two defined objects
	 * @return {nul.obj.defined}
	 * @throws {nul.failure}
	 */
	unified: function(o, klg) {
		this.use(); nul.obj.use(o); nul.xpr.mod(klg, 'nul.xpr.knowledge');
		
		if(o.toString() == this.toString()) return true;
		if(this.subUnified) {
			var e = [this, o];
			var rv = 0;
			if(e[0].selfRef && e[1].selfRef) {
				var nwSelf = nul.execution.name.gen('obj.local.self');
				e[0] = e[0].reself(nwSelf);
				e[1] = e[1].reself(nwSelf);
			}
			if(e[1].selfRef) {
				e.unshift(e.pop());
				rv = 1-rv;
			}
			if(e[0].selfRef) e[0] = e[0].reself(e[1]);
			return e[rv].subUnified(e[1-rv], klg);
		}
		nul.fail(this, ' does not unify to ', o);
	},
	
	/**
	 * Intersect two defined objects
	 * @return nul.obj.defined
	 * @throws {nul.failure}
	 * TODO 2: refaire le meme systeme qu'avec unified : subIntersect de deux defined
	 */
	intersect: function(o, klg) {
		this.use(); nul.obj.use(o); nul.xpr.mod(klg, 'nul.xpr.knowledge');
		if(o == this) return true;
	},
	
	
	/**
	 * Bunch of named attributes
	 * @type {nul.xpr.object[String]}
	 * @constant
	 */
	attributes: {},
	
	/**
	 * Bunch of instant-made attributes
	 * @type {function() {nul.xpr.object} [String]}
	 * @constant
	 */
	properties: {
		'': function() { throw 'abstract'; }
	},
	
	/**
	 * Retrieve an attribute
	 * @param {String} an Attribute Name
	 * @return {nul.xpr.object}
	 * @throws {nul.failure}
	 */
	attribute: function(anm, klg) {
		var af = this.attributes[anm] || this.cachedProperties[anm];
		if(af) return af;
		af = this.properties[anm];
		if(af) return this.cachedProperties[anm] = af.apply(this, [klg, anm]);
		nul.fail(this, 'doesnt have the attribute "'+anm+'"');
	},
	
	/**
	 * Return a list of possibles[nul.xpr.possible] 'o' once it is known that 'o' is in this 'set'
	 * Or nothing if nothing can be simplified
	 * @param {nul.xpr.object} o
	 * @param {nul.xpr.object[]} attrs
	 * @return {nul.xpr.object[]|nul.xpr.possible[]}
	 */
	has: function(o, attrs) {
		if(this.subHas) {
			if(!this.selfRef) return this.subHas(o, attrs);
			return nul.trys(function() {
				var psbl = this.subHas(o, attrs);
				var dp = [];
				while(psbl.length) dp.pushs(psbl.pop().distribute());
				switch(dp.length) {
				case 0: nul.fail('No convenient recursive base-case');
				case 1: return dp[0].beself(this).distribute();	//TODO O: see which equivls[0] appears in (&isin; &uArr;) to determine recursive argument
				default:
					return;
					var klg = new nul.xpr.knowledge();
					var srcLcl = klg.newLocal('&uArr;');
					klg.unify(srcLcl, this);
					var sRef = this.selfRef;
					dp = map(dp, function() { return this.beself(srcLcl, sRef); });
					return [klg.wrap(klg.hesitate(dp))];
				}
			}, 'Recursion', this, [o, this]);
		}
	},
	
////////////////nul.xpr.object implementation

	/**
	 * Return a list of possibles[nul.xpr.possible] 'o' once it is known that 'o' is in this 'set'
	 * Try first an assertion of 'this.has'. If nothing is possible, just let the belonging assertion.
	 * @param {nul.xpr.object} o
	 * @param {nul.xpr.knowledge} klg
	 * @return {nul.xpr.possible[]}
	 */
	having: function($super, o, attr) {
		return this.has(o, attr||{}) || $super(o, attr);
	}
});
