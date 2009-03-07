/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
 
function removeAccess(acs, n) {
}
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
		affect: function(us, way) {
			way = way||0;

			//Merge equalities if needed
			var eqClass = [];
			var eqClassNdx = {};
			for(var n=0; n<us.length; ++n) {
				var fpn, eqi;
				if('undefined'!= typeof(fpn= this.knowledge[0].access[us[n].ndx])) {
					//TODO: xadd
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
			//Sort to have a nice 'replace-by'
			for(var n=1; n<us.length; ++n)
				if(isEmpty(us[n].deps))
					us.unshift(us.splice(n,1)[0]);
		 	if('local'== us[0].charact) {
		 		for(var n=1; n<us.length; ++n) if('local'!= us[n].charact) break;
		 		if(n<us.length) us.unshift(us.splice(n,1)[0]);
		 	}

			nul.debug.log('knowledge')('Equivalents', clone1(us));
			//if(nul.debug.watches) nul.debug.kevol.log(a.dbgHTML(), 'as', b.dbgHTML());

			var rv = us[0];
			var unf = nul.build.unification(us, way).clean().summarised();
			this.knowledge[0].knew(unf);
			return rv;
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
				if(['=',':='].contains(premices[i].charact)) {
					var prm = premices.splice(i,1)[0];
					this.affect(prm.components,':='==prm.charact?1:0);
				} else if('[-]'== premices[i].charact) {
					nul.debug.log('knowledge')('Known',
						[premices[i].components.applied,'in',premices[i].components.object]);
					if(nul.debug.watches) nul.debug.kevol.log(
						premices[i].components.applied.dbgHTML(), 'in',
						premices[i].components.object.dbgHTML());
					++i;
				} else {
					var dstr = premices[i].splice(i,1)[0];
					if(dstr.components) map(dstr.components, function() {
						premices.push(this);
					});
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