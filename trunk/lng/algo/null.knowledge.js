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
	initialize: function(knowledge, locals, ctxName) {
		this.knowledge = knowledge || [];
		this.locals = locals || [];
		this.ctxName = ctxName || nul.xpr.fuzzy.createCtxName();
		nul.debug.log('ctxs')(nul.debug.lcs.collapser('Enter'),
			[this.ctxName, this.knowledge]);
	},
	leave: function(rv) {
		nul.debug.log('ctxs')(nul.debug.lcs.endCollapser('Leave', 'Ctx'),
			[this.ctxName, rv||'']);
		if(rv) {
			rv = this.asFuzz(rv);
			if(nul.debug.assert) assert(
				'fz'!= rv.charact || rv.openedKnowledge === this,
				'Knowledge opened only once');
			delete rv.openedKnowledge;
			return rv;
		}			
	},
	asFuzz: function(rv) {
		try {
			if('fz'== rv.charact) {
				if(nul.debug.assert) assert(this.ctxName == rv.ctxName,
					'Fuzzy leaves the knowledge it created.')
				if(this.knowledge !== rv.components) {
					while(rv.components.length)
						this.know(rv.components.pop());
					this.knowledge.value = rv.components.value;
					rv.components = this.knowledge;
				}
				rv.locals = this.locals;
				if(nul.debug.assert) assert(rv.openedKnowledge === this,
					'Knowledge opened only once');
			} else { 
				rv = new nul.xpr.fuzzy(
					rv,
					this.knowledge,
					this.locals,
					this.ctxName);
				this.knowledge = rv.components;
				if('fz'!= rv.charact) return rv;
				rv.withKlg(this, 'asFuzz');
			}
			
			var oldKNdx, newKNdx = this.knowledgeNdx();
			do {
				oldKNdx = newKNdx;
				rv = rv.simplify();
				if('fz'!= rv.charact) return rv;
				this.concentrate(rv.components.value);
				if('fz'!= rv.charact) return rv;
				newKNdx = this.knowledgeNdx();
			} while(oldKNdx != newKNdx)
			rv = rv.relocalise();
			if('fz'!= rv.charact) return rv;
			return rv.composed();
		} catch(err) {
			if(nul.failure!= err) throw nul.exception.notice(err);
			return new nul.xpr.fuzzy();
		}
	},
/////// Access management
	knowledgeNdx: function() {
		var rv = '';
		for(var i=0; i<this.knowledge.length; ++i)
			rv += '|'+ this.knowledge[i].ndx;
		return rv;
	},
	/**
	 * Equality accesses
	 */
	eqAccess: function() {
		var rv = {};
		map(this.knowledge, function(ndx) {
			if('='== this.charact) map(this.components,function() {
				rv[this.ndx] = ndx;
			});
		});
		return rv;
	},
	/**
	 * Type accesses (applications)
	 */
	tpAccess: function() {
		var rv = {};
		map(this.knowledge, function(ndx) {
			if('[.]'== this.charact) {
				if(!rv[this.components.applied.ndx])
					rv[this.components.applied.ndx] = {};
				rv[this.components.applied.ndx][this.components.object.ndx] = ndx;
			}
		});
		return rv;
	},
	/**
	 * boolean: is this premice known
	 */
	known: function(prm) {
		//TODO: this function avoid to store twice the same knowledge
		// The problem is that knowledges are proposed a lot of time to be known
		// It should be nice to try to make less propositions instead of filtering them that much
		return trys(this.knowledge, function(p) { return prm.cmp(this); });
	},
/////// Premices management
	forget: function(sn) {
		if('undefined'== typeof sn)
			return this.knowledge.splice(0);
		else return this.knowledge.splice(sn, 1)[0];
	},
	know: function(premices) {
		if(!isArray(premices)) premices = [premices];
		while(0<premices.length) {
			var p = premices.pop();
			if('='== p.charact) this.affect(p.components);
			else this.knew(p);
		}
	},
	knew: function(p) {
		if(!this.known(p) && p.flags.failable) {
			nul.debug.log('knowledge')('known', p);
			if('[.]'== p.charact) {
				//Insert it as the last belonging knowledge
				var i;
				for(i=0;
					i<this.knowledge.length &&
					'[.]'== this.knowledge[i].charact;
					++i);
				this.knowledge.splice(i, 0, p);
			} else this.knowledge.push(p);
		}	//else: already known
		return this;
	},
	primitive: function(xpr) {
		var tpAccess = this.tpAccess();
		if(tpAccess[xpr.ndx]) {
			for(var y in tpAccess[xpr.ndx]) {
				var st = this.knowledge[tpAccess[xpr.ndx][y]];
				if(nul.debug.assert) assert('[.]'== st.charact,
					'tpAccess refers to belonging.');
				st = st.components.object.elementPrimitive;
				if(st) return st;
			}
		}
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
		var eqAccess = this.eqAccess();
		for(var n=0; n<us.length; ++n) {
			var fpn, eqi;
			//TODO:
			if('undefined'!= typeof(fpn= eqAccess[us[n].ndx])) {
				merged = true;
				eqi = this.forget(fpn).components;
				for(var i in eqAccess)
					if(fpn== eqAccess[i]) delete eqAccess[i];
					else if(fpn< eqAccess[i]) --eqAccess[i];
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
		used = nul.lcl.dep.mix(used)[this.ctxName]||[];
		
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
						if(2== prm.components.length)
							this.forget(p);
						else {
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