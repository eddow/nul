/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
 
nul.behav = {
	freedom: {
		finalise: function(kb) {
			if(nul.debug.assert) assert(kb.knowledge[0].premices === this.components,
				'Finalise freedom while knowing it')
			this.known(this.components);
			while(this.flags.dirty) {
				var nprms = this.components.splice(0);
				kb.forget();
				while(0<nprms.length) {
					var prms = nprms.pop().evaluate(kb);
					if(prms.flags.failable) kb.knew(prms);
				}
				this.components.value = this.components.value.evaluate(kb);
				this.summarised();
				this.known(this.components);
			}
			//TODO: knowledge must be forgotten in OR premice if not used in containing set : n=(1[]2) should give (1[]2)
			if('ctx'== this.freedom) {
				//remove useless knowedge : the one that share no deps with 'value' or other useful knowledge
				var ctxn = kb.contexts[0].ctxName;
				/*TODO:
				 * we could eliminate more : (a+1=b) should forget a+1=b
				 * even group the equivalent locals to express in one only : v; (z=1 [] z=2); v=z
				*/
				var usefulLocals = this.components.value.deps[ctxn];
				if(!usefulLocals) kb.forget();
				else {
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
					while(0<forgottenPrmcs.length) kb.forget(forgottenPrmcs.pop());
				}
			}
			return this;
		}.perform('freedom->finalise').xKeep(),
		frdmMock: function(kb) {
			var fv = this;
			var rvThis = function() { return this; };
			return {
				components: clone1(this.components),
				kb: kb,
				operate: function() {
					fv.components.value = this.components.value;
					for(var i=0; i<this.components.length; ++i)
						if(['[]',':'].contains(this.components[i].charact) &&
							this.components[i].flags.failable) {
							var ior = nul.build.ior3(this.components[i].components).clean();
							for(var c=0; c<ior.components.length; ++c)
								delete ior.components[c].components.value;
							this.kb.knew(ior);
						}
					return fv;
				},
				x : { attributes: {} },
				integre: rvThis,
				summarised: rvThis,
				compose: rvThis,
				composed: rvThis,
				clone: rvThis,
				operable: rvThis
			};
		},

		freedomHTML: function() {
			var rv = '';
			if(this.components.value) {
				if(0<this.components.length) return ''+
					'<table class="xpr freedom"><tr><td class="freedom">' +
					this.components.value.toHTML() +
					'</td></tr><tr><th class="freedom">' +
					nul.text.expressionHTML(';', this.components) +
					'</th></tr></table>';
				return this.components.value.toHTML();
			}
			if(0<this.components.length) return nul.text.expressionHTML(';', this.components);
			return '<span class="failure">Ok</span>';
		},
		freedomString: function() {
			var rv = '';
			if(this.components.value) rv =
				this.components.value.toString() + (0<this.components.length?'; ':'');
			if(0<this.components.length)
				rv += nul.text.expressionString(';', this.components);
			return rv;
		},
		integrity: function() {
			return this.charact == {kw:'kw', ctx:'{}'}[this.freedom];
		}
	},
	html_place: {
		transform: function() { return true; },
		take: function() {},
		extract: function() {
			return nul.build.list(nul.html(this.element.innerHTML)).xadd(this);
		}.xKeep(),
		append: function(itm) {
			if(itm.toXML) {
				this.element.innerHTML += itm.toXML();
				return itm.components.parms;
			}
			if(itm.value) {
				this.element.innerHTML += itm.value;
				return nul.build.atom('#text');
			}
			throw nul.semanticException('XML element expected for appending');
		},
		isFailable: function() { return false; }
	},
	application: {
		operable: function() {
			return this.components.object.finalRoot();
		},
		operate: function(kb) {
			if(!this.components.object.take)
				throw nul.semanticException('Not a set : '+ this.components.object.toHTML());
			var selfRef = this.components.object.arCtxName, srTt;
			if(selfRef) {
				srTt = {};
				srTt[nul.build.local(selfRef,nul.lcl.slf).ndx] = this.components.object;
			}
			if(selfRef && !isEmpty(this.components.applied.deps)) return;
			var rv = this.components.object.take(this.components.applied, kb, 1);
			if(rv) {
				//TODO: optimise recursion
				while(selfRef && rv.deps[selfRef]) {
					rv = rv.contextualise(srTt,'self').evaluate(kb);
				}
				return rv.xadd(this, kb);
			}
			if(!this.components.object.transform()) {
				kb.knew(this.clean().clone());
				return this.components.applied.xadd(this, kb);
			}
		}.perform('application->operate').xKeep()
	},
	kwFreedom: {
		takeFrdm: function(knwl, ctx) {
			return this.composed().summarised();
		}.perform('kwFreedom->takeFrdm'),
		composed: function() {
			if(this.components &&
			this.components.value &&	//Value is not set when called from within nul.build.item
			0== this.components.length &&
			!this.components.value.flags.failable)
				return this.components.value.xadd(this);
			return this;
		},
		fail: function() {
			delete this.components;
			this.flags = this.deps = {};
			return this;
		},
		makeFrdm: function(kb) {
			kb.push(nul.knowledge(this.components));
			return this.frdmMock(kb);
		}
	},
	set: nul.set.behaviour,
	seAppend: {
		extract: function() {
			var eff = this.components.effected;
			if(!eff.append)
				eff = eff.extract();
			if(!eff.append)
				throw nul.semanticException('Expected appendable : ' + eff.toString());
			eff.append(this.components.appended);
			return eff.xadd(this);
		}		
	},
	cumulExpr: {
		//operable: nul.xpr.subFixed,
		operate: function(kb)
		{
			var cps = clone1(this.components), ncps = [], o;
			while(o || 0< cps.length) {
				var c = o || cps.pop();
				if(c.fixed()) {
					c = nul.asJs(c, this.charact);
					o = cps.pop();
					while(o && o.fixed()) {
						o = nul.asJs(o, this.charact);
						c = eval( ''+nul.jsVal(o) + this.charact + nul.jsVal(c) );
						o = cps.pop();
					}
					c = nul.build.atom(c);
				} else o = null;
				ncps.unshift(c);
			}
			if(1==ncps.length) return ncps[0].xadd(this, kb);
			if(ncps.length != this.components.length)
				return this.compose(ncps).clean();
		}.perform('cumulExpr->operate').xKeep()
	},
	biExpr: {
		operable: nul.xpr.subFixed,
		operate: function(kb)
		{
			return nul.build.atom(eval('' +
				nul.asJs(this.components[0], this.charact) +
				this.charact +
				nul.asJs(this.components[1], this.charact) ))
				.xadd(this, kb);
		}.perform('biExpr->operate').xKeep()
	},
	list: {
		followed: function(flw) {
			if(flw) this.components.follow = flw;
			else delete this.components.follow;
			return this.composed();
		},
		composed: function() {
			//a, b,.. c, d,.. e ==> a, b, c, d,.. e
			while(this.components.follow && ','== this.components.follow.charact) {
				this.components.pushs(this.components.follow.components);
				this.followed(this.components.follow.components.follow);
			}
			if(
					this.components.follow &&
					'{}'== this.components.follow.charact &&
					!this.components.follow.components)
				delete this.components.follow;
			if(0== this.components.length)
				return this.components.follow || nul.build.set();
			return this;
		}.perform('list->composed').xKeep(),
		take: function(apl, kb, way) {
			var rvl, rvf;
			try{ rvl = nul.unify.orDist(this.components, this.x, apl, kb, way); }
			catch(err) { if(nul.failure!= err) throw nul.exception.notice(err); }
			if(this.components.follow) {
				try{ rvf = this.components.follow.take(apl,kb,way); }
				catch(err) { if(nul.failure!= err) throw nul.exception.notice(err); }
			}
			if(!rvl && !rvf) nul.fail();
			if(!rvl ^ !rvf) return rvl || rvf;
			rvl = nul.build.ior3([rvl,rvf]);
			return rvl?rv.xadd(x, kb):rvl;			
		}.perform('list->take')
	},
	preceded: {
		operable: nul.xpr.subFixed,
		operate: function(kb)
		{
			return nul.build
				.atom(eval( this.charact + nul.asJs(this.components[0],this.charact) ))
				.xadd(this, kb);
		}.perform('preceded->operate').xKeep()
	},
	assert: {
		operable: nul.xpr.subFixed,
		operate: function(kb)
		{
			var v = nul.asJs(this.components[0],'?');
			if('boolean'!= typeof v)
				throw nul.semanticException('Boolean expected instead of ' +
					this.components[0].toString());
			if(v) return this.components[0].xadd(this, kb);
			nul.fail('Assertion not provided');
		}.perform('assert->operate').xKeep()
	},
	extraction: {
		operate: function(kb)
		{
			var rv = this.components[0].extraction();
			if(!rv) return this.components[0].xadd(this);
			if(rv) return rv.evaluate(kb).xadd(this);
		}.perform('extration->operate').xKeep(),
		extract: function() {}		//Must avoid sub-expr extraction
	},
	unification: {
		operate: function(kb)
		{
			var fl = this.components.length;
			var rv = nul.unify.multiple(this.components, kb, this.way, this.x)
			if(rv && 1== rv.length) return rv[0].xadd(this, kb);
			if(!rv) rv = this.components;
			return kb.affect(rv, this.way, this.x).xadd(this, kb);
		}.perform('unification->operate').xKeep()
	},
	kwFreedomHolder: {
		composed: function() {
			var i=0;
			while(i<this.components.length)
				//If component is failed, remove it
				if('kw'== this.components[i].charact && !this.components[i].components)
					this.components.splice(i,1);
				//If xor and component is not failable, stop browsing
				else if(':'== this.charact && 'kw'!= this.components[i].charact)
					break;
				else ++i;
			if(i<this.components.length) this.components.splice(++i);
			switch(i) {
				case 0: nul.fail();
				case 1: this.dirty();
			}
			return this;
		}.perform('kwFreedomHolder->composed'),
		operate: function(kb) {
			if(1== this.components.length) {
				var rv = this.components[0];
				if('kw'== rv.charact) {
					kb.knew(rv.components);
					rv = rv.components.value;
				}
				return rv.xadd(this, kb);
			}
		}.perform('kwFreedomHolder->operate').xKeep(),
	},
	ior3: {
		possibility: function(n) {
			if(n<this.components.length) 
				return nul.build.ior3([this.components[n]]).dirty().xadd(this.x);
		},
		isFailable: function() {
			for(var i=0; i<this.components.length; ++i)
				if(!this.components[i].flags.failable) return false;
			return true;
		}
	},
	xor3: {
		isFailable: function() {
			return this.components[this.components.length-1].flags.failable;
		}
	},
	nativeSet : {
		transform: function() { return false; },
		take: function(apl, kb, way) {
			return this.callback(apl, kb);
		}.perform('nativeFunction->take'),
		isFailable: function() { return false; }
	}
};