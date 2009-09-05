/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**
 * Define an object that is a value of a local
 */
nul.obj.local = Class.create(nul.obj, {
	initialise: function(klgNdx, lclNdx) {
		this.klgNdx = klgNdx;
		this.lclNdx = lclNdx;
	}
});