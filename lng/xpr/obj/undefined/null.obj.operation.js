/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

//TODO 4: ((a + b) + (c + d)) => (a + b + c + d)
//TODO 4: ((a - b) - c) =?> (a - (b + c)) 
//TODO 4: (a - (b - c)) =?> ((a + c) - b) !!!/0 

nul.obj.operation = Class.create(nul.obj.undefined, /** @lends nul.obj.operation# */{
	/**
	 * Define an operator applied to several objects
	 * @constructs
	 * @extends nul.obj.undefined
	 * @param {String} operator The operator binding
	 * @param {nul.xpr.object[]} ops The operands
	 */
	initialize: function(operator, ops) {
		this.operator = operator;
		this.operands = ops;
		this.alreadyBuilt();
	},
	
//////////////// nul.expression implementation
	
	/** @constant */
	expression: 'operation',
	/** @constant */
	components: {'operands': {type: 'nul.xpr.object', bunch: true}}
});

nul.obj.operation.binary = Class.create(nul.obj.operation, {
	//TODO 3
});

nul.obj.operation.Nary = Class.create(nul.obj.operation, {
	//TODO 3
});