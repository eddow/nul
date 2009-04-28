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
	expression: function(behav, noOwnBS) {
		if(!noOwnBS) behav.browseSpace = ++nul.browse.spaces;
		var xpr = this, chg = false;
		function iif(nv, ov) {
			if(!nv) return ov;
			chg = true;
			return nv;
		}

		if(this.browseSpace== behav.browseSpace) return;

		var isToBrowse = 'undefined'== typeof behav.browse ||
						('function'== typeof behav.browse && behav.browse(xpr)) ||
						('function'!= typeof behav.browse && behav.browse);
		try {
			if(behav.before) xpr = behav.before(xpr)||xpr;
			if(isToBrowse && xpr.components) {
				var nxpr = xpr.subRecursion(function() {
					if(nul.debug.assert) assert(this.browse, 'Sub is expressions');
					var co = iif(this.browse(behav, 'nocs'), this);
					if(behav.newSub) co = behav.newSub(xpr, this, co) || co;
					return co;
				}, behav.kb);
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
				return xpr;
			}
			if(nul.browse.abort== err) return;
			throw err;
		}
		if(behav.finish) { xpr = behav.finish(xpr, chg, this); chg = true; }

		if(chg && xpr) {
			xpr.browseSpace = behav.browseSpace;
			return xpr;
		}
		nul.debug.log('perf')('Useless browse for '+behav.name,this);			
	}.perform(function(behav) { return 'nul.browse->recursion/'+behav.name; }),

	subjectivise: function(klg, kb) {
		return {
			klg: klg,
			kb: kb||[],
			name: 'subjectivisation',
			finish: function(xpr, chgd, ori) {
				if(xpr.subject) {
					var rv = xpr.subject(this.klg, this.kb[0]);
					if(rv) {
						chgd = true;
						xpr = rv;
					}
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

	contextualise: function(klg, rpl, act) {
		return {
			name: 'contextualisation',
			rpl: rpl,
			act: act,
			kb: klg?[klg]:[],
			eqProtect: [-1],
			before: function(xpr) {
				//TODO: throw stop.browsing ?
				if('='== xpr.charact) this.eqProtect.unshift(0);
				else --this.eqProtect[0];
			},
			finish: function(xpr, chgd, orig) {
				xpr.summarised();
				if((0!= ++this.eqProtect[0] ||
					'knwl'!= this.act || 1<this.kb.length) &&
						this.rpl[xpr.ndx])
					return this.rpl[xpr.ndx];
				if('='== orig.charact) this.eqProtect.shift();
				if(xpr && xpr.operate) {
					var rv = xpr.operate(this.kb[0]);
					chgd |= !!rv;
					xpr = rv || xpr;					
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
			local: function(xpr) {
				if(xpr.ctxName == this.orgName)
					return new nul.xpr.local(this.dstName, xpr.lindx + this.inc, xpr.dbgName);
			}.perform('nul.lclShft->local')
		};
	},
};