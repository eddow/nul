/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/* browse behaviour defines:
- browse
- browseAttributes(xpr) : not to browse attributes
- browseComponents(xpr) : not to browse components
- before(xpr) : returns nothing to remain unchanged or something as new value to browse
- newComponent(xpr, oldComp, newComp) : A new component is produced (oldComp can be == newComp)
- newAttribute(xpr, name, oldAttr, newAttr) : A new attribute is produced (oldAttr can be == newAttr)
- finish(xpr, chgd) : returns the final value
- abort(xpr, willed) : returns nothing. Called instead of 'finish' when a problem occured. <willed> specifies if the abortion had been asked by the behaviour.
- <charact>(xpr) : acts on a specific characterised expression
*/
nul.browse = {
	abort: 'stopBrowsingPlease',
	recursion:  function(behav) {
		function isToBrowse(behav, cb, xpr) {
			if('undefined'!= typeof cb) return ('function'== typeof cb) ? cb(xpr) : !!cb;
			return ('undefined'== typeof behav.browse) || (
				'function'== typeof behav.browse ?
					behav.browse(xpr) :
					!!behav.browse );
		};
		var assertKbLen, assertLc;
		if(nul.debug.assert && behav.kb) {
			assertKbLen = behav.kb.knowledge.length; assertLc = nul.debug.lc; } 

		var xpr = this, chg = false;
		try {
			try {
				if(behav.before) xpr = behav.before(xpr)||xpr;
				var cps;
				if(xpr.components && isToBrowse(behav, behav.browseComponents, xpr))
					cps = map(xpr.components, function(o) {
						var co = o.browse(behav);
						chg |= !!co;
						co = co||o;
						if(behav.newComponent) co = behav.newComponent(xpr, o, co) || co;
						return co;
					});
				var ats;
				if(isToBrowse(behav, behav.browseAttributes, xpr))
					ats = map(xpr.attributes, function(o, ky) {
						var co = o.browse(behav);
						chg |= !!co;
						co = co||o;
						if(behav.newAttribute) co = behav.newAttribute(xpr, ky, o, co) || co;
						return co;
					});
				if(chg) xpr = xpr.modify(cps, ats);
				if(behav[xpr.charact]) xpr = behav[xpr.charact](xpr) || xpr;
				chg |= xpr!==this;
			} catch(err) {
				nul.exception.notice(err);
				if(behav.abort) behav.abort(xpr, nul.browse.abort== err);
				if(nul.browse.abort== err) return;
				throw err;
			}
			if(behav.finish) { xpr = behav.finish(xpr, chg); chg = true; }
		} finally { if(nul.debug.assert && behav.kb)
			assert(assertKbLen== behav.kb.knowledge.length,
				'Knowledge enter/leave paired while browsing ['+assertLc+']'); }

		if(chg && xpr) return xpr;
		if(nul.debug.perf) nul.debug.log('infoLog')('Useless browse for '+behav.name,nul.debug.logging?this.toHTML():'');			
	}.perform(function(behav) { return 'nul.browse->recursion/'+behav.name; }),

	contextualize: function(knwldg, dlt, kb) {
		return {
			name: 'contextualisation',
			ctxDelta: (dlt||0)-1,
			knwldg: knwldg,
			kb: kb,
			before: function(xpr) {
				++this.ctxDelta;
				for(var cd in xpr.deps) {
					cd = reTyped(cd);
					if(this.ctxDelta<= cd && cd <this.ctxDelta+this.knwldg.length)
						for(var li in xpr.deps[cd])
							if(this.itmCtxlsz(cd-this.ctxDelta, li))
								return;
				}
				throw nul.browse.abort;
			},
			abort: function() { --this.ctxDelta; },
			finish: function(xpr, chgd) {
				--this.ctxDelta;
				if(chgd) {
					xpr = xpr.summarised();
					if(xpr.components) xpr.dirty();
					return xpr;
				}
			},
			itmCtxlsz: function(ctxNdx, lindx) {
				return 0<= ctxNdx && ctxNdx<this.knwldg.length && 
					this.knwldg[ctxNdx][lindx] &&
					!this.knwldg[ctxNdx][lindx].flags.fuzzy &&
					(nul.lcl.slf!= lindx || 0== ctxNdx)
			},
			local: function(xpr) {
				var ctxNdx = xpr.ctxDelta-this.ctxDelta;
				if( this.itmCtxlsz(ctxNdx, xpr.lindx)) {
					var rv = this
						.knwldg[ctxNdx][xpr.lindx]
						.localise(xpr.ctxDelta-(dlt||0))
						.numerise(xpr.locals.prnt);
					if(nul.debug.assert) assert(this.kb || is_empty(xpr.attributes));
					if(!rv.dbgName) rv.dbgName = xpr.dbgName;
					return kb?rv.addAttr(this.kb,xpr):rv;
				}
			}
		};
	},

	extraction: {
		name: 'extration',
		browse: function(xpr) {
			return !xpr.extract;
		},
		finish: function(xpr, chgd) {
			if(xpr.extract) return xpr.extract().levelise(xpr);
			if(chgd) return xpr.summarised().dirty();
		}
	},
	lclShft: function(n, act) {
		return {
			name: 'local shifting',
			ctxDelta: -1,
			alc: n,
			action: act,
			shifted: function(xpr) {
				return !is_empty(xpr.deps);	//TODO: sois plus précis. spécifie moins de shifted !
			},
			before: function(xpr) {
				//If nul.debug.levels, all locals.lvl must be changed
				//if(!nul.debug.levels && !this.shifted(xpr))
				//	throw nul.browse.abort;
				// TODO: on ne peut pas abandonner .... il faut summariser ?
				++this.ctxDelta;
			}.perform('nul.lclShft->before'),
			finish: function(xpr, chgd) {
				--this.ctxDelta;
				if(nul.debug.levels && 'undefined' != typeof xpr.locals.lvl) {
					if(['sdn','wrp'].contains(this.action)) ++xpr.locals.lvl;
					else if('sup'== this.action) --xpr.locals.lvl;
				}
				xpr.summarised();
				if('undefined'== typeof xpr.lindx) xpr.dirty();
			}.perform('nul.lclShft->finish'),
			local: function(xpr) {
				if('dng'== this.action && xpr.ctxDelta==this.ctxDelta+1) --xpr.ctxDelta;
				else if('wrp'!= this.action && xpr.ctxDelta==this.ctxDelta) {
					if(nul.lcl.slf!= xpr.lindx) {
						if('number'== typeof xpr.lindx) xpr.lindx += this.alc;
						if(['upg', 'sdn'].contains(this.action)) ++xpr.ctxDelta;
					}
				} else if('sup'== this.action && xpr.ctxDelta>this.ctxDelta) --xpr.ctxDelta;
				else if(['wrp', 'sdn'].contains(this.action) && xpr.ctxDelta>this.ctxDelta) ++xpr.ctxDelta;
			}.perform('nul.lclShft->local')
		};
	},
	localise: function(inc) {
		return {
			name: 'localisation',
			inc: inc,
			ctxDelta: -1,
			before: function(xpr) {
				//if(is_empty(xpr.deps)) throw nul.browse.abort;
				++this.ctxDelta;
				return clone1(xpr).withLocals(clone1(xpr.locals));
			},
			finish: function(xpr, chgd) {
				--this.ctxDelta;
				return xpr.summarised();
			},
			local: function(xpr) {
				var rDelta = this.ctxDelta + this.inc;
				//From kb local-space to expression local-space 
				if(0>xpr.ctxDelta) xpr.ctxDelta = rDelta-1-xpr.ctxDelta;
				//The same in any local-space 
				else if(this.ctxDelta >= xpr.ctxDelta) return;
				//From expression local-space to kb local-space 
				else if(rDelta <= xpr.ctxDelta) xpr.ctxDelta = rDelta-1-xpr.ctxDelta;
				else throw nul.unlocalisable;
				return xpr;
			}
		};
	},
	numerise: function(prnt, lvl) {
		return {
			name: 'numerisation',
			sLvl: lvl?lvl:0,
			prnts: prnt?[prnt]:[],
			before: function(xpr) {
				var mblvl = this.prnts.length+this.sLvl;
				var mbprnt = 0<this.prnts.length?this.prnts[0]:null;
				if(xpr.locals.lvl == mblvl && xpr.locals.prnt == mbprnt) throw nul.browse.abort;
				xpr.locals.lvl = mblvl;
				if(mbprnt) xpr.locals.prnt = mbprnt;
				else delete xpr.locals.prnt;
				this.prnts.unshift(xpr);
				return xpr;
			},
			finish: function(xpr, chgd) {
				this.prnts.shift();
				return chgd?xpr:null;
			}
		};
	},	
	evaluate: function(kb, entrance) {
		return {
			name: 'evaluation',
			kb: kb,
			entrance: entrance||0,
			newComponent: function(xpr, oldComp, newComp) {
				if(oldComp!= newComp) newComp = newComp.numerise(xpr);
				return newComp.clean();
			},
			newAttribute: function(xpr, name, oldAttr, newAttr) {
				if(xpr.deps[0]&&xpr.deps[0][name]) this.kb.know(name, newAttr, 1);
				if(oldAttr!= newAttr) newAttr = newAttr.numerise(xpr);
				return newAttr.clean();
			},
			browse: function(xpr) {
				return !xpr.subOperationManagement;
			},
			before: function(xpr) {
				if(!xpr.flags.dirty) throw nul.browse.abort;
				if(0<++this.entrance) this.kb.enter(xpr);
			},
			finish: function(xpr, chgd) {
				var assertKbLen, assertLc;
				if(nul.debug.assert) { assertKbLen = this.kb.knowledge.length; assertLc = nul.debug.lc; } 
				if(nul.debug.levels) assert(xpr.locals.lvl == this.kb.knowledge.length-1, 'Evaluation level');
				try {
					try {
						var rv;
						if(xpr.operable()) {
							rv = xpr.operate(this.kb);
							if(rv) { chgd = true; xpr = rv; }
						}
						if(!rv && chgd) xpr = xpr.summarised().clean();
					} catch(err) { this.abort(xpr); throw nul.exception.notice(err); }
					if(0>--this.entrance) return chgd?xpr:undefined;
					return this.kb.leave(chgd?xpr:undefined);
				} finally { if(nul.debug.assert) assert(
					(0<=this.entrance && assertKbLen== this.kb.knowledge.length+1) ||
					(0>this.entrance && assertKbLen== this.kb.knowledge.length),
					'Knowledge enter/leave paired while evaluation ['+assertLc+']'); }
			}.describe(function(xpr, chgd) { return 'Evaluating '+xpr.toHTML(); }),
			abort: function(xpr, willed) {
				if(willed || 0>--this.entrance) return;
				return this.kb.abort(xpr);
			}
		};
	},
};