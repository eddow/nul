/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**
 * Defines an object that is defined as "belonging to a set"
 */
nul.obj.through = Class.create(nul.obj, {
	initialise: function(set) {
		this.set = set;
	},
	components: ['set'],
});