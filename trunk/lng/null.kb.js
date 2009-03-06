/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
nul.kb = function(knowledge, protectedKb) {
	return {
		//The effective data : a list of contexts where
		// the last one is the root context, the first specified
		// the first one knowledg[0] is the crrent-level context
		knowledge: knowledge || [],
		protectedKb: protectedKb,
		//Add knowledge to this knowledge base.
		//State that the context <ctxDelta> has for the index <lindx> the value <xpr>. 
		know: function(lcl, xpr, vDelta) {
			var lclzd = xpr.localise(lcl.ctxDelta+(vDelta||0));
			if('string'== typeof lcl) lcl = {ctxDelta: 0, lindx: lcl};
			if(nul.debug) {
				var _lcl;
				var _xpr;
				if(nul.debug.logging || nul.debug.watches) {
					_lcl = nul.build.local(
						'+'+(this.knowledge.length-lcl.ctxDelta), lcl.lindx, lcl.dbgName||'')
						.toHTML();
					_xpr = lclzd.dbgHTML();
					nul.debug.kevol.log(_lcl, _xpr);
				}
				nul.debug.log('knowledge')('Know', _lcl + ' as ' + _xpr);
				if(nul.debug.assert) assert(this.knowledge[lcl.ctxDelta], _lcl+' is valid');
				if(nul.debug.watches)
					if(!this.protectedKb)	//TODO: afficher plusieurs KB, le protégé et l'actuel en colonnes ?
					//TODO: standardiser le "context change debug"
						nul.debug.kbase.item(lcl.ctxDelta).set(nul.debug.ctxTable(
							this.knowledge[lcl.ctxDelta]));
			}
			this.knowledge[lcl.ctxDelta].lvals[lcl.lindx] = lclzd;
			return (xpr.flags.fuzzy || (
				lclzd.deps[-1] && lclzd.deps[-1][lcl.lindx])
			)?lcl:xpr;
		}.perform('nul.kb->know'),
		
		protectedKnowledge: function(lcl, fct) {
			if(nul.debug.assert) assert(this.protectedKb,'Verify before !');
			var pCtxDelta = this.knowledge.length - this.protectedKb.knowledge.length;
			if(lcl.ctxDelta < pCtxDelta) return;
			lcl.ctxDelta -= pCtxDelta;
			var rv = this.protectedKb[fct](lcl);
			lcl.ctxDelta += pCtxDelta;
			return rv;
		},

		//Gets what is known about a local (or nothing if nothing is known)
		known: function(lcl) {
			if('object'!= typeof lcl) lcl = {ctxDelta: 0, lindx: lcl};
			var rv = this.knowledge[lcl.ctxDelta]?
				this.knowledge[lcl.ctxDelta].lvals[lcl.lindx]:null;
			if(rv) return rv;
			if(this.protectedKb) return this.protectedKnowledge(lcl,'known');
		}.perform('nul.kb->known'),
		//Affect an expression to a local variable.
		//<lcl> and <xpr> are both expressions.
		affect: function(lcl, xpr) {
			if(this.affectable(xpr)) {
				if(xpr.ctxDelta == lcl.ctxDelta && xpr.lindx == lcl.lindx) return lcl;
				var kx = this.known(xpr);
				if( lcl.ctxDelta > xpr.ctxDelta ||
					(lcl.ctxDelta == xpr.ctxDelta && 
						lcl.lindx < xpr.lindx &&
						(!kx || !kx.deps[-1] || !kx.deps[-1][lcl.lindx])))
					{ var tmp = xpr; xpr = lcl; lcl = tmp; }
			}
			var ovl;
			if(xpr.deps[0]) for(var d in xpr.deps[0])
				if((ovl = this.known(d)) && ovl.deps[-1] && ovl.deps[-1][lcl.lindx]) {
					var st = {};
					st[lcl.lindx] = xpr;
					return this.affect(nul.build.local(0, d), ovl.localise().contextualise(st).localise());
				}
			if(ovl = this.known(lcl)) {
				if(xpr.deps[lcl.ctxDelta] && xpr.deps[lcl.ctxDelta][lcl.lindx]) {
					var st = {};
					st[lcl.lindx] = ovl;
					xpr = xpr.contextualise(st,lcl.ctxDelta).evaluate(this);
					ovl = ovl.localise(lcl.ctxDelta);
				} else {
					ovl = ovl.localise(lcl.ctxDelta);
					if(ovl.deps[lcl.ctxDelta] && ovl.deps[lcl.ctxDelta][lcl.lindx]) {
						var st = {};
						st[lcl.lindx] = xpr.localise(lcl.ctxDelta);
						ovl = ovl.contextualise(st,lcl.ctxDelta).evaluate(this);
					}
				}
				xpr = nul.unify.level(ovl, xpr, this);
			}
			return this.know(lcl, xpr);
		},
		//Determine if the expression <xpr> can simply be affected a value for this knowledge base.
		affectable: function(xpr) {
			return 'local'== xpr.charact;
		}.perform('nul.kb->affectable'),

		addLocals: function(locals) {
			if(nul.debug.assert) assert(0<this.knowledge.length, 'Add locals in context.');
			return this.knowledge[0].addLocals(locls);
		},
		premiced: function(premices) {
			if(nul.debug.assert) assert(0<this.knowledge.length, 'Add premice in context.');
			return this.knowledge[0].premiced(premices);
		},
	
		//Context push
		push: function(frdm, ftp) {
			this.protectedKb = nul.kb(this.knowledge, this.protectedKb);
			this.knowledge = [];
			for(var i=0; i<this.protectedKb.knowledge.length; ++i)
				this.knowledge.push({
					lvals:[],
					locals: this.protectedKb.knowledge[i].locals
				});
			if('ctx'== ftp) this.knowledge.unshift(frdm);
			else merge(this.knowledge[0], frdm);
			
			if(nul.debug.watches)
			{
				if('ctx'== ftp) nul.debug.kbase.push(nul.debug.ctxTable(this.knowledge[0]));
				if(nul.debug.assert)
					assert(nul.debug.kbase.length()==this.knowledge.length, 'Entering debug level');
			}
		},
		//Context pop
		pop: function(ftp) {
			var rv = this.knowledge;
			this.knowledge = this.protectedKb.knowledge;
			this.protectedKb = this.protectedKb.protectedKb;
			if(nul.debug.watches) {
				if('ctx'== ftp) nul.debug.kbase.pop();
				if(nul.debug.assert)
						assert(nul.debug.kbase.length()==this.knowledge.length, 'Leaving debug level');
			}
			return rv;
		}
	};
};