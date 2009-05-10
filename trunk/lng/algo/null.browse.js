/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.browse = {
	/**
	 * Browsing behaviour
	 */
	behav: Class.create({
		initialize: function() {
			this.browseSpace = ++nul.browse.spaces;
			this.tabul = [{}];
		},
		/**
		 * An expression is going to get browsed
		 * <xpr> is the that is going to be browsed
		 * returns weither <xpr> is changed
		 */
		before: function(xpr) {},
		/**
		 * An expression is finished browsing
		 * <xpr> is the that is finished browsing
		 * <chg> is weither <xpr> components changed or the expression was changed by 'before'
		 * <fail> is the fail function of the original expression
		 * returns weither <xpr> is changed
		 */
		finish: function(xpr, chd, fail) { return chg; },
		/**
		 * An expression failed while browsing
		 * <xpr> is the that just failed
		 * <err> is the failure cause (what has been thrown)
		 * <fail> is the fail function of the original expression
		 * returns weither <xpr> is a return value. If not, <err> will be propagated 
		 */
		abort: function(xpr, err, fail) {},
		/**
		 * An expression component is changed
		 * <xpr> is the that is browsed
		 * <sub> is the component that changed
		 * <ndx> is the index of the changed component
		 * returns weither <sub> is changed
		 */
		newSub: function(xpr, sub, ndx) {},
		/**
		 * Determine weither an expression' components have to be browsed
		 * <xpr> is the expression that is browsed
		 * returns weither the components of <xpr> have to be browsed
		 * NOTE: it can be replaced by a boolean value
		 */
		browse: function(xpr) { return true; },

		/**
		 * Put a value in expression' computing cache
		 * <xpr> is the expression that have been browsed
		 * <v> any value that has to be stored for this expression
		 */
		cache: function(xpr, v) {
			xpr.cachedComp.bs = this.browseSpace;
			xpr.cachedComp.bsv = v;
		},

		/**
		 * Get a value in expression' computing cache
		 * <xpr> is the expression that is browsed
		 * returns the value <v> given by 'cache'
		 */
		cached: function(xpr) {
			if(xpr.cachedComp.bs == this.browseSpace) return xpr.cachedComp.bsv;
		},
		
		/**
		 * Compose an expression, the components are just browsed
		 * <xpr> is the expression that is browsed
		 * <cps> is the new components
		 */
		composed: function(xpr) {
			xpr.composed();
		},
		/**
		 * Can also define functions wearing the name of a charact.
		 * These functions will be called with (xpr, chg) after 'sub-browse' and before 'finish'
		 * <xpr> is the that is browsed
		 * <chg> is weither <xpr> components changed or the expression was changed by 'before'
		 */
	}),
		
	abort: 'stopBrowsingPlease',
	spaces: 0,	//TODO: le système de compCache remplace le browseSpace, remove this!
	expression: function(behav) {
		var xpr = this, chg = false;
		var failer = this.fail;
		function subBrws(ndx) {
			if(nul.debug.assert) assert(this.browse, 'Sub is expressions');
			var co = this.browse(behav);
			if(behav.newSub) co = co || behav.newSub(xpr, this, ndx);
			return co;
		}

		var inpNdx = this.ndx;
		if(behav.tabul && behav.tabul[0][inpNdx]) switch(behav.tabul[0][inpNdx]) {
			case nul.failure: nul.fail('I remember...');
			case 'id': return;
			default:
				return this.replaceBy(
					behav.tabul[0][inpNdx].inSet(this.belong) ||
					behav.tabul[0][inpNdx]);
		}
		var chcd = behav.cached(this);
		if(chcd) {
			if(behav.tabul) behav.tabul[0][inpNdx] = 'id';
			return chcd.chg == behav.browseSpace;
		}
		try {
			chg = behav.before(this);
			if(this.components && ('function'== typeof behav.browse ? behav.browse(this) : behav.browse)) {
				var subTabul = 'fz'== this.charact, schg = false;
				if(behav.tabul && subTabul) behav.tabul.unshift({});
				try {
					if(behav.kb) schg = this.subRecursion(subBrws, behav.kb);
					else if(schg = cnt(this.components, subBrws)) behav.composed(this);
				} finally { if(behav.tabul && subTabul) behav.tabul.shift(); }
				chg |= !!schg;
			}
			if(behav[this.charact]) chg |= !!behav[this.charact](this);
		} catch(err) {
			nul.exception.notice(err);
			if(behav.abort && behav.abort(this, err, failer)) {
				if(behav.tabul) behav.tabul[0][inpNdx] = this;
				behav.cache(this, {chg: true});
				return 'aborted';
			}
			if(nul.browse.abort== err) {
				if(behav.tabul) behav.tabul[0][inpNdx] = 'id';
				behav.cache(this, {});
				return;
			}
			if(nul.failure== err & behav.tabul) behav.tabul[0][inpNdx] = err;
			throw err;
		}
		chg = behav.finish(this, chg, failer);

		if(this.belong) {
			var bchg = this.belong.browse(behav);
			if(bchg) {
				this.inSet(this.belong, 'replace');
				chg = true;
			}
		}
		behav.cache(xpr, {chg: behav.browseSpace});
		if(chg) {
			if(behav.tabul) behav.tabul[0][inpNdx] = xpr;
			return xpr;
		}
		if(behav.tabul) behav.tabul[0][inpNdx] = 'id';
		nul.debug.log('perf')('Useless browse for '+behav.name,this);			
	}.perform(function(behav) { return 'nul.browse->recursion/'+behav.name; }),
};

