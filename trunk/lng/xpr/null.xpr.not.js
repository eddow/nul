/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

//TODO: ne plus utiliser des fuzzys at remplacer '!(a;b)' par '!a [] !b'
// ensuite, remplacer '!!a' par 'a'

/**
 * Set given as a list of item. Each item can be fuzzy 
 */
nul.xpr.not = Class.create(nul.xpr.holder.preceded, {
	charact: '!',
	failable: function() { return true; },
	fail: function() {
		return new nul.xpr.set();
	},
	composed: function($super) {
		$super();
		if(!this.components.length) return this.replaceBy(new nul.xpr.set());
		if(!this.components[0].flags.failable) nul.fail('NOT verified');
		return this;
	},
/////// Set specific
	operate: function(klg) {
		var ps = this.extend();
		while(1< ps.length) klg.knew(new nul.xpr.not(ps.shift()));
		return this.compose(ps);
	}	
});