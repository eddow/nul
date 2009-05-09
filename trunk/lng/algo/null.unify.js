/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
 
//<us>[...] appear in an expression like 'a = b' where they are both un-wrapped
// <us>s locals are distinct
//returns an expression or nothing if unification unchanged 
nul.unify = {
	/**
	 * Unify all the elements of 'us'.
	 * Returns
	 * - an array with less expressions: the ones that couldn't be unified 
	 * - nothing if no expression can be unified.
	 */
	multiple: function(us, klg) {
		//<us> : to try to unify
		//<uu> : cannot unify with unifion
		//<rv> : cannot unify with any past unifion
		//<unifion> : the item trying to unify
		us = clone1(us);
		var rv = [], uu = [], unifion, fUsLn = us.length;
		unifion = us.pop();
		while(0<us.length) {
			var unirv = null;
			while(0<us.length) {
				var unitry = us.pop();
				unirv = nul.unify.chewed(unitry, unifion, klg);
				if(unirv) break;
				uu.unshift(unitry);
			}
			if(unirv) {
				unifion = unirv;
				us.pushs(uu, rv);
				uu = [];
				rv = [];
			} else {
				rv.unshift(unifion);
				us.pushs(uu);
				uu = [];
				unifion = us.pop();
			}
		}
		rv.unshift(unifion);
		us.pushs(rv);
		if(fUsLn== rv.length) return;
		return us;
	}.perform('nul.unify.commutative'),

	/**
	 * Unify 'a' and 'b'.
	 * Returns the stereotype of the equivalence class.
	 */
	level: function(a, b, klg) {	//don't touch A & B; gather their ctx0 locals
		if(nul.debug.assert) assert(klg, 'Level without KLG shouldnt happen anymore');
		var rv = nul.unify.chewed(a, b, klg);
		if(rv) return rv;
		klg.know(new nul.xpr.unification([a,b]));	//TODO: le affect va refaire un chewed.
		return a;
	}.perform('nul.unify.level'),

	
	/**
	 * Try to unify the sub-components of 'a' and 'b'
	 * Returns :
	 * - an expression
	 * - nothing if this function couldn't manage
	 */
	subs: function(a, b, klg) {
		if(a.charact== b.charact) {
			if(a.ctxDef && b.ctxDef) {
				b.renameCtx(a.ctxDef);
				//TODO: faire le contraire !!! Utiliser le knowledge et
				// remplacer x[↵|ar1] = {blah} 
				// par ar1:(_[0|fc2] , x[↵|ar1]) = {blah}
				/*var nacn = nul.xpr.fuzzy.createCtxName();
				var lcl = new nul.xpr.local(nacn, nul.lcl.slf);
				a.expSelfRef(lcl, klg);
				b.expSelfRef(lcl, klg);
				a.ctxDef = b.ctxDef = nacn;*/
			} else if(a.ctxDef) a.expSelfRef(a.clone(), klg);
			else if(b.ctxDef) b.expSelfRef(b.clone(), klg);
			switch(a.charact) {
			case '{}':
				var ac = clone1(a.components);
				var bc = clone1(b.components);
				var brv = [], erv = [];
				
				while(ac.length && bc.length &&
					'fz'!= ac[0].charact &&
					'fz'!= bc[0].charact)

					brv.push(nul.unify.level(ac.shift(), bc.shift(), klg));
				while(ac.length && bc.length &&
					'fz'!= ac[ac.length-1].charact &&
					'fz'!= bc[bc.length-1].charact)
					erv.unshift(nul.unify.level(ac.pop(), bc.pop(), klg));
				if(bc.length < ac.length) { var t=ac; ac=bc; bc=t; }
				if(bc.length) {
					if(!(brv.length+erv.length)) return;
					nul.unify.level(
						new nul.xpr.set(ac, a.ctxDef),
						new nul.xpr.set(bc, b.ctxDef),
						klg);
					if(!ac.length && trys(bc, function()
							{ return !this.flags.failable; }))
						nul.fail('Unification failure : ' +
							a.dbgHTML() + ' and ' + b.dbgHTML());
				}
				return a.compose(brv.pushs(bc, erv));
			case '::':
				return a.compose(merge(a.components, b.components, function(a, b) {
					if(!a||!b) nul.fail('Attributes dont match');
					return nul.unify.level(a, b, klg);
				}));
			case ':-':
				return a.compose(merge(a.components, b.components, function(a, b) {
					return nul.unify.level(a, b, klg);
				}));
			}
		}
	}.perform('nul.unify.subs'),
	
	/**
	 * Used ViCe VerSa
	 * For particular expression, the unification can be shortcut.
	 * If 'a' is one of these peculiar expression, try the shortcut.
	 * Returns :
	 * - an expression
	 * - nothing if this function couldn't manage
	 */
	vcvs: function(a, b, klg) {
		if(a.ctxDef && a.used && a.used[nul.lcl.slf]) {
			var ctxd = a.clone().expSelfRef(b, klg);
			//if(ctxd) ctxd = ctxd.subjective();
			/*if(ctxd && !ctxd.contains(b))*/
			//nul.unify.level(ctxd, b, klg);
		}

		if('='== a.charact) return nul.unify.andDist(a.components, a.x, b, klg);

		if('[.]'== a.charact && a.components.object.finalRoot()) {
			if(!a.components.object.take)
				throw nul.semanticException('OPM', 'Cannot take from '+ a.components.object.toHTML());
			var trtk = a.components.object.take(b, klg, -1);
			if(trtk) {
				nul.unify.level(trtk, a.components.applied, klg);
				return b;
			}
			if(!a.components.object.transform()) {
				var rv = a.compose({applied: nul.unify.level(a.components.applied, b, klg)});
				return rv.operate(klg)||rv;
			}
		}
	}.perform('nul.unify.vcvs'),
	
	/**
	 * Unify 'a' and 'b'.
	 * Returns the unified expression or nothing if it cannot be unified now.
	 */
	chewed: function(a, b, klg) {
		a.inSet(b.belong);
		b.inSet(a.belong, 'replace');
		if(a.cmp(b)) return a;
		
		var rv = nul.unify.subs(a, b, klg);
		if(rv) return rv;

		rv = nul.unify.vcvs(a, b, klg);
		if(rv) return rv;
		rv = nul.unify.vcvs(b, a, klg);
		if(rv) return rv;

		//TODO: try extraction before fail ?
		//TODO: finir le système de finalRoot et fuzzy avec min/max poss?
		if(a.finalRoot() && b.finalRoot() && '{}'!= a.charact && '{}'!= b.charact)
			nul.fail('Unification failure : ' + a.dbgHTML() + ' and ' + b.dbgHTML());
	}.perform('nul.unify.chewed'),
	
	/**
	 * Unification of <b> with one member of table <as>
	 * <b> and <ax>(<as>' parent locals) are distinct
	 * Always returns an expression
	 */ 
	orDist: function(as, ax, b, klg) {
		var rv = [];
		for(var i=0; i<as.length; ++i) {
			var oa = as[i].aknlgd(function(klg) {
				return nul.unify.level(this, b.clone(), klg);
			});
			if(oa && !oa.failed) rv.push(oa);
		}
		return rv;
	}.perform('nul.unify.orDist'),
	
	/**
	 * Unification of <b> with each member of table <as>
	 * <b> and <ax>(<as>' parent locals) are distinct
	 * Always returns an expression
	 */ 
	andDist: function(as, ax, b, klg) {
		if('='!= b.charact) as.push(b); else as.pushs(b.components);
		var fl = as.length;
		as = nul.unify.multiple(as, klg) || as;

		if(as) switch(as.length) {
			case 1: return as[0];
			default: return new nul.xpr.unification(as);
		}
	}.perform('nul.unify.andDist')
};

