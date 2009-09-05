/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**
 * Defines an object that is the value of another object through a function
 */
nul.obj.through = Class.create(nul.obj, {
	initialise: function(fct, obj) {
		this.functio = fct;
		this.object = obj;
	}
});