/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.obj.litteral = Class.create(nul.obj.defined, /** @lends nul.obj.litteral# */ {
	/**
	 * Abstract litteral - hold a javascript litteral value
	 * @constructs
	 * @extends nul.obj.defined
	 * @param {Number|String|Boolean} val Javascript value to hold.
	 */
	initialize: function($super, val) {
		/** @constant */
		this.value = val;
		this.alreadyBuilt();
		$super();
	}
});

/**
 * @class
 * @extends nul.obj.litteral
*/
nul.obj.litteral.number = Class.create(nul.obj.litteral, /** @lends nul.obj.litteral.number# */{
//////////////// nul.xpr.object implementation

	/** @constant */
	attributes: {},

	//TODO 3: {2 Q} ==> ( Q _, Q _ ) 
	subHas: function(o) {
		nul.fail('TODO');
	},
	
//////////////// nul.expression implementation

	/** @constant */
	expression: 'number',
	/** Specific index for numbers litterals */
	sum_index: function() { return this.indexedSub(this.value.toString().replace(']','[|]')); }
});

/**
 * @class
 * @extends nul.obj.litteral
*/
nul.obj.litteral.string = Class.create(nul.obj.litteral, /** @lends nul.obj.litteral.string# */{
//////////////// nul.xpr.object implementation

	/** @constant */
	attributes: {
		'# ': function() { return nul.obj.litteral.make(this.value.length); }
	},

	/** Strings contain nothing */
	subHas: function() { nul.fail('Strings contain nothing'); },

//////////////// nul.expression implementation

	/** @constant */
	expression: 'string',
	/** Specific index for string litterals */
	sum_index: function() { return this.indexedSub(this.value.replace(']','[|]')); }
});

/**
 * @class
 * @name nul.obj.litteral.boolean 
 * @extends nul.obj.litteral 
 */
nul.obj.litteral['boolean'] = Class.create(nul.obj.litteral, /** @lends nul.obj.litteral.boolean# */{
//////////////// nul.xpr.object implementation

	/** @constant */
	attributes: {},

	/** Booleans contain nothing */
	subHas: function() { nul.fail('Booleans contain nothing'); },

//////////////// nul.expression implementation

	/** @constant */
	expression: 'boolean',
	/** Specific index for boolean litterals */
	sum_index: function() { return this.indexedSub(this.value?'T':'F'); }
});

/**
 * Make a litteral from a javascript value - choose the wright class
 */
nul.obj.litteral.make = function(v) {
	if(nul.debug.assert) assert(nul.obj.litteral[typeof v], (typeof v)+' is a litteral type')
	return new nul.obj.litteral[typeof v](v);
};
