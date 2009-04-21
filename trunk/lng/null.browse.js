/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/* browse behaviour defines:
- browse
- before(xpr, kb)
* 	returns nothing to remain unchanged or something as new value to browse
- newSub(xpr, oldSub, newSub, kb)
* 	A new sub-expression is produced (oldSub can be newSub)
- finish(xpr, chgd, orig, kb)
* 	returns the final value, knowing the expresion, if it changed and the original expression
- abort(orig, err, xpr, kb)
* 	returns nothing. Called instead of 'finish' when a problem occured. <willed> specifies if the abortion had been asked by the behaviour.
- <charact>(xpr, kb)
* 	acts on a specific characterised expression
*/
nul.browse = {
	abort: 'stopBrowsingPlease',
	recursion: function(behav, kb) {
		var xpr = this, chg = false;
		function iif(nv, ov) {
			if(!nv) return ov;
			chg = true;
			return nv;
		}

		var isToBrowse = 'undefined'== typeof behav.browse ||
						('function'== typeof behav.browse && behav.browse(xpr)) ||
						('function'!= typeof behav.browse && behav.browse);
		try {
			if(behav.before) xpr = behav.before(xpr, kb)||xpr;
			if(isToBrowse && xpr.components) {
				var nkb = (xpr.enter&&(!kb || kb.fzx!== xpr))?xpr.enter():kb;
				try {
					var nComps = map(xpr.components, function() {
							if(nul.debug.assert) assert(this.browse, 'Sub is expressions');
							var co = iif(this.browse(behav, nkb), this);
							if(behav.newSub) co = behav.newSub(xpr, this, co) || co;
							return co;
						});
				} catch(err) {
					if(nkb !== kb) nkb.leave();
					throw nul.exception.notice(err);
				}
				if(chg) {
					if(nkb !== kb)
						xpr = iif(nkb.leave(nComps.value));
					else switch(behav.clone) {
						case 'itm': xpr = xpr.clone(nComps); break;
						default: xpr = xpr.compose(nComps); break;
					}
				} else if(nkb !== kb) nkb.leave();
			}
			if(behav[xpr.charact]) xpr = iif(behav[xpr.charact](xpr, kb), xpr);
		} catch(err) {
			nul.exception.notice(err);
			if(behav.abort) xpr = behav.abort(xpr, err, this, kb);
			else xpr = null;
			if(xpr) return xpr;
			if(nul.browse.abort== err) return;
			throw err;
		}
		if(behav.finish) { xpr = behav.finish(xpr, chg, this, kb); chg = true; }
		if(chg && xpr) xpr = xpr.summarised();

		if(chg && xpr) return xpr;
		nul.debug.log('perf')('Useless browse for '+behav.name,this);			
	}.perform(function(behav) { return 'nul.browse->recursion/'+behav.name; }),

	subjectivise: function() {
		return {
			name: 'subjectivisation',
			finish: function(xpr, chgd, ori, kb) {
				if(xpr.subject) {
					var rv = xpr.subject(kb);
					if(rv) {
						chgd = true;
						xpr = rv;
					}
				}
				if(chgd) return xpr;
			},			
            abort: function(xpr, err, orig, kb) {
                if(nul.browse.abort== err) return;
                var abrtXpr;
                if(nul.failure== err && orig.fail) abrtXpr = orig.fail();
                return abrtXpr;
            },
		};
	},

	contextualise: function(rpl, act) {
		return {
			name: 'contextualisation',
			rpl: rpl,
			act: act,
			eqProtect: [0],
			before: function(xpr, kb) {
				//TODO: throw stop.browsing ?
				if('='== xpr.charact) this.eqProtect.unshift(0);
				else --this.eqProtect[0];
			},
			finish: function(xpr, chgd, orig, kb) {
				xpr.summarised();
				if(chgd && this.act) xpr.dirty();
				if((0!= ++this.eqProtect[0] || 'knwl'!= this.act) && this.rpl[xpr.ndx])
					return this.rpl[xpr.ndx];
				if('='== orig.charact) this.eqProtect.shift();
				if(chgd) {
					if(!xpr || !xpr.operate || !kb) return xpr;
					return xpr.operate(kb) || xpr;
				}
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