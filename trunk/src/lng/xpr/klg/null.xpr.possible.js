/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
//#requires: src/lng/xpr/null.expression, uses: src/lng/xpr/klg/null.klg

nul.xpr.possible = new JS.Class(nul.expression, /** @lends nul.xpr.possible# */{
	/**
	 * @class A value associated with a knowledge : A value that can be unified to several different defined object, along some conditions.
	 * @extends nul.expression
	 * @constructs
	 * @param {nul.xpr.object} value
	 * @param {nul.xpr.knowledge} knowledge
	 */
	initialize: function(value, knowledge) {
		this.callSuper(null, null);
		if(value) {
			if(!knowledge) knowledge = nul.klg.always;
			nul.obj.use(value); nul.klg.use(knowledge);
			/** @type nul.xpr.object */
			this.value = value;
			/** @type nul.xpr.knowledge */
			this.knowledge = knowledge;
		}
		this.alreadyBuilt();
	},

//////////////// public

	/**
	 * The knowledge now knows all what this possible knows - gets the value expression then
	 * @param {nul.xpr.knowledge} klg destination knowledge
	 * @return {nul.xpr.object} This modified value (to refer the new knowledge)
	 */
	valueKnowing: function(klg) {
		return klg.merge(this.knowledge, this.value);
	},
	
	/**
	 * Returns a possible, this unified to an object
	 * @param {nul.xpr.object} o
	 * @return {nul.xpr.possible}
	 * @throws {nul.ex.failure}
	 */
	extract: function(o) {
		//var klg = this.knowledge.modifiable();
		var klg = new nul.xpr.knowledge();
		//Merge because we need to create a new context reference in case of half-recursion
		var rv = klg.wrap(klg.unify(klg.merge(this.knowledge, this.value), o));
		if(nul.debugged) nul.assert(!rv.dependance().usages[klg.name], 'Out of knowledge, no more deps');
		return rv;
	}.describe('Extraction'),
	
	/**
	 * Determine wether the resolution engine can distribute anything
	 * @return {Boolean}
	 */
	distribuable: function() {
		return this.knowledge.distribuable();
	},
	
	/**
	 * Use the resolution engine : make several possibles without ior3
	 * @return {nul.xpr.possible[]}
	 */
	distribute: function() {
		if(!this.knowledge.distribuable()) return [this];
		var val = this.value;
		return maf(this.knowledge.distribute(), function() {
			try { return this.wrap(val); } catch(e) { nul.failed(e); }
		});
	},
	
	/**
	 * @param {document} doc
	 * @return {XMLElement}
	 * @throw {nul.ex.semantic}
	 * TODO 2 returns Element
	 */
	XML: function(doc) {
		if(nul.klg.always != this.knowledge) //TODO 2: if possible too fuzzy, get a "loading" node 
			nul.ex.semantic('XML', 'No XML fixed representation for fuzzy expression', this);
		return this.value.XML(doc);
	},	
	
//////////////// nul.expression summaries

	sum_dependance: function() {
		var rv = this.callSuper();
		this.usage = rv.use(this.knowledge);
		return rv;
	},

//////////////// nul.expression implementation
	
	/** @constant */
	expression: 'possible',
	/** @constant */
	components: {
		'value': {type: 'nul.xpr.object', bunch: false},
		'knowledge': {type: 'nul.xpr.knowledge', bunch: false}
	},
	chew: function() {
		nul.klg.use(this.knowledge);
		return this.knowledge.modifiable().wrap(this.value);
	}.describe('Possible reformulation'),

////////////////	Internals

	/**
	* Change self references to the given self-refered object
	* @param {nul.obj.defined} recursion The object that contains 'this' and makes recursion
	*/
	beself: function(recursion) {
		var fz = this;	//TODO 2: possible#beself
		//1 - remove in knowledge : x in y : x is value and y self-ref
		//TODO O: ne faire cela que si dependance de selfref
		/*var klg = this.knowledge.modifiable();
		var ec = klg.access[this.value];
		if(ec) {
			nul.xpr.use(ec, 'nul.klg.eqClass');
			ec = klg.freeEC(ec);
			for(var b=0; ec.belongs[b]; ++b) {
				var blg = ec.belongs[b];
				if(nul.obj.local.is(blg) && nul.obj.local.self.ref == blg.klgRef && slf.selfRef== blg.ndx) {
					ec.belongs.splice(b,1);
					klg.minMult = 0;
					break;
				}
			}
			klg.ownEC(ec);
			fz = klg.wrap(this.value);
		}*/
		//2 - replace the self-reference by the set
		return new nul.xpr.object.reself(recursion.selfRef, recursion).browse(fz);	//TODO 2: reself other fct ?
		//return fz.reself(slf, selfRef); slf.reself(..., fz) ?
	}
});

nul.xpr.failure = nul.xpr.possible.prototype.failure = new JS.Singleton(nul.xpr.possible, /** @lends nul.xpr.failure# */{
	/**
	 * Singleton
	 * @class Specific possible that never give any value.
	 * @extends nul.xpr.possible
	 * @constructs
	 */
	initialize: function() { this.callSuper(); },
	/** @constant */
	expression: 'possible',
	/** @constant */
	components: {},
	distribuable: function() { return true; },
	distribute: function() { return []; }
});

/**
 * Have a possible for sure. Made with nul.klg.always if an object is given
 * @param {nul.xpr.possible|nul.xpr.object} o
 */
nul.xpr.possible.cast = function(o) {
	if('possible'== o.expression) return o;
	return new nul.xpr.possible(o);
};
