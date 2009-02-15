/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
 
//<us>[...] appear in an expression like 'a = b' where they are both un-wrapped
// <us>s locals are distinct
//returns ctxd or nothing if unification unchanged 
nul.unify = {
	multiple: function(us, kb, lcls) {
		//us = map(us, function(u) { return u.lclsUpg(lcls, kb) });
		us = clone1(us);
		return kb.knowing(us, function(kb) {
			var ununified, rv = [], unifion, fUsLn = us.length;
			while(0<us.length) {
				unifion = us.pop();
				ununified = [];
				for(var i=0; i<us.length; ++i) {
					var trv = nul.unify.chewed(us[i], unifion, kb);
					if(trv) unifion = trv;
					else ununified.push(us[i]);
				}
				us = ununified;
				rv.push(unifion);
			}
			if(fUsLn== rv.length) return;
			return rv;
		});
	},
	
	//<a> and <b> are on the same level
	//locals are distinct
	//always returns ctxd 
	level: function(a, b, kb) {	//don't touch A & B; gather their ctx0 locals
		var rv = nul.unify.chewed(a, b, kb);
		if(rv) return rv;
		return nul.actx.unification([a.wrap(kb),b.wrap(kb)]).ctxd().numerise(a.locals.prnt);
	},
	
	//<a> and <b> are on the same level, one more down than <kb>
	subd: function(a, b, kb) {	//Do this in a lower context
		return kb.knowing([a, b], function(kb) { return nul.unify.level(a, b, kb); });
	},
	
	//<a> and <b> are on the same level. Only unify component <c>
	//locals are the same but component locals are distinct
	//always returns ctxd 
	sub: function(a, b, c, kb) {	//Do this in a lower context
		return nul.unify.subd(a.components[c], b.components[c], kb);
	},
	
	//<a> is a level lower than <b> and <b> need to get down to unify in a sub-context
	//locals are distinct
	//returns same level than <a>
	//always returns ctxd
	sub1: function(a, b, kb) {	//Do this in a lower context
		return nul.unify.subd(a, b.wrap(kb), kb);
	},
	
	//Used vice versa
	//<a> and <b> are on the same level
	//locals are distinct
	//returns ctxd or nothing if it is sure nothing is manageable or 'unk' if this function couldn't manage 
	vcvs: function(a, b, kb) {
		if(nul.actx.isC(a,';')) {
			var cs = clone1(a.components);
			cs.push(nul.unify.sub1(cs.pop(), b, kb));
			return a.clone(cs).ctxd(true).clean();
		}
	
		if(nul.actx.isC(a,'[]')) return nul.unify.orDist(a.components, a.locals, b, kb);
		if(nul.actx.isC(a,'=')) return nul.unify.andDist(a.components, a.locals, b, kb);
		if(nul.actx.isC(a,':-')) {
			return a.clone({
				parms: nul.unify.sub1(a.components.parms, b, kb),
				value: a.components.value
			}).ctxd(true);
		}
		
		if(kb.affectable(a)) return kb.affect(a,
			b/*.lclShft(clone1(a.locals))*/);		//x=...
		return 'unk';
	},
	
	//<a> and <b> are on the same level
	//Try to make a components to components unification
	//locals are distinct
	//returns ctxd or nothing if it is sure nothing is manageable or 'unk' if this function couldn't manage 
	subs: function(a, b, kb) {
		a = a.clone();
		a.locals = clone1(a.locals);
		b = b.lclShft(a.locals);
	
		//<a> is choosen abitrarily. Take care here of the attributes. :*
		if(a.value && b.value && a.value===b.value) return a;
		if(nul.actx.isC(a,',') && nul.actx.isC(b,',') && a.components.length == b.components.length) {
			var rv = [];
			for(var i=0; i<a.components.length; ++i)
				rv.push(nul.unify.sub(a, b, i, kb));
			return a.modify(rv).ctxd(true);
		}
		if(nul.actx.isC(a,':-') && nul.actx.isC(b,':-') ) {
			return a.modify({
					parms: nul.unify.sub(a, b, 'parms', kb),
					value: nul.unify.sub(a, b, 'value', kb)
				}).withLocals(a.locals).ctxd(true);
		}
		if(nul.actx.isC(a,'{}') && nul.actx.isC(b,'{}') )
			return a.modify([nul.unify.sub(a, b, 0, kb)]).withLocals(a.locals).ctxd(true);
		return 'unk';
	},
	
	//<a> and <b> are on the same level
	//<a> and <b> have distinct locals
	//returns ctxd or nothing if unification unchanged 
	chewed: function(a, b, kb) {
		if(nul.debug.levels) assert(a.locals.lvl==b.locals.lvl, 'Unification levels : '+a.locals.lvl+' and '+b.locals.lvl)
	
		try {
			var rv = nul.unify.subs(a, b, kb);
			if('unk'!== rv) return rv?rv.addAttr(kb, a, b):rv;
			
			var t = a;
			var ar = a.deps[0] && a.deps[0][nul.lcl.slf];
			var br = b.deps[0] && b.deps[0][nul.lcl.slf];
			if(ar && !br) t = a.rDevelop(b);
			if(br && !ar) b = b.rDevelop(a);
			a = t;
	
			rv = nul.unify.vcvs(a, b, kb);
			if('unk'!== rv) return rv?rv.addAttr(kb, a, b):rv;
			rv = nul.unify.vcvs(b, a, kb);
			if('unk'!== rv) return rv?rv.addAttr(kb, a, b):rv;
			
			if(!a.free() || !b.free()) return;
			nul.fail('Unification failure');
		} catch(err) {
			//Localisation failure means a localcannot be affected because of context position
			//  (see ctxd.localise throwing nul.unlocalisable)
			//If localisation failure, then the unification cannot be stored in the KB.
			// In this case, just returns the unification as it is first expressed
			if(err!=nul.unlocalisable) throw err;
		}
	}.describe(function(a, b, kb) { return 'Unifying '+a.toHTML()+' and '+b.toHTML(); }),
	
	//unification of <b> with one member of table <as>
	//<b> and <alcls>(<as>' parent locals) are distinct
	//always returns ctxd 
	orDist: function(as, alcls, b, kb) {
		var rv = kb.trys(
			'OR distribution', as, alcls,
			function(c, kb) { return nul.unify.sub1(c, b, kb); });
		if(nul.debug.assert) assert(rv, 'orDist use')
		if(!isArray(rv)) return rv;
		return nul.actx.or3(rv).ctxd().withLocals(alcls).clean();
	},
	
	//unification of <b> with each member of table <as>
	//<b> and <alcls>(<as>' parent locals) are distinct
	//always returns ctxd 
	andDist: function(as, alcls, b, kb) {
		if(nul.actx.isC(b,'=')) {
		//optimisation : (a=b=c) = (d=e=f) ==> (a=b=c=d=e=f)
			b = b.lclShft(alcls);
			as = as.concat(b.components);
		} else as = unshifted(b.wrap(kb),as);
		as = nul.unify.multiple(as, kb, alcls) || as;

		if(1== as.length) {
			as = as[0].stpUp(alcls, kb);
			//TODO: workaround with leave/enter ?
			//try { as = kb.leave(as).evaluate(kb); }
			//finally { kb.enter(as); }
			return as;
		}

		return nul.actx.unification(as).ctxd().withLocals(alcls);
	}
};