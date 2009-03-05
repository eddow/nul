/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

function lclCntx(knwldg) {
	/*Sorting :
	 * Locals values have to be contextualised before being given as contextualiation value
	 * There is NO circular references in locals 
	*/
	var st = knwldg[0];
	var i, slTbl=[];	//Sorted st : if i < j; st[slTbl[i]] doesn't depends on st[slTbl[j]]
	var tSrt = [];		//Unsorted array
	var nSrt = [];		//No need to sort array
	for(i in st) {
		i = reTyped(i);
		if(
		st[i] && st[i].deps && st[i].deps[-1] &&
		!isEmpty(st[i].deps[-1], [nul.lcl.slf]) &&
		!st[i].reindexing)
			tSrt.push(i);
		else {
			nSrt.push(i);
			if(st[i] && st[i].reindexing) delete st[i].reindexing;
		}
	}
	///// Sorting the locals table
	while(0< tSrt.length) {
		if(i >= tSrt.length) i = 0;
		if(trys(st[tSrt[i]].deps[-1], function(i) { 
			return !slTbl.contains(i) && !nSrt.contains(i);
		})) ++i;
		else slTbl.push(tSrt.splice(i,1)[0]);
	}
	///// Now, contextualise the locals the sorted way
	for(i = 0; i<slTbl.length; ++i) {
		var v = st[slTbl[i]].localise().contextualise(knwldg, 'sub');
		if(v) st[slTbl[i]] = v.localise();
	}	
}
 
