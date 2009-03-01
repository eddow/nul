/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
 
nul.xpr = {	//Main interface implemented by all expressions
	isXpr: true,
	premiced: function(prms) {
		return nul.build().and3([this].concat(prms));
	},
	makeCtx: function() {},
	takeCtx: function() { throw nul.internalException('Any expression cannot take ctx'); },
	clone: function(prnt) {
		var rv = clone1(this);
		rv.x = this.x.clone();
		if(this.components) rv.components = map(this.components, function() { return this.clone(rv); });
		rv.x.attributes = map(this.x.attributes, function() { return this.clone(rv); });
		return rv;
	}.perform('nul.xpr->clone'),
	toHTML: nul.text.toHTML,
	dbgHTML: function() {
		var str = this.toString();
		if(str.length < 50) return this.toHTML();
		return str;
	},
	browse: nul.browse.recursion,
	//Just compare : returns true or false
	cmp: function(xpr) {
		if(xpr.charact != this.charact) return false;
		var txpr = this;
		if((trys(xpr.x.attributes, function(c, i) {
			return !txpr.x.attributes[i];
		}) || trys(this.x.attributes, function(c,i) {
			return !c.cmp(xpr.x.attributes[i]);
		}))) return false;
		if( this.components || xpr.components ) {
			if(!this.components || !xpr.components || this.components.length != xpr.components.length)
				return false;
			return !(trys(xpr.components, function(c, i) {
				return !txpr.components[i];
			}) || trys(this.components, function(c,i) {
				return !c.cmp(xpr.components[i]);	
			}));
		}
		switch(this.charact) {
			case 'atom': return this.value == xpr.value;
			case 'local': return this.lindx == xpr.lindx && this.ctxDelta==xpr.ctxDelta;
		}
		return true;
	}.perform('nul.xpr->cmp'),
/* Makes a summary of components and characteristics :
 *  Fix flags, dependances, ...
 */
	summarised: function(first) {
		//TODO: vérifier qu'il n'y a pas de redondance
		var dps = [];
		var flags = {};
		if(this.components) map(this.components, function() {
			if(nul.debug.assert) assert(this.deps,'Subs summarised.'); 
			dps.push(nul.lcl.dep.stdDec(this.deps));
			for(var f in this.flags) if(first || 'dirty'!=f) flags[f] = true;
		});
		map(this.x.attributes, function() {
			if(nul.debug.assert) assert(this.deps,'Subs summarised.');
			dps.push(nul.lcl.dep.stdDec(this.deps));
			for(var f in this.flags) if(first || 'dirty'!=f) flags[f] = true;
		});

		if(['<<=','=','?','[-]'].contains(this.charact)) flags.failable = true;
		else if(this.isFailable && this.isFailable()) flags.failable = true;
		if(['{}'/*,':'*/].contains(this.charact)) delete flags.fuzzy;
		if(['[-]','[]'].contains(this.charact)) flags.fuzzy = true;
		
		if(this.makeDeps) dps.push(this.makeDeps());
		this.deps = nul.lcl.dep.mix(dps);
		//Attributes unification could fail later
		if(!this.fixed() && !isEmpty(this.x.attributes)) flags.failable = true;
		//It is fuzzy if this describe a var - so if there are dependances other than 'self'
		if(this.deps[0]) for(var d in this.deps[0]) if(nul.lcl.slf!= d)
			{ flags.fuzzy = true; break; }
		this.flags = flags;

		if(first && !this.flags.dirty && this.operable()) this.flags.dirty = true;
		return this;
	}.perform('nl.xpr->summarised'),
	//Get xpr premiced with the fuzzy knowledge of <knwldg>
	fuzzyPremiced: function(knwldg) {
		var lcls = [];
		var vals = [];
		for(var d=0; d<knwldg.length; ++d)
			for(var v=0; v<knwldg[d].length; ++v)
				if(knwldg[d][v] && (0<d || knwldg[d][v].flags.fuzzy)) {
					lcls.push(nul.build().local(d+3, v,'-'));
					vals.push(knwldg[d][v].localise(d+3));
				}
		if(0>= lcls.length) return this;
		if(1==lcls.length && (
				this.lindx == lcls[0].lindx ||
				this.cmp(vals[0]) /*TODO: compare within another ctxDelta*/)) {
			if(3== lcls[0].ctxDelta) return knwldg[0][lcls[0].lindx].localise(0);
			return nul.build().unification([
				nul.build().local(lcls[0].ctxDelta-1, lcls[0].lindx,'-'),
				knwldg[lcls[0].ctxDelta-3][lcls[0].lindx].localise(lcls[0].ctxDelta-1)]);
		}
		return this.premiced(map(lcls[i], 
				function(i) { return nul.build().unification([lcls[i], vals[i]]); })
			).summarised();
	}.perform('nul.xpr->fuzzyPremiced'),
	//Be sure the expression is operated until it's not dirty anymore
	composed: function() { return this; },	
	finalize: function(kb) {
		var xpr = this.known(kb) || this;
		if(xpr==this && !xpr.flags.dirty) return;	//TODO: if it was replaced ...
		while(xpr.flags.dirty) {
			xpr = xpr.evaluate(kb) || xpr;
			xpr = xpr.known(kb) || xpr;
		}
		return xpr;
	}.perform('nul.xpr->finalize'),
	//Get a list of non-fuzzy expressions
	solve: function() {
		if(nul.debug) nul.debug.log('leaveLog')(
			nul.debug.lcs.collapser('Solving'), nul.debug.logging?this.dbgHTML():'');
		var sltn;
		try {
			sltn = nul.solve.solve(this);
		} finally {
			if(nul.debug) {
				if(sltn) nul.debug.log('leaveLog')(
					nul.debug.lcs.endCollapser('Solved', 'Solved'), sltn.length + ' possibiliti(es)');
				else nul.debug.log('leaveLog')(
					nul.debug.lcs.endCollapser('Aborted', 'Unsolvable'), nul.debug.logging?this.dbgHTML():'');
			}			
		}
		return sltn;
	}.perform('nul.xpr->solve'),
	//Gets the value of this expression after operations effect (unifications, '+',  ...)
	evaluate: function(kb) {
		return this.browse(nul.browse.evaluate(kb||nul.kb())) || this.clean();
	}.perform('nul.xpr->evaluate'),
	//Replace this context's locals according to association/table <ctx>
	contextualize: function(ctx, dlt) {
		if(!dlt) dlt=0;
		//if(this.deps[dlt]) for(var d in this.deps[dlt]) if(ctx[d])
		return this.browse(nul.browse.contextualize([ctx], dlt));
	}.perform('nul.xpr->contextualize'),
	known: function(kb, dlt) {
		if(!dlt) dlt=0;
		//TODO: verify intersection between kb and this.deps
		return this.browse(nul.browse.contextualize(kb.knowledge, dlt, kb));
	}.perform('nul.xpr->known'),
	//Take the side-effected value of this expression
	extraction: function() {
		return this.browse(nul.browse.extraction);
	}.perform('nul.xpr->extraction'),
	
	brws_lclShft: function(x, act, px, kb) {
		return this;
		var rv = this.browse(nul.browse.lclShft(x.locals.length, act)) || this;
		x.xadd(rv, kb);
		return rv.withX(px);
	}.perform('nul.xpr->brws_lclShft'),
	//When this expression's locals are moved from (0..#) to (<n>..<n>+#)
	//<lcls> was the added locals and becomes the whole ones.
	//ctxDelta-s are unchanged
	lclShft: function(x, kb) {
		return this;	//TODO: rewrite
		if(nul.debug.levels && kb) assert(this.x.lvl == kb.knowledge.length, 'lclShft predicate');
		if(0== this.x.locals.length || 0== x.locals.length)
			return this.xadd(x, kb);
		return this.brws_lclShft(x,'sft',x, kb);
	}.perform('nul.xpr->lclShft'),
	//This expression wrapped. Locals are given to parent.
	//<lcls> is the new parent's already locals and becomes new parent's whole locals
	//ctxDelta-s of these locals and outer locals are incremented
	stpDn: function(x, kb) {	//Note: never used .... debug me !
		return this;	//TODO: rewrite
		return this.brws_lclShft(x,'sdn',nul.x(), kb);
	}.perform('nul.xpr->stpDn'),
	//This expression wrapped. Locals are unchanged.
	//<lcls> is the new parent's already locals and becomes new parent's whole locals
	//ctxDelta-s of outer locals are incremented
	wrap: function(kb) {
		return this;	//TODO: rewrite
		return this.brws_lclShft(nul.x(),'wrp', this.x);
	}.perform('nul.xpr->wrap'),
	//This expression climbed.
	//<lcls> is the old parent's locals and becomes common locals.
	//ctxDelta-s of outer locals are decremented
	//<kb> last context knows <lcls>
	stpUp: function(x, kb) {
		return this;	//TODO: rewrite
		//this.locals are the unknown of kb[-1]
		if(nul.debug.levels && kb) assert(this.x.lvl == kb.knowledge.length, 'StepUp predicate');
		return this.brws_lclShft(x,'sup', x, kb);
	}.perform('nul.xpr->stpUp'),
	//Extract locals and says <this> we gonna give them to his parent
	//<x> are the destination parent's locals
	//ctxDelta-s are unchanged
	lclsUpg: function(x, kb) {	//TODO: debug me !
		return this;	//TODO: rewrite
		if(nul.debug.levels && kb) assert(this.x.lvl == kb.knowledge.length-1, 'LocalsUpgrade predicate');
		//TODO: refaire la condition: cf attr aussi
		if(0>= this.x.locals.length) {
			x.xadd(this.x);
			return this.withX();
		}
		return this.brws_lclShft(x,'upg',nul.x());
	}.perform('nul.xpr->lclsUpg'),
	//Insert locals from his parent
	//<x> are the emptied source parent's locals
	//ctxDelta-s are unchanged
	//<x> refer to the last known context
	lclsDng: function(x, kb) {
		return this;	//TODO: rewrite
		if(0>= x.locals.length) return this.xadd(x);
		try { return this.brws_lclShft(x,'dng',x, kb); }
		finally { x.seEmpty(); }
	}.perform('nul.xpr->lclsDng'),
	
	//Transform an expression from kb local-space to expression local-space and vice versa
	localise: function(inc) {
		//TODO: optimise: throw nul.unlocalisable en fonction des dépendances
		return this.browse(nul.browse.localise(inc||0));
	}.perform('nul.xpr->localise'),

	rDevelop: function(v, inc, lcl) {
		var ctx = [];
		ctx[lcl || nul.lcl.slf] = v.localise();
		return this.contextualize(ctx, inc);
	}.perform('nul.xpr->rDevelop'),
	//Shortcut: Weither this epression is free of dependance toward external locals
	free: function() { return nul.lcl.dep.free(this.deps); }.perform('nul.xpr->free'),
	//If the root expression of this operand will be kept forever
	finalRoot: function() { return !this.operate && 'local'!= this.charact; },
	//If this expression is self-refering
	selfRef: function() { return this.deps[0] && this.deps[0][nul.lcl.slf]; },
	//If this operand will keep this value forever
	fixed: function() { return this.free() && this.finalRoot() && !this.selfRef(); },
	subFixed: function() { return !trys(this.components, function(o) { return !o.fixed(); }) },
	operable: function() { return !!this.operate; },
	clean: function() { delete this.flags.dirty; return this; },
	dirty: function() { this.flags.dirty = true; return this; },
	
	compose: function(nComps) {
		if([';','[]',':','=','&','|','^','+','*','&&','||'].contains(this.charact)) {
			var nc = [];
			while(0<nComps.length) {
				var tc = nComps.pop();
				if(tc.charact == this.charact) {
					tc = tc.stpUp(this.x);
					nComps = nComps.concat(tc.components);
				} else nc.unshift(tc);
			}
			nComps = nc;
		}
		this.components = nComps;
		return this.composed().summarised(true);
	}.perform('nul.xpr->compose'),
	xadd: function(x, kb) {
		var tx = this.x;
		//This dirty comes from the unification created (just the line under) in the attributes
		if(!kb && trys(x.attributes, function(o, i) { return !tx.attributes[i]; } )) this.dirty();
		this.x.xadd(x,kb);
		return this.summarised();
	}.perform('nul.xpr->xadd'),
	
	withX: function(x) {
		if(!x) x = nul.x();
		if(nul.debug.assert) assert(x.attributes,'X given');
		this.x = x;
		return this;
	}.perform('nul.xpr->withX'),
};