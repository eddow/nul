/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.obj.undefined = Class.create(nul.xpr.object, /** @lends nul.obj.undefined# */{
	/**
	 * Undefined object
	 * @extends nul.xpr.object
	 * @constructs
	 */
	initialize: function($super) {
		$super();
	},
	defined: false
});