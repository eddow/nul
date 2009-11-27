/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.obj.undefnd = new JS.Class(nul.xpr.object, /** @lends nul.obj.undefnd# */{
	/**
	 * Undefined object
	 * @extends nul.xpr.object
	 * @constructs
	 */
	initialize: function() {
		this.callSuper();
	},
	defined: false
});