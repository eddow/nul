/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
//=requires: /src/lng/xpr/obj/defined/null.obj.defined

nul.obj.list = new JS.Class(nul.obj.defined, /** @lends nul.obj.list */{
	/**
	 * @class Any expression that act as a list or a set
	 * @extends nul.obj.defined
	 * @constructs
	 */
	initialize: function() {
		this.callSuper();
	},
	
	/**
	 * Yes, it is a list.
	 */
	isList: function() { return true; },
	/**
	 * <a href="http://code.google.com/p/nul/wiki/Summary">Summary</a>: The set who give, for each parameter, the recursive parameter applied
	 * @function
	 * @return {nul.obj.list}
	 */
	recursion: nul.summary('recursion').describe('Recursion analyse'),
	
	/** <a href="http://code.google.com/p/nul/wiki/Summary">Summary</a> computation of {@link recursion} */
	sum_recursion: function() { return nul.obj.empty; }
});