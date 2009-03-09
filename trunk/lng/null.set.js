nul.set = {
	unionCtxName: 0,
	union: function(sets, x) {
		if(!sets.length) return nul.build.set();
		if(1==sets.length) return sets[0];
		var ctxName = 'u'+(++nul.set.unionCtxName)
		var locals = [];
		var iors = [];
		while(sets.length) iors.push(sets.pop().into(ctxName, locals));
		return nul.build.set(nul.build.ior3(iors), [], locals, ctxName).xadd(x);
	},
	behaviour: {
		//This expression out of the set
		//this' locals are added to <kb>' last context 
		//This ctxName is not referenced anymore
		stpUp: function(kb) {
			var dlt = kb.addLocals(this.locals);
			var rv = (this.browse(
				nul.browse.lclShft(dlt, this.ctxName, kb.contexts[0].ctxName)
			) || this);
			kb.knew(rv.components);
			return rv.components.value
		}.perform('freedom->stpUp'),
		//This expression in another set
		//this' locals are added to <kb>' last context 
		//This ctxName is not referenced anymore
		into: function(ctxName, lcls) {
			var dlt = lcls.length;
			lcls.pushs(this.locals);
			var rv = (this.browse(
				nul.browse.lclShft(dlt, this.ctxName, ctxName)
			) || this);
			return nul.build.kwFreedom(rv.components.value, rv.components);
		}.perform('freedom->stpUp'),
		takeFrdm: function(knwl, ctx) {
			this.composed().summarised();
			//Remove local-index-space allocations for unknowns not used anymore
			var delta = 0, i = 0, tt = {};
			while(i<ctx.length) {
				if(!this.used[i+delta]) {
					++delta;
					ctx.splice(i,1);
				} else {
					if(0<delta) tt[nul.build.local(this.ctxName,i+delta).ndx] =
						nul.build.local(this.ctxName,i,ctx[i]); 
					++i;
				}
			}
			return this.contextualise(tt);
		}.perform('set->takeFrdm'),
		composed: function() {
			//TODO: composed : if can enumerate, just enumerate in a list
			if(!this.components.value.flags.fuzzy &&
			isEmpty(this.components.value.deps) &&
			0>= this.components.length)
				return nul.build.list([this.components.value]).xadd(this);
			return this;
		}.perform('set->composed').xKeep(),
		transform: function() {
			//TODO: set::transform : if " :- " or " ..[]:-[].. "
			return true;
		},
		take: function(apl, kb, way) {
			//TODO: clone:'itm' à l'evaluate et au contextualise pour enlever ici
			return nul.unify.level(apl, this.clone().stpUp(kb), kb, -1);
		}.perform('set->take'),
		fail: function() {
			return nul.build.set().xadd(this);
		},
		extract: function() {
			//TODO: remember extraction and use it instead from now on
			var sltns = nul.solve.solve(this);
			//return nul.build.atom('Solved: '+sltns.solved.length+'\nFuzzies: '+sltns.fuzzy.length);

			if(sltns.solved.length) {
				if(0<sltns.fuzzy.length)
					sltns.solved.follow = nul.set.union(sltns.fuzzy, this.x);
				return nul.build.list(sltns.solved).xadd(this);
			}
			if(sltns.fuzzy.length) return nul.set.union(sltns.fuzzy, this.x);
			return nul.build.set().xadd(this);
		}.perform('set->extract').xKeep(),
		isFailable: function() {
			return false;
		},
		makeFrdm: function(kb) {
			kb.push(nul.knowledge(this.components), {
				ctxName: this.ctxName,
				locals: this.locals,
				addLocals: function(locals) {
					this.locals.pushs(isArray(locals)?locals:[locals]);
					return this.locals.length-locals.length;
				}
			});
			return this.frdmMock(kb);
		}
	}
};