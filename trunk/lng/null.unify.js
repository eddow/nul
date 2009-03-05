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
	multiple: function(us, kb, x, way) {
		if(!way) return nul.unify.commutative(us, kb, x)
		return nul.unify.ncommutative(us, kb, x, way);
	},
	//Commutative algorithm
	commutative: function(us, kb, x) {
	
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
				rv = []
				//map(us, function(i) { us[i] = us[i].finalise(kb) || us[i]; });
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
		return rv;
	}.perform('nul.unify.commutative'),
	ncommutative: function(us, kb, x, way) {
		var unifion = us.shift();
		var rv = [];
		while(0<us.length) {
			var unitry = nul.unify.chewed(unifion, us[0], kb, way);
			if(unitry) {
				unifion = unitry;
				us.shift();
			} else {
				rv.push(unifion);
				unifion = us.shift()
			}
		}
		rv.push(unifion);
		us.pushs(rv);
		return rv;
	}.perform('nul.unify.ncommutative'),
/*ways:
 *  0: don't care
 *  1: a = b
 * -1: b = a 
*/
	//<a> and <b> share their locals
	//always returns an expression 
	level: function(a, b, kb, way) {	//don't touch A & B; gather their ctx0 locals
		if(!a ^ !b) return a||b;
		way = way||0;
		if(!kb) return nul.build.unification([a,b], way);
		return nul.unify.chewed(a, b, kb, way) ||
			nul.build.unification([a,b], way).clean();
	}.perform('nul.unify.level'),

	//Only unify component <c>
	//<a> and <b> share their locals
	//always returns an expression 
	sub: function(a, b, c, kb, way) {	//Do this in a lower context
		return nul.unify.level(a.components[c], b.components[c], kb, way);
	}.perform('nul.unify.sub'),
	
	//<a> and <b> are on the same level
	//Try to make a components to components unification
	//locals are distinct
	//returns an expression or nothing if it is sure nothing is manageable or 'unk' if this function couldn't manage 
	subs: function(a, b, kb, way) {
		if(','== a.charact && ','== b.charact) {
			if(a.components.length > b.components.length) { var t=a; a=b; b=t; }
			if(a.components.length== b.components.length || a.components.follow) {
				var rv = [];
				for(var i=0; i<a.components.length; ++i)
					rv.push(nul.unify.sub(a, b, i, kb, way));
				b.components.splice(0,i);
				var bx = b.x;
				if(0==b.components.length) b = b.components.follow;				
				if(a.components.follow)
					rv.follow = nul.unify.level(a.components.follow, b, kb, way)
				else if(b)
					rv.follow = nul.unify.level(nul.build.set(), b, kb, way)
				rv = a.compose(rv).summarised().xadd(bx, kb);
				if(b) rv = rv.xadd(b, kb);
				return rv;
			}
			nul.fail();
		}
		if('{}'== a.charact && '{}'== b.charact ) return;
		return 'unk';
	}.perform('nul.unify.subs'),
	
	//Used vice versa
	//<a> and <b> are on the same level
	//locals are distinct
	//returns an expression or nothing if it is sure nothing is manageable or 'unk' if this function couldn't manage
	vcvs: function(a, b, kb, way) {
		if('='== a.charact) return nul.unify.andDist(a.components, a.x, b, kb, way);
		if('[]'== a.charact) return nul.unify.orDist(a.components, a.x, b, kb, way);

		if('[-]'== a.charact && a.components.object.finalRoot()) {
			if(!a.components.object.take)
				throw nul.semanticException('Not a set : '+ a.components.object.toHTML());
			if(0>= way && (!a.components.object.selfRef() || b.free())) {
				//Try to 'take' the opposite way
				var trtk = a.components.object.take(b, kb, -1);
				if(trtk) return nul.unify.level(trtk, a.components.applied, kb, 1).dirty();
			}
			//if Set doesn't transform, a = Set x  ====>   Set (a=x)
			if(0<= way && !a.components.object.transform()) {
				var rv = a.compose({applied: nul.unify.level(a.components.applied, b, kb, way)});
				return rv.operate(kb)||rv;
			}
		}
	
		return 'unk';
	}.perform('nul.unify.vcvs'),
	
	//<a> and <b> share their locals
	//returns an expression or nothing if nothing is possible to do now 
	chewed: function(a, b, kb, way) {
		try {
			if(a.cmp(b)) return a;
			if(0>way) {
				way = 1;
				var t = a; a = b; b = t;
			} else way = way||0;
			
			if(0<way) {
				var bkey = b.key(); b.keyed();
				if(a.key()) {
					kb.premiced([nul.unify.level(a.key(), b, kb, 1)]);
					return a.keyed(bkey);
				}
				if(bkey) return nul.unify.level(a, b, kb, 1).keyed(bkey);
			}
			var rv = nul.unify.subs(a, b, kb, way);
			if('unk'!== rv) return rv;
	
			rv = nul.unify.vcvs(a, b, kb, way);
			if('unk'!== rv) return rv;
			rv = nul.unify.vcvs(b, a, kb, -way);
			if('unk'!== rv) return rv;
	
			if(kb.affectable(a)) return kb.affect(a, b);
			if(kb.affectable(b)) return kb.affect(b, a);
			//TODO: try extraction before fail ?
			if(a.fixed() && b.fixed())
				nul.fail('Unification failure : ' + a.dbgHTML() + ' and ' + b.dbgHTML());
		} catch(err) {
			//Localisation failure means a localcannot be affected because of context position
			//  (see browse.localise throwing nul.unlocalisable)
			//If localisation failure, then the unification cannot be stored in the KB.
			// In this case, just returns the unification as it is first expressed
			if(err!=nul.unlocalisable) throw nul.exception.notice(err);
		}
	}.perform('nul.unify.chewed'),
	
	//unification of <b> with one member of table <as>
	//<b> and <ax>(<as>' parent locals) are distinct
	//always returns an expression 
	orDist: function(as, ax, b, kb, way) {
		var rv = [];
		for(var i=0; i<as.length; ++i) {
			var kwf;
			var oa = as[i];
			var ob = b.clone();
			if('kw'==oa.charact) {
				kwf = oa.dirty();
				kwf.components.value = nul.build.unification([oa.components.value, ob]);
			} else kwf = nul.build.kwFreedom(nul.build.unification([oa, ob])).dirty();
			rv.push(kwf.evaluate(kb));
		}
		return nul.build.ior3(rv).xed(kb, way, ax, b.x);
	}.perform('nul.unify.orDist'),
	
	//unification of <b> with each member of table <as>
	//<b> and <ax>(<as>' parent locals) are distinct
	//always returns an expression
	// way is 0 
	andDist: function(as, ax, b, kb, way) {
		//TODO: wayed distribution
		if('='!= b.charact) as.push(b); else as.pushs(b.components);
		var fl = as.length;
		as = nul.unify.multiple(as, kb, ax, way) || as;

		if(as) switch(as.length) {
			case 1: return as[0].xed(kb, way, ax, b.x);
			default: return nul.build.unification(as, 0).xed(kb, way, ax, b.x);
		}
	}.perform('nul.unify.andDist')
};

