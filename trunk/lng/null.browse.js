/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/* browse behaviour defines:
- browse
- before(xpr) : returns nothing to remain unchanged or something as new value to browse
- newSub(xpr, oldSub, newSub) : A new sub-expression is produced (oldSub can be newSub)
- newAttribute(xpr, name, oldAttr, newAttr) : A new attribute is produced (oldAttr can be == newAttr)
- finish(xpr, chgd, orig) : returns the final value, knowing the expresion, if it changed and the original expression
- abort(xpr, willed, orig) : returns nothing. Called instead of 'finish' when a problem occured. <willed> specifies if the abortion had been asked by the behaviour.
- <charact>(xpr) : acts on a specific characterised expression
*/
nul.browse = {
	abort: 'stopBrowsingPlease',
	subs: function(xpr, cb, dst) {
		if(!dst) {
			dst = {};
			dst.x = {};
		}
		if(dst!== xpr) {
			dst.components = [];
			dst.x.attributes = {};
		}
		if(xpr.components) map(xpr.components, function(i, o) {
			var rv = o?cb.call(this, i):null;
			if(nul.debug.assert) assert(xpr!==dst || 'undefined'!= typeof rv, 'No build with undefined');
			dst.components[i] = rv||null;
		});
		map(xpr.x.attributes, function(i) {
			var rv = cb.call(this, i);
			if(nul.debug.assert) assert(xpr!==dst || 'undefined'!= typeof rv, 'No build with undefined');
			dst.x.attributes[i] = rv||null;
		});
		return dst;
	},
	recursion: function(behav) {
		var assertKbLen, assertLc;
		if(nul.debug.assert && behav.kb) {
			assertKbLen = behav.kb.knowledge.length; assertLc = nul.debug.lc; } 

		var xpr = this.integre(), chg = false;
		try {
			try {
				if(behav.before) xpr = (behav.before(xpr)||xpr).integre();
				if('undefined'== typeof behav.browse ||
						('function'== typeof behav.browse && behav.browse(xpr)) ||
						behav.browse(xpr))
					nul.browse.subs(xpr, function(indx) {
						if(nul.debug.assert) assert(this.browse, 'Sub is expressions');
						var co = this.browse(behav);
						chg |= !!co;
						co = co||this;
						if(behav.newComponent) co = behav.newComponent(xpr, this, co) || co;
						return co;
					}, xpr);
				xpr.integre();
				if(behav[xpr.charact]) xpr = (behav[xpr.charact](xpr) || xpr).integre();
				chg |= xpr!==this;
			} catch(err) {
				nul.exception.notice(err);
				if(behav.abort) behav.abort(xpr, nul.browse.abort== err, this);
				if(nul.browse.abort== err) return;
				throw err;
			}
			if(behav.finish) { xpr = behav.finish(xpr, chg, this); chg = true; }
		} catch(err) { throw nul.exception.notice(err);
		} finally { if(nul.debug.assert && behav.kb)
			assert(assertKbLen== behav.kb.knowledge.length,
				'Knowledge enter/leave paired while browsing ['+assertLc+']'); }

		if(xpr) xpr.integre();
		if(chg && xpr) return xpr;
		nul.debug.log('info')('Useless browse for '+behav.name,this);			
	}.perform(function(behav) { return 'nul.browse->recursion/'+behav.name; }),

	contextualise: function(rpl, dlt) {
		return {
			name: 'contextualisation',
			ctxDelta: dlt||0,
			rpl: rpl,
			before: function(xpr) {
				if(xpr.freedom) ++this.ctxDelta;
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
			abort: function(xpr) { if(xpr.freedom) --this.ctxDelta; },
			finish: function(xpr, chgd, orig) {
				if(orig.freedom) --this.ctxDelta;
				if(chgd) return xpr.dirty().summarised();
			},
			itmCtxlsz: function(ctxNdx, lindx) {
				return 0<= ctxNdx && ctxNdx<this.rpl.length && 
					this.rpl[ctxNdx][lindx];
			},
			local: function(xpr) {
				var ctxNdx = xpr.ctxDelta-this.ctxDelta;
				if(this.itmCtxlsz(ctxNdx, xpr.lindx)) {
					var rv = this.rpl[ctxNdx][xpr.lindx]
						.localise(xpr.ctxDelta);
					if(!rv.dbgName) rv.dbgName = xpr.dbgName;
					return rv.xadd(xpr.x);
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
	lclShft: function(act, n) {
		return {
			name: 'local shifting',
			ctxDelta: ('undefined'!= typeof n)?-1:0,
			inc: n||0,
			action: act,
			before: function(xpr) {
				//if(!nul.debug.levels && !this.shifted(xpr))
				//	throw nul.browse.abort;
				// TODO: on peut p-e abandonner ....
				if(xpr.freedom) ++this.ctxDelta;
			}.perform('nul.lclShft->before'),
			abort: function(xpr) {
				if(xpr.freedom) --this.ctxDelta;
			},
			finish: function(xpr, chgd) {
				if(xpr.freedom) --this.ctxDelta;
				if(chgd) return xpr.summarised();
			}.perform('nul.lclShft->finish'),
			local: function(xpr) {
				if('wrp'!= this.action && xpr.ctxDelta==this.ctxDelta) {
					assert(nul.lcl.slf!= xpr.lindx, 'Dont move self');
					xpr.lindx += this.inc;
					if(['upg', 'sdn'].contains(this.action)) ++xpr.ctxDelta;
				} else if('sup'== this.action && xpr.ctxDelta>this.ctxDelta) --xpr.ctxDelta;
				else if(['wrp', 'sdn'].contains(this.action) && xpr.ctxDelta>this.ctxDelta) ++xpr.ctxDelta;
				else return;
				return xpr;
			}.perform('nul.lclShft->local')
		};
	},
	localise: function(inc) {
		return {
			name: 'localisation',
			inc: inc,
			ctxDelta: 0,
			before: function(xpr) {
				if(isEmpty(xpr.deps)) throw nul.browse.abort;
				if(xpr.freedom) ++this.ctxDelta;
			},
			finish: function(xpr, chgd) {
				if(xpr.freedom) --this.ctxDelta;
				return xpr.summarised();
			},
			abort: function(xpr) {
				if(xpr.freedom) --this.ctxDelta;
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
				if(xpr.freedom) this.kb.enter(xpr);
				nul.debug.log('evals')(nul.debug.lcs.collapser('Entering'),xpr);
			},
			finish: function(xpr, chgd, orig) {
				var assertKbLen, assertLc;
				if(nul.debug.assert) { assertKbLen = this.kb.knowledge.length; assertLc = nul.debug.lc; } 
				xpr.summarised().composed();	//warn: if must use KB, the KB is one too much inside here
				try {
					var rv;
					if(xpr.operable()) {
						rv = xpr.operate(this.kb);
						if(rv) { chgd = true; xpr = rv; }
					}
					if(!rv && chgd) xpr = xpr.clean();
				} catch(err) { this.abort(xpr,false,orig); throw nul.exception.notice(err); }
				xpr = chgd?xpr:null;
				nul.debug.log('evals')(nul.debug.lcs.endCollapser('Leave', 'Produce'),
					xpr?[xpr, 'after', orig]:orig);
				return orig.freedom?this.kb.leave(xpr):xpr;
			},
			abort: function(xpr, willed, orig) {
				if(willed) return;
				nul.debug.log('evals')(nul.debug.lcs.endCollapser('Abort', 'Fail'),
					xpr?[xpr, 'after', orig]:orig);
				return orig.freedom?this.kb.abort(xpr):xpr;
			}
		};
	},
};