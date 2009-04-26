/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.xpr.objectivity = Class.create(nul.xpr.ceded, {
	charact: '.',
	initialize: function($super, applied, lcl) {
		this.local = lcl;
		$super(applied);
	},
/////// String
	expressionHTML: function() {
		return this.components[0].toHTML() +
			'<span class="op">.' + this.local + '</span>';
	},
	expressionString: function() {
		return this.components[0].toString() + '.' + this.local;
	},
/////// Objectivity specific
	subject: function(klg) {
		return this.replaceBy(this.components[0].attribute(this.local, klg));
	}.describe(function(klg) { return ['Subjectiving', this]; }),
});