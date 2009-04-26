/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.xpr.holder = Class.create(nul.xpr.listed, {
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
		var nc = [];
		while(0< this.components.length)
			nc.pushs(nul.solve.solve(this.components.shift()));
		return this.compose(nc);
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
			var trv = xpr.components[i].stpUp(klg);
			try {
				//var nklg = new nul.knowledge();
				trv = new nul.xpr.handle(apl.clone(), trv);
				trv = trv.subject(klg) || trv;
			} catch(err) {
				trv = null;
				if(nul.failure!= err) throw nul.exception.notice(err);
			} finally {
				//trv = nklg.leave(trv);
			}
			if(trv) rv.push(trv);
		}
		if(xpr.components.follow) {
			//TODO
/*			var kwf = nul. build.kwFreedom();
			kwf.makeFrdm(klg);
			try {
				kwf.components.value = xpr.components.follow.take(apl,klg,way).dirty();
			} catch(err) {
				klg.pop('kw');
				if(nul.failure!= err) throw nul.exception.notice(err);
			}
			if(kwf.components.value) {
				kwf = klg.pop(kwf).dirty();
				rv.push(kwf.evaluate(klg)||kwf);
			}*/
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