/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
/*#
 * requires: src/lng/null.execution
 * uses:
 * src/lng/txt/out/null.txt
 * src/lng/algo/null.browse, src/lng/algo/null.recur, src/lng/algo/null.solve
 * src/krnl/null.dependance,
 * src/lng/xpr/obj/null.xpr.object
 */

/**
 * Shortcut to build expression summary items
 */
nul.summary = function(itm) {
	return function() { return this.summary(itm); };
};

nul.expression = new JS.Class(/** @lends nul.expression# */{
	/**
	 * @class NUL expression
	 * @constructs
	 * @param {String} tp Type of expression
	 */
 	initialize: function(tp) {
		this.haveOrigin();
		/**
		 * @type String
		 */
 		if(tp) this.expression = tp;
 	},

	/**
	 * Fix my origin from a new action
	 * @param {nul.expression} frm The expression this is derived from
	 */
 	haveOrigin: function(frm) {
		if(nul.action) this.origin = new nul.origin(frm);
		return this;
 	},

	/**
	 * Fix my origin provenance to frm without changing the action
	 * @param {nul.expression} frm The expression this is derived from
	 */
 	from: function(frm) {
 		if(nul.action) this.origin.from = frm;
		return this;
 	},
 	/**
 	 * Defined empty by default. Must be overriden.
 	 * @type String[]
 	 */
	components: {},
	
//////////////// Assertions

	/**
	 * Assert this expression is modifiable
	 */
	modify: function() {
		return !this.summarised;
	}.contract('Cannot modify summarised'),
	/**
	 * Assert this expression is summarised
	 */
	use: function() {
		return !!this.summarised;
	}.contract('Cannot use non-summarised'),

//////////////// Summary functionment

	/**
	 * Retrieve a computed value about this expression
	 * @param {String} itm Summary item to retrieve
	 */
	summary: function(itm) {
		if(!this.summarised) return this['sum_'+itm].apply(this);
		//this.use();
		if('undefined'== typeof this.summarised[itm]) {
			if(nul.debugged) nul.assert(this['sum_'+itm],'Summary '+itm+' provided for '+this.expression);
			this.summarised[itm] = this['sum_'+itm].apply(this);
		}
		return this.summarised[itm];
	},
	
	/**
	 * Compute the summary of this expression. Marks it as unmodifiable
	 * @param {Association} smr The given summary
	 */
	summarise: function(smr) {
		this.modify();
		this.summarised = smr || {};
	},

	/**
	 * Return a clone version of this expression to modify it.
	 */
	modifiable: function() {
		this.use();
		return this.clone('summarised');
	},

	/**
	 * Return a clone version of this expression to modify it.
	 * @param {String} paramarray List of elements to exclude from clone
	 */
	clone: function() {
		var bsd = beArrg(arguments);
		var comps = this.components;
		var rv = maf(this, function(ndx, obj) {
			if(!bsd.include(ndx)) 
				return (comps[ndx] && comps[ndx].bunch)?map(obj):obj;
		});
		
		return rv.haveOrigin(this);
	},

//////////////// Virtuals

	/**
	 * Return a built version of this expression when the components has bee modified by browse
	 */
	chew: function() {
		this.modify();
		return this.built();
	},	
	/**
	 * Return a summarised version of this. Verify children consistency and make them {@link placed}
	 */
	built: function(smr) {
		if(nul.debugged) nul.assert(this.origin, 'Each expression have an origin.');
		this.modify();
		for(var comp in this.components)
			if(this.components[comp].bunch) {
				for(var ci in ownNdx(this[comp])) if('function'!= typeof this[comp][ci]) {
					this[comp][ci] = this[comp][ci].placed(this);
					nul.xpr.use(this[comp][ci], this.components[comp].type);
				}
			} else {
				this[comp] = this[comp].placed(this);
				nul.xpr.use(this[comp], this.components[comp].type);
			}
		this.summarise(smr);
		return this.fix();
	},
	/**
	 * Built called in a constructor.
	 * No return value, assume it returns this
	 */
	alreadyBuilt: function(smr) {
		var built = this.built(smr);
		if(nul.debugged) nul.assert(this===built, 'Already built fix self');
	},
	/**
	 * Modify internal representation : you won't be changed anymore
	 */
	fix: function() {
		this.use();
		return this;
	},
	/**
	 * Get the version to set as a child of 'prnt' to represent me
	 */
	placed: function(prnt) {
		this.use(); nul.xpr.mod(prnt);
		return this;
	},
	
//////////////// Public

	/**
	 * Change the summarised human-destinated texts
	 * Can be changed even for a built expression (doesn't change the meaning, just the debug drawing)
	 */
	invalidateTexts: function() {
		//TODO 3: invalidate parent texts ?
		delete this.summarised.flatTxt;
		delete this.summarised.htmlTxt;
	},

	
////////////////Internals

	/**
	 * Change self sub-representations. Either to change the self-context index or to modify it by another known value
	 * @param {nul.xpr.object|Name} newSelf
	 * @param {Name} selfRef The actual self reference to replace (this one if none specified)
	 * If newSelf is a {nul.xpr.object}, it will replace the self-references
	 * If not, it will be considered as a new self index
	 */
	reself: function(newSelf, selfRef) {
		if(!this.selfRef && !selfRef) return this;
		var rv = new nul.xpr.object.reself(selfRef || this.selfRef, newSelf).browse(this);
		if(nul.debugged) nul.assert(this.expression == rv.expression || ('pair'== this.expression && '&phi;'== rv.expression),
			'Reselfing doesnt modify the definition');
		return rv;
	},

	/**
	 * @param {document} doc
	 * @return {XMLElement}
	 * @throw {nul.ex.semantic}
	 * TODO 2 returns Element
	 */
	XML: function(doc) {
		nul.ex.semantic('XML', this.expression + ' doesnt fit for XML output', this);
	},
	
//////////////// Summary users

	/**
	 * <a href="http://code.google.com/p/nul/wiki/Summary">Summary</a>: The key string-index of this expression
	 * @function
	 * @return {String}
	 */
	toString: nul.summary('index'),
	/**
	 * <a href="http://code.google.com/p/nul/wiki/Summary">Summary</a>: The HTML representation
	 * @function
	 * @return {HTML}
	 */
	toHtml: nul.summary('htmlTxt'),
	/**
	 * <a href="http://code.google.com/p/nul/wiki/Summary">Summary</a>: The NODE representation
	 * @function
	 * @return {NODE}
	 */
	toNode: function() { return this.summary('nodeTxt').clone(true); },
	/**
	 * <a href="http://code.google.com/p/nul/wiki/Summary">Summary</a>: The flat-text representation
	 * @function
	 * @return {String}
	 */
	toFlat: nul.summary('flatTxt'),
	/**
	 * <a href="http://code.google.com/p/nul/wiki/Summary">Summary</a>: The dependances of this expression.
	 * @function
	 * @return {nul.dependance}
	 */
	dependance: nul.summary('dependance'),

//////////////// Generic summary providers

	/** <a href="http://code.google.com/p/nul/wiki/Summary">Summary</a> computation of 'components' */
	sum_components: function() {
		var rv = {};
		for(var comp in this.components)
			if(this.components[comp].bunch) {
				for(var ci in ownNdx(this[comp]))
					rv[comp+':'+ci] = this[comp][ci];
			} else rv[comp] = this[comp];
		return rv;
	},
	
	/** <a href="http://code.google.com/p/nul/wiki/Summary">Summary</a> computation of {@link index} */
	sum_index: function() {
		var cs = [];
		for(var c in this.components) cs.push(this[c]);
		return this.indexedSub();
	},

	/**
	 * Create an index string out of this object and some given more information
	 * @param {String[]} paramarray Specification to hold
	 */
	indexedSub: function() {
		//TODO 3: assert no infinite recursion
		nul.xpr.is(this);
	 	items = beArrg(arguments).join(',');
	 	var rv = [];
	 	for(var c in this.components)
	 		if(this.components[c].bunch) {
	 			for(var e in ownNdx(this[c]))
	 				rv.push(c+'.'+e+':'+this[c][e].toString());
	 		} else rv.push(c+':'+this[c].toString());
	 	if(items) rv.unshift(items);
	 	rv.unshift(this.expression);
	 	return '['+ rv.join('|') +']';
	},

	/** <a href="http://code.google.com/p/nul/wiki/Summary">Summary</a> computation of {@link toNode} */
	sum_nodeTxt: function() { return nul.txt.node.toText(this); },
	/** <a href="http://code.google.com/p/nul/wiki/Summary">Summary</a> computation of {@link toHtml} */
	sum_htmlTxt: function() { return nul.txt.html.toText(this); },
	/** <a href="http://code.google.com/p/nul/wiki/Summary">Summary</a> computation of {@link toFlat} */
	sum_flatTxt: function() { return nul.txt.flat.toText(this); },
	/** <a href="http://code.google.com/p/nul/wiki/Summary">Summary</a> computation of {@link dependance} */
	sum_dependance: function() {
		var comps = this.summary('components');
		var rv = new nul.dependance();
		for(var c in comps) if(comps[c])
			rv.also(comps[c].dependance());
		return rv;
	}
	
});

