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
	initialize: function($super, obj, apl, ctxName) {
		this.ctxName = ctxName;
		$super({object: obj, applied: apl});
	},
	composed: function($super) {
		return $super();
	},
/////// Application specific
	operate: function(klg) {
		if(!this.components.object.take) {
			//TODO: if not, operator $
			if(!this.components.object.finalRoot()) return;
			throw nul.semanticException(
				'OPM', 'Cannot take from '+ this.components.object.toHTML());
		}
		var rv = this.components.object.take(this.components.applied, klg, 1, this.ctxName);
		if(rv) return this.replaceBy(rv);
	}.perform('nul.xpr.application->apply')
	.describe(function(klg) { return ['Applying', this]; }),
	/**
	 * Try to get the value only
	 */
	value: function(klg) {
		var rv = this.operate(klg);
		if(!rv) {
			klg.know(this);
			if(this.components.object.transform && !this.components.object.transform())
				return this.components.applied;
		}
		return this;	//add belonging img(object)
	},
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