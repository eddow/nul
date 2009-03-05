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
			return xpr.flags.fuzzy?lcl:xpr;
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

		holder: function(lcl) {
			if('string'== typeof lcl) lcl = {ctxDelta: 0, lindx: lcl};
			return this.knowledge[lcl.ctxDelta].lvals[lcl.lindx];
		},
		//Gets what is known about a local (or nothing if nothing is known)
		isKnown: function(lcl) {
			var rv = this.holder(lcl);
			return rv || (this.protectedKb && this.protectedKnowledge(lcl,'isKnown'));
		}.perform('nul.kb->isKnown'),
		known: function(lcl) {
			var rv = this.holder(lcl);
			if(rv) return rv.localise(lcl.ctxDelta);
			if(this.protectedKb) return this.protectedKnowledge(lcl,'known');
		}.perform('nul.kb->known'),
		//Affect an expression to a local variable.
		//<lcl> and <xpr> are both expressions.
		affect: function(lcl, xpr) {
			if(this.affectable(xpr)) {
				if(xpr.ctxDelta == lcl.ctxDelta && xpr.lindx == lcl.lindx) return lcl;
				//Always affect to the lowest ctxDelta : the lower in the xpr hyerarchi
				//Only affect once : circle references kills
				if( lcl.ctxDelta > xpr.ctxDelta ||
					(lcl.ctxDelta == xpr.ctxDelta && (
						lcl.lindx < xpr.lindx || nul.lcl.slf== xpr.lindx)))
					{ var tmp = xpr; xpr = lcl; lcl = tmp; }
			} 
			if(this.isKnown(lcl)) xpr = nul.unify.level(this.known(lcl), xpr, this);
			//xpr = xpr.finalise(this) || xpr;
			/*TODO: error on self or ok if set
			xpr = xpr.contextualise(
				nul.lcl.selfCtx(lcl.dbgName, lcl.lindx),
				lcl.ctxDelta) || xpr;*/
			if(nul.lcl.slf!= lcl.lindx) return this.know(lcl, xpr);
			this.know(lcl, xpr);
			return lcl;
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
			switch(ftp) {
				case 'ctx': this.knowledge.unshift(frdm); break;
				case 'kw':
					this.protectedKb = nul.kb(this.knowledge, this.protectedKb);
					this.knowledge = [];
					for(var i=0; i<this.protectedKb.knowledge.length; ++i)
						this.knowledge.push({
							lvals:[],
							locals: this.protectedKb.knowledge[i].locals
						});
					merge(this.knowledge[0], frdm);
					break;
			}
			
			if(nul.debug.watches)
			{
				switch(ftp) {
					case 'ctx':
						nul.debug.kbase.push(nul.debug.ctxTable(this.knowledge[0]));
						break;
					case 'kw': break;	//TODO
				}
				if(nul.debug.assert)
					assert(nul.debug.kbase.length()==this.knowledge.length, 'Entering debug level');
			}
		},
		//Context pop
		pop: function(ftp) {
			var rv;
			switch(ftp) {
				case 'ctx': rv = this.knowledge.shift(); break;
				case 'kw':
					rv = this.knowledge;
					this.knowledge = this.protectedKb.knowledge;
					this.protectedKb = this.protectedKb.protectedKb;
					break;
			}
			if(nul.debug.watches) {
				switch(ftp) {
					case 'ctx':
						nul.debug.kbase.pop();
						break;
					case 'kw': break;	//TODO
				}
				if(nul.debug.assert)
						assert(nul.debug.kbase.length()==this.knowledge.length, 'Leaving debug level');
			}
			return rv;
		}
	};
};