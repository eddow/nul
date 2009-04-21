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
	apply: function(kb) {
		var fl = this.components.length;
		var rv = nul.unify.multiple(this.components, kb)
		if(rv && 1== rv.length) return rv[0];
		if(!rv) rv = this.components;
		return kb.affect(rv, this.x);
	}.perform('nul.xpr.unification->apply')
	.describe(function(kb) { return ['Applying', this]; }),
});