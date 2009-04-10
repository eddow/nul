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
	multiple: function(us, kb) {
		return nul.unify.commutative(us, kb)
	}.describe(function(us, kb){ return ['Unification', '=', us]; }),
	//Commutative algorithm
	commutative: function(us, kb) {
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
	//<a> and <b> share their locals
	//always returns an expression 
	level: function(a, b, kb) {	//don't touch A & B; gather their ctx0 locals
		if(!a ^ !b) return a||b;
		if(nul.debug.assert) assert(kb, 'Level without KB shouldnt happen anymore');
		var rv = nul.unify.chewed(a, b, kb);
		if(rv) return rv;
		return kb.affect([a,b]).clean();
	}.perform('nul.unify.level'),

	//Only unify component <c>
	//<a> and <b> share their locals
	//always returns an expression 
	sub: function(a, b, c, kb) {	//Do this in a lower context
		return nul.unify.level(a.components[c], b.components[c], kb);
	}.perform('nul.unify.sub'),
	
	//<a> and <b> are on the same level
	//Try to make a components to components unification
	//locals are distinct
	//returns an expression or nothing if it is sure nothing is manageable or 'unk' if this function couldn't manage 
	subs: function(a, b, kb) {
		if('[.]'== a.charact && '[.]'== b.charact) {
			var rv = merge(a.components, b.components, function(a,b) {
				if(!b) return a;
				return nul.unify.level(a,b,kb);
			});
			return nul.build.object(rv);
		}
		if(','== a.charact && ','== b.charact) {
			if(a.components.length > b.components.length) { var t=a; a=b; b=t; }
			if(a.components.length== b.components.length || a.components.follow) {
				var rv = [];
				for(var i=0; i<a.components.length; ++i)
					rv.push(nul.unify.sub(a, b, i, kb));
				b = b.clone1();
				b.components.splice(0,i);
				if(0==b.components.length) b = b.components.follow;
								
				if(a.components.follow)
					rv.follow = nul.unify.level(a.components.follow, b, kb)
				else if(b)
					rv.follow = nul.unify.level(nul.build.definition(), b, kb)
				rv = a.compose(rv).summarised();
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
	vcvs: function(a, b, kb) {
		if('='== a.charact) return nul.unify.andDist(a.components, a.x, b, kb);
		if(['<','>'].contains(a.charact))
			return a.compose(
					[nul.unify.level(a.components[0], b, kb), a.components[1]]).dirty().evaluate(kb);
		//Distribution in 'solve' but need here too. Epimenide forget premice if not
		if('[]'== a.charact) {
			var rv = nul.unify.orDist(a.components, a.x, b, kb);
			if(!rv) return;
			rv = nul.build.ior3(rv).xadd(a.x, kb);
			rv.xadd(b.x, kb);
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
	
		return 'unk';
	}.perform('nul.unify.vcvs'),
	
	//<a> and <b> share their locals
	//returns an expression or nothing if nothing is possible to do now 
	chewed: function(a, b, kb) {
		if(a.cmp(b)) return a;
		
		var rv = nul.unify.subs(a, b, kb);
		if('unk'!== rv) return rv;

		rv = nul.unify.vcvs(a, b, kb);
		if('unk'!== rv) return rv;
		rv = nul.unify.vcvs(b, a, kb);
		if('unk'!== rv) return rv;

		//TODO: try extraction before fail ?
		if(a.finalRoot() && b.finalRoot())
			nul.fail('Unification failure : ' + a.dbgHTML() + ' and ' + b.dbgHTML());
	}.perform('nul.unify.chewed'),
	
	//unification of <b> with one member of table <as>
	//<b> and <ax>(<as>' parent locals) are distinct
	//always returns an expression 
	orDist: function(as, ax, b, kb) {
		var rv = [];
		for(var i=0; i<as.length; ++i) {
			var kwf;
			var oa = as[i];
			var ob = b.clone();
			if('kw'==oa.charact) {
				kwf = oa.dirty();
				kwf.components.value = nul.build.unification([oa.components.value, ob]);
			} else kwf = nul.build.kwFreedom(nul.build.unification([oa, ob])).dirty();
			//TODO: if kw:fail, don't push do you ?
			//But react then nicely if rv == []
			rv.push(kwf.evaluate(kb));
		}
		return rv;
	}.perform('nul.unify.orDist'),
	
	//unification of <b> with each member of table <as>
	//<b> and <ax>(<as>' parent locals) are distinct
	//always returns an expression
	andDist: function(as, ax, b, kb) {
		//TODO: wayed distribution
		if('='!= b.charact) as.push(b); else as.pushs(b.components);
		var fl = as.length;
		as = nul.unify.multiple(as, kb) || as;

		if(as) switch(as.length) {
			case 1: return as[0].xadd(ax, kb).xadd(b.x, kb);
			default: return nul.build.unification(as).xadd(ax, kb).xadd(b.x, kb);
		}
	}.perform('nul.unify.andDist')
};

