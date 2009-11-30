/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.origin = new JS.Class({
	initialize: function(frm) {
		this.action = nul.action.doing();
		this.from = frm;
	},
	toString: function() {
		if(!this.from) return 'Created while ' + this.action.name + '.';
		return 'Transformation while ' + this.action.name + ' of ' + this.from.toFlat();
	}
});