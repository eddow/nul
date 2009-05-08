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
	initialize: function($super, ops, ctxDef) {
		this.ctxDef = ctxDef;
		return $super(ops);
	},
	//TODO: si un sub fuzzy, finalroot est faux
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
	composed: function($super) {
		if(1== this.components.length) {
			var c = this.components[0];
			if(!c.flags.failable && 1== c.belong.length &&	//TODO: boudjou, quel cas particulier de dieu-le-père Oo
					'fz'== c.charact && 'local'== c.components.value.charact)
				return this.replaceBy(c.belong[0]);
		}
		//Extends components
		var nc = [], cd = this.ctxDef;
		nul.debug.log('evals')(nul.debug.lcs.collapser('Extend'),
			cd?[cd, this.components]:this.components);
		map(this.components, function() { nc.pushs(nul.solve.solve(this, cd)); });
		this.components = nc;
		nul.debug.log('evals')(nul.debug.lcs.endCollapser('Extended'),
			cd?[cd, this.components]:this.components);

		//Specify my appartenance set, verify every object became subject
		var tps = [], crd = [];	//TODO: types and cardinalities
		map(this.components, function() {
			if(this.unfinished && this.unfinished.length)
				throw nul.semanticException('AUD',this.unfinished.join('<br />'));
		});
		
		return $super();
	},
	take: function(apl, klg, way, ctxDef) {
		var xpr = this.clone();	//TODO: please kill me :'(
		var rv = [], trv, acn = this.ctxDef, set = this;
		for(var i=0; i<xpr.components.length; ++i) {
			try {
				trv = xpr.components[i].aknlgd(function(){
					return new nul.xpr.handle(apl.clone(), this.renameCtx(klg));
				});
				if(acn && trv.deps[acn] && trv.deps[acn][nul.lcl.slf])
					//TODO: optimise recursion
					trv = trv.entered(function(klg) {
						return this.expSelfRef(set, klg, acn);
					}) || trv;
				if(!trv.failed) rv.push(trv);
			} catch(err) {
				if(nul.failure!= err) throw nul.exception.notice(err);
			}
		}
		switch(rv.length) {
		case 0: nul.fail(apl.toString()+' not in set '+this.toString());
		case 1: return rv[0].stpUp(klg);
		}
		return new nul.xpr.ior3(rv, ctxDef || klg.ctxName);
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
});