/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

 /**
  * Used to build expression summary items
  */
nul.summary = function(itm) {
	return function() { return this.summary(itm); };
};
//TODO 1: change the docs "defined in" to have a relative path.
nul.expression = Class.create(/** @lends nul.expression# */{
	/**
	 * Expression
	 * @constructs
	 * @param {String} tp Type of expression
	 */
 	initialize: function(tp) {
		/**
		 * @type String
		 */
 		if(tp) this.expression = tp;
 	},
 	/**
 	 * Defined empty by default. Must be overriden.
 	 * @type String[]
 	 */
	components: [],
	
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
		return this.summarised;
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
			assert(this['sum_'+itm],'Summary '+itm+' provided for '+this.expression);
			this.summarised[itm] = this['sum_'+itm].apply(this);
		}
		return this.summarised[itm];
	},
	
	/**
	 * Stop the modifications brought to this expression. Now, we compute some values about
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
		return maf(this, function(ndx, obj) { if('summarised'!= ndx) return obj; });
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
	 * Return a summarised version of this.
	 */
	built: function(smr) {
		this.modify();
		for(var comp in this.components) if(cstmNdx(comp)) {
			var cname = this.components[comp];
			if(nul.debug.assert) assert('attribs'!= cname || nul.xpr.bunch(this[cname]),
				'Attributes ARE bunch');
			if(nul.xpr.bunch(this[cname])) {
				for(var ci in this[cname]) if(cstmNdx(ci))
					this[cname][ci] = this[cname][ci].placed(this);
			} else this[cname] = this[cname].placed(this);
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
		if(nul.debug.assert) assert(this===built, 'Already built fix self');
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
	 * Gets a string to represent this for debug.
	 * Either HTML, either flat if it would be too big.
	 * @return {String}
	 */
	dbgHtml: function() {
		var f = this.toFlat();
		if(100>f.length) return this.toHtml();
		return f;
	},
	
	/**
	 * Change the summarised texts.
	 * Can be changed even for a built expression (doesn't change the meaning, just the debug drawing)
	 */
	invalidateTexts: function() {
		//TODO 3: invalidate parent texts ?
		delete this.summarised.flatTxt;
		delete this.summarised.htmlTxt;
	},

//////////////// Summary users

	/**
	 * Summary: The key string-index of this expression
	 * @function
	 * @type string
	 */
	toString: nul.summary('index'),
	/**
	 * Summary: The HTML representation
	 * @function
	 * @type string
	 */
	toHtml: nul.summary('htmlTxt'),			//The HTML representation of an expression
	/**
	 * Summary: The flat-text representation
	 * @function
	 * @type string
	 */
	toFlat: nul.summary('flatTxt'),			//The flat-text representation of an expression
	/**
	 * Summary: Weither this expression is a list
	 * @function
	 * @type boolean
	 */
	isList: nul.summary('isList'),
	/**
	 * Summary: The dependances of this expression.
	 * @function
	 * @type nul.dependance
	 */
	dependance: nul.summary('dependance'),	//nul.dependance

//////////////// Generic summary providers

	sum_components: function() {
		var rv = {};
		for(var comp in this.components) if(cstmNdx(comp)) {
			var cname = this.components[comp];
			if(nul.xpr.bunch(this[cname])) {
				for(var ci in this[cname]) if(cstmNdx(ci))
					rv[cname+':'+ci] = this[cname][ci];
			} else {
				rv[cname] = this[cname];
			}
		}
		return rv;
	},
	
	sum_index: function() {
		var cs = [];
		for(var c in this.components) if(cstmNdx(c))
			cs.push(this[this.components[c]]);
		return this.indexedSub(cs);
	},

	indexedSub: function(items) {
		//TODO 3: assert no infinite recursion
		nul.xpr.is(this);
	 	items = beArrg(arguments);
	 	var rv = [];
	 	if(items) for(var e in items) if(cstmNdx(e))
	 		rv.push(nul.xpr.indexedBunch(items[e]));
	 	return '['+this.expression + (rv.length?(':' + rv.join('|')):'') +']';
	},

	sum_htmlTxt: function() { return nul.txt.html.toText(this); },
	sum_flatTxt: function() { return nul.txt.flat.toText(this); },
	sum_dependance: function() {
		var comps = this.summary('components');
		var rv = new nul.dependance();
		for(var c in comps) if(comps[c])
			rv.also(comps[c].dependance());
		return rv;
	},
	sum_isList: function() { return true; }
	
});

/** @namespace Expression helper */
nul.xpr = {
	are: nul.debug.are('expression'),
	is: function(x, t) {
		nul.debug.is('expression')(x);
		if(t) {
			t = t.prototype.expression;
			(function() { return x.expression == t; }.asserted('Expected "'+t+'" expression'));
		}
	},
	use: function(x, t) {
		if(nul.debug.assert) assert(x, 'Unexpected empty expression');
		if(!nul.xpr.bunch(x)) x = [x];
		if(nul.debug.assert) map(x, function(i, o) {
			nul.xpr.is(o, t);
			o.use();
		});
	},
	
	mod: function(x, t) {
		if(nul.debug.assert) assert(x, 'Unexpected empty expression');
		if(!nul.xpr.bunch(x)) x = [x];
		if(nul.debug.assert) map(x, function(i, o) {
			nul.xpr.is(o, t);
			o.modify();
		});
	}
};

/**
 * X is either an expression either a [components] bunch of expression
 * @return {Boolean} Weither x is a bunch of expressions
 */
nul.xpr.bunch = function(x) {
	return isArray(x) || 'xprBunch'== x[''];
};
/**
 * Mark an object as an expression bunch
 * @param {Association} x
 * @return {Association} x that has been modified
 */
nul.xpr.beBunch = function(x) {
	if(!x) x = {};
	x[''] = 'xprBunch';
	return x;
};

nul.xpr.indexedBunch = function(b) {
	if(!nul.xpr.bunch(b)) return b.toString();
	var rv = [];
	for(var e in b) if(cstmNdx(e))
		rv.push(e+':'+b[e].toString());
	return rv.join('/');
};

/**
 * Retrieve an expression (and modifies the knowledge) to represent a value-taking
 * @returns {nul.expression} rv; set(itm=>rv)
 */
nul.xpr.application = function(set, itm, klg) {
	var hst = [];
	var rv = klg.newLocal(nul.understanding.rvName);
	klg.hesitate(set.having(new nul.obj.lambda(itm, rv)));
	return rv;
};

