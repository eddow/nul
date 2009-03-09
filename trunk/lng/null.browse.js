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
- finish(xpr, chgd, orig) : returns the final value, knowing the expresion, if it changed and the original expression
- abort(orig, willed) : returns nothing. Called instead of 'finish' when a problem occured. <willed> specifies if the abortion had been asked by the behaviour.
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
			var rv = cb.call(this, i);
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
		function iif(nv, ov) {
			if(!nv) return ov;
			chg = true;
			return nv;
		}

		var subRecur = function() {
			if(nul.debug.assert) assert(this.browse, 'Sub is expressions');
			var co = iif(this.browse(behav), this);
			if(behav.newSub) co = behav.newSub(xpr, this, co) || co;
			return co;
		};
		var nAttrs, nComps;
		var isToBrowse = 'undefined'== typeof behav.browse ||
						('function'== typeof behav.browse && behav.browse(xpr)) ||
						('function'!= typeof behav.browse && behav.browse);
		try {
			if(isToBrowse) nAttrs = map(this.x.attributes, subRecur);
			try {
				if(behav.before) xpr = iif(behav.before(xpr), xpr).integre();
				if(isToBrowse && xpr.components) nComps = map(xpr.components, subRecur);
				if(chg) {
					switch(behav.clone) {
						case 'itm': xpr = xpr.clone(nComps, nAttrs); break;
						case 'sub': xpr.compose(nComps).x.attributes = nAttrs; break;
						default:
							if(nComps) {
								if(isArray(xpr.components)) xpr.components.splice(0);
								merge(xpr.components, nComps);
							}
							merge(xpr.x.attributes, nAttrs);
					}
				} else xpr.integre();
				if(behav[xpr.charact]) xpr = iif(behav[xpr.charact](xpr), xpr);
			} catch(err) {
				nul.exception.notice(err);
				if(behav.abort) xpr = behav.abort(this, err);
				else xpr = null;
				if(xpr) return xpr.integre();
				if(nul.browse.abort== err) return;
				throw err;
			}
			if(behav.finish) { xpr = behav.finish(xpr, chg, this); chg = true; }
			if(chg && xpr) xpr = xpr.summarised();
		} catch(err) { throw nul.exception.notice(err);
		} finally { if(nul.debug.assert && behav.kb)
			assert(assertKbLen== behav.kb.knowledge.length,
				'Knowledge enter/leave paired while browsing ['+assertLc+']'); }

		if(xpr) xpr.integre();
		if(chg && xpr) return xpr;
		nul.debug.log('perf')('Useless browse for '+behav.name,this);			
	}.perform(function(behav) { return 'nul.browse->recursion/'+behav.name; }),

	contextualise: function(rpl, act) {
		return {
			name: 'contextualisation',
			rpl: rpl,
			act: act,
			eqProtect: [0],
			before: function(xpr) {
				//TODO: throw stop.browsing ?
				if(xpr.unification) this.eqProtect.unshift(0);
				else --this.eqProtect[0];
			},
			finish: function(xpr, chgd, orig) {
				xpr.summarised();
				if(chgd && this.act) xpr.dirty();
				if((0!= ++this.eqProtect[0] || 'knwl'!= this.act) && this.rpl[xpr.ndx])
					return this.rpl[xpr.ndx].xadd(xpr);
				if(orig.unification) this.eqProtect.shift();
				if(chgd) return xpr;
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
			if(chgd) return xpr.dirty();
		}
	},
	lclShft: function(inc, orgName, dstName) {
		return {
			name: 'local shifting',
			clone: 'itm',
			inc: inc,
			dstName: dstName || orgName,
			orgName: orgName,
			local: function(xpr) {
				if(xpr.ctxName == this.orgName)
					return nul.build.local(this.dstName, xpr.lindx + this.inc, xpr.dbgName).xadd(xpr);
			}.perform('nul.lclShft->local')
		};
	},
	evaluate: function(kb) {
		return {
			name: 'evaluation',
			kb: kb,
			newSub: function(xpr, oldSub, newSub) {
				return newSub.clean();
			},
			newAttribute: function(xpr, name, oldAttr, newAttr) {
				return newAttr.clean();
			},
			before: function(xpr) {
				if(!xpr.flags.dirty) throw nul.browse.abort;
				nul.debug.log('evals')(nul.debug.lcs.collapser('Entering'),xpr);
				if(xpr.freedom) return xpr.makeFrdm(this.kb);
			},
			finish: function(xpr, chgd, orig) {
				var assertKbLen, assertLc;
				try {
					if(nul.debug.assert) { assertKbLen = this.kb.knowledge.length; assertLc = nul.debug.lc; } 
					xpr.summarised().composed();
					var rv;
					if(xpr.operable()) {
						rv = xpr.operate(this.kb);
						if(rv) { chgd = true; xpr = rv; }
					}
					if(!rv && chgd) { xpr = xpr.composed().clean(); chgd = true; }
					if(orig.freedom && chgd) xpr = xpr.finalise(this.kb).composed();
				} catch(err) {
					var rv = this.abort(orig,err);
					if(rv) return rv;
					throw nul.exception.notice(err);
				}
				xpr = chgd?xpr:null;
				nul.debug.log('evals')(nul.debug.lcs.endCollapser('Leave', 'Produce'),
					xpr?(xpr!=orig?[xpr, 'after', orig]:['modified', xpr]):orig);
				
				if(orig.freedom) {
					if(!chgd) this.kb.pop(orig.freedom);
					else this.kb.pop(xpr);
				}
				return chgd?xpr:null;
				//TODO: seek for duplicatas
			},
			abort: function(orig, err) {
				if(nul.browse.abort== err) return;
				if(orig.freedom) this.kb.pop(orig.freedom);
				var xpr;
				if(nul.failure== err && orig.fail) xpr = orig.fail();
				nul.debug.log('evals')(nul.debug.lcs.endCollapser('Abort', 'Fail'),
					xpr?(xpr!=orig?[xpr, 'after', orig]:['modified', xpr]):orig);
				return xpr;
			}
		};
	},
};