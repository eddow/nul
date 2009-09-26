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
 
nul.expression = Class.create({
 	initialize: function(tp) {
 		if(tp) this.expression = tp;
 	},
	components: [],
	
//////////////// Assertion functionment

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
	 */
	summary: function(itm) {
		this.use();
		if('undefined'== typeof this.summarised[itm]) {
			assert(this['sum_'+itm],'Summary '+itm+' provided for '+this.expression);
			this.summarised[itm] = this['sum_'+itm].apply(this);
		}
		return this.summarised[itm];
	},
	/**
	 * Stop the modifications brought to this expression. Now, we compute some values about
	 * @param {association} smr The given summary
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
		for(var comp in this.components) if(cstmNdx(comp)) {
			var cname = this.components[comp];
			if(isArray(this[cname])) {
				for(var ci in this[cname]) if(cstmNdx(ci) && this[cname][ci])
					this[cname][ci] = this[cname][ci].placed(this);
			} else if(this[cname]) this[cname] = this[cname].placed(this);
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

//////////////// Summary users

	toString: nul.summary('index'),			//TODO: faire qqch pour pas qu'il l'appelle dans firebug
	toHtml: nul.summary('htmlTxt'),			//The HTML representation of an expression
	toFlat: nul.summary('flatTxt'),			//The flat-text representation of an expression
	isSet: nul.summary('isSet'),			//Weither this expression is a set
	isList: nul.summary('isList'),			//Weither this expression is a list
	isDefined: nul.summary('isDefined'),	//Weither this expression has its attributes defined
	dependance: nul.summary('dependance'),	//nul.dependance

//////////////// Generic summary providers

	sum_components: function() {
		var rv = {};
		for(var comp in this.components) if(cstmNdx(comp)) {
			var cname = this.components[comp];
			if(isArray(this[cname])) {
				for(var ci in this[cname]) if(cstmNdx(ci))
					rv[cname+':'+ci] = this[cname][ci];
			} else {
				rv[cname] = this[cname];
			}
		}
		return rv;
	},
	
	sum_index: function() {
		return this.indexedSub(vals(this.sum_components()));
	},
	indexedSub: function(items) {
		nul.xpr.is(this);
	 	items = beArrg(arguments);
	 	var rv = '['+this.expression;
	 	if(items && items.length) rv += ':' + items.join('|');
	 	return rv+']';
	},

	sum_htmlTxt: function() { return nul.txt.html.toText(this); },
	sum_flatTxt: function() { return nul.txt.flat.toText(this); },
	sum_isList: function() { return this.isSet(); },
	sum_dependance: function() {
		var comps = this.summary('components');
		var rv = new nul.dependance();
		for(var c in comps) if(comps[c])
			rv.also(comps[c].dependance());
		return rv;
	},
});

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
		if(!isArray(x)) x = [x];
		if(nul.debug.assert) map(x, function(i, o) {
			nul.xpr.is(o, t);
			o.use();
		});
	},
	
	mod: function(x, t) {
		if(!isArray(x)) x = [x];
		if(nul.debug.assert) map(x, function(i, o) {
			nul.xpr.is(o, t);
			o.modify();
		});
	},
};