/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.xpr.application = Class.create(nul.xpr.composed, {
	htmlCharact: ' ',
	charact: '[.]',
	failable: function() { return true; },
	initialize: function($super, obj, apl) {
		$super({object: obj, applied: apl});
	},
/////// Application specific
	operate: function(klg) {
		if(!this.components.object.take) {
			//TODO: if not, operator $
			if(!this.components.object.finalRoot()) return;
			throw nul.semanticException(
				'OPM', 'Cannot take from '+ this.components.object.toHTML());
		}
		var rv = this.components.object.take(this.components.applied, klg, 1);
		if(rv) return this.replaceBy(rv);
		if(!this.components.object.transform()) {
			klg.know(this);
			return this.components.applied;
		}
	}.perform('nul.xpr.application->apply')
	.describe(function(klg) { return ['Applying', this]; }),
/////// String special management. TODO:  on garde ou pas ?
	expressionHTML: function($super) {
		if(!this.components.object.opChr) return $super();
		return '<span class="op native">' + this.components.object.opChr +
			'</span>' + this.components.applied.toHTML();
	},
	expressionString: function($super) {
		if(!this.components.object.opChr) return $super();
		return this.components.object.opChr +
			' ' + this.components.applied.toString();
	},
});