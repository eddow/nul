/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.xpr.unification = Class.create(nul.xpr.associative.relation, {
	charact: '=',
	failable: function() { return true; },
/////// Unification specific
	operate: function(klg) {
		var b4ndx = this.ndx;
		var fl = this.components.length;
		var rv = nul.unify.multiple(this.components, klg)
		if(rv && 1== rv.length) return rv[0];
		if(!rv) rv = this.components;
		rv = klg.affect(rv);
		if(rv.ndx != b4ndx) return rv;	//TODO: trouver autre chose pour voir le changement ?
	}.perform('nul.xpr.unification->apply')
	.describe(function(klg) { return ['Applying', this]; }),
	value: function(klg) {
		var rv = this.operate(klg) || this;
		if('='== rv.charact) {
			klg.know(rv);
			rv = rv.components[0];
		}
		return rv;
	},
});