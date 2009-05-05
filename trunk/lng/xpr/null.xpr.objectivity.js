/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.xpr.objectivity = Class.create(nul.xpr.ceded, {
	initialize: function($super, applied, lcl) {
		this.obj = lcl;
		this.charact = '.'+lcl;
		$super(applied);
	},
/////// String
	expressionHTML: function() {
		return this.components[0].toHTML() +
			'<span class="op">.' + this.obj + '</span>';
	},
	expressionString: function() {
		return this.components[0].toString() + '.' + this.obj;
	},
/////// Objectivity specific
	subject: function(klg) {
		var rv = this.components[0].attribute(this.obj);
		if(!rv) return [nul.unSubj(
			'Attribute '+this.obj+' undefined for', this.components[O]
		)];
		return this.replaceBy(rv);
	},
});