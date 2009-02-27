/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
 
nul.xpr = {	//Main interface implemented by all expressions
	clone: function(prnt) {
		var rv = clone1(this);
		rv.locals = clone1(this.locals);
		if(prnt) rv.locals.prnt = prnt;
		rv.components = map(this.components, function(o) { return o.clone(rv); });
		rv.attributes = map(this.attributes, function(o) { return o.clone(rv); });
		return rv;
	}.perform('nul.xpr->clone'),
	toHTML: nul.text.toHTML,
	browse: nul.browse.recursion,
	//Just compare : returns true or false
	cmp: function(xpr) {
		if(xpr.charact != this.charact) return false;
		if( this.components || xpr.components ) {
			if(!this.components || !xpr.components || this.components.length != xpr.components.length)
				return false;
			var allSim = true;
			//TODO: endMap
			map(this.components, function(c,i) {
				if(allSim && !c.cmp(xpr.components[i])) allSim = false;
			});
			map(this.attributes, function(c,i) {
				if(allSim && !c.cmp(xpr.attributes[i])) allSim = false;
			});
			if(allSim) for(var an in xpr.attributes) if(!this.attributes[an]) return false;
			return allSim;
		}
		if( ('undefined'!= typeof this.value || 'undefined'!= typeof xpr.value) &&
				this.value != xpr.value)
			return false;
		if( ('undefined'!= typeof this.lindx || 'undefined'!= typeof xpr.lindx) &&
				(this.lindx != xpr.lindx) || (this.ctxDelta != xpr.ctxDelta) )
			return false;
		return true;
	}.perform('nul.xpr->cmp'),
/* Makes a summary of components and characteristics :
 *  Fix flags, dependances, ...
 */
	summarised: function(first) {
		//TODO: vérifier qu'il n'y a pas de redondance
		var dps = [];
		var flags = {};
		if(this.components) map(this.components, function(o) {
			if(nul.debug.assert) assert(o.deps,'Subs summarised.'); 
			dps.push(nul.lcl.dep.stdDec(o.deps));
			for(var f in o.flags) if(first || 'dirty'!=f) flags[f] = true;
		});
		map(this.attributes, function(o) {
			if(nul.debug.assert) assert(o.deps,'Subs summarised.');
			dps.push(nul.lcl.dep.stdDec(o.deps));
			for(var f in o.flags) if(first || 'dirty'!=f) flags[f] = true;
		});

		if(['<<=','=','?','[-]'].contains(this.charact)) flags.failable = true;
		else if(this.isFailable && this.isFailable()) flags.failable = true;
		if('{}'== this.charact) delete flags.fuzzy;
		if(['[-]','[]',':'].contains(this.charact)) flags.fuzzy = true;
		
		if(this.makeDeps) dps.push(this.makeDeps());
		this.deps = nul.lcl.dep.mix(dps);
		//It is fuzzy if this describe a var - so if there are depdnances other than 'self'
		if(this.deps[0]) for(var d in this.deps[0]) if(nul.lcl.slf!= d)
		{ flags.fuzzy = true; break; }
		this.flags = flags;

		if(!nul.understanding.phase) {
			//Remove locals declarations if no dependance
			var rmningLcls = {};
			if(this.deps[0]) for(var i in this.deps[0]) rmningLcls[i] = true;
			for(var i=0; i<this.locals.length; ++i) if(!rmningLcls[i]) delete this.locals[i];
		}
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
				knwldg[lcls[0].ctxDelta-3][lcls[0].lindx].localise(lcls[0].ctxDelta-1)])
				.levelise(this);
		}
		var xpr = this;
		for(var i=0; i<vals.length; ++i) {
			var prem = nul.build().unification([lcls[i], vals[i]]);
			if(';'== xpr.charact) xpr = xpr.modify(unshifted(prem,xpr.components));
			else {
				var rlcls = [];
				xpr = nul.build(rlcls).and3([prem,xpr.stpDn(rlcls)]);
			}
		}
		return xpr.levelise(this).summarised();
	}.perform('nul.xpr->fuzzyPremiced'),
	//Be sure the expression is operated until it's not dirty anymore		
	finalize: function(kb) {
		var xpr = this.known(kb) || this;
		if(xpr==this && !xpr.flags.dirty) return;	//TODO: if it was replaced ...
		while(xpr.flags.dirty) {
			xpr = xpr.evaluate(kb, -1) || xpr;
			xpr = xpr.known(kb) || xpr;
		}
		return xpr;
	}.perform('nul.xpr->finalize'),
	//Get a list of non-fuzzy expressions
	solve: function() {
		if(nul.debug) nul.debug.log('leaveLog')(
			nul.debug.lcs.collapser('Solving'), nul.debug.logging?this.toHTML():'');
		var sltn;
		try {
			sltn = nul.solve.solve(this);
		} finally {
			if(nul.debug) {
				if(sltn) nul.debug.log('leaveLog')(
					nul.debug.lcs.endCollapser('Solved', 'Solved'), sltn.length + ' possibiliti(es)');
				else nul.debug.log('leaveLog')(
					nul.debug.lcs.endCollapser('Aborted', 'Unsolvable'), nul.debug.logging?this.toHTML():'');
			}			
		}
		return sltn;
	}.perform('nul.xpr->solve'),
	//Gets the value of this expression after operations effect (unifications, '+',  ...)
	evaluate: function(kb, entrance) {
		return this.browse(nul.browse.evaluate(kb||nul.kb(), entrance)) || this.clean();
	}.perform('nul.xpr->evaluate'),
	//Replace this context's locals according to association/table <ctx>
	contextualize: function(ctx, dlt) {
		if(!dlt) dlt=0;
		if(this.deps[dlt]) for(var d in this.deps[dlt]) if(ctx[d])
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
	
	brws_lclShft: function(lcls, act, plcls) {
		var rv = this.browse(nul.browse.lclShft(lcls.length, act)) || this;
		if(0<rv.locals.length) seConcat(lcls, rv.locals);
		if(nul.debug.levels)
			//TODO: rendre ce dilîte générique : si on l'enlève, unittest foire
			if(rv.locals.prnt) delete rv.locals.prnt;
		return rv.withLocals(plcls);
	}.perform('nul.xpr->brws_lclShft'),
	//When this expression's locals are moved from (0..#) to (<n>..<n>+#)
	//<lcls> was the added locals and becomes the whole ones.
	//ctxDelta-s are unchanged
	lclShft: function(lcls) {
		if(0== this.locals.length) {
			this.locals = lcls;
			return this;
		}
		if(0== lcls.length) return this;
		return this.brws_lclShft(lcls,'sft',lcls);
	}.perform('nul.xpr->lclShft'),
	//This expression wrapped. Locals are given to parent.
	//<lcls> is the new parent's already locals and becomes new parent's whole locals
	//ctxDelta-s of these locals and outer locals are incremented
	stpDn: function(lcls) {	//Note: never used .... debug me !
		return this.brws_lclShft(lcls,'sdn',[]);
	}.perform('nul.xpr->stpDn'),
	//This expression wrapped. Locals are unchanged.
	//<lcls> is the new parent's already locals and becomes new parent's whole locals
	//ctxDelta-s of outer locals are incremented
	wrap: function(kb) {
		return this.brws_lclShft([],'wrp', this.locals);
	}.perform('nul.xpr->wrap'),
	//This expression climbed.
	//<lcls> is the old parent's locals and becomes common locals.
	//ctxDelta-s of outer locals are decremented
	//<kb> last context knows <lcls>
	stpUp: function(lcls, kb) {
		//this.locals are the unknown of kb[-1]
		if(nul.debug.levels && kb) assert(this.locals.lvl == kb.knowledge.length, 'StepUp predicate');
		return this.brws_lclShft(lcls,'sup', lcls);
	}.perform('nul.xpr->stpUp'),
	//Extract locals and says <this> we gonna give them to his parent
	//<lcls> are the destination parent's locals
	//ctxDelta-s are unchanged
	lclsUpg: function(lcls, kb) {	//TODO: debug me !
		if(nul.debug.levels && kb) assert(this.locals.lvl == kb.knowledge.length,
			'LocalsUpgrade predicate');
		if(0>= this.locals.length) return this;
		return this.brws_lclShft(lcls,'upg',[]);
	}.perform('nul.xpr->lclsUpg'),
	//Insert locals from his parent
	//<lcls> are the emptied source parent's locals
	//ctxDelta-s are unchanged
	//<lcls> refer to the last known context
	lclsDng: function(lcls, kb) {	//TODO: never used .... debug me !
		if(0>= lcls.length) return this;
		try { return this.brws_lclShft(lcls,'dng',lcls); }
		finally { seEmpty(lcls); }
	}.perform('nul.xpr->lclsDng'),
	
	//Transform an expression from kb local-space to expression local-space and vice versa
	localise: function(inc) {
		//TODO: optimise: throw nul.unlocalisable en fonction des dépendances
		return this.browse(nul.browse.localise(inc||0));
	}.perform('nul.xpr->localise'),

	numerise: function(prnt) {
		if(!nul.debug.levels || nul.understanding.phase) return this;
		var lvl;
		if(prnt) {
			if(('number'==typeof prnt)) { lvl=prnt; prnt = undefined; }
			else lvl = prnt.locals.lvl;
		}
		if(nul.debug.assert && 'undefined'!= typeof lvl) assert(! (
				!prnt && this.locals.lvl == lvl
			) || (
				prnt && this.locals.lvl == prnt.locals.lvl+1
			),'No useless numerisation.')
		return this.browse(nul.browse.numerise(prnt, lvl)) || this;
	}.perform('nul.xpr->numerise'),
	levelise: function(sl) {
		if(!nul.debug.levels) return this;
		if(sl.locals) sl = sl.locals;
		return this.numerise(sl.prnt || sl.lvl);
	},
	rDevelop: function(v, inc, lcl) {
		var ctx = [];
		ctx[lcl || nul.lcl.slf] = v.localise();
		return this.contextualize(ctx, inc);
	}.perform('nul.xpr->rDevelop'),
	//Shortcut: Weither this epression is free of dependance toward external locals
	free: function(beside) { return nul.lcl.dep.free(this.deps, beside); }.perform('nul.xpr->free'),
	operable: function() {
		return !!this.operate;
	},
	//Shortcut: Clean !
	clean: function() { delete this.flags.dirty; return this; },
	dirty: function() { this.flags.dirty = true; return this; },
	
	modify: function(nComps, nAttrs) {
		if(nComps) {
			if([';','[]',':','=','&','|','^','+','*','&&','||'].contains(this.charact)) {
				var nc = [];
				while(0<nComps.length) {
					var tc = nComps.pop();
					if(tc.charact == this.charact) {
						tc = tc.stpUp(this.locals);
						nComps = nComps.concat(tc.components);
					} else nc.unshift(tc);
				}
				nComps = nc;
			} else if(':-'==this.charact) {
				//(a :- b) :- c ===> a :- (b = c)
				if(':-'== nComps.parms.charact) {
					var flmbd = nComps.parms.stpUp(this.locals);
					var eq = nul.build()	//TODO:numerise?
						.unification([flmbd.components.value, nComps.value]).wrap();
					nComps = {parms: flmbd.components.parms, value: eq};
				}
			} else if(','==this.charact) {
				while(nComps.follow && ','== nComps.follow.charact) {
					var flw = nComps.follow.stpUp(this.locals);
					seConcat(nComps, flw.components);
					nComps.follow = flw.components.follow;
				}
				if(nComps.follow && '{}'== nComps.follow.charact && !nComps.follow.components)
					delete nComps.follow;
				if(0== nComps.length) return nComps.follow || nul.build().set();
			} else if('?'==this.charact) {
				var uc;
				if(['||','&&'].contains(nComps[0].charact)) {
					uc = nComps[0].stpUp(this.locals);
					switch(nComps[0].charact) {
						case '&&': return nul.build(this).and3(uc.components);
						case '||': return nul.build(this).or3(uc.components);
					}
				}
			}
			this.subbed('components', nComps);
		}
		return this.attributed(nAttrs).summarised();
	}.perform('nul.xpr->modify'),
	attributed: function(nAttrs) {
		return this.subbed('attributes', nAttrs);
	}.perform('nul.xpr->attributed'),
	subbed: function(subNm, subs) {
		var prnt = this;
		if(subs) this[subNm] = map(subs, function(c) { return c.numerise(prnt); });
		return this;
	}.perform('nul.xpr->attributed'),
	addAttr: function(kb) {
		for(var i=1; i<arguments.length; ++i)
			for(an in arguments[i].attributes)
				if(!this.attributes[an]) this.attributes[an] = arguments[i].attributes[an];
				else this.attributes[an] = kb?
					nul.unify.subd(
						this.attributes[an],
						arguments[i].attributes[an], kb) :
					nul.build().unification(
						this.attributes[an],
						arguments[i].attributes[an], kb) ;
		var rv = this.summarised();
		//TODO: on n'ajouterais pas simplement les attributs au KB ? quels sont les effets secondaires?
		rv = rv.known(kb) || rv;
		return rv.contextualize(rv.attributes) || rv;
	}.perform('nul.xpr->addAttr'),
	
	withLocals: function(lcls) {
		if(nul.debug.levels && 'undefined'!= typeof this.locals.lvl) {
			if('undefined'== typeof lcls.lvl) lcls.lvl = this.locals.lvl;
			else assert(this.locals.lvl == lcls.lvl, 'Local change doesnt change level');
		}
		this.locals = lcls;
		return this;
	}.perform('nul.xpr->withLocals'),
};