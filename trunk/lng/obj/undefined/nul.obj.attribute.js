/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**
 * Defined an object that is an attribute of another object
 */
nul.obj.attribute = Class.create(nul.obj, {
	initialise: function(ofo, anm) {
		this.ofObject = ofo;
		this.attributeName = anm;
	},
	ndx: function() { return '[attr:'+this.ofObject.ndx()+'|'+this.attributeName+']'; },
});