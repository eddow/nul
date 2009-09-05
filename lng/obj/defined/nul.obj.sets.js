/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.obj.empty = Class.create(nul.obj.defined, {
	attr: {
		' ': function() { return []; }
	}
});

nul.obj.whole = Class.create(nul.obj.defined, {
	attr: {
		' ': function(op1, op2) { return [nul.fuzzy(op2)]; }
	}
});
