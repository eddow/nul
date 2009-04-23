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
	access: function() {
		this.eqAccess = {};
		this.tpAccess = {};
		for(var n=0; n<this.knowledge.length; ++n) this.makeAccess(n);
	},
	initialize: function(knowledge, locals, ctxName) {
		this.knowledge = knowledge || [];
		this.locals = locals || [];
		this.ctxName = ctxName || nul.xpr.fuzzy.createCtxName();
		this.access();
		nul.debug.log('ctxs')(nul.debug.lcs.collapser('Enter'),
			[this.ctxName, this.knowledge]);
	},
	leave: function(rv) {
		nul.debug.log('ctxs')(nul.debug.lcs.endCollapser('Leave', 'Ctx'),
			[this.ctxName, rv||'']);
		if(rv) return this.asFuzz(rv);
	},
	asFuzz: function(rv) {
		try {
			if('fz'== rv.charact) {
				if(nul.debug.assert) assert(this.ctxName == rv.ctxName,
					'Fuzzy leaves the knowledge it created.')
				rv.components.pushs(this.knowledge);
				this.knowledge = rv.components;
				this.access();
				rv.locals = this.locals;
			} else rv = new nul.xpr.fuzzy(
					rv,
					this.knowledge,
					this.locals,
					this.ctxName);
			
			rv.openedKnowledge = this;
			rv = rv.simplify(this);
			if('fz'!= rv.charact) throw {cpsd: rv};
			this.concentrate(rv.components.value);
			rv = rv.relocalise(this);
			if('fz'!= rv.charact) throw {cpsd: rv};
			rv = rv.composed();
		} catch(err) {
			if(err.cpsd) rv = err.cpsd;
			else {
				if(nul.failure!= err) throw nul.exception.notice(err);
				return new nul.xpr.fuzzy();
			} 
		} finally {
			this.knowledge = [];
			this.access();
		}
		if(rv.openedKnowledge) delete rv.openedKnowledge;
		return rv;
	},
/////// Premices management
	forget: function(sn) {
		if('undefined'== typeof sn) {
			this.knowledge.splice(0);
			this.eqAccess = {};
			this.tpAccess = {};
		} else {
			for(var x in this.eqAccess) {
				if(this.eqAccess[x] == sn) delete this.eqAccess[x];
				else if(this.eqAccess[x] > sn) --this.eqAccess[x];
			}
			if('[.]'== this.knowledge[sn].charact)
				delete this.tpAccess[this.knowledge[sn].components.applied.ndx];
			return this.knowledge.splice(sn, 1)[0];
		}
	},
	knew: function(premices) {
		if(!isArray(premices)) premices = [premices];
		while(0<premices.length) {
			var p = premices.pop();
			if(p.flags.failable) this.knowledge.push(this.makeAccess(p));
		}
		return this;
	},
	makeAccess: function(pn, pval) {
		if('undefined'== typeof pval) {
			if('object'== typeof pn) {
				pval = pn;
				pn = this.knowledge.length;
			} else pval = this.knowledge[pn];
		}
		if('='== pval.charact)
			for(var c=0; c<pval.components.length; ++c)
				this.eqAccess[pval.components[c].ndx] = pn;
		else if('[.]'== pval.charact)
			this.tpAccess[pval.components.applied.ndx] =
				pval.components.object;
		return pval;
	},
	primitive: function(xpr) {
		var rv = this.tpAccess[xpr.ndx];
		if(rv) return rv.elementPrimitive;
	},
/////// Locals management
	addLocals: function(locals) {
		if(!isArray(locals)) locals = [locals];
		this.locals.pushs(locals);
		return this.locals.length-locals.length;
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
			if('undefined'!= typeof(fpn= this.eqAccess[us[n].ndx])) {
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
			if(isEmpty(us[n].deps) || '::'== us[n].charact)
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

	/**
	 * Remove all clauses in the knowledge that share no deps with 'value'
	 * nor with an useful clause.
	 * No return value.
	 */
	concentrate: function(value) {
		var ctxn = this.ctxName;
		var usefulLocals = value.deps[this.ctxName];
		usefulLocals = usefulLocals?clone1(usefulLocals):{};

		var used = [];
		map(this.knowledge, function() { used.push(this.deps); });
		used = nul.lcl.dep.mix(used);
		
		//First eliminate locals found once in an equality of the premices
		for(var l in used) if(1== used[l] && !usefulLocals[l]) {
			//This local is used only once in the premices.
			// Is it as a term of a unification ?
			var p;
			for(p=0; p < this.knowledge.length && (
				!this.knowledge[p].deps[this.ctxName] ||
				 !this.knowledge[p].deps[this.ctxName][l] )
			; ++p);	///Find the premice containing this local
			if(p < this.knowledge.length) {	//The premice can have been deleted by this algorithm!
				var prm = this.knowledge[p];
				if('='== prm.charact) {
					var c;
					for(c=0; !prm.components[c].deps[this.ctxName] ||
						!prm.components[c].deps[this.ctxName][l]; ++c);
							//Find the term refering the local
					if('local'== prm.components[c].charact) {
						if(2== prm.components.length) {
							this.knowledge.splice(p,1);
						} else {
							prm.components.splice(c,1);
							prm.summarised();
						}
					}
				}
			}
		}
		//Second, sort the premices to keep only the ones with no link at all from the value
		var forgottenPrmcs = [];
		for(var i=0; i<this.knowledge.length; ++i)
			if(isEmpty(this.knowledge[i].deps, [this.ctxName]))
				forgottenPrmcs.push(i);
		do {
			var ds;
			for(var i=0; i<forgottenPrmcs.length; ++i) {
				ds = this.knowledge[forgottenPrmcs[i]].deps[this.ctxName];
				if(ds) if(trys(ds, function(d) { return usefulLocals[d] })) break; 
			}
			if(i>=forgottenPrmcs.length) ++i;
			else {
				merge(usefulLocals, ds);
				forgottenPrmcs.splice(i,1);
			}
		} while(i<=forgottenPrmcs.length);
		//Remove in inverse orders to have valid indices.
		// If [1, 3] must be removed from (0,1,2,3,4) to give (0,2,4),
		//  first remove 3 then 1.
		while(0<forgottenPrmcs.length) this.forget(forgottenPrmcs.pop());
	}.perform('nul.knowledge->concentrate'),
});