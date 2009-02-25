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
	/* browse behaviour defines:
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
			nul.debug.log('infoLog')('Useless browse for '+behav.name,nul.debug.logging?this.toHTML():'');			
		}.perform(function(behav) { return 'nul.ctxd->browse/'+behav.name; }),
		//Just compare : returns true or false
		cmp: function(ctxd) {
			if(ctxd.charact != this.charact) return false;
			if( this.components || ctxd.components ) {
				if(!this.components || !ctxd.components || this.components.length != ctxd.components.length)
					return false;
				var allSim = true;
				map(this.components, function(c,i) {
					if(allSim && !c.cmp(ctxd.components[i])) allSim = false;
				});
				map(this.attributes, function(c,i) {
					if(allSim && !c.cmp(ctxd.attributes[i])) allSim = false;
				});
				if(allSim) for(var an in ctxd.attributes) if(!this.attributes[an]) return false;
				return allSim;
			}
			if( ('undefined'!= typeof this.value || 'undefined'!= typeof ctxd.value) &&
					this.value != ctxd.value)
				return false;
			if( ('undefined'!= typeof this.lindx || 'undefined'!= typeof ctxd.lindx) &&
					(this.lindx != ctxd.lindx) || (this.ctxDelta != ctxd.ctxDelta) )
				return false;
			return true;
		}.perform('nul.ctxd->cmp'),
/* Makes a summary of components and characteristics :
 *  Fix flags, dependances, ...
 */
		summarised: function(first) {
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

			if(['=','?','[-]'].contains(this.charact)) flags.failable = true;
			else if(this.isFailable && this.isFailable()) flags.failable = true;
			if('{}'== this.charact) delete flags.fuzzy;
			if(['[-]','[]',':'].contains(this.charact)) flags.fuzzy = true;
//			if(['<<=', '{}'].contains(this.charact)) flags.extractible = true;
			
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
			if(first && !this.flags.dirty && this.evaluable()) this.flags.dirty = true;
			return this;
		}.perform('nl.ctxd->summarised'),
		//Get ctxd premiced with the fuzzy knowledge of <knwldg>
		fuzzyPremiced: function(knwldg) {
			var lcls = [];
			var vals = [];
			for(var d=0; d<knwldg.length; ++d)
				for(var v=0; v<knwldg[d].length; ++v)
					if(knwldg[d][v] && (0<d || knwldg[d][v].flags.fuzzy)) {
						lcls.push(nul.actx.local(d+3, v,'-'));
						vals.push(knwldg[d][v].localise(d+3));
					}
			if(0>= lcls.length) return this;
			if(1==lcls.length && (
					this.lindx == lcls[0].lindx ||
					this.cmp(vals[0]) /*TODO: compare within another ctxDelta*/)) {
				if(3== lcls[0].ctxDelta) return knwldg[0][lcls[0].lindx].localise(0);
				return nul.actx.unification([
					nul.actx.local(lcls[0].ctxDelta-1, lcls[0].lindx,'-'),
					knwldg[lcls[0].ctxDelta-3][lcls[0].lindx].localise(lcls[0].ctxDelta-1)]);
			}
			var xpr = this;
			for(var i=0; i<vals.length; ++i) {
				var prem = nul.actx.unification([lcls[i], vals[i]]);
				if(nul.actx.isC(xpr,';')) xpr = xpr.modify(unshifted(prem,xpr.components));
				else {
					var rlcls = [];
					xpr = nul.actx.and3([prem,xpr.stpDn(rlcls)]).withLocals(rlcls);
				}
			}
			return xpr.summarised()
		}.perform('nul.ctxd->fuzzyPremiced'),
		//Have the expressions touched out of understanding		
		touch: function() {	//TODO: on devrait pouvoir enlever le 'touch' sans bug MAIS bug dans unittest
			return this.browse(nul.ctxd.touch) || this;
		}.perform('nul.ctxd->touch'),
		//Be sure the expression is evaluated until it's not dirty anymore		
		finalize: function(kb) {
			return nul.eval.finalize(this, kb);
		}.perform('nul.ctxd->finalize'),
		//Get a list of non-fuzzy expressions
		solve: function() {
			return nul.solve.solve(this);
		}.perform('nul.ctxd->solve'),
		//Gets the value of this expression after operations effect (unifications, '+',  ...)
		evaluate: function(kb) {
			var x = kb?this:(this.contextualize(nul.globals, 1) || this);
			return x.browse(nul.eval.evaluate(kb||nul.kb())) || x.clean();
		}.perform('nul.ctxd->evaluate'),
		//Replace this context's locals according to association/table <ctx>
		contextualize: function(ctx, dlt) {
			if(!dlt) dlt=0;
			if(this.deps[dlt]) for(var d in this.deps[dlt]) if(ctx[d])
			return this.browse(nul.ctxd.contextualize([ctx], dlt));
		}.perform('nul.ctxd->contextualize'),
		known: function(kb, dlt) {
			if(!dlt) dlt=0;
			//TODO: verify intersection between kb and this.deps
			return this.browse(nul.ctxd.contextualize(kb.knowledge, dlt, kb));
		}.perform('nul.ctxd->known'),
		//Take the side-effected value of this expression
		extraction: function() {
			return this.browse(nul.ctxd.extraction);
		}.perform('nul.ctxd->extraction'),
		
		brws_lclShft: function(lcls, act, plcls) {
			seConcat(lcls, this.locals);
			var n = lcls.length-this.locals.length;
			if(plcls) this.locals = plcls;
			var rv = this.browse(nul.ctxd.lclShft(n, act));
			if(!rv) return this;
			return rv;
		}.perform('nul.ctxd->brws_lclShft'),
		//When this expression's locals are moved from (0..#) to (<n>..<n>+#)
		//<lcls> was the added locals and becomes the whole ones.
		//ctxDelta-s are unchanged
		lclShft: function(lcls) {
			if(0== this.locals.length) {
				this.locals = lcls;
				return this;
			}
			if(0== lcls.length) return this;
			return this.brws_lclShft(lcls,'sft').withLocals(lcls);
		}.perform('nul.ctxd->lclShft'),
		//This expression wrapped. Locals are given to parent.
		//<lcls> is the new parent's already locals and becomes new parent's whole locals
		//ctxDelta-s of these locals and outer locals are incremented
		stpDn: function(lcls) {	//Note: never used .... debug me !
			return this.brws_lclShft(lcls,'sdn').withoutLocals();
		}.perform('nul.ctxd->stpDn'),
		//This expression wrapped. Locals are unchanged.
		//<lcls> is the new parent's already locals and becomes new parent's whole locals
		//ctxDelta-s of outer locals are incremented
		wrap: function(kb) {
			return this.brws_lclShft([],'wrp').numerise(nul.debug.levels?this.locals.lvl+1:null);
		}.perform('nul.ctxd->wrap'),
		//This expression climbed.
		//<lcls> is the old parent's locals and becomes common locals.
		//ctxDelta-s of outer locals are decremented
		//<kb> last context knows <lcls>
		stpUp: function(lcls, kb) {
			//this.locals are the unknown of kb[-1]
			if(nul.debug.levels && kb) assert(this.locals.lvl == kb.knowledge.length, 'StepUp predicate');
			return this.brws_lclShft(lcls,'sup',lcls).numerise(lcls.prnt || lcls.lvl);
		}.perform('nul.ctxd->stpUp'),
		//Extract locals and says <this> we gonna give them to his parent
		//<lcls> are the destination parent's locals
		//ctxDelta-s are unchanged
		lclsUpg: function(lcls, kb) {	//TODO: debug me !
			if(nul.debug.levels && kb) assert(this.locals.lvl == kb.knowledge.length, 'LocalsUpgrade predicate');
			if(0>= this.locals.length) return this;
			return this.brws_lclShft(lcls,'upg').withoutLocals();
		}.perform('nul.ctxd->lclsUpg'),
		//Insert locals from his parent
		//<lcls> are the emptied source parent's locals
		//ctxDelta-s are unchanged
		//<lcls> refer to the last known context
		lclsDng: function(lcls, kb) {	//TODO: never used .... debug me !
			if(0>= lcls.length) return this;
			var _lcls = clone1(lcls);
			seEmpty(lcls);
			return this.brws_lclShft(_lcls,'dng').withLocals(_lcls);
		}.perform('nul.ctxd->lclsDng'),
		
		//Transform an expression from kb local-space to expression local-space and vice versa
		localise: function(inc) {
			return (this.browse(nul.ctxd.localise(inc||0)) || this.clone()).summarised();
		}.perform('nul.ctxd->localise'),

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
		}.perform('nul.ctxd->numerise'),
		rDevelop: function(v, inc, lcl) {
			var ctx = [];
			ctx[lcl || nul.lcl.slf] = v.localise();
			return this.contextualize(ctx, inc);
		}.perform('nul.ctxd->rDevelop'),
		//Shortcut: Weither this epression is free of dependance toward external locals
		free: function(beside) { return nul.lcl.dep.free(this.deps, beside); }.perform('nul.ctxd->free'),
		//Shortcut: Is evaluable ?
		evaluable: function() {
			return this.evaluation &&
				(!this.evaluation.evaluable || this.evaluation.evaluable(this));
		}.perform('nul.ctxd->evaluable'),
		//Shortcut: Clean !
		clean: function() { delete this.flags.dirty; return this; },
		dirty: function() { this.flags.dirty = true; return this; },
		
		clone: function(nComps, nAttrs) {
			var rv = {};
			for(var i in this) if(['locals'].contains(i))
				rv[i] = clone1(this[i]);
			else rv[i] = this[i];
			return rv.modify(nComps, nAttrs);
		}.perform('nul.ctxd->clone'),
		cloneUnsure: function(nComps, nAttrs) { return this.clone(nComps, nAttrs); },
		//TOMAINTAIN
		//If 'truc.cloneUnsure' is called, try to replace it with 'truc.modify'.
		// If it cannot work (please, WELL TESTED), let 'truc.clone' instead.
		// If not, replace 'modify' call if possible
		modify: function(nComps, nAttrs) {
			if(nComps) {
				if(!nul.understanding.phase) {
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
						//(a :- b) :- c ===> a :- (b = c)
						if(nul.actx.isC(nComps.parms,':-')) {
							var flmbd = nComps.parms.stpUp(this.locals);
							var eq = nul.actx.unification([flmbd.components.value, nComps.value]).wrap();
							nComps = {parms: flmbd.components.parms, value: eq};
						}
					}
				}
				this.components = map(nComps,nul.ctxd.parentise(this));
			}
			return this.attributed(nAttrs);
		}.perform('nul.ctxd->modify'),
		attributed: function(nAttrs) {
			if(nAttrs) this.attributes = map(nAttrs,nul.ctxd.parentise(this));
			return this;
		}.perform('nul.ctxd->attributed'),
		addAttr: function(kb) {
			var attr = clone1(this.attributes);
			for(var i=1; i<arguments.length; ++i)
				for(an in arguments[i].attributes) {
					if(!attr[an]) attr[an] = arguments[i].attributes[an];
					else attr[an] = nul.unify.subd(
						attr[an],
						arguments[i].attributes[an], kb);
				}
			var rv = this.clone().attributed(attr).summarised();
			rv = rv.known(kb) || rv;
			return rv.contextualize(rv.attributes) || rv;
		}.perform('nul.ctxd->addAttr'),
		
		withLocals: function(lcls) {
			var rv = this;
			if(nul.debug.levels && (lcls.prnt || 'undefined'!= typeof lcls.lvl))
				rv = rv.numerise(lcls.prnt || lcls.lvl);
			rv.locals = clone1(lcls);
			return rv;
		}.perform('nul.ctxd->withLocals'),
		withoutLocals: function() {
			var lcls = [], rv = this.clone();
			map(rv.locals, function(v, i) { if('number'!= typeof i) lcls[i] = v; });
			rv.locals = lcls;
			return rv;
		}.perform('nul.ctxd->withLocals'),
	},

	parentise: function(prnt) {
		return function(c) {
			return c.numerise(prnt);
		};
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
				if(chg) ctxd = ctxd.clone(null,ats).summarised();
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
	}.perform(function(behav) { return 'nul.ctxd.flatBrowse/'+behav.name; }),
	contextualize: function(knwldg, dlt, kb) {
		return {
			name: 'contextualisation',
			ctxDelta: (dlt||0)-1,
			knwldg: knwldg,
			kb: kb,
			before: function(ctxd) {
				++this.ctxDelta;
				for(var cd in ctxd.deps) {
					cd = reTyped(cd);
					if(this.ctxDelta<= cd && cd <this.ctxDelta+this.knwldg.length)
						for(var li in ctxd.deps[cd])
							if(this.itmCtxlsz(cd-this.ctxDelta, li))
								return;
				}
				throw nul.ctxd.noBrowse;
			},
			abort: function() { --this.ctxDelta; },
			finish: function(ctxd, chgd) {
				--this.ctxDelta;
				if(chgd) {
					ctxd = ctxd.summarised();
					if(ctxd.components) ctxd.dirty();
					return ctxd;
				}
			},
			itmCtxlsz: function(ctxNdx, lindx) {
				return 0<= ctxNdx && ctxNdx<this.knwldg.length && 
					this.knwldg[ctxNdx][lindx] &&
					!this.knwldg[ctxNdx][lindx].flags.fuzzy &&
					(nul.lcl.slf!= lindx || 0== ctxNdx)
			},
			local: function(ctxd) {
				var ctxNdx = ctxd.ctxDelta-this.ctxDelta;
				if( this.itmCtxlsz(ctxNdx, ctxd.lindx)) {
					var rv = this
						.knwldg[ctxNdx][ctxd.lindx]
						.localise(ctxd.ctxDelta-(dlt||0))
						.numerise(ctxd.locals.prnt);
					if(nul.debug.assert) assert(this.kb || is_empty(ctxd.attributes));
					if(!rv.dbgName) rv.dbgName = ctxd.dbgName;
					return kb?rv.addAttr(this.kb,ctxd):rv;
				}
			}
		};
	},

	extraction: {
		name: 'extration',
		browse: function(ctxd) {
			return !ctxd.extract;
		},
		finish: function(ctxd, chgd) {
			if(ctxd.extract) return ctxd.extract().numerise(ctxd.locals.prnt || ctxd.locals.lvl);
			if(chgd) return ctxd.summarised().dirty();
		}
	},
	touch: {
		name: 'touch',
		finish: function(ctxd, chgd) {
			return ctxd.modify(ctxd.components, ctxd.attributes);
		}
	},
	lclShft: function(n, act) {
		return {
			name: 'local shifting',
			ctxDelta: -1,
			alc: n,
			before: function(ctxd) {
				if(is_empty(ctxd.deps)) throw nul.ctxd.noBrowse;	//TODO: détecter *TOUS* les inutiles: deps vide et deps non-fit
				++this.ctxDelta;
			}.perform('nul.lclShft->before'),
			finish: function(ctxd, chgd) {
				--this.ctxDelta;
				if(chgd && 'undefined'!= typeof ctxd.lindx) return ctxd.summarised();
				if(chgd) return ctxd.summarised().dirty();
			}.perform('nul.lclShft->finish'),
			local: function(ctxd) {
				var rv = ctxd.clone();
				if('dng'== act && rv.ctxDelta==this.ctxDelta+1) --rv.ctxDelta;
				else if('wrp'!= act && rv.ctxDelta==this.ctxDelta) {
					//if(nul.lcl.slf=== rv.lindx && inOr(act, 'upg', 'dng'))
					//	throw nul.internalException("Trying to move 'self' local !");
					if(nul.lcl.slf!= rv.lindx) {
						if('number'== typeof rv.lindx) rv.lindx += this.alc;
						if(inOr(act, 'upg', 'sdn')) ++rv.ctxDelta;
					}
				} else if('sup'== act && rv.ctxDelta>this.ctxDelta) --rv.ctxDelta;
				else if(inOr(act, 'sdn', 'wrp') && rv.ctxDelta>this.ctxDelta) ++rv.ctxDelta;
				else return;
				return rv.summarised();
			}.perform('nul.lclShft->local')
		};
	},
	localise: function(inc) {
		return {
			name: 'localisation',
			inc: inc,
			ctxDelta: -1,
			before: function(ctxd) {
				if(is_empty(ctxd.deps)) throw nul.ctxd.noBrowse;
				++this.ctxDelta;
			},
			finish: function(ctxd, chgd) {
				--this.ctxDelta;
				if(chgd) return ctxd.summarised();
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
				return rv.summarised();
			}
		};
	},
	numerise: function(prnt, lvl) {
		return {
			name: 'numerisation',
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