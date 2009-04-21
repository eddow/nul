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
	operate: function(kb) {
		if(!this.components.object.take && this.components.object.finalRoot())
			throw nul.semanticException('OPM', 'Cannot take from '+ this.components.object.toHTML());
		var rv = this.components.object.take(this.components.applied, kb, 1);
		if(rv) return rv;
		if(!this.components.object.transform()) {
			kb.knew(this.clean().clone());
			return this.components.applied;
		}
	}.perform('nul.xpr.application->apply')
});