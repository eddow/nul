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
	expression: true,
	components: [],
	
//////////////// Assertion functionment

	/**
	 * Assert this expression is modifiable
	 */
	modify: function() {	//TODO1: call this in each function it is appliable (for this and arguments)
		return !this.summarised;
	}.contract('Cannot modify summarised'),
	/**
	 * Assert this expression is summarised
	 */
	use: function() {	//TODO1: call this in each function it is appliable (for this and arguments)
		return this.summarised;
	}.contract('Cannot use non-summarised'),

//////////////// Summary functionment

	/**
	 * Retrieve a computed value about this expression
	 */
	summary: function(itm) {
		this.use();
		if('undefined'== typeof this.summarised[itm]) {
			assert(this['sum_'+itm],'Summary '+itm+' provided for '+this.type);
			this.summarised[itm] = this['sum_'+itm].apply(this);
		}
		return this.summarised[itm];
	},
	/**
	 * Stop the modifications brought to this expression. Now, we compute some values about
	 * @param smr The given summary
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
	
	/**
	 * Return a summarised version of this.
	 */
	built: function(smr) {
		this.summarise(smr);
		return this;
	},

//////////////// Summary users

	toString: nul.summary('index'),
	toHtml: nul.summary('htmlTxt'),
	toFlat: nul.summary('flatTxt'),
	isSet: nul.summary('isSet'),
	isList: nul.summary('isList'),
	isDefined: nul.summary('isDefined'),

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
		if(nul.debug.assert) assert(this.type, 'NDX builder implemented');
	 	items = beArrg(arguments);
	 	var rv = '['+this.type;
	 	if(items && items.length) rv += ':' + items.join('|');
	 	return rv+']';
	},

	sum_htmlTxt: function() { return nul.txt.flat.toText(this); },
		//TODO2: return nul.txt.html.toText(this); },
	sum_flatTxt: function() { return nul.txt.flat.toText(this); },
	
	sum_isList: function() { return this.isSet(); },
});

nul.xpr = {
	are: nul.debug.are('expression'),
	is: function(x, t) {
		nul.debug.is('expression')(x);
		if(t) {
			t = t.prototype.type;
			(function() { return x.type == t; }.asserted('Expected "'+t+'" expression'));
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