/**
 * Expression management helper
 * @namespace 
 */
nul.xpr = nul.debugged?/** @lends nul.xpr */{
	/**
	 * Assert: 'x' are a collection of expression of type 't'
	 * @param {nul.expression[]} x
	 * @param {String} t JS type name
	 */
	are: function(x, t) {
		nul.debugged.are(t||'nul.expression')(x);
		return x;
	},
	/**
	 * Assert: 'x' is an expression of type 't'
	 * @param {nul.expression} x
	 * @param {String} t JS type name
	 */
	is: function(x, t) {
		nul.debugged.is(t||'nul.expression')(x);
		return x;
	},
	/**
	 * Assert: 'x' is an expression of type 't'. 'x' is summarised.
	 * @param {nul.expression} x
	 * @param {String} t JS type name
	 */
	use: function(x, t) {
		nul.debugged.is(t||'nul.expression', 'summarised', function(o) { return !!o.summarised; })(x);
		return x;
	},
	/**
	 * Assert: 'x' is an expression of type 't'. 'x' is not summarised.
	 * @param {nul.expression} x
	 * @param {String} t JS type name
	 */
	mod: function(x, t) {
		nul.debugged.is(t||'nul.expression', 'modifiable', function(o) { return !o.summarised; })(x);
		return x;
	}
}:/** @ignore */{ are: $.id, is: $.id, use: $.id, mod: $.id };

/**
 * Retrieve an expression (and modifies the knowledge) to represent a value-taking
 * @returns {nul.expression} rv; set(itm=>rv)
 */
nul.xpr.application = function(set, itm, klg) {
	var lcl = klg.newLocal(nul.understanding.rvName);
	var rv = klg.hesitate(set.having(new nul.obj.lambda(itm, lcl)));
	if(rv.isA(nul.obj.lambda)) return rv.image;
	return lcl;
};

