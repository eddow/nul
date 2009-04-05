nul.set = {
	/*
	union: function(sets, x) {
		if(!sets.length) return nul.build.definition();
		if(1==sets.length) return sets[0];
		var locals = [];
		var iors = [];
		while(sets.length) iors.push(sets.pop().into(ctxName, locals));
		return nul.build.definition(nul.build.ior3(iors), [], locals, ctxName).xadd(x);
	},

	*/
	behaviour: {
		asUnion: function(vals) {
			if(1==vals.length) {
				this.components = vals[0].components;
			} else {
				var iors = [];
				while(vals.length) iors.push(vals.pop().into());
				this.components.value = nul.build.ior3(iors).clean();
			}
			return this.summarised().clean();
		},
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
			var rv;
			if(ctxName) {
				var dlt = lcls.length;
				lcls.pushs(this.locals);
				rv = (this.browse(
					nul.browse.lclShft(dlt, this.ctxName, ctxName)
				) || this);
			} else rv = this;
			return nul.build.kwFreedom(rv.components.value, rv.components);
		}.perform('freedom->stpUp'),
		takeFrdm: function(knwl, ctx) {
			if(this.solving) return this;
			this.solving = true;
			try { var rv = nul.solve.solve(this);
			} finally { delete this.solving; }
	
			if(rv.solved.length) {
				if(0<rv.fuzzy.length)
					rv.solved.follow = this.asUnion(rv.fuzzy);
				rv = nul.build.list(rv.solved).xadd(this.x);
			}
			else if(rv.fuzzy.length) rv = this.asUnion(rv.fuzzy, this.x);
			else return nul.build.definition().xadd(this.x);

			if('{}'== rv.charact) return rv.removeUnused().clean();
			delete this.arCtxName;	//arCtxName went to the containing list
			rv.xadd(this.x);
			if(nul.debug.assert) assert(','== rv.charact, 'Solution value is set or list');
			if(rv.components.follow) rv.components.follow.removeUnused();
			return rv;
		}.perform('set->takeFrdm'),
		composed: function() {
			if(!this.components.value.flags.fuzzy &&
			isEmpty(this.components.value.deps) &&
			0>= this.components.length)
				return nul.build.list([this.components.value]).xadd(this.x);
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
			return nul.build.definition().xadd(this.x);
		},
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
			return this;
		},
		removeUnusedKnowledge: function() {
			//It is called on first-son ORs while they get unified after solve,
			//  so each IOR son is seen as a set
			//remove useless knowedge : the one that share no deps with 'value' or other useful knowledge
			var ctxn = this.ctxName;
			var usefulLocals = this.components.value.deps[ctxn];
			if(!usefulLocals) this.components.splice(0);
			else {
				//First eliminate locals found once in an equality of the premices
				for(var l in this.used) if(1== this.used[l] && !usefulLocals[l]) {
					//This local is used only once in the premices. Is it as a term of a unification ?
					var p;
					for(p=0; p < this.components.length && (
						!this.components[p].deps[ctxn] ||
						 !this.components[p].deps[ctxn][l] )
					; ++p);	///Find the premice containing this local
					if(p < this.components.length) {	//The premice can have been deleted by this algorithm!
						var prm = this.components[p];
						if(prm.unification) {
							var c;
							for(c=0; !prm.components[c].deps[ctxn] || !prm.components[c].deps[ctxn][l]; ++c); //Find the term refering the local
							if('local'== prm.components[c].charact) {
								if(2== prm.components.length) {
									this.components.splice(p,1);
									this.summarised();
								} else if('='== prm.charact) {
									prm.components.splice(c,1);
									this.summarised();
									this.summarised();
								} else if(':='== prm.charact) {
									this.components.push(nul.build.unification(prm.components.splice(c+1),-1));
									prm.components.splice(c,1);
									prm.summarised();
								}
							}
						}
					}
				}
				//Second, sort the premices to keep only the ones with no link at all from the value
				var forgottenPrmcs = [];
				for(var i=0; i<this.components.length; ++i)
					if(isEmpty(this.components[i].deps, [ctxn]))
						forgottenPrmcs.push(i);
				do {
					var ds;
					for(var i=0; i<forgottenPrmcs.length; ++i) {
						ds = this.components[forgottenPrmcs[i]].deps[ctxn];
						if(ds) if(trys(ds, function(d) { return usefulLocals[d] })) break; 
					}
					if(i>=forgottenPrmcs.length) ++i;
					else {
						merge(usefulLocals, ds);
						forgottenPrmcs.splice(i,1);
					}
				} while(i<=forgottenPrmcs.length);
				//Remove in inverse orders to have valid indices.
				// If [1, 3] must be removed from (0,1,2,3,4) to give (0,2,4),
				//  first remove 3 then 1.
				while(0<forgottenPrmcs.length) this.components.splice(forgottenPrmcs.pop(), 1);
			}
			return this;
		},		
		removeUnused: function() {
			this.summarised();
			this.removeUnusedKnowledge();
			if(this.solving) return this;
			//Remove local-index-space allocations for unknowns not used anymore
			var delta = 0, i = 0, tt = {};
			while(i<this.locals.length) {
				if(!this.used[i+delta]) {
					++delta;
					this.locals.splice(i,1);
				} else {
					if(0<delta) tt[nul.build.local(this.ctxName,i+delta).ndx] =
						nul.build.local(this.ctxName,i,this.locals[i]); 
					++i;
				}
			}
			if(!delta) return this;
			var rv = this.contextualise(tt);
			nul.debug.log('ctxs')('Relocated', rv);
			return rv;
		}
	}
};