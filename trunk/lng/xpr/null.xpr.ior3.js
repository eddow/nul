/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**
 * Each component is a possibility
 * NOTE: the purpose of this class is to be suppressed finally.
 * Only 'nul.xpr.set' should be used - this class is kept now as an evolution step.
 */
nul.xpr.ior3 = Class.create(nul.xpr.holder, {
	charact: '[]',
	htmlCharact: '&#9633;',
	failable: function() {
		return this.canBeEmpty();
	},
	operate: function(klg) {
		switch(this.components.length) {
		case 0: nul.fail('No possibile ways');
		case 1: return this.replaceBy(this.components[0].stpUp(klg));
		}
	}.perform('nul.xpr.ior3->composed'),
//Interface to solving engine	
	possibility: function(n, klg) {
		if(n<this.components.length)
		//TODO: if it is a xpr.fuzzy, use 'into' kb (grab 'into' fct over SVN)
			return this.components[n].stpUp(klg);
	},
});