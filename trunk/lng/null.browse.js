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
- abort(orig, err, xpr) : returns nothing. Called instead of 'finish' when a problem occured. <willed> specifies if the abortion had been asked by the behaviour.
- <charact>(xpr) : acts on a specific characterised expression
*/
nul.browse = {
	abort: 'stopBrowsingPlease',
	recursion: function(behav) {
		var assertKbLen, assertLc;
		if(nul.debug.assert && behav.kb) {
			assertKbLen = behav.kb.knowledge.length; assertLc = nul.debug.lc; } 

		var xpr = this.integre(), chg = false, attrChg;
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
		var isToBrowse = 'undefined'== typeof behav.browse ||
						('function'== typeof behav.browse && behav.browse(xpr)) ||
						('function'!= typeof behav.browse && behav.browse);
		try {
			if(isToBrowse) {
				var nAttrs = map(this.x.attributes, subRecur);
				if(chg) {
					switch(behav.clone) {
						case 'itm': xpr = xpr.clone(null, nAttrs); break;
						case 'sub': xpr.x.attributes = nAttrs; break;
						default: merge(xpr.x.attributes, nAttrs);
					}
					chg = false;
					attrChg = xpr;
				}
			}
			try {
				if(behav.before) xpr = (behav.before(xpr)||xpr).integre();
				if(isToBrowse && xpr.components) {
					var nComps = map(xpr.components, subRecur);
					if(chg) switch(behav.clone) {
						case 'itm': xpr = xpr.clone(nComps); break;
						case 'sub': xpr.compose(nComps); break;
						default:
							if(nComps) {
								if(isArray(xpr.components)) xpr.components.splice(0);
								merge(xpr.components, nComps);
							}
					} else xpr.integre();
				}
				if(behav[xpr.charact]) xpr = iif(behav[xpr.charact](xpr), xpr);
			} catch(err) {
				nul.exception.notice(err);
				if(behav.abort) xpr = behav.abort(xpr, err, this);
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
		if(attrChg) return attrChg.summarised().dirty();	//TODO: reléguer cette part au <behav>?
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
				try { if(xpr.freedom) return xpr.makeFrdm(this.kb); }
				finally { nul.debug.log('evals')(nul.debug.lcs.collapser('Entering'),xpr); }
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
					if(xpr.freedom && chgd) xpr = xpr.finalise(this.kb);
				} catch(err) {
					var rv = this.abort(xpr,err, orig);
					if(rv) return rv;
					throw nul.exception.notice(err);
				}
				xpr = chgd?xpr:null;
				nul.debug.log('evals')(nul.debug.lcs.endCollapser('Leave', 'Produce'),
					xpr?(xpr!=orig?[xpr, 'after', orig]:['modified', xpr]):orig);
				
				if(orig.freedom) {
					if(!chgd) this.kb.pop(orig.freedom);
					else xpr = this.kb.pop(xpr)||xpr;
				}
				return chgd?xpr:null;
				//TODO: seek for duplicatas
			},
			abort: function(xpr, err, orig) {
				if(nul.browse.abort== err) return;
				var abrtXpr;
				if(nul.failure== err && orig.fail) abrtXpr = orig.fail();
				nul.debug.log('evals')(nul.debug.lcs.endCollapser('Abort', 'Fail'),
					abrtXpr?(abrtXpr!=orig?[abrtXpr, 'after', orig]:['modified', abrtXpr]):orig);
				if(orig.freedom) this.kb.pop(orig.freedom);
				return abrtXpr;
			},
			browse: function(xpr) { return !xpr.freedom; },
			'kw': function(xpr) {
				xpr.known(xpr.components);
				while(xpr.flags.dirty) {
					var nprms = xpr.components.splice(0);
					kb.forget();
					while(0<nprms.length) {
						var prms = nprms.pop().evaluate(kb);
						if(prms.flags.failable) {
							if(['[]',':'].contains(prms.charact))
								for(var c=0; c<prms.components.length; ++c)
									delete prms.components[c].components.value;
							kb.knew(prms);
						}
					}
					xpr.components.value = xpr.components.value.evaluate(kb);
					xpr.summarised();
					xpr.known(xpr.components);
				}
				return xpr;
			},
			'{}': function(xpr) { return this.kw(xpr); }
		};
	},
};