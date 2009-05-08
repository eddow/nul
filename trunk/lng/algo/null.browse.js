/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/* browse behaviour defines:
- browse
- before(xpr)
* 	returns nothing to remain unchanged or something as new value to browse
- newSub(xpr, oldSub, newSub)
* 	A new sub-expression is produced (oldSub can be newSub)
- finish(xpr, chgd, orig)
* 	returns the final value, knowing the expresion, if it changed and the original expression
- abort(orig, err, xpr)
* 	returns nothing. Called instead of 'finish' when a problem occured. <willed> specifies if the abortion had been asked by the behaviour.
- <charact>(xpr)
* 	acts on a specific characterised expression
*/
nul.browse = {
	abort: 'stopBrowsingPlease',
	spaces: 0,
	expression: function(behav) {
		if(!behav.browseSpace) behav.browseSpace = ++nul.browse.spaces;
		var xpr = this, chg = false;
		function iif(nv, ov) {
			if(!nv) return ov;
			chg = true;
			return nv;
		}
		function subBrws() {
			if(nul.debug.assert) assert(this.browse, 'Sub is expressions');
			var co = iif(this.browse(behav), this);
			if(behav.newSub) co = behav.newSub(xpr, this, co) || co;
			return co;
		}

		if(this.browseSpace== behav.browseSpace) return;
		var inpNdx = this.ndx;
		if(!behav.tabul) behav.tabul = [{}];
		//for(var t=0; t<behav.tabul.length; ++t)
			if(behav.tabul[0][inpNdx]) switch(behav.tabul[0][inpNdx]) {
				case nul.failure: nul.fail('I remember...');
				case 'id': return;
				default: return behav.tabul[0][inpNdx].alsoInSets(this.belong);
			}
			//TODO: browse this.belong!
		var isToBrowse = 'undefined'== typeof behav.browse ||
						('function'== typeof behav.browse && behav.browse(xpr)) ||
						('function'!= typeof behav.browse && behav.browse);
		try {
			if(behav.before) xpr = iif(behav.before(xpr), xpr);
			if(isToBrowse && xpr.components) {
				var subTabul = 'fz'== xpr.charact;
				if(subTabul) behav.tabul.unshift({});
				try {
					var nxpr = behav.kb ?
						xpr.subRecursion(subBrws, behav.kb):
						behav.compose?
						behav.compose(xpr, map(xpr.components, subBrws)):
						xpr.compose(map(xpr.components, subBrws));
				} finally { if(subTabul) behav.tabul.shift(); }
				if(nxpr!== xpr) {
					xpr = nxpr;
					chg = true;
				}
			}
			if(behav[xpr.charact]) xpr = iif(behav[xpr.charact](xpr), xpr);
		} catch(err) {
			nul.exception.notice(err);
			if(behav.abort) xpr = behav.abort(xpr, err, this);
			else xpr = null;
			if(xpr) {
				xpr.browseSpace = behav.browseSpace;
				behav.tabul[0][inpNdx] = xpr;
				return xpr;
			}
			if(nul.browse.abort== err) {
				behav.tabul[0][inpNdx] = 'id';
				return;
			}
			throw err;
		}
		if(behav.finish) xpr = iif(behav.finish(xpr, chg, this), xpr);

		if(chg) {
			chg = false;
			var nbln = map(this.belong, function() {
				return iif(this.browse(behav), this);
			});
			if(chg) xpr.inSets(nbln);
			else chg = true;
		}
		if(chg) {
			xpr.browseSpace = behav.browseSpace;
			behav.tabul[0][inpNdx] = xpr;
			return xpr;
		} else behav.tabul[0][inpNdx] = 'id';
		nul.debug.log('perf')('Useless browse for '+behav.name,this);			
	}.perform(function(behav) { return 'nul.browse->recursion/'+behav.name; }),

	subjectivise: function(klg) {
		return {
			klg: klg,
			kb: [klg],
			name: 'subjectivisation',
			needMore: [],
			finish: function(xpr, chgd, orig) {
				var rv;
				if(xpr && xpr.subject) try {
					nul.debug.log('evals')(nul.debug.lcs.collapser('Subjective'),
						[this.klg.ctxName, xpr]);
					rv = xpr.subject(this.kb[0]);
					if(isArray(rv)) {
						if(isEmpty(xpr.fuzze) && isEmpty(xpr.deps,[this.klg.ctxName]))
							this.needMore.pushs(rv);
						rv = null;
					}
					return rv || xpr;					
				} catch(err) {
					if(nul.failure== err && orig.fail) return orig.fail();
					throw nul.exception.notice(err);
				} finally {
					nul.debug.log('evals')(nul.debug.lcs.endCollapser('Subjectived', 'Subjectivisation'),
						rv?[rv]:['unchanged']);
				}
				if(chgd) return xpr;
			},			
            abort: function(xpr, err, orig) {
                if(nul.browse.abort== err) return;
                var abrtXpr;
                if(nul.failure== err && orig.fail) abrtXpr = orig.fail();
                return abrtXpr;
            },
		};
	},

	contextualise: function(tt) {
		return {
			name: 'contextualisation',
			tt: tt,
			finish: function(xpr, chg) {
				if(this.tt[xpr.ndx]) return this.tt[xpr.ndx];
				if(chg) return xpr;
			}
		};
	},
	operated: function(klg) {
		return {
			name: 'operation',
			kb: klg?[klg]:[],
			before: function(xpr) {
				//TODO: throw stop.browsing ? Dirt system?
			},
			finish: function(xpr, chgd, orig) {
				var rv;
				if(xpr && xpr.operate) try {
					nul.debug.log('evals')(nul.debug.lcs.collapser('Operate'), [xpr]);
					rv = xpr.operate(this.kb[0]);
					return rv || xpr;					
				} catch(err) {
					if(nul.failure== err && orig.fail) return orig.fail();
					throw nul.exception.notice(err);
				} finally {
					nul.debug.log('evals')(nul.debug.lcs.endCollapser('Operated', 'Operation'),
						rv?[rv]:['unchanged']);
				}
				if(chgd) return xpr;
			}
		};
	},
	lclShft: function(inc, orgName, dstName) {
		return {
			name: 'local shifting',
			clone: 'itm',
			inc: inc,
			dstName: dstName || orgName,
			orgName: orgName,
			finish: function(xpr, chgd, orig) {
				if(xpr.ctxName == this.orgName) {
					//return new nul.xpr.local(this.dstName, xpr.lindx + this.inc, xpr.dbgName);
					xpr.ctxName = this.dstName;
					if('local'== xpr.charact && nul.lcl.slf!= xpr.lindx)
						xpr.lindx += this.inc;
					if(xpr.composed) xpr = xpr.composed();
					chgd = true;
				}
				if(chgd) return xpr;
			}
		};
	},
	clonage: function() {
		return {
			name:'clone',
			before: function(xpr) {
				return clone1(xpr);
			},
			finish: function(xpr, chg, orig) {
				if(xpr.cloned) xpr.cloned();
				return xpr;
			},
			compose: function(xpr, cs) {
				xpr.components = cs;
				return xpr;
			},
		};
	},
	belong: function(ndx, blngs) {
		return {
			name: 'belong',
			ndx: ndx,
			blngs: blngs,
			finish: function(xpr, chg) {
				if(ndx== xpr.ndx) return xpr.inSets(blngs);
				if(chg) return xpr;
			},
			compose: function(xpr, cs) {
				xpr.components = cs;
				return xpr;
			},
		};
	},
};