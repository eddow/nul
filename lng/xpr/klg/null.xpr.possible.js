/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**
 * A possible value; refering a value and a condition
 */
nul.xpr.possible = Class.create(nul.expression, {
	initialize: function(value, knowledge) {
		this.value = value;
		this.knowledge = knowledge;
		this.summarise();
	},
	
//////////////// nul.expression implementation
	
	type: 'possible',
	components: ['value','knowledge'],
});
