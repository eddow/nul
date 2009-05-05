/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.xpr.subSet = Class.create(nul.xpr.preceded, {
 	charact: 'set',
	failable: function() { return false; },
	initialize: function($super, op) {
		return $super(ops);
	},
});
