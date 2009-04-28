/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.xpr.ordered = Class.create(nul.xpr.relation, {
	failable: function() { return true; },
	initialize: function($super, oprtr, oprnds) {
		if('='== oprtr.substr(1)) {
			oprtr = oprtr.substr(0, 1);
			this.charact = '<=';
			this.htmlCharact = '&le;';
		} else {
			this.charact = '<';
			this.htmlCharact = '&lt;';
		}
		switch(oprtr) {
			case '>': $super([oprnds[1], oprnds[0]]); break;
			case '<': $super(oprnds); break;
		}
	}
});