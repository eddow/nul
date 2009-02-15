/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
 
function isToBrowse(behav, cb, ctxd)
{
	if('undefined'!= typeof cb) return ('function'== typeof cb) ? cb(ctxd) : !!cb;
	return ('undefined'== typeof behav.browse) || (
		'function'== typeof behav.browse ?
			behav.browse(ctxd) :
			!!behav.browse );
}
nul.ctxd = {
	/*
	browse behaviour defines:
	- browse
	- browseAttributes(ctxd) : not to browse attributes
	- browseComponents(ctxd) : not to browse components
	- before(ctxd) : returns nothing to remain unchanged or something as new value to browse
	- newComponent(ctxd, oldComp, newComp) : A new component is produced (oldComp can be == newComp)
	- newAttribute(ctxd, name, oldAttr, newAttr) : A new attribute is produced (oldAttr can be == newAttr)
	- finish(ctxd, chgd) : returns the final value
	- abort(ctxd, chgd) : returns nothing. Called instead of 'finish' when a problem occured
	- atom(ctxd) : acts on a ctxd.value
	- local(ctxd) : acts on a ctxd.local
	*/
	noBrowse: 'stopBrowsingPlease',
	itf: {	//Main interface implemented by all ctxd
		browse: function(behav) {
			var assertKbLen, assertLc;
			if(nul.debug.assert && behav.kb) {
				assertKbLen = behav.kb.knowledge.length; assertLc = nul.debug.lc; } 

			var ctxd = this;
			try {
				try {
					if(behav.before) ctxd = behav.before(ctxd)||ctxd;
					var chg = false;
					var cps;
					if(isToBrowse(behav, behav.browseComponents, ctxd))
						cps = map(ctxd.components, function(o) {
							var co = o.browse(behav);
							chg |= !!co;
							co = co||o;
							if(behav.newComponent) co = behav.newComponent(ctxd, o, co) || co;
							return co;
						});
					var ats;
					if(isToBrowse(behav, behav.browseAttributes, ctxd))
						ats = map(ctxd.attributes, function(o, ky) {
							var co = o.browse(behav);
							chg |= !!co;
							co = co||o;
							if(behav.newAttribute) co = behav.newAttribute(ctxd, ky, o, co) || co;
							return co;
						});
					ctxd = chg?ctxd.clone(cps, ats):ctxd;
					chg = ctxd!==this;
				} catch(err) {
					if(behav.abort) behav.abort(ctxd, chg);
					if(nul.ctxd.noBrowse== err) return;
					throw err;
				}
				if(behav.finish) ctxd = behav.finish(ctxd, chg);
			} finally { if(nul.debug.assert && behav.kb)
				assert(assertKbLen== behav.kb.knowledge.length,
					'Knowledge enter/leave paired while browsing ['+assertLc+']'); }

			if(ctxd && ctxd!= this) return ctxd;
		},
		//Gets the value of this expression after operations effect (unifications, '+',  ...)
		evaluate: function(kb) {
			var x = kb?this:(this.contextualize(nul.globals, 1) || this);
			return x.browse(nul.eval.evaluate(kb||nul.kb())) || x;
		},
		//Replace this context's locals according to association/table <ctx>
		contextualize: function(ctx, dlt) {
			if(!dlt) dlt=0;
			if(this.deps[dlt]) for(var d in this.deps[dlt]) if(ctx[d])
			return this.browse(nul.ctxd.contextualize([ctx], dlt));
		},
		known: function(knwldg, dlt) {
			if(!dlt) dlt=0;
			//TODO: verify intersection between kb and this.deps
			return this.browse(nul.ctxd.contextualize(knwldg, dlt));
		},
		//Take the side-effected value of this expression
		extraction: function() {
			return this.browse(nul.ctxd.extraction) || this.cloneUnsure();
		},
		
		brws_lclShft: function(lcls, act) {
			seConcat(lcls, this.locals);
			var rv = this.browse(nul.ctxd.lclShft(lcls.length-this.locals.length, act));
			if(!rv) return this;
			return rv.ctxd(true);
		},
		//When this expression's locals are moved from (0..#) to (<n>..<n>+#)
		//<lcls> was the added locals and becomes the whole ones.
		//ctxDeltas are unchanged
		lclShft: function(lcls) {
			if(0== this.locals.length) {
				this.locals = lcls;
				return this;
			}
			if(0== lcls.length) return this;
			return this.brws_lclShft(lcls,'sft').withLocals(lcls);
		},
		//This expression wrapped. Locals are given to parent.
		//<lcls> is the new parent's already locals and becomes new parent's whole locals
		//ctxDeltas of these locals and outer locals are incremented
		stpDn: function(lcls) {	//Note: never used .... debug me !
			return this.brws_lclShft(lcls,'sdn').withoutLocals();
		},
		//This expression wrapped. Locals are unchanged.
		//<lcls> is the new parent's already locals and becomes new parent's whole locals
		//ctxDeltas of outer locals are incremented
		wrap: function(kb) {
			return this.brws_lclShft([],'wrp').numerise(nul.debug.levels?this.locals.lvl+1:null);
		},
		//This expression climbed.
		//<lcls> is the old parent's locals and becomes common locals.
		//ctxDeltas of outer locals are decremented
		//<kb> last context knows <lcls>
		stpUp: function(lcls, kb) {
			//this.locals are the unknown of kb[-1]
			if(nul.debug.levels && kb) assert(this.locals.lvl == kb.knowledge.length, 'StepUp predicate');
			return this.brws_lclShft(lcls,'sup').withLocals(lcls);
		},
		//Extract locals and says <this> we gonna give them to his parent
		//<lcls> are the destination parent's locals
		//ctxDeltas are unchanged
		lclsUpg: function(lcls, kb) {	//TODO: debug me !
			if(nul.debug.levels && kb) assert(this.locals.lvl == kb.knowledge.length, 'LocalsUpgrade predicate');
			if(0>= this.locals.length) return this;
			return this.brws_lclShft(lcls,'upg').withoutLocals();
		},
		//Insert locals from his parent
		//<lcls> are the emptied source parent's locals
		//ctxDeltas are unchanged
		//<lcls> refer to the last known context
		lclsDng: function(lcls, kb) {	//TODO: never used .... debug me !
			if(0>= lcls.length) return this;
			var _lcls = clone1(lcls);
			seEmpty(lcls);
			return this.brws_lclShft(_lcls,'dng').withLocals(_lcls);
		},
		
		//Transform an expression from kb local-space to expression local-space and vice versa
		localise: function(inc) {
			return (this.browse(nul.ctxd.localise(inc||0)) || this.clone()).ctxd(true);
		},

		numerise: function(prnt) {
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
			if(nul.debug.levels) return this.browse(nul.ctxd.numerise(prnt, lvl)) || this;
			return this;
		},
		rDevelop: function(v, inc, lcl) {
			var ctx = [];
			ctx[lcl || nul.lcl.slf] = v.localise();
			return this.contextualize(ctx, inc);
		},
		//Shortcut: Weither this epression is free of dependance toward external locals
		free: function(beside) { return nul.lcl.dep.free(this.deps, beside); },
		//Shortcut: Is evaluable ?
		evaluable: function() { return this.evaluation &&
			(!this.evaluation.evaluable || this.evaluation.evaluable(this)); },
		//Shortcut: Clean !
		clean: function() { delete this.flags.dirty; return this; },
		
		clone: function(nComps, nAttrs) {
			var rv = {};
			for(var i in this) rv[i] = clone1(this[i]);
			return rv.modify(nComps, nAttrs);
		},
		cloneUnsure: function(nComps, nAttrs) { return this.clone(nComps, nAttrs); },
		//TOMAINTAIN
		//If 'truc.cloneUnsure' is called, try to replace it with 'truc.modify'.
		// If it cannot work (please, WELL TESTED), let 'truc.clone' instead.
		// If not, replace 'modify' call if possible
		modify: function(nComps, nAttrs) {
			if(nComps) {
				if([';','[]',':','=','&','|','^','+','*','&&','||'].contains(this.charact)) {
					var nc = [];
					while(0<nComps.length) {
						var tc = nComps.pop();
						if(nul.actx.isC(tc, this.charact)) {
							tc = tc.stpUp(this.locals);
							nComps = nComps.concat(tc.components);
						} else nc.unshift(tc);
					}
					nComps = nc;
				} else if(':-'==this.charact) {
					//Doit donner 1 :- (x = 2)
					if(nul.actx.isC(nComps.parms,':-')) {
						var flmbd = nComps.parms.stpUp(this.locals);
						//TODO: use a KB to nul.unify.level() when flattening :- ?
						var eq = nul.actx.unification([flmbd.components.value, nComps.value])
							.ctxd().wrap();
						nComps = {parms: flmbd.components.parms, value: eq};
					}
				}
				this.components = map(nComps,nul.ctxd.parentise(this));
			}
			return this.attributed(nAttrs);
		},
		attributed: function(nAttrs) {
			if(nAttrs) this.attributes = map(nAttrs,nul.ctxd.parentise(this));
			return this;
		},
		addAttr: function(kb) {
			var attr = clone1(this.attributes);
			for(var i=1; i<arguments.length; ++i)
				for(an in arguments[i].attributes) {
					if(!attr[an]) attr[an] = arguments[i].attributes[an];
					else attr[an] = nul.unify.level(
						attr[an],
						arguments[i].attributes[an], kb);
				}
			return this.clone().attributed(attr).ctxd(true);
		},
		
		withLocals: function(lcls) {
			var rv = this;
			if(nul.debug.levels && (lcls.prnt || 'undefined'!= typeof lcls.lvl))
				rv = rv.numerise(lcls.prnt || lcls.lvl);
			rv.locals = clone1(lcls);
			return rv;
		},
		withoutLocals: function() {
			var lcls = [], rv = this.clone();
			map(rv.locals, function(v, i) { if('number'!= typeof i) lcls[i] = v; });
			rv.locals = lcls;
			return rv;
		},
	},
	std: function(actx) {	//TODO: différencier l'ajout d'interface et la computation des depx/flags
		for(var i in nul.ctxd.itf) if(!actx[i]) actx[i] = nul.ctxd.itf[i];
		
		var dps = [actx.deps];
		if(!actx.flags) actx.flags = {};
		map(actx.attributes, function(o) {
			o.ctxd();
			dps.push(nul.lcl.dep.stdDec(o.deps));
			if(o.flags.dirty) actx.flags.dirty = true;
		});
		actx.deps = nul.lcl.dep.mix(dps);
		return actx.modify(actx.components, actx.attributes);
	},

	parentise: function(prnt) {
		return function(c) {
			return c.numerise(prnt);
		};
	},

	stdRecurs: function(actx) {
		actx.deps = nul.lcl.dep.empty;
		var dps = [actx.deps];
		actx.flags = {};
		if(actx.components) map(actx.components, function(o) {
			o.ctxd();
			dps.push(nul.lcl.dep.stdDec(o.deps));
			for(var f in o.flags) actx.flags[f] = true;
		});

		if(['=','?','[-]'].contains(actx.charact)) actx.flags.failable = true;
		else if(actx.isFailable) actx.flags.failable = actx.isFailable();
		if(['<<='].contains(actx.charact)) actx.flags.extractible = true;
		
		actx.deps = nul.lcl.dep.mix(dps);
		var rmningLcls = clone1(actx.locals);
		for(var i=0; i<rmningLcls.length; ++i) rmningLcls[i] =  undefined;
		if(actx.deps[0]) for(var i in actx.deps[0]) rmningLcls[i] = actx.locals[i];
		actx.locals = rmningLcls;
		nul.ctxd.std(actx);
		if(actx.evaluable()) actx.flags.dirty = true;
	},
	flatBrowse: function(behav, ctxd, cbn) {
		var assertKbLen, assertLc;
		if(nul.debug.assert && behav.kb) {
			assertKbLen = behav.kb.knowledge.length; assertLc = nul.debug.lc; } 
		var chg = false;
		var orig = ctxd;
		try {
			try {
				if(behav.before) ctxd = behav.before(ctxd) || ctxd;
				if(isToBrowse(behav, behav.browseAttributes, ctxd))
					ats = map(ctxd.attributes, function(o) {
						var co = o.browse(behav);
						chg |= !!co;
						return co||o;
					});
				if(chg) ctxd = ctxd.cloneUnsure(null,ats).ctxd(true);
				if(behav[cbn]) ctxd = behav[cbn](ctxd) || ctxd;
				chg = ctxd!==orig;
			} catch(err) {
				if(behav.abort) behav.abort(ctxd, chg);
				if(nul.ctxd.noBrowse== err) return;
				throw err;
			}
			if(behav.finish) ctxd = behav.finish(ctxd, chg);
		} finally { if(nul.debug.assert && behav.kb)
			assert(assertKbLen== behav.kb.knowledge.length,
				'Knowledge enter/leave paired while browsing ['+assertLc+']'); }
		
		if(orig!= ctxd) return ctxd;
	},
	contextualize: function(knwldg, dlt) {
		return {
			ctxDelta: (dlt||0)-1,
			knwldg: knwldg,
			before: function(ctxd) {
				++this.ctxDelta;
				if(1<this.knwldg.length) return;	//TODO: calculate intersection
				if(ctxd.deps[this.ctxDelta]) for(var d in ctxd.deps[this.ctxDelta])
					if(this.knwldg[0][d]) return;
				throw nul.ctxd.noBrowse;
			},
			abort: function() { --this.ctxDelta; },
			finish: function(ctxd, chgd) {
				--this.ctxDelta;
				if(chgd) return ctxd.ctxd(true);
			},
			local: function(ctxd) {
				var ctxNdx = ctxd.ctxDelta-this.ctxDelta;
				if( 0<= ctxNdx && ctxNdx<this.knwldg.length && 
					this.knwldg[ctxNdx][ctxd.lindx] &&
						(nul.lcl.slf!= ctxd.lindx || 0== ctxNdx)) {
					var rv = this
						.knwldg[ctxNdx][ctxd.lindx]
						.localise(ctxd.ctxDelta-(dlt||0))
						.numerise(ctxd.locals.prnt);
					if(!rv.dbgName) rv.dbgName = ctxd.dbgName;
					return rv;
				}
			}
		};
	},

	extraction: {
		browse: function(ctxd) {
			return !ctxd.extract;
		},
		finish: function(ctxd, chgd) {
			if(ctxd.extract) return ctxd.extract();
			if(chgd) return ctxd;
		}
	},
	lclShft: function(n, act) {
		return {
			ctxDelta: -1,
			alc: n,
			before: function() { ++this.ctxDelta; },
			finish: function(ctxd, chgd) {
				--this.ctxDelta;
				if(chgd) return ctxd.ctxd(true);
			},
			local: function(ctxd) {
				var rv = ctxd.clone();
				if('dng'== act && rv.ctxDelta==this.ctxDelta+1) --rv.ctxDelta;
				else if('wrp'!= act && rv.ctxDelta==this.ctxDelta) {
					if(nul.lcl.slf=== rv.lindx && inOr(act, 'upg', 'dng'))
						throw nul.internalException("Trying to move 'self' local !");
					if(nul.lcl.slf!= rv.lindx) {
						if('number'== typeof rv.lindx) rv.lindx += this.alc;
						if(inOr(act, 'upg', 'sdn')) ++rv.ctxDelta;
					}
				} else if('sup'== act && rv.ctxDelta>this.ctxDelta) --rv.ctxDelta;
				else if(inOr(act, 'sdn', 'wrp') && rv.ctxDelta>this.ctxDelta) ++rv.ctxDelta;
				else return;
				return rv.ctxd(true);
			}
		};
	},
	localise: function(inc) {
		return {
			inc: inc,
			ctxDelta: -1,
			before: function() { ++this.ctxDelta; },
			finish: function(ctxd, chgd) {
				--this.ctxDelta;
				if(chgd) return ctxd.ctxd(true);
			},
			local: function(ctxd) {
				var rv = ctxd.clone();
				var rDelta = this.ctxDelta + this.inc;
				//From kb local-space to expression local-space 
				if(0>rv.ctxDelta) rv.ctxDelta = rDelta-1-rv.ctxDelta;
				//The same in any local-space 
				else if(this.ctxDelta >= ctxd.ctxDelta) return;
				//From expression local-space to kb local-space 
				else if(rDelta <= rv.ctxDelta) rv.ctxDelta = rDelta-1-rv.ctxDelta;
				else throw nul.unlocalisable;
				return rv.ctxd(true);
			}
		};
	},
	numerise: function(prnt, lvl) {
		return {
			sLvl: lvl?lvl:0,
			prnts: prnt?[prnt]:[],
			before: function(ctxd) {
				ctxd = ctxd.clone();
				if('undefined'!= typeof this.sLvl) {
					ctxd.locals.lvl = this.prnts.length+this.sLvl;
					if(nul.debug.assert) assert(!isNaN(ctxd.locals.lvl), 'levels computation');
				}
				if(0<this.prnts.length) ctxd.locals.prnt = this.prnts[0];
				else delete ctxd.locals.prnt;
				this.prnts.unshift(ctxd);
				return ctxd;
			},
			finish: function(ctxd, chgd) {
				this.prnts.shift();
				return chgd?ctxd:null;
			}
		};
	}
};