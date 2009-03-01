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
					cps = map(xpr.components, function() {
						assert(this.browse);
						var co = this.browse(behav);
						chg |= !!co;
						co = co||this;
						if(behav.newComponent) co = behav.newComponent(xpr, this, co) || co;
						return co;
					});
				var ats;
				if(isToBrowse(behav, behav.browseAttributes, xpr))
					ats = map(xpr.x.attributes, function(ky) {
						var co = this.browse(behav);
						chg |= !!co;
						co = co||this;
						if(behav.newAttribute) co = behav.newAttribute(xpr, ky, this, co) || co;
						return co;
					});
				if(chg) xpr = xpr.compose(cps, ats);
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

	contextualize: function(rpl, dlt, kb) {
		return {
			name: 'contextualisation',
			ctxDelta: dlt||0,
			rpl: rpl,
			kb: kb,
			before: function(xpr) {
				if(xpr.makeContext) ++this.ctxDelta;
				/*TODO: avoid useless sub-contextualisation
				for(var cd in xpr.deps) {
					cd = reTyped(cd);
					if(this.ctxDelta<= cd && cd <this.ctxDelta+this.knwldg.length)
						for(var li in xpr.deps[cd])
							if(this.itmCtxlsz(cd-this.ctxDelta, li))
								return;
				}
				throw nul.browse.abort;*/
			},
			abort: function() { --this.ctxDelta; },
			finish: function(xpr, chgd) {
				if(xpr.makeContext) --this.ctxDelta;
				if(chgd) {
					xpr = xpr.summarised();
					if(xpr.components) xpr.dirty();
					return xpr;
				}
			},
			itmCtxlsz: function(ctxNdx, lindx) {
				return 0<= ctxNdx && ctxNdx<this.rpl.length && 
					this.rpl[ctxNdx][lindx];
			},
			local: function(xpr) {
				var ctxNdx = xpr.ctxDelta-this.ctxDelta;
				if(this.itmCtxlsz(ctxNdx, xpr.lindx)) {
					var rv = this.rpl[ctxNdx][xpr.lindx]
						.localise(xpr.ctxDelta-(dlt||0));
					if(!rv.dbgName) rv.dbgName = xpr.dbgName;
					return rv.xadd(xpr.x, this.kb);
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
			if(xpr.extract) return xpr.extract();
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
				return !isEmpty(xpr.deps);	//TODO: sois plus précis. spécifie moins de shifted !
			},
			before: function(xpr) {
				//if(!nul.debug.levels && !this.shifted(xpr))
				//	throw nul.browse.abort;
				// TODO: on peut p-e abandonner ....
				++this.ctxDelta;
			}.perform('nul.lclShft->before'),
			finish: function(xpr, chgd) {
				--this.ctxDelta;
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
				//if(isEmpty(xpr.deps)) throw nul.browse.abort;
				++this.ctxDelta;
				return clone1(xpr).withX(xpr.x.clone());
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
	evaluate: function(kb) {
		return {
			name: 'evaluation',
			kb: kb,
			newComponent: function(xpr, oldComp, newComp) {
				return newComp.clean();
			},
			newAttribute: function(xpr, name, oldAttr, newAttr) {
				return newAttr.clean();
			},
			browse: function(xpr) {
				return !xpr.subOperationManagement;
			},
			before: function(xpr) {
				if(!xpr.flags.dirty) throw nul.browse.abort;
				this.kb.enter([xpr]);
			},
			finish: function(xpr, chgd) {
				var assertKbLen, assertLc;
				if(nul.debug.assert) { assertKbLen = this.kb.knowledge.length; assertLc = nul.debug.lc; } 
				xpr.composed(kb);
				try {
					var rv;
					if(xpr.operable()) {
						rv = xpr.operate(this.kb);
						if(rv) { chgd = true; xpr = rv; }
					}
					if(!rv && chgd) xpr = xpr.summarised().clean();
				} catch(err) { this.abort(xpr); throw nul.exception.notice(err); }
				return this.kb.leave(chgd?xpr:null);
			}.describe(function(xpr, chgd) { return 'Evaluating '+xpr.toHTML(); }),
			abort: function(xpr, willed) {
				if(willed) return;
				return this.kb.abort(xpr);
			}
		};
	},
};