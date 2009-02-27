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
	multiple: function(us, kb, lcls) {
		us = map(us, function(u) { return u.lclsUpg(lcls, kb) });
		return kb.knowing(us, function(kb) {
			
			function moveKnown(lfr, lto, kb) {
				var trv;
				for(var i=0; i<lfr.length;) {
					trv = lfr[i].finalize(kb);
					if(trv) { lto.unshift(unirv); lfr.splice(i,1); }
					else ++i;
				}
			}
			
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
					seConcat(us, uu);
					seConcat(us, rv);
					uu = [];
					rv = []
					us = map(us, function(u) { return u.finalize(kb) || u; });
				} else {
					rv.unshift(unifion);
					us = uu;
					uu = [];
					unifion = us.pop();
				}
			}
			rv.unshift(unifion);
			if(fUsLn== rv.length) return;
			return rv;
		});
	}.perform('nul.unify.multiple'),
	
	//<a> and <b> are on the same level
	//locals are distinct
	//always returns an expression 
	level: function(a, b, kb) {	//don't touch A & B; gather their ctx0 locals
		var rv = nul.unify.chewed(a, b, kb);
		if(rv) return rv;
		var lvlRef;
		if(nul.debug.levels) lvlRef = a.locals.prnt || a.locals.lvl;
		return nul.build().unification([a.wrap(kb),b.wrap(kb)])
			.numerise(lvlRef).clean();
	}.perform('nul.unify.level'),
	
	//<a> and <b> are on the same level, one more down than <kb>
	subd: function(a, b, kb) {	//Do this in a lower context
		return kb.knowing([a, b], function(kb) { return nul.unify.level(a, b, kb); });
	}.perform('nul.unify.subd'),
	
	//<a> and <b> are on the same level. Only unify component <c>
	//locals are the same but component locals are distinct
	//always returns an expression 
	sub: function(a, b, c, kb) {	//Do this in a lower context
		return nul.unify.subd(a.components[c], b.components[c], kb);
	}.perform('nul.unify.sub'),
	
	//<a> is a level lower than <b> and <b> need to get down to unify in a sub-context
	//locals are distinct
	//returns same level than <a>
	//always returns an expression
	sub1: function(a, b, kb) {	//Do this in a lower context
		return nul.unify.subd(a, b.wrap(kb), kb);
	}.perform('nul.unify.sub1'),
	
	//Used vice versa
	//<a> and <b> are on the same level
	//locals are distinct
	//returns an expression or nothing if it is sure nothing is manageable or 'unk' if this function couldn't manage 
	vcvs: function(a, b, kb) {
		if(';'== a.charact) {
			a.components.push(nul.unify.sub1(a.components.pop(), b, kb));
			return a.summarised();
		}
	
		if('[]'== a.charact) return nul.unify.orDist(a.components, a.locals, b, kb);
		if('='== a.charact) return nul.unify.andDist(a.components, a.locals, b, kb);
		if(':-'== a.charact) {
			return a.modify({
				parms: nul.unify.sub1(a.components.parms, b, kb),
				value: a.components.value
			}).summarised();
		}
		return 'unk';
	}.perform('nul.unify.vcvs'),
	
	//<a> and <b> are on the same level
	//Try to make a components to components unification
	//locals are distinct
	//returns an expression or nothing if it is sure nothing is manageable or 'unk' if this function couldn't manage 
	subs: function(a, b, kb) {
	
		//<a> is choosen abitrarily. Take care here of the attributes. :*
		if(a.value && b.value && a.value===b.value) return a;
		if(','== a.charact && ','== b.charact && a.components.length == b.components.length) {
			b = b.lclShft(a.locals);
			var rv = [];
			for(var i=0; i<a.components.length; ++i)
				rv.push(nul.unify.sub(a, b, i, kb));
			return a.modify(rv).summarised();
		}
		if(':-'== a.charact && ':-'== b.charact) {
			b = b.lclShft(a.locals);
			return a.modify({
					parms: nul.unify.sub(a, b, 'parms', kb),
					value: nul.unify.sub(a, b, 'value', kb)
				}).withLocals(a.locals).summarised();
		}
		if('{}'== a.charact && '{}'== b.charact ) {
			b = b.lclShft(a.locals);
			//TODO: {1 [] 2 [] 3} = {3 [] 4 [] 5} vaut ? (fail indeed) 
			return a.modify([nul.unify.sub(a, b, 0, kb)]).withLocals(a.locals).summarised();
		}
		return 'unk';
	}.perform('nul.unify.subs'),
	
	digg: function(a, b, kb) {
		var rv = nul.unify.subs(a, b, kb);
		if('unk'!== rv) return rv?rv.addAttr(kb, a, b):rv;

		rv = nul.unify.vcvs(a, b, kb);
		if('unk'!== rv) return rv?rv.addAttr(kb, a, b):rv;
		rv = nul.unify.vcvs(b, a, kb);
		if('unk'!== rv) return rv?rv.addAttr(kb, a, b):rv;

		if(kb.affectable(a)) return kb.affect(a, b);
		if(kb.affectable(b)) return kb.affect(b, a);
		
		return 'unk';
	}.perform('nul.unify.digg'),
	
	//<a> and <b> are on the same level
	//<a> and <b> have distinct locals
	//returns an expression or nothing if unification unchanged 
	chewed: function(a, b, kb) {
		if(nul.debug.levels) assert(a.locals.lvl==b.locals.lvl, 'Unification levels : '+a.locals.lvl+' and '+b.locals.lvl)
	
		try {
			var rv = nul.unify.digg(a, b, kb);
			if('unk'== rv) {
				var ar = !!(a.deps[0] && a.deps[0][nul.lcl.slf]);
				var br = !!(b.deps[0] && b.deps[0][nul.lcl.slf]);
				if(ar ^ br) {
					var fa = a;
					if(ar) a = a.rDevelop(b).numerise(a).evaluate(kb);
					if(br) b = b.rDevelop(fa).numerise(b).evaluate(kb);
					rv = nul.unify.digg(a, b, kb);
				}
			}
			if('unk'!= rv) return rv;

			if(a.free() && b.free()) nul.fail('Unification failure');
		} catch(err) {
			nul.exception.notice(err);
			//Localisation failure means a localcannot be affected because of context position
			//  (see browse.localise throwing nul.unlocalisable)
			//If localisation failure, then the unification cannot be stored in the KB.
			// In this case, just returns the unification as it is first expressed
			if(err!=nul.unlocalisable) throw err;
		}
	}.describe(function(a, b, kb) { return 'Unifying '+a.toHTML()+' and '+b.toHTML(); })
	.perform('nul.unify.chewed'),
	
	//unification of <b> with one member of table <as>
	//<b> and <alcls>(<as>' parent locals) are distinct
	//always returns an expression 
	orDist: function(as, alcls, b, kb) {
		var rv = kb.trys(
			'OR distribution', as, alcls,
			function(c, kb) { return nul.unify.sub1(c, b.clone(), kb); });
		if(nul.debug.assert) assert(rv, 'orDist use')
		if(!isArray(rv)) return rv;
		return nul.build(alcls).or3(rv).clean();
	}.perform('nul.unify.orDist'),
	
	//unification of <b> with each member of table <as>
	//<b> and <alcls>(<as>' parent locals) are distinct
	//always returns an expression 
	andDist: function(as, alcls, b, kb) {
		if('='== b.charact) {
		//optimisation : (a=b=c) = (d=e=f) ==> (a=b=c=d=e=f)
			b = b.lclShft(alcls);
			as = as.concat(b.components);
		} else as.push(b.wrap(kb));
		as = nul.unify.multiple(as, kb, alcls) || as;

		if(1== as.length) {
			as = as[0].stpUp(alcls, kb);
			return as;
		}

		return nul.build(alcls).unification(as);
	}.perform('nul.unify.andDist')
};