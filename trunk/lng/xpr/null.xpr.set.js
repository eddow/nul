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
			if('fz'== this.components[i].charact && !this.components[i].components)
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

	take: function(apl, kb, way) {
		var xpr = this.clone();	//TODO: please kill me :'(
		var rv = [];
		for(var i=0; i<xpr.components.length; ++i) {
			var trv = xpr.components[i], nkb;
			var nv, ov
			if('fz'== trv.charact) {
				nkb = trv.enter();
				ov = trv.components.value;
			} else ov = trv;
			nv = new nul.xpr.handle(apl.clone(), ov);
			if('fz'== trv.charact) trv = nkb.leave(nv);
			else trv = nul.xpr.build(nul.xpr.fuzzy, nv);
			rv.push(trv);
		}
		if(xpr.components.follow) {
			//TODO
/*			var kwf = nul. build.kwFreedom();
			kwf.makeFrdm(kb);
			try {
				kwf.components.value = xpr.components.follow.take(apl,kb,way).dirty();
			} catch(err) {
				kb.pop('kw');
				if(nul.failure!= err) throw nul.exception.notice(err);
			}
			if(kwf.components.value) {
				kwf = kb.pop(kwf).dirty();
				rv.push(kwf.evaluate(kb)||kwf);
			}*/
		}
		if(!rv.length) nul.fail();
		return nul.xpr.build(nul.xpr.ior3, rv);
	}.perform('nul.xpr.set->take'),
/*
	extension::take: function(apl, kb, way) {
	* 
		//TODO: put selfRef dans le .x.take
		//TODO: vérifier si l'argument est libre, pas développer à l'infini
		var selfRef = this.components.object.arCtxName, srTt;
		if(selfRef) {
			srTt = {};
			srTt[new nul.xpr.local(selfRef,nul.lcl.slf).ndx] = this.components.object;
		}
		if(selfRef && !isEmpty(this.components.applied.deps)) return;

	* 

	 * 
	 * 
		if(rv) {
			//TODO: optimise recursion
			var dbgCpt = 0;
			while(selfRef && rv.deps[selfRef]) {
				if(nul.debug.assert) assert(50<++dbgCpt, 'Finite loop')
				for(var v in srTt) srTt[v] = srTt[v].clone();
				rv = rv.contextualise(kb, srTt,'self').evaluate(kb);
			}
			return rv;
		}

	 	// TODO: faire des stpUp
		var rv = [];
		var xpr = this.clone();	//TODO: please kill me :'(
		for(var i=0; i<xpr.components.length; ++i) {
			var kwf = nul. build.kwFreedom();
			kwf.makeFrdm(kb);
			try {
				kwf.components.value = xpr.components[i].handled(apl.clone(), kb);
			} catch(err) {
				kb.pop('kw');
				if(nul.failure!= err) throw nul.exception.notice(err);
			}
			if(kwf.components.value) {
				kwf = kb.pop(kwf).dirty();
				rv.push(kwf.evaluate(kb)||kwf);
			}
		}
		if(xpr.components.follow) {
			var kwf = nul. build.kwFreedom();
			kwf.makeFrdm(kb);
			try {
				kwf.components.value = xpr.components.follow.take(apl,kb,way).dirty();
			} catch(err) {
				kb.pop('kw');
				if(nul.failure!= err) throw nul.exception.notice(err);
			}
			if(kwf.components.value) {
				kwf = kb.pop(kwf).dirty();
				rv.push(kwf.evaluate(kb)||kwf);
			}
		}
		if(!rv.length) nul.fail();
		rv = nul. build.ior3(rv)
		return rv.operate(kb)||rv;
	}.perform('nul.xpr.extension->take')
 */
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