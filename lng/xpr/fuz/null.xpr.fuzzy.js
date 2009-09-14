/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**
 * An expression that can take several fixed values
 */
nul.xpr.fuzzy = Class.create(nul.xpr, {
		
//////////////// publics

	built: function(fzns) { throw 'abstract'; },	//Summarise. Return this or something else fixed if possible

//////////////// specific summaries

	maxXst: function() { return this.summary('maxXst'); }, 	
	minXst: function() { return this.summary('minXst'); }, 	

});