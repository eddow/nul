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
		return klg.affect([a,b]);
	}.perform('nul.unify.level'),

	
	/**
	 * Try to unify the sub-components of 'a' and 'b'
	 * Returns :
	 * - an expression
	 * - nothing if this function couldn't manage
	 */
	subs: function(a, b, klg) {
		if(a.charact== b.charact) {
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
				if(!bc.length) { var t=ac; ac=bc; bc=t; }
				if(bc.length) {
					if(ac.length)
						nul.unify.level(
							new nul.xpr.set(ac),
							new nul.xpr.set(bc),
							klg);
					else map(bc, function() { 
							klg.knew(new nul.xpr.not(this));
						});
				}
				return a.compose(brv.pushs(ac, erv));
			case '::':
				return a.compose(merge(a.components, b.components, function(a, b) {
					if(!a||!b) nul.fail('Attributes dont match');
					return nul.unify.level(a, b, klg);
				}));
			case ':-':
				return a.compose(merge(a.components, b.components, function(a, b) {
					return nul.unify.level(a, b, klg);
				}));
			/*case 'fz':
				return a.aknlgd(function(klg) {
					return nul.unify.level(this, b.stpUp(klg), klg)
				});*/
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
		if(a.arCtxName && !b.flags.fuzzy) {
			var srTt = {}, aNdx = a.ndx;
			srTt[nul.xpr.local.ndx(nul.lcl.slf, a.arCtxName)] = b;
			var ctxd = a.contextualise(klg, srTt);
			//TODO: can do better. unify.level(a,b) iif ctxd applied sth
			if(ctxd) ctxd = nul.unify.chewed(ctxd, b, klg);
			if(ctxd && ctxd.ndx != a.ndx) a = ctxd;
		}
		/*if('fz'== a.charact) {
			return nul.unify.level(a.stpUp(klg), b, klg);
			return a.aknlgd(function(klg) {
				return nul.unify.level(this, b, klg);
			});
		}*/
		if('='== a.charact) return nul.unify.andDist(a.components, a.x, b, klg);
		//Distribution in 'solve' but need here too. Epimenide forget premice if not
		if('[]'== a.charact) {
			var rv = nul.unify.orDist(a.components, a.x, b, klg);
			if(!rv) return;
			rv = new nul.xpr.ior3(rv);
			return rv.operate(klg)||rv;
			
		}

		if('[-]'== a.charact && a.components.object.finalRoot()) {
			if(!a.components.object.take)
				throw nul.semanticException('OPM', 'Cannot take from '+ a.components.object.toHTML());
			var trtk = a.components.object.take(b, klg, -1);
			if(trtk) return nul.unify.level(trtk, a.components.applied, klg);
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
		if(a.cmp(b)) return a;
		
		var rv = nul.unify.subs(a, b, klg);
		if(rv) return rv;

		rv = nul.unify.vcvs(a, b, klg);
		if(rv) return rv;
		rv = nul.unify.vcvs(b, a, klg);
		if(rv) return rv;

		//TODO: try extraction before fail ?
		if(a.finalRoot() && b.finalRoot())
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
			if(oa && !oa.flags.failed) rv.push(oa);
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

