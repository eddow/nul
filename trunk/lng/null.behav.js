/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
 
nul.behav = {
	html_place: {
		take: function() {},
		extract: function() {
			return nul.build(this.x).list(nul.html(this.element.innerHTML));
		},
		append: function(itm) {
			if(itm.toXML) {
				this.element.innerHTML += itm.toXML();
				return itm.components.parms;
			}
			if(itm.value) {
				this.element.innerHTML += itm.value;
				return nul.build(this.x).atom('#text');
			}
			throw nul.semanticException('XML element expected for appending');
		}		
	},
	application: {
		operable: function() {
			return this.components.object.finalRoot() && (
				!this.components.object.selfRef() || this.components.applied.free());
		},
		operate: function(kb) {
			if(!this.components.object.take)
				throw nul.semanticException('Not a set : '+ this.components.object.toHTML());
			var rv = this.components.object.take(this.components.applied, kb, this.x);
			if(!rv) return rv;
			if(rv.deps[0] && rv.deps[0][nul.lcl.rcr])	//TODO: optimise :)
				rv = rv.rDevelop(this.components.object, 0, nul.lcl.rcr).dirty();
			return rv;
		}.describe(function(kb) {
			return ''+
				'Applying '+this.components.applied.toHTML()+
				' to '+this.components.object.toHTML();
		}).perform('application->operate'),
		composed: function() {
			if(';'== this.components.applied) {
				var apl = this.components.applied;
				this.components.applied = apl.components[0];
				apl.components[0] = this.composed();
				return apl.composed();
			}
			return this;
		}.perform('application->composed')
	},
	set: {
		//TODO: if can enumarate, just enumerate in a list
		take: function(apl, kb, x) {
			var rcr = nul.build().local(1, nul.lcl.rcr);
			var unf = this.components[0].clone();
			var tx = this.x;
			//TODO: remplacer rcr AVANT unification ?
			var rv = kb.knowing([this, apl], function(kb) {
				var rv = nul.unify.sub1(unf, apl, kb);
				return (rv.rDevelop(rcr, 1) || rv).xadd(tx).clean();
			}).stpUp(x, kb).clean();
			if(':-'!= rv.charact || ':-'== apl.charact) return rv;
			return rv.components.value.xadd(x);
		}.perform('set->take'),
		extract: function() {
			//TODO: remember extraction and use it instead from now on
			var sltns = this.components[0].solve();
			return nul.build(this.x).atom(
				'Solved: '+sltns.solved.length+
				'\nFuzzies: '+sltns.fuzzy.length);
			if(sltns.solved.length) {
				if(0<sltns.fuzzy.length)
					sltns.solved.follow = nul.build().set(nul.build().or3(sltns.fuzzy));
				return nul.build(this.x).list(sltns.solved);
			}
			if(sltns.fuzzy.length)
				return nul.build(this.x).set(nul.build().or3(sltns.fuzzy));
			return nul.build(this.x).set();
		}.perform('set->extract'),
		makeCtx: function() { return this.components; },
		takeCtx: function(ctx) {
			ctx[nul.lcl.slf] = this.components[nul.lcl.slf];
			return this.compose(ctx);
		},
		subResolve: function() {
			var smplfctnTbl = {};
			var delta = 0;
			for(var i=0; i<this.components.length; ++i) {
				var c = this.components[i];
				if('{}'== c.charact && !c.components[nul.lcl.slf].fuzzy) {
					smplfctnTbl[i+delta] = c.components[nul.lcl.slf];
					this.components.splice(i,1);
					++delta; --i;
				} else if(0 < delta)
					smplfctnTbl[i+delta] = nul.build().local(0, i, c.kasName);
			}
			return this.contextualize(smplfctnTbl) || this;
		}
	},
	seAppend: {
		extract: function() {
			if(!this.components.effected.append)
				throw nul.semanticException('Expected appendable : ',
					this.components.effected.toString());
			return this.components.effected.append(this.components.appended);
		}			
	},
	lambda: {
		composed: function() {
			//(a :- b) :- c ===> a :- (b = c)
			if(':-'== this.components.parms.charact) {
				var flmbd = components.parms.stpUp(this.x);
				var eq = nul.build()	//TODO:use nul.unify instead?
					.unification([components.parms.components.value, nComps.value]);
				nComps = {parms: components.parms.components.parms, value: eq};
			}
			return this;
		}.perform('lambda->composed')
	},
	cumulExpr: {
		//operable: nul.xpr.subFixed,
		operate: function(kb)
		{
			var cps = clone1(this.components), ncps = [], o;
			while(o || 0< cps.length) {
				var c = o || cps.pop();
				var cx = c.x;
				if(c.fixed()) {
					c = nul.asJs(c, this.charact);
					o = cps.pop();
					while(o && o.fixed()) {
						cx.xadd(o.x, kb);
						o = nul.asJs(o, this.charact);
						c = eval( ''+nul.jsVal(o) + this.charact + nul.jsVal(c) );
						o = cps.pop();
					}
					c = nul.build(cx).atom(c);
				} else o = null;
				ncps.unshift(c);
			}
			if(1==ncps.length) return ncps[0].stpUp(this.x, kb);
			if(ncps.length != this.components.length)
				return nul.build(this.x, kb).cumulExpr(this.charact, ncps).clean();
		}.perform('cumulExpr->operate')
	},
	biExpr: {
		operable: nul.xpr.subFixed,
		operate: function(kb)
		{
			return nul.build(this.x, kb).atom(eval('' +
				nul.asJs(this.components[0], this.charact) +
				this.charact +
				nul.asJs(this.components[1], this.charact) ));
		}.perform('biExpr->operate')
	},
	list: {
		composed: function() {
			//a, b,.. c, d,.. e ==> a, b, c, d,.. e
			while(this.components.follow && ','== this.components.follow.charact) {
				var flw = nComps.follow;
				this.components = this.components.concat(this.components.components);
				this.components.follow = this.components.components.follow;
			}
			if(
					this.components.follow &&
					'{}'== this.components.follow.charact &&
					!this.components.follow.components)
				delete this.components.follow;
			if(0== this.components.length)
				return this.components.follow || nul.build().set();
			return this;
		}.perform('list->composed'),
		take: function(apl, kb, x) {
			var cs = this.components;
			var rv = kb.knowing([this, apl], function(kb) {
				var rvl, rvf;
				try{ rvl = nul.unify.orDist(cs, x, apl, kb); }
				catch(err) { if(nul.failure!= err) throw nul.exception.notice(err); }
				if(cs.follow) {
					try{ rvf = cs.follow.take(apl,kb,x); }
					catch(err) { if(nul.failure!= err) throw nul.exception.notice(err); }
				}
				if(!rvl && !rvf) nul.fail;
				if(!rvl ^ !rvf) return rvl || rvf;
				return nul.build(apl.x, kb).or3([rvl,rvf]);
			});
			return rv?rv.xadd(x):rv;	//TODO: vérifier que les <x> doivent bien être repassés			
		}.perform('list->take')
				
	},
	preceded: {
		operable: nul.xpr.subFixed,
		operate: function(kb)
		{
			return nul.build(this.x, kb)
				.atom(eval( this.charact + nul.asJs(this.components[0],this.charact) ))
		}.perform('preceded->operate')
	},
	assert: {
		operable: nul.xpr.subFixed,
		operate: function(kb)
		{
			var v = nul.asJs(this.components[0],'?');
			if('boolean'!= typeof v)
				throw nul.semanticException('Boolean expected instead of ' +
					this.components[0].toString());
			if(v) return this.components[0];
			nul.fail('Assertion not provided');
		}.perform('assert->operate'),
		composed: function() {
			switch(this.components[0].charact) {
				case '&&': return nul.build(this.x).and3(this.components.components);
				case '||': return nul.build(this.x).or3(this.components.components);
			}
			return this;
		}.perform('assert->composed'),
	},
	extraction: {
		operable: nul.xpr.subFixed,
		operate: function(kb)
		{
			var rv = this.components[0].extraction();
			if(rv) return rv.stpUp(this.x, kb).dirty();
		}.perform('extration->operate'),
		extract: function() {}		//Must avoid sub-expr extraction
	},
	unification: {
		operate: function(kb)
		{
			var rv = nul.unify.multiple(this.components, kb, this.x)
			if(rv) switch(rv.length) {
				case 1: return rv[0].stpUp(this.x, kb);
				default: return this.compose(rv);
			}
		}.perform('unification->operate')
	},
	and3: {
		operate: function(kb) {
			if(1== this.components.length) return this.components[0];
		},
		composed: function()
		{
			var ol = this.components.length, i;
			for(i=1; i<this.components.length;)
				if(this.components[i].flags.failable) ++i;
				else this.components.splice(i,1);
			return this;
		}.perform('and3->composed'),
		premiced: function(prms) {
			return this.compose(this.components.concat(prms));
		},
	},
	or3: {
		subOperationManagement: true,
		operate: function(kb)
		{
			var rv = kb.trys(
				'OR3', this.components, this.x,
				function(c, kb) { return c.browse(nul.browse.evaluate(kb)); });
			if(rv && isArray(rv)) return nul.build(this.x).or3(rv).clean();
			return rv;
		}.perform('or3->operate'),
		isFailable: function() {
			for(var i=0; i<this.components.length; ++i)
				if(!this.components[i].flags.failable) return false;
			return true;
		}
	},
	xor3: {
		subOperationManagement: true,
		operate: function(kb)
		{
			var rv = kb.trys(
				'XOR3', this.components, this.x,
				function(c, kb) { return c.browse(nul.browse.evaluate(kb)); },
				function(cs, kbs) {
					for(var i=0; i<cs.length-1; ++i) {
						var d=0;
						while(d<kbs[i].length && 0>=kbs[i][d].length) ++d;
						if(!cs[i].flags.failable && d>=kbs[i].length) return cs.splice(0,i+1);
					}
				});
			if(rv && isArray(rv)) rv = this.compose(rv);
			return rv;
		}.perform('xor3->operate'),
		isFailable: function() {
			return this.components[this.components.length-1].flags.failable;
		}
	},
	nativeFunction : {
		take: function(apl, kb, x) {
			var tnf = this;
			var rv = kb.knowing([this, apl], function(kb) {
				var prm, val;
				if(':-'== apl.charact) {
					prm = apl.components.parms;
					val = apl.components.value;
				} else prm = apl;
				var rv = tnf.callback(prm, kb);
				if(!rv) return;
				rv.xadd(tnf.x);
				return val?
					nul.build().lambda(prm, nul.unify.level(val,rv, kb))
					:rv;
			});
			if(rv) return rv.xadd(x);
		}.perform('nativeFunction->take')
	}
};