nul.browse.subjectivise = Class.create(nul.browse.behav, {
	initialize: function($super, klg) {
		this.kb = [this.klg = klg];
		return $super();
	},
	name: 'subjectivisation',
	needMore: [],
	cache: function(xpr, v) {
		if(!xpr.cachedComp['subject']) xpr.cachedComp['subject'] = {};
		xpr.cachedComp['subject'][this.klg.ctxName] = v;
	}, 
	cached: function(xpr) {
		if(xpr.cachedComp['subject']) return xpr.cachedComp['subject'][this.klg.ctxName];
	}, 
	finish: function(xpr, chg, failer) {
		if(!xpr || !xpr.subject) return chg;
		var rv;
		try {
			nul.debug.log('evals')(nul.debug.lcs.collapser('Subjective'),
				[this.klg.ctxName, xpr]);
			rv = xpr.subject(this.kb[0]);
			if(isArray(rv)) {
				if(isEmpty(xpr.fuzze) && isEmpty(xpr.deps,[this.klg.ctxName]))
					this.needMore.pushs(rv);
				return false;
			}
			return rv;					
		} catch(err) {
			if(nul.failure== err && failer) return rv = xpr.replaceBy(failer());
			throw nul.exception.notice(err);
		} finally {
			nul.debug.log('evals')(nul.debug.lcs.endCollapser('Subjectived', 'Subjectivisation'),
				rv?[rv]:['unchanged']);
		}
	},			
    abort: function(xpr, err, failer) {
        if(nul.failure== err && failer) return xpr.replaceBy(failer());
    },
});

nul.browse.contextualise = Class.create(nul.browse.behav, {
	initialize: function($super, tt) {
		this.tt = tt;
		$super();
		this.tabul = false;
	},
	name: 'contextualisation',
	finish: function(xpr, chg) {
		if(this.tt[xpr.ndx]) {
			if(this.tt[xpr.ndx].ndx == xpr.ndx &&	//TODO: simplement éviter de spécifier des a=>a/belong mais utiliser browse.belong
				(!!this.tt[xpr.ndx].belong == !!xpr.belong) &&
				(!xpr.belong || this.tt[xpr.ndx].belong.ndx == xpr.belong.ndx))
					return chg;
			return xpr.replaceBy(this.tt[xpr.ndx]);	//TODO: on remplace dans les égalités de knowledge aussi !!
			//Note: pas le choix (on ne retourne plus d'expression) donc il faut trouver un autre syst
			// cloner ls égalités du knowledge au préalable ?
		}
		return chg;
	}
});