nul.behav = {
	freedom: {
		finalise: function(kb) {
			var lPrem = 0;
			var tof = [{s:this.components,n:'value'}], fnd = [], cs = this.components;
			if(this.finalisationValues) tof.pushs(this.finalisationValues(kb));
			var cpt = 50;
			this.f_composed();
			while(0< tof.length) {
				var ndx = tof.shift();
				var c = ndx.s[ndx.n];
				if(c) {
					c = c.integre().known(kb) || c;
					if(c.flags.dirty) {
						tof.pushs(fnd); fnd = [];
						do {
							c = c.evaluate(kb) || c;
							if(0>=--cpt) throw nul.internalException('Too much finalisation');
						} while(c.flags.dirty)
					}
					ndx.s[ndx.n] = c;
				}
				fnd.push(ndx);
				for(; lPrem<this.components.length; ++lPrem) tof.push({s:this.components,n:lPrem});
			}
			return this;
		}.perform('freedom->finalise').xKeep(),
		composed: function() {
			//TODO: stpUp non-dep0 premices (if allowed)
			var nc = this.components.splice(0);
			while(0<nc.length) this.components.pushs(nc.shift().failables());
			return this.f_composed().summarised();			
		}.perform('freedom->composed').xKeep(),
		//This expression's locals are moved from (0..#) to (<n>..<n>+#)
		//this' locals are added to <kb>' last context 
		//ctxDelta-s are unchanged
		lclShft: function(kb) {
			return this.browse(
				nul.browse.lclShft('sft', kb
					.premiced(this.components)
					.addLocals(this.locals))
			) || this;
		}.perform('freedom->lclShft').xKeep(),
		//This expression climbed.
		//this' locals are added to <kb>' last context 
		//ctxDelta-s of outer locals are decremented
		stpUp: function(kb) {
			return (this.browse(
				nul.browse.lclShft('sup', kb
					.premiced(this.components)
					.addLocals(this.locals))
			) || this).components.value;
		}.perform('freedom->stpUp'),
		//Extract locals and says <this> we gonna give them to his parent
		//this' locals are added to <kb>' last context 
		//ctxDelta-s of these locals are incremented
		lclsUpg: function(kb) {
			return this.browse(
				nul.browse.lclShft('upg', kb
					.premiced(this.components)
					.addLocals(this.locals))
			) || this;
		}.perform('freedom->lclsUpg').xKeep(),
		freedomHTML: function() {
			var rv = this.components.value?this.components.value.toHTML():
				'<span class="failure">?</span>';
			if(0<this.components.length) rv =
				'<table class="xpr freedom"><tr><td class="freedom">' +
				rv +
				'</td></tr><tr><th class="freedom">' +
				nul.text.expressionHTML(';', this.components) +
				'</th></tr></table>';
			return rv;
		},
		freedomString: function() {
			var rv = this.components.value?this.components.value.toString():'(?)';
			if(0<this.components.length)
				rv += '; '+ nul.text.expressionString(';', this.components);
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
			return this.components.object.finalRoot() && (
				!this.components.object.selfRef() || this.components.applied.free());
		},
		operate: function(kb) {
			if(!this.components.object.take)
				throw nul.semanticException('Not a set : '+ this.components.object.toHTML());
			var rv = this.components.object.take(this.components.applied, kb, 1);
			if(rv) return rv.xadd(this);
			if(!this.components.object.transform()) {
				kb.premiced(this.clean().clone());
				return this.components.applied;
			}
		}.perform('application->operate').xKeep()
	},
	kwFreedom: {
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
			return this;
		},
		makeFrdm: function(kb) {
			for(var i=0; i<this.components.length; ++i) this.components[i].dirty();
			return {
				origXpr: this,
				origHTML: this.dbgHTML(),

				premices: this.components,
	
				addLocals: function(locals) {
					return kb.protectedKb.addLocals(locals);
				},
				premiced: function(premices) {
					this.premices.pushs(isArray(premices)?premices:[premices]);
					return this;
				}
			};
		},
		takeFrdm: function(knwldg) {
			if(nul.debug.assert) assert(this.components === knwldg[0].premices, 'Expression kept ctx');
			var ck = [];
			var lclPrmcs = [];
			while(0<knwldg.length) {
				var cl = knwldg.pop();
				var st = {};
				//We need a map and not an array for lclCntx
				for(var i=0; i<cl.lvals.length; ++i) st[i] = cl.lvals[i];
				ck.unshift(st);
				lclCntx(ck);
				for(var i=0; i<cl.locals.length; ++i) if(st[i]) lclPrmcs.unshift(
					nul.build.unification([
						nul.build.local(knwldg.length, i, cl.locals[i]),
						st[i].localise()
					]).clean());
			}
			var rv = this.contextualise(ck,'sub') || this;
			rv.components.pushs(lclPrmcs);
			return rv.composed();
		}
	},
	set: {
		finalisationValues: function(kb) {
			var ctx = kb.knowledge[0];
			var rv = [];
			for(var i=0; i<ctx.locals.length; ++i) rv.push({s:ctx.lvals, n:i});
			return rv;
		},
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
		fail: function() {
			return nul.build.set();
		},
		extract: function() {
			//TODO: remember extraction and use it instead from now on
			var sltns = this.solve();
			return nul.build.atom(
				'Solved: '+sltns.solved.length+
				'\nFuzzies: '+sltns.fuzzy.length);
			/*TOREDO
			if(sltns.solved.length) {
				if(0<sltns.fuzzy.length)
					sltns.solved.follow = nul.build.set(nul.build.ior3(sltns.fuzzy));
				return nul.build.list(sltns.sol.xadd(this)s.x);
			}
			if(sltns.fuzzy.length)
				return nul.build.set(nul.build.ior3(sltns.fuz.xadd(this)s.x);
			return nul.build.s.xadd(this)s.x);
			*/
		}.perform('set->extract').xKeep(),
		isFailable: function() {
			return false;
		},
		makeFrdm: function() {
			for(var i=0; i<this.components.length; ++i) this.components[i].dirty();
			return {
				origXpr: this,
				origHTML: this.dbgHTML(),

				lvals: [],
				locals: this.locals,
				premices: this.components,
	
				addLocals: function(locals) {
					this.locals.pushs(isArray(locals)?locals:[locals]);
					return this.locals.length-locals.length;
				},
				premiced: function(premices) {
					this.premices.pushs(isArray(premices)?premices:[premices]);
					return this;
				}
			};
		},
		takeFrdm: function(ctx) {
			if(nul.debug.assert) assert(this.components === ctx.premices, 'Expression kept ctx');
			this.locals = ctx.locals;
			this.summarised(); //To have the 'used' table filled 
			var st = {};
			var delta = 0;
			
			for(var i=0; i<ctx.locals.length; ++i) {
				var v = ctx.lvals[i];
				//TODO:Les auto-refs ne se remplacent pas
				//TODO: si utilisé une fois et sans valeur : remplacer par un joker ?
				if(!this.used[i+delta] || (v && 1==this.used[i+delta]) || 
					(v && !v.flags.fuzzy)) {
					ctx.lvals.splice(i,1);
					ctx.locals.splice(i,1);
					++delta; --i;
					st[i+delta] = v;
				} else if(0< delta) {
					st[i+delta] = nul.build.local(-1, i, ctx.locals[i]);
					st[i+delta].reindexing = true;
				}
			}
			if(0>= delta) return this.composed();
			lclCntx([st]);
			this.contextualise(st);
			
			for(var i=0; i<ctx.lvals.length; ++i) if(ctx.lvals[i]) this.components.unshift(
				nul.build.unification(
					[nul.build.local(0, i, this.locals[i]),
					ctx.lvals[i].localise()
				]).clean());
			return this.composed();
		}.perform('set->takeCtx').xKeep()
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
				try{ rvf = this.components.follow.take(apl,kb,x); }
				catch(err) { if(nul.failure!= err) throw nul.exception.notice(err); }
			}
			if(!rvl && !rvf) nul.fail;
			if(!rvl ^ !rvf) return rvl || rvf;
			rvl = nul.build.ior3([rvl,rvf]);
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
				case '||': return nul.build.ior3(...);
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
			var fl = this.components.length;
			var rv = nul.unify.multiple(this.components, kb, this.way)
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
	kwFreedomHolder: {
		operate: function(kb) {
			var i=0, l = this.components.length;
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
				case 1:
					if('kw'== this.components[0].charact)
						kb.premiced(this.components[0].components);
					return this.components[0];
				case l: return;
				default: return this;
			}
		}.perform('kwFreedomHolder->operate').xKeep(),
	},
	ior3: {
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