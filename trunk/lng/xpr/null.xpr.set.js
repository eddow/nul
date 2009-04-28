/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**
 * Set given as a list of item. Each item can be fuzzy 
 */
nul.xpr.set = Class.create(nul.xpr.primitive(nul.xpr.holder.listed,'set'), {
	transform: function() {
		//TODO: set::transform : if " :- " or " ..[]:-[].. "
		//si tous primitifs, return false;
		return true;
	},
	charact: '{}',
	failable: function() { return false; },
	fail: function() {
		return new nul.xpr.set();
	},

	take: function(apl, klg, way) {
		var xpr = this.clone();	//TODO: please kill me :'(
		var rv = [];
		for(var i=0; i<xpr.components.length; ++i) {
			try {
				rv.push(xpr.components[i].aknlgd(function(klg){
					var v = new nul.xpr.handle(apl.clone(), this);
					return v.subject(klg, klg) || v;
				}));
			} catch(err) {
				if(nul.failure!= err) throw nul.exception.notice(err);
			}
		}
		switch(rv.length) {
		case 0: nul.fail(apl.toString()+' not in set '+this.toString());
		case 1: return rv[0].stpUp(klg);
		}
		return new nul.xpr.ior3(rv);
	}.perform('nul.xpr.set->take'),
/////// String management
	expressionHTML: function() {
		if(1>=this.components.length) {
			if(0==this.components.length) return '&phi;';
			return '<span class="big op">{</span>'+this.components[0].toHTML()+'<span class="big op">}</span>';
		}
		return nul.text.expressionHTML('<span class="op">,</span>', this.components);
	},
	expressionString: function() {
		if(1>=this.components.length) {
			if(0==this.components.length) return '&phi;';
			return '{'+this.components[0].toString()+'}';
		}
		return '('+nul.text.expressionString(',', this.components)+')';
	},
/////// Set specific
	extended: function() {
		return this.compose(this.extend());
	}
});