/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

 nul.xpr = Class.create({

	components: [],
	
//////////////// Summary functionment

	/**
	 * Assert this expression is modifiable
	 */
	modify: function() {
		if(nul.debug.assert) assert(!this.summarised, 'Cannot modify summarised')
	},
	/**
	 * Retrieve a computed value about this expression
	 */
	summary: function(itm) {
		if(nul.debug.assert) assert(this.summarised, 'Use summary only when summarised')
		if(!this.summarised[itm]) {
			assert(this['sum_'+itm],'Summary '+itm+' provided for '+this.type);
			this['sum_'+itm].apply(this);
		}
		return this.summarised[itm];
	},
	/**
	 * Stop the modifications brought to this expression. Now, we compute some values about
	 * @param smr The given summary
	 */
	summarise: function(smr) {
		this.summarised = smr || {};
	},

	/**
	 * Return a clone version of this expression to modify it.
	 */
	modifiable: function() {
		return maf(this, function(ndx, obj) { if('summarised'!= ndx) return obj; });
	},

//////////////// Summary users

	toString: function() { return this.summary('index'); },
	toHtml: function() { return this.summary('htmlTxt'); },
	toFlat: function() { return this.summary('flatTxt'); },
	isSet: function() { return this.summary('isSet'); },
	isList: function() { return this.summary('isList'); },
	isFixed: function() { return this.summary('isFixed'); },
	isDefined: function() { return this.summary('isDefined'); },
	
//////////////// Generic summary providers

	sum_components: function() {
		var rv = {};
		for(var comp in this.components) if(cstmNdx(comp)) {
			if(isArray(comp)) {
				for(var ci in this[comp]) if(cstmNdx(ci))
					rv[comp+':'+ci] = this[comp][ci];
			} else {
				rv[comp] = this[comp];
			}
		}
		return rv;
	},
	
	sum_index: function() {
		if(nul.debug.assert) assert(this.type, 'NDX builder implemented');
		return this.indexedSubs(vals(this.sum_components));
	},
	indexedSubs: function(items) {
	 	items = beArrg(arguments);
	 	var rv = '['+this.type;
	 	if(items && items.length) rv += ':' + items.join('|');
	 	return rv+']';
	},

	sum_htmlTxt: function() { return nul.txt.html.toText(this); },
	sum_flatTxt: function() { return nul.txt.flat.toText(this); },
	
	sum_isList: function() { return this.isSet(); },
	sum_isFixed: function() { return true; },
 });
 