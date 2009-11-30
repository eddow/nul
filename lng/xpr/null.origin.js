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
		if(!this.action) return 'Bereth ...';
		var dspl = this.action.name;
		if(nul.browser.def(this.action.applied))
			dspl += ' ' + this.action.applied.description;
		if(!this.from) return 'Created while ' + dspl + '.';
		return 'Transformation while ' + dspl + ' of ' + this.from.toFlat();
	}
});