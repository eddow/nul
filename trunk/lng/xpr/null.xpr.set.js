/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.xpr.holder = Class.create(nul.xpr.listed, {
	hold: true,
	/**
	 * Determines weither this set can be empty or not.
	 * If 'true', the set *CAN* be empty
	 * if 'false', the set contains at least one element for sure
	 */
	canBeEmpty: function() {
		for(var i=0; i<this.components.length; ++i)
			if(!this.components[i].flags.failable) return false;
		return true;
	},
	/**
	 * Extend expressions and multiply them to be sure no more IOR3s are in.
	 */
	extend: function() {
		nul.debug.log('evals')(nul.debug.lcs.collapser('Extend'), [this]);
		var nc = [];
		while(0< this.components.length)
			nc.pushs(nul.solve.solve(this.components.shift()));
		var rv = this.compose(nc);
		nul.debug.log('evals')(nul.debug.lcs.endCollapser('Extended'), [this]);
		
		return rv;
	}.perform('nul.xpr.holder->extend')
	.describe(function() { return ['Extendinging', this]; }),
	composed: function() {
		///	Flattens the follow if needed
		while(this.components.follow && '{}'== this.components.follow.charact) {
			this.components.pushs(this.components.follow.components);
			if(this.components.follow.components.follow)
				this.components.follow = this.components.follow.components.follow;
			else delete this.components.follow;
		}
		///	Removes empty fuzzy values
		for(var i = 0; i<this.components.length;)
			if(this.components[i].flags.failed)
				this.components.splice(i,1);
			else ++i;
		//TODO: if follow, follow->primitive: 'set'
		if(0== this.components.length)
			return this.components.follow || this;
		return this;
	}.perform('nul.xpr.holder->composed'),
	subRecursion: function(cb, kb) {
		return this.compose(map(this.components, function() {
			var klg = this.enter();
			if(kb) kb.unshift(klg);
			var rv;
			try { rv = cb.apply(this); }
			finally {
				rv = klg.leave(rv);
				if(kb) kb.shift();
			}
			return rv;
		}));
	},
});

/**
 * Set given as a list of item. Each item can be fuzzy 
 */
nul.xpr.set = Class.create(nul.xpr.primitive(nul.xpr.holder,'set'), {
	transform: function() {
		//TODO: set::transform : if " :- " or " ..[]:-[].. "
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
				rv.push(xpr.components[i].aknlgd(function(v, klg){
					v = new nul.xpr.handle(apl.clone(), v);
					return v.subject(klg, klg) || v;
				}));
			} catch(err) {
				if(nul.failure!= err) throw nul.exception.notice(err);
			}
		}
		if(xpr.components.follow) {
			var trv = xpr.components.follow.stpUp(klg);
			try {
				trv = new nul.xpr.application(xpr.components.follow, apl);
				rv.push(trv.operate(klg) || trv);
			} catch(err) {
				if(nul.failure!= err) throw nul.exception.notice(err);
			}
		}
		switch(rv.length) {
		case 0: nul.fail();
		case 1: return rv[0].stpUp(klg);
		}
		return new nul.xpr.ior3(rv);
	}.perform('nul.xpr.set->take'),
/////// String management
	expressionHTML: function() {
		if(1>=this.components.length && !this.components.follow) {
			if(0==this.components.length) return '&phi;';
			return '<span class="big op">{</span>'+this.components[0].toHTML()+'<span class="big op">}</span>';
		}
		var rv = nul.text.expressionHTML('<span class="op">,</span>', this.components);
		if(!this.components.follow) return rv;
		return rv+'<span class="op">,..</span>'+this.components.follow.toHTML();
	},
	expressionString: function() {
		if(1>=this.components.length && !this.components.follow) {
			if(0==this.components.length) return '&phi;';
			return '{'+this.components[0].toString()+'}';
		}
		var rv = '('+nul.text.expressionString(',', this.components);
		if(!this.components.follow) return rv + ')';
		return rv +' ,.. '+this.components.follow.toString()+')';
	},
});