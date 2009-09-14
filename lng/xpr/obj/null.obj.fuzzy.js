/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.obj.fuzzy = Class.create(nul.obj, {
	initialize: function(value, knowledge) {
		this.value = value;
		this.knowledge = knowledge;
	},
//////////////// nul.xpr implementation
	
	type: 'fuzzy',
	components: ['value', 'knowledge'],
});
