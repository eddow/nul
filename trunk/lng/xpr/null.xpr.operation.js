/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**
 * List defined in extension : each element is a member
 */
nul.xpr.operation = Class.create(nul.xpr.listed, {
	initialize: function($super, op, oprnds) {
		this.charact = op;
		$super(oprnds);
	}
});