nul.browse.operated = Class.create(nul.browse.behav, {
	initialize: function($super, klg) {
		this.kb = klg?[klg]:[];
		return $super();
	},
	name: 'operation',
	cache: function(xpr, v) { xpr.cachedComp['operation'] = v; }, 
	cached: function(xpr) { return xpr.cachedComp['operation']; }, 
	finish: function(xpr, chg, failer) {
		if(!xpr || !xpr.operate) return chg;
		var rv;
		try {
			nul.debug.log('evals')(nul.debug.lcs.collapser('Operate'), [xpr]);
			return rv=xpr.operate(this.kb[0]);
		} catch(err) {
			if(nul.failure== err && failer) return rv = xpr.replaceBy(failer());
			throw nul.exception.notice(err);
		} finally {
			nul.debug.log('evals')(nul.debug.lcs.endCollapser('Operated', 'Operation'),
				rv?[rv]:['unchanged']);
		}
	}
});

nul.browse.lclShft = Class.create(nul.browse.behav, {
	initialize: function($super, inc, orgName, dstName) {
		this.inc = inc;
		this.dstName = dstName || orgName;
		this.orgName = orgName;		
		return $super();
	},
	name: 'local shifting',
	finish: function(xpr, chg) {
		if(xpr.ctxName == this.orgName) {
			//return new nul.xpr.local(this.dstName, xpr.lindx + this.inc, xpr.dbgName);
			xpr.ctxName = this.dstName;
			if('local'== xpr.charact && nul.lcl.slf!= xpr.lindx)
				xpr.lindx += this.inc;
			if(xpr.composed) xpr = xpr.composed();
			return true;
		}
		return chg;
	}
});

nul.browse.clonage = Class.create(nul.browse.behav, {
	name:'clone',
	before: function(xpr) {
		return clone1(xpr);
	},
	finish: function(xpr, chg) {
		if(xpr.cloned) xpr.cloned();
		return true;
	},
	compose: function(xpr, cs) {
		xpr.components = cs;
	},
});

nul.browse.belong = Class.create(nul.browse.behav, {
	initialize: function($super, ndx, blngs) {
		this.ndx = ndx;
		this.blngs = blngs;
		return $super();
	},
	name: 'belong',
	finish: function(xpr, chg) {
		if(ndx== xpr.ndx) return xpr.inSet(blngs);
		return chg;
	},
	composed: function(xpr) {},
});

nul.browse.solve = Class.create(nul.browse.behav, {
	initialize: function($super, cn, ctxName) {
		this.browse = true;
		this.ctxName = ctxName;
		this.cn = cn;
		this.kb = [];
		$super();
		this.tabul = false;
	},
	name: 'solve try',
	cache: function(xpr, v) {
		if(!xpr.cachedComp['solve']) xpr.cachedComp['solve'] = {};
		xpr.cachedComp['solve'][this.cn] = v;
	}, 
	cached: function(xpr) {
		if(xpr.cachedComp['solve']) return xpr.cachedComp['solve'][this.cn];
	}, 
	before: function(xpr) {
		if(!this.browse /*|| ('{}'==xpr.charact && this.klg)*/)
			throw nul.browse.abort;
		if(xpr.possibility && this.ctxName == xpr.ctxName) {
			this.browse = false;
			nul.debug.log('solve')('Choose',[this.cn, 'out of', xpr]);
			var rv = xpr.possibility(this.cn, this.kb[0]);
			if(rv) return xpr.replaceBy(rv);
			this.cn = 'end';
		} 
	},
	finish: function(xpr, chg) {
		return chg || (!this.browse && 'end'!= this.cn);
	},
});