/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**
 * Utility functions to access a fuzzy expression as a knowledge
 */
nul.knowledge = Class.create({
	initialize: function(fzx) {
		this.access = {};
		this.fzx = fzx;
		for(var n=0; n<this.fzx.components.length; ++n) this.makeAccess(n);
	},
/////// Premices management
	forget: function(sn) {
		if('undefined'== typeof sn) {
			this.fzx.components.splice(0);
			this.access = {};
		} else {
			for(var x in this.access) {
				if(this.access[x] == sn) delete this.access[x];
				else if(this.access[x] > sn) --this.access[x];
			}
			return this.fzx.components.splice(sn, 1)[0];
		}
	},
	knew: function(premices) {
		if(!isArray(premices)) premices = [premices];
		while(0<premices.length) {
			var p = premices.pop();
			if(p.flags.failable) this.fzx.components.push(this.makeAccess(p));
		}
		return this;
	},
	makeAccess: function(pn, pval) {
		if('undefined'== typeof pval) {
			if('object'== typeof pn) {
				pval = pn;
				pn = this.fzx.components.length;
			} else pval = this.fzx.components[pn];
		}
		if('='== pval.charact)
			for(var c=0; c<pval.components.length; ++c)
				this.access[pval.components[c].ndx] = pn;
		return pval;
	},
/////// Locals management
	addLocals: function(locals) {
		if(!isArray(locals)) locals = [locals];
		this.fzx.locals.pushs(locals);
		return this.fzx.locals.length-locals.length;
	},
/////// Algorythms

	/**
	 * Create an equivalence class.
	 */
	affect: function(us) {
		//Merge equalities if needed
		var eqClass = [];
		var eqClassNdx = {};
		var merged = false;
		for(var n=0; n<us.length; ++n) {
			var fpn, eqi;
			if('undefined'!= typeof(fpn= this.access[us[n].ndx])) {
				merged = true;
				eqi = this.forget(fpn).components;
				eqi.push(us[n]);
			} else eqi = [us[n]];
			var eq;
			while(0<eqi.length) if(!eqClassNdx[(eq = eqi.pop()).ndx]) {
				eqClassNdx[eq.ndx] = true;
				eqClass.push(eq);
			}
		}

		us = eqClass;
		if(merged) {
			var rv = nul.unify.multiple(us, this);
			if(rv && 1== rv.length) return rv[0];
			if(rv) us = rv;
		}
		//Sort to have a nice 'replace-by'. note: replaceBy = left-ward
		//free variables goes left
		for(var n=1; n<us.length; ++n)
			if(isEmpty(us[n].deps))
				us.unshift(us.splice(n,1)[0]);
		//If left-ward is a local, try to put another value (not local) leftward
	 	if('local'== us[0].charact) {
	 		for(var n=1; n<us.length; ++n) if('local'!= us[n].charact) break;
	 		if(n<us.length) us.unshift(us.splice(n,1)[0]);
	 	}
	 	//Don't replace X by a value that refer X : if it occurs, contextualise into self-reference
	 	do {
	 		for(var n=1; n<us.length; ++n) if(us[0].contains(us[n])) break;
	 		if(n<us.length) us[0].setSelfRef(us[n]);
	 	} while(n<us.length);

		nul.debug.log('knowledge')('Equivals', us);

		var rv = us[0];
		var unf = new nul.xpr.unification(us).summarised();
		this.knew(unf);
		return rv;
	},
	leave: function(value) {
		nul.debug.log('ctxs')(nul.debug.lcs.endCollapser('Leave', 'Ctx'));
		try {
			if(!value) nul.fail();
			this.fzx.components.value = value;
			var rv = this.fzx;
	
			rv = rv.simplify(this);
			if('fz'!= rv.charact) return rv;
			rv = rv.browse(nul.browse.subjectivise()) || rv;
			if('fz'!= rv.charact) return rv;
			rv = rv.concentrate();
			if('fz'!= rv.charact) return rv;
			rv = rv.relocalise(this);
			if('fz'!= rv.charact) return rv;
			rv = rv.composed();
		} catch(err) {
			if(nul.failure!= err) throw nul.exception.notice(err);
			delete this.fzx.components;
			this.fzx.locals = [];
			return this.fzx; 
		}
		return rv;
	}
});