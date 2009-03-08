/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
 
nul.knowledge = function(statements) {
	var rv = {
		premices: statements,
		access: {},
		forget: function(sn) {
			if('undefined'== typeof sn) {
				this.premices.splice(0);
				this.access = {};
			} else {
				for(var x in this.access) {
					if(this.access[x] == sn) delete this.access[x];
					else if(this.access[x] > sn) --this.access[x];
				}
				return this.premices.splice(sn, 1)[0];
			}
		},
		knew: function(premices) {
			if(!isArray(premices)) premices = [premices];
			while(0<premices.length) 
				this.premices.push(this.makeAccess(premices.pop()));
			return this;
		},
		makeAccess: function(pn, pval) {
			if('undefined'== typeof pval) {
				if('object'== typeof pn) {
					pval = pn;
					pn = this.premices.length;
				} else pval = this.premices[pn];
			}
			if('='== pval.charact)
				for(var c=0; c<pval.components.length; ++c)
					this.access[pval.components[c].ndx] = pn;
			return pval;
		}
	};
	for(var n=0; n<rv.premices.length; ++n) rv.makeAccess(n);
	return rv;
};

nul.kb = function(knowledge) {
	return {
		//The effective data : a list of contexts where
		// the last one is the root context, the first specified
		// the first one knowledg[0] is the crrent-level context
		knowledge: knowledge || [],
		contexts: [],

		//Affect an expression to an other expression.
		//<unk> and <knwn> are both expressions.
		affect: function(us, way, x) {
			way = way||0;

			//Merge equalities if needed
			var eqClass = [];
			var eqClassNdx = {};
			var merged = false;
			for(var n=0; n<us.length; ++n) {
				var fpn, eqi;
				if('undefined'!= typeof(fpn= this.knowledge[0].access[us[n].ndx]) &&
					this.knowledge[0].premices[fpn].way == way) {
					merged = true;
					eqi = this.knowledge[0].forget(fpn).components;
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
				var rv = nul.unify.multiple(us, this, way, x);
				if(rv && 1== rv.length) return rv[0];
				if(rv) us = rv;
			}
			//Sort to have a nice 'replace-by'. note: replaceBy = left-ward
			if(!way) {
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
			}

			nul.debug.log('knowledge')(['Handles','Equivals','Handled'][1+way], us);
			//if(nul.debug.watches) nul.debug.kevol.log(a.dbgHTML(), 'as', b.dbgHTML());

			var rv = us[0];
			var unf = nul.build.unification(us, way).clean().summarised();
			this.knowledge[0].knew(unf);
			return rv;
		},

		createLocal: function(lName) {
			if(nul.debug.assert) assert(0<this.contexts.length, 'Add locals in context.');
			return nul.build.local(
				this.contexts[0].ctxName,
				this.contexts[0].addLocals([lName]),
				lName);
		},
		addLocals: function(locals) {
			if(nul.debug.assert) assert(0<this.contexts.length, 'Add locals in context.');
			return this.contexts[0].addLocals(locals);
		},
		knew: function(premices) {
			if(nul.debug.assert) assert(0<this.knowledge.length, 'Add premice in context.');
			if(!isArray(premices)) premices = [premices];
			var i = 0;
			while(i< premices.length) {
				if(premices[i].unification) {
					var prm = premices.splice(i,1)[0];
					this.affect(prm.components,':='==prm.charact?-1:0, prm.x);
				} else if('[-]'== premices[i].charact) {
					nul.debug.log('knowledge')('Known',
						[premices[i].components.applied,'in',premices[i].components.object]);
					/*if(nul.debug.watches) nul.debug.kevol.log(
						premices[i].components.applied.dbgHTML(), 'in',
						premices[i].components.object.dbgHTML());*/
					++i;
				} else if('?'== premices[i].charact) {
					nul.debug.log('knowledge')('Assert', [premices[i].components[0]]);
					++i;
				} else if('[]'== premices[i].charact) {
					nul.debug.log('knowledge')('Choice', premices[i].components);
					++i;
				} else {
					//TODO: assert there are some attributes to verify
					nul.debug.log('knowledge')('Attributed', premices[i]);
					++i;
				}
			}
			return this.knowledge[0].knew(premices);
		},
		forget: function(pn) {
			return this.knowledge[0].forget(pn);
		},
		//Context push
		push: function(knl, ctx) {
			this.knowledge.unshift(knl);
			if(ctx) this.contexts.unshift(ctx);
		},
		//Context pop
		pop: function(frdm) {
			if(frdm.freedom)
				frdm.takeFrdm(
					this.knowledge.shift().premices,
					'ctx'==frdm.freedom?this.contexts.shift().locals:null);
			else {
				this.knowledge.shift();
				if('ctx'== frdm) this.contexts.shift();
			}
		}
	};
};