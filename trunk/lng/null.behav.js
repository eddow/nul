/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
 
nul.behav = {
	freedom: {
		composed: function() {
			//TODO: stpUp non-dep0 premices (if allowed)
			var st = {};
			var delta = 0;
			
			/*Sorting :
			 * Locals values have to be contextualied before being given as contextualiation value
			 * There is NO circular references in locals 
			*/
			var i, slTbl=[];	//Sorted st : if i < j; st[slTbl[i]] doesn't depends on st[slTbl[j]]
			var tSrt = [];		//Unsorted array
			var nSrt = [];		//No need to sort array
			for(var i=0; i<this.components.length; ++i) {
				var v = this.components[i];
				if(!this.used[i+delta] || (v && 1==this.used[i+delta]) || 
					(v && !v.flags.fuzzy)) {
					this.components.splice(i,1);
					this.locals.splice(i,1);
					++delta; --i;
					st[i+delta] = v;
					if(v && v.deps[0] && !isEmpty(v.deps[0], [nul.lcl.slf])) tSrt.push(i+delta);
					else nSrt.push(i+delta);
				} else {
					if(0< delta) st[i+delta] = nul.build.local(-1, i, this.locals[i]);
					nSrt.push(i+delta);
				}
			}
			///// Sorting the locals table
			while(0< tSrt.length) {
				if(i >= tSrt.length) i = 0;
				if(trys(st[tSrt[i]].deps[0], function(i) { 
					return !slTbl.contains(i) && !nSrt.contains(i);
				})) ++i;
				else slTbl.push(tSrt.splice(i,1)[0]);
			}
			///// Now, contextualise the locals the sorted way
			for(i = 0; i<slTbl.length; ++i) st[slTbl[i]] = 
				st[slTbl[i]].contextualise(st) || st[slTbl[i]];
			if(0>= delta) return this.f_composed();
			//don't contextualise components[0..] (locals) again !
			//TODO: verify the locals were effectively changed by side-effect
			this.components.value =
				this.components.value.contextualise(st)||this.components.value;
			this.components.premices =
				this.components.premices.contextualise(st)||this.components.premices;
			return this.f_composed().summarised();
		}.perform('freedom->composed').xKeep(),
		integrity: function() {
			return this.locals.length == this.components.length &&
				(!this.f_integrity || this.f_integrity());
		},
		//This expression's locals are moved from (0..#) to (<n>..<n>+#)
		//this' locals are added to <kb>' last context 
		//ctxDelta-s are unchanged
		lclShft: function(kb) {
			return this.browse(
				nul.browse.lclShft('sft', kb
					.premiced(this.components.premices.components)
					.addLocals(this.components, this.locals))
			) || this;
		}.perform('freedom->lclShft').xKeep(),
		//This expression climbed.
		//this' locals are added to <kb>' last context 
		//ctxDelta-s of outer locals are decremented
		stpUp: function(kb) {
			return (this.browse(
				nul.browse.lclShft('sup', kb
					.premiced(this.components.premices.components)
					.addLocals(this.components, this.locals))
			) || this).components.value;
		}.perform('freedom->stpUp'),
		//Extract locals and says <this> we gonna give them to his parent
		//this' locals are added to <kb>' last context 
		//ctxDelta-s of these locals are incremented
		lclsUpg: function(kb) {
			return this.browse(
				nul.browse.lclShft('upg', kb
					.premiced(this.components.premices.components)
					.addLocals(this.components, this.locals))
			) || this;
		}.perform('freedom->lclsUpg').xKeep(),
		takeCtx: function(ctx) {
			this.locals = ctx.locals;
			ctx.lvals.premices = nul.build.and3(ctx.premices);
			ctx.lvals.value = this.components.value;
			return this.compose(ctx.lvals);
		},
		makeCtx: function() {
			return {
				lvals: this.components,
				locals: this.locals,
				premices: this.components.premices.components
			};
		},
		
		createLocal: function(value, name) {
			this.components.push(value);
			this.locals.push(name);
			this.summarised();
			return nul.build.local(0, ctx.length-1, name);
		},
		addLocals: function(lvals, locals) {
			this.components.pushs(lvals);
			this.locals.pushs(locals);
			this.summarised();
			return this.components.length-lvals.length;
		},
		premiced: function(premices) {
			this.components.premices.components.pushs(isArray(premices)?premices:[premices]);
			this.components.premices.summarised();
			return this;//.summarised();
		},
		freedomHTML: function() {
			var rv = this.components.value.toHTML();
			if(0<this.components.premices.components.length) rv =
				'<table class="xpr freedom"><tr><td class="freedom">' +
				rv +
				'</td></tr><tr><th class="freedom">'+
				this.components.premices.toHTML() +
				'</th></tr></table>';
			return rv;
		},
		freedomString: function() {
			var rv = this.components.value.toString();
			if(0<this.components.premices.components.length)
				rv += '; '+ this.components.premices.toString();
			return rv;
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
			return this.components.object.finalRoot() && (
				!this.components.object.selfRef() || this.components.applied.free());
		},
		operate: function(kb) {
			if(!this.components.object.take)
				throw nul.semanticException('Not a set : '+ this.components.object.toHTML());
			var rv = this.components.object.take(this.components.applied, kb, 1);
			if(rv) return rv.xadd(this);
		}.perform('application->operate').xKeep()
	},
	kwFreedom: {
	
	},
	set: {
		composed: function() {
		//TODO: composed : if can enumarate, just enumerate in a list
			return this;
		}.perform('set->composed').xKeep(),
		transform: function() {
			//TODO: set::transform : can if :- or ..[]:-[]..
			return true;
		},
		take: function(apl, kb, way) {
			return nul.unify.level(this.clone().stpUp(kb), apl, kb, way);
		}.perform('set->take'),
		extract: function() {
			//TODO: remember extraction and use it instead from now on
			var sltns = this.solve();
			return nul.build.atom(
				'Solved: '+sltns.solved.length+
				'\nFuzzies: '+sltns.fuzzy.length);
			/*TOREDO
			if(sltns.solved.length) {
				if(0<sltns.fuzzy.length)
					sltns.solved.follow = nul.build.set(nul.build.or3(sltns.fuzzy));
				return nul.build.list(sltns.sol.xadd(this)s.x);
			}
			if(sltns.fuzzy.length)
				return nul.build.set(nul.build.or3(sltns.fuz.xadd(this)s.x);
			return nul.build.s.xadd(this)s.x);
			*/
		}.perform('set->extract').xKeep(),
		//TODO: set failability
		isFailable: function() {
			return !isEmpty(this.deps);
		},
		/*failableSubs: function() {
			return [this];
		}.perform('set->failableSubs')*/
	},
	seAppend: {
		extract: function() {
			if(!this.components.effected.append)
				throw nul.semanticException('Expected appendable : ',
					this.components.effected.toString());
			return this.components.effected.append(this.components.appended);
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
			if(1==ncps.length) return ncps[0].xadd(this);
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
				.xadd(this);
		}.perform('biExpr->operate').xKeep()
	},
	list: {
		composed: function() {
			//a, b,.. c, d,.. e ==> a, b, c, d,.. e
			while(this.components.follow && ','== this.components.follow.charact) {
				var flw = nComps.follow;
				this.components.pushs(this.components.components);
				this.components.follow = this.components.components.follow;
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
				try{ rvf = this.components.follow.take(apl,kb,x); }
				catch(err) { if(nul.failure!= err) throw nul.exception.notice(err); }
			}
			if(!rvl && !rvf) nul.fail;
			if(!rvl ^ !rvf) return rvl || rvf;
			rvl = nul.build.or3([rvl,rvf]);
			return rvl?rv.xadd(x):rvl;			
		}.perform('list->take')
	},
	preceded: {
		operable: nul.xpr.subFixed,
		operate: function(kb)
		{
			return nul.build
				.atom(eval( this.charact + nul.asJs(this.components[0],this.charact) ))
				.xadd(this);
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
			if(v) return this.components[0].xadd(this);
			nul.fail('Assertion not provided');
		}.perform('assert->operate').xKeep(),
		composed: function() {
			/*switch(this.components[0].charact) {
				//TODO: passe dans le kb ? case '&&': return nul.build.and3(...);
				case '||': return nul.build.or3(...);
			}*/
			return this;
		}.perform('assert->composed').xKeep()
	},
	extraction: {
		operable: nul.xpr.subFixed,
		operate: function(kb)
		{
			return this.components[0].extraction();
		}.perform('extration->operate').xKeep(),
		extract: function() {}		//Must avoid sub-expr extraction
	},
	unification: {
		composed: function() {
			return this;	//TODO: wayed unifications go to keys: bien utile ? fait dans chewed
			//TODO: wayed, fixed and keyless ... becomes simple unification (way=0) ?
		},
		operate: function(kb)
		{
			if(2== this.components.length) {
				var rv = nul.unify.chewed(
					this.components[0], this.components[1], kb, this.way);
				return rv?rv.xadd(this):rv;
			}
			if(nul.debug.assert) assert(0== this.way, 'No tree-some with directed unifications')
			var fl = this.components.length;
			var rv = nul.unify.multiple(this.components, kb, this.x)
			if(rv) switch(rv.length) {
				case 1: return rv[0].xadd(this);
				case fl: return;
				default: return this.compose(rv);
			}
		}.perform('unification->operate').xKeep()
	},
	and3: {
		composed: function()
		{
			this.components = this.failables();
			return this.summarised();
		}.perform('and3->composed').xKeep(),
	},
	or3: {
		subOperationManagement: true,
		operate: function(kb)
		{
			var rv = kb.trys(
				'OR3', this.components, this.x,
				function(c, kb) { return c.browse(nul.browse.evaluate(kb)); });
			return isArray(rv)?this.compose(rv):rv;
		}.perform('or3->operate').xKeep(),
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
			return isArray(rv)?this.compose(rv):rv;
		}.perform('xor3->operate').xKeep(),
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