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
	toShort: function() {
		if(!this.action) return 'Bereshit ...';
		if(!this.from) return 'Created while ' + this.action.description() + '.';
		return 'Transformation while ' + this.action.description() + ' of ' + this.from.toFlat();
	}
});