/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.xpr.unification = Class.create(nul.xpr.associative, {
	charact: '=',
	failable: function() { return true; },
	initialize: function($super, ops) {
		$super(ops);
	},
/////// Unification specific
	operate: function(klg) {
		var fl = this.components.length;
		var rv = nul.unify.multiple(this.components, klg)
		if(rv && 1== rv.length) return rv[0].stpUp(klg);
		if(!rv) rv = this.components;
		return klg.affect(rv, this.x);
	}.perform('nul.xpr.unification->apply')
	.describe(function(klg) { return ['Applying', this]; }),
});