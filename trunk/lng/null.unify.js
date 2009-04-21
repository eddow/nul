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
	multiple: function(us, kb) {
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
				unirv = nul.unify.chewed(unitry, unifion, kb);
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
	level: function(a, b, kb) {	//don't touch A & B; gather their ctx0 locals
		if(!a ^ !b) return a||b;
		if(nul.debug.assert) assert(kb, 'Level without KB shouldnt happen anymore');
		var rv = nul.unify.chewed(a, b, kb);
		if(rv) return rv;
		return kb.affect([a,b]);
	}.perform('nul.unify.level'),

	
	/**
	 * Try to unify the sub-components of 'a' and 'b'
	 * Returns :
	 * - an expression
	 * - nothing if this function couldn't manage
	 */
	subs: function(a, b, kb) {
		if(a.charact== b.charact) {
			switch(a.charact) {
			case '{}':
				if(a.components.length > b.components.length) { var t=a; a=b; b=t; }
				if(a.components.length!= b.components.length && !a.components.follow)
					nul.fail('List length already dont fit');
				var rv = [];
				for(var i=0; i<a.components.length; ++i)
					rv.push(nul.unify.level(a.components[i], b.components[i], kb));
				b = b.clone1();
				b.components.splice(0,i);
				if(0==b.components.length) b = b.components.follow;
								
				if(a.components.follow)
					rv.follow = nul.unify.level(a.components.follow, b, kb)
				else if(b)
					rv.follow = nul.unify.level(new nul.xpr.set(), b, kb)
				rv = a.compose(rv);
				return rv;
			case '::':
				return a.compose(merge(a.components, b.components, function(a, b) {
					if(!a||!b) nul.fail('Attributes dont match');;
					return nul.unify.level(a, b, kb);
				}));
			case ':-':
				return a.compose(merge(a.components, b.components, function(a, b) {
					return nul.unify.level(a, b, kb);
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
	vcvs: function(a, b, kb) {
		if('='== a.charact) return nul.unify.andDist(a.components, a.x, b, kb);
		//Distribution in 'solve' but need here too. Epimenide forget premice if not
		if('[]'== a.charact) {
			var rv = nul.unify.orDist(a.components, a.x, b, kb);
			if(!rv) return;
			rv = nul.xpr.build(nul.xpr.ior3, rv);
			return rv.operate(kb)||rv;
			
		}

		if('[-]'== a.charact && a.components.object.finalRoot()) {
			if(!a.components.object.take)
				throw nul.semanticException('OPM', 'Cannot take from '+ a.components.object.toHTML());
			var trtk = a.components.object.take(b, kb, -1);
			if(trtk) return nul.unify.level(trtk, a.components.applied, kb).dirty();
			if(!a.components.object.transform()) {
				var rv = a.compose({applied: nul.unify.level(a.components.applied, b, kb)});
				return rv.operate(kb)||rv;
			}
		}
	}.perform('nul.unify.vcvs'),
	
	/**
	 * Unify 'a' and 'b'.
	 * Returns the unified expression or nothing if it cannot be unified now.
	 */
	chewed: function(a, b, kb) {
		if(a.cmp(b)) return a;
		
		var rv = nul.unify.subs(a, b, kb);
		if(rv) return rv;

		rv = nul.unify.vcvs(a, b, kb);
		if(rv) return rv;
		rv = nul.unify.vcvs(b, a, kb);
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
	orDist: function(as, ax, b, kb) {
		var rv = [];
		for(var i=0; i<as.length; ++i) {
			var kwf;
			var oa = as[i];
			var ob = b.clone();
			if('fz'==oa.charact) {
				kwf = oa.dirty();
				kwf.components.value = new nul.xpr.unification([oa.components.value, ob]);
			} else	//TODO: y'a plus de kwFreedom !
				kwf = new nul.xpr.kwFreedom(new nul.xpr..unification([oa, ob])).dirty();
			//TODO: if kw:fail, don't push do you ?
			//But react then nicely if rv == []
			rv.push(kwf.evaluate(kb));
		}
		return rv;
	}.perform('nul.unify.orDist'),
	
	/**
	 * Unification of <b> with each member of table <as>
	 * <b> and <ax>(<as>' parent locals) are distinct
	 * Always returns an expression
	 */ 
	andDist: function(as, ax, b, kb) {
		if('='!= b.charact) as.push(b); else as.pushs(b.components);
		var fl = as.length;
		as = nul.unify.multiple(as, kb) || as;

		if(as) switch(as.length) {
			case 1: return as[0];
			default: return new nul.xpr.unification(as);
		}
	}.perform('nul.unify.andDist')
};

