/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
//#requires: src/lng/xpr/obj/defined/null.obj.defined

nul.obj.litteral = new JS.Class(nul.obj.defined, /** @lends nul.obj.litteral# */ {
	/**
	 * @class Abstract litteral - hold a javascript litteral value
	 * @constructs
	 * @extends nul.obj.defined
	 * @param {Number|String|Boolean} val Javascript value to hold.
	 */
	initialize: function(val) {
		this.callSuper();
		/** @constant */
		this.value = val;
		this.alreadyBuilt();
	}
});

/**
 * @class
 * @extends nul.obj.litteral
*/
nul.obj.litteral.string = new JS.Class(nul.obj.litteral, /** @lends nul.obj.litteral.string# */{

////////////////	nul.xpr.defined implementation
	
	/** @constant */
	properties: {
		'# ': function() { return new nul.obj.litteral.number(this.value.length); },
		'': function() { return nul.obj.litteral.tag.string; }
	},
	
	/**
	 * @param {document} doc
	 * @return {XMLElement}
	 * TODO 2 returns Element
	 */
	XML: function(doc) {
		return doc.createTextNode(this.value);	//TODO 2: remplacer par des &...; ?
	},
	
//////////////// nul.xpr.object implementation

	/** Strings contain nothing */
	subHas: function() { nul.fail('Strings contain nothing'); },

//////////////// nul.expression implementation

	/** @constant */
	expression: 'string',
	/** <a href="http://code.google.com/p/nul/wiki/Summary">Summary</a> computation of {@link index} */
	sum_index: function() { return this.indexedSub(this.value.replace(']','[|]')); }
});

/**
 * @class
 * @extends nul.obj.litteral
*/
nul.obj.litteral.number = new JS.Class(nul.obj.litteral, /** @lends nul.obj.litteral.number# */{

////////////////	nul.xpr.defined implementation
	
	/** @constant */
	properties: {
		'text': function() { return nul.obj.litteral.make(this.value.toString()); },
		'': function() { return nul.obj.litteral.tag.number; }
	},

//////////////// nul.xpr.object implementation

	/**
	 * TODO 3: {2[Q]} ==> ( Q _, Q _ ) ?
	 */ 
	subHas: function(o) {
		nul.fail('TODO 3: number has');
	},
	
//////////////// nul.expression implementation

	/** @constant */
	expression: 'number',
	/** <a href="http://code.google.com/p/nul/wiki/Summary">Summary</a> computation of {@link index} */
	sum_index: function() { return this.indexedSub(this.value.toString().replace(']','[|]')); }
});

/**
 * @class
 * @name nul.obj.litteral.boolean 
 * @extends nul.obj.litteral 
 */
nul.obj.litteral['boolean'] = new JS.Class(nul.obj.litteral, /** @lends nul.obj.litteral.boolean# */{
	
////////////////	nul.xpr.defined implementation
	
	/** @constant */
	properties: {
		'# ': function() { return nul.obj.litteral.make(this.value.length); },
		'': function() { return nul.obj.litteral.tag['boolean']; }
	},
	
	/** @constant */
	attributes: {},
	
//////////////// nul.xpr.object implementation

	/** Booleans contain nothing */
	subHas: function() { nul.fail('Booleans contain nothing'); },

//////////////// nul.expression implementation

	/** @constant */
	expression: 'boolean',
	/** <a href="http://code.google.com/p/nul/wiki/Summary">Summary</a> computation of {@link index} */
	sum_index: function() { return this.indexedSub(this.value?'T':'F'); }
});

/**
 * Make a litteral from a javascript value - choose the wright class
 */
nul.obj.litteral.make = function(v) {
	if(nul.debugged) nul.assert(nul.obj.litteral[typeof v], (typeof v)+' is a litteral type');
	if('boolean'== typeof v) return nul.obj.litteral['boolean'][v?'true':'false'];
	return new nul.obj.litteral[typeof v](v);
};

/**
 * Hard-coding of the booleans : no generic definition while they are two
 */
nul.obj.litteral['boolean']['true'] = new nul.obj.litteral['boolean'](true);
nul.obj.litteral['boolean']['false'] = new nul.obj.litteral['boolean'](false);
nul.obj.litteral['boolean']['true'].attributes['! '] = nul.obj.litteral['boolean']['false'];
nul.obj.litteral['boolean']['false'].attributes['! '] = nul.obj.litteral['boolean']['true'];

/**
 * Virtual 'tags' of litterals
 */
nul.obj.litteral.tag = {
	string: new nul.obj.litteral.string('#text'),
	number: new nul.obj.litteral.string('#number'),
	'boolean': new nul.obj.litteral.string('#boolean'),
	set: new nul.obj.litteral.string('#set')
};
