/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
 
nul.kb = function(knowledge) {
	return {
		//The effective data : a list of contexts where
		// the last one is the root context, the first specified
		// the first one knowledg[0] is the crrent-level context
		knowledge: knowledge || [],
		
		emptyCtx : function(entr) {
			var ctx=[];
			if(nul.debug.levels || nul.debug.logging || nul.debug.assert) {
				ctx['+entr'] = map(entr, function(o) { return o.clone(); });
				ctx['+entrHTML'] = function(glue) { return nul.text.tblHTML(this['+entr'], glue); };
			}
			return ctx;
		},
		//Add knowledge to this knowledge base.
		//State that the context <ctxDelta> has for the index <lindx> the value <xpr>. 
		know: function(lcl, xpr, vDelta) {
			if('string'== typeof lcl) lcl = {ctxDelta: 0, lindx: lcl};
			this.knowledge[lcl.ctxDelta][lcl.lindx] =
				xpr.localise(lcl.ctxDelta+(vDelta||0)).numerise();
			if(nul.debug) {
				var _lcl;
				var _xpr;
				if(nul.debug.logging || nul.debug.watches) {
					_lcl = nul.build().local(
						'+'+(this.knowledge.length-lcl.ctxDelta), lcl.lindx, lcl.dbgName||'')
						.toHTML();
					_xpr = this.knowledge[lcl.ctxDelta][lcl.lindx].toHTML();
					nul.debug.kevol.log(_lcl, _xpr);
				}
				nul.debug.log('knowledgeLog')('Know', _lcl + ' as ' + _xpr);
				if(nul.debug.watches)
					if(!this.protectedKb)	//TODO: afficher plusieurs KB, le protégé et l'actuel en colonnes ?
					//TODO: standardiser le "context change debug"
						nul.debug.kbase.item(lcl.ctxDelta).set(nul.debug.ctxTable(this.knowledge[lcl.ctxDelta]));
			}
			//if(this.protectedKb &&
				//this.protectedKb.knowledge.length+lcl.ctxDelta > this.knowledge.length)
				//If lcl is a "try" local, ..;
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

		//Gets what is known about a local (or nothing if nothing is known)
		isKnown: function(lcl) {
			if('string'== typeof lcl) lcl = {ctxDelta: 0, lindx: lcl};
			if(!this.knowledge[lcl.ctxDelta]) return;
			return !!this.knowledge[lcl.ctxDelta][lcl.lindx] ||
				(this.protectedKb && this.protectedKnowledge(lcl,'isKnown'));
		}.perform('nul.kb->isKnown'),
		known: function(lcl) {
			if('string'== typeof lcl) lcl = {ctxDelta: 0, lindx: lcl};
			if(!this.knowledge[lcl.ctxDelta]) return;
			var rv = this.knowledge[lcl.ctxDelta][lcl.lindx];
			if(rv) return rv.localise(lcl.ctxDelta).numerise(lcl.locals.lvl);
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
 			if(nul.debug.assert) assert('undefined'!= typeof lcl.lindx, 'Some condition should be verified before')
			if(this.isKnown(lcl)) xpr = nul.unify.level(xpr, this.known(lcl), this);
			xpr = xpr.finalize(this) || xpr;
			xpr = xpr.contextualize(
				nul.lcl.selfCtx(lcl.dbgName, lcl.lindx),
				lcl.ctxDelta) || xpr;
			if(nul.lcl.slf!= lcl.lindx) return this.know(lcl, xpr);
			this.know(lcl, xpr);
			return lcl;
		}.describe(function(lcl, xpr) {
			return 'Affecting to '+lcl.toHTML()+' the value '+xpr.toHTML();
		}).perform('nul.kb->affect'),
		//Determine if the expression <xpr> can simply be affected a value for this knowledge base.
		affectable: function(xpr) {
			return 'undefined'!= typeof xpr.lindx;
		}.perform('nul.kb->affectable'),
		//Enter a sub context. <ctx> is the context
		enter: function(xpr) {
			if(!xpr) xpr = [];
			else if(!isArray(xpr)) xpr = [xpr];
			var ctx = this.emptyCtx(xpr);
			if(nul.debug) {
				nul.debug.log('leaveLog')(nul.debug.lcs.collapser('Entering'),nul.debug.logging?ctx['+entrHTML']():'');
				if(nul.debug.logging) ctx['+ll'] = nul.debug.logs.length();
				if(nul.debug.watches) nul.debug.kbase.push(nul.debug.ctxTable(ctx));
			}
			var knwldgL = this.knowledge.length;
			this.knowledge.unshift(ctx);
			if(nul.debug.watches && nul.debug.assert)
				assert(nul.debug.kbase.length()==this.knowledge.length, 'Entering debug level');
			if(nul.debug.levels) map(xpr, function(c) {
				assert(c.locals.lvl == knwldgL, 'Entering level');
			});
		}.perform('nul.kb->enter'),
		//Leave the context for the expression <xpr>. Contextualisation occurs.
		// This means that the local variables remembered by this left context will be replaced in <xpr>.
		//Returns the contextualised <xpr>
		leave: function(xpr) {
			var tkb = this, ctx = this.knowledge[0];
			if(nul.debug.assert) {
				assert(ctx, 'Knowledge coherence');
				assert('function'== typeof ctx['+entrHTML'], 'Valid context');
				if(nul.debug.watches)
					assert(nul.debug.kbase.length()==this.knowledge.length, 'Leaving debug level');
			}
			try {
				if(xpr) {
					if(ctx[nul.lcl.slf]) delete ctx[nul.lcl.slf];
					//If the expression depends only once of a local
					//Even if this local is known to have a fuzzy value,
					//Replace the value when contextualising
					//note: forcing is made by removing the fuzzy flag that'll be added on
					// contextualise::local summarised
					var deps = isArray(xpr)?xpr[0].deps:xpr.deps;
					if(deps[0]) for(var d in deps[0])
						if(1==deps[0][d] && ctx[d] && ctx[d].flags.fuzzy)
							delete ctx[d].flags.fuzzy;
					xpr = m1a(xpr, function(c) {
						c = c.finalize(tkb) || c;
						return c.fuzzyPremiced([ctx]);
					});
				} else if(nul.debug.assert)
					assert(!ctx[nul.lcl.slf],'ar-developement need means changement');
			}
			finally {
				this.knowledge.shift();
				if(nul.debug.watches) nul.debug.kbase.pop();
			}
			if(nul.debug) {
				nul.debug.log('leaveLog')(nul.debug.lcs.endCollapser('Leave', 'Produce'),
					nul.debug.logging?(
						(xpr?(nul.text.tblHTML(xpr)+ ' after '):'') + ctx['+entrHTML']()):'');
				if(nul.debug.logging) if(ctx['+ll'] == nul.debug.logs.length()) nul.debug.logs.unlog();
				if(nul.debug.assert && xpr) {
					var cctxd = isArray(xpr)?xpr:[xpr];
					if(cctxd.length == ctx['+entr'].length) {
						for(var i=0; i<cctxd.length; ++i) {
							if(!cctxd[i].cmp(ctx['+entr'][i])) break;
							//Check special case (z=1 [] z=2) ==> (-=1 [] -=2)
							//Where fuzzyPremice re-produce the original expression
							if([':','[]'].contains(cctxd[i].charact)) {
								for(var j=0; j<cctxd[i].components.length; ++j)
							  		if(
										'='== cctxd[i].components[j].charact &&
										2== cctxd[i].components[j].components.length && (
											cctxd[i].components[j].components[0].ctxDelta ||
											cctxd[i].components[j].components[1].ctxDelta
									)) break;
								if(j<cctxd[i].components.length) break;
							}
						}
						assert(i<cctxd.length, 'Never produce duplicata');
					}
				}
				if(nul.debug.levels) {
					/*map(ctx['+entr'], function(c) {
						assert(c.locals.lvl == tkb.knowledge.length, 'Leaving level entry preservation');
					});*/
					if(xpr) m1a(xpr, function(c) {
						return assert(c.locals.lvl == tkb.knowledge.length, 'Leaving level return value');
					});
				}
			}
			return xpr;
		}.perform('nul.kb->leave'),
		//Abort a context (for failure).
		//Just returns <xpr>
		abort: function(xpr) {
			var ctx = this.knowledge.shift();
			if(nul.debug) { 
				if(nul.debug.assert) {
					assert(ctx, 'Knowledge coherence');
					assert('function'== typeof ctx['+entrHTML'], 'Valid context');
					if(nul.debug.watches)
						assert(nul.debug.kbase.length()==this.knowledge.length+1, 'Aborting debug level');
				}
				nul.debug.log('leaveLog')(nul.debug.lcs.endCollapser('Abort', 'Fail'), nul.debug.logging?(
					(xpr?(nul.text.tblHTML(xpr)+ ' after '):'') + ctx['+entrHTML']()):'');
				if(nul.debug.watches) { 
					nul.debug.kbase.pop();
					if(ctx['+ll'] == nul.debug.logs.length()) nul.debug.logs.unlog();
				}
			}
			return xpr;
		}.perform('nul.kb->abort'),
		//Call cb under the context <ctx>
		// shortcut to enter-anonymous function-leave
		knowing: function(xpr, cb) {
			var assertKbLen, assertLc;
			if(nul.debug.assert) { assertKbLen = this.knowledge.length; assertLc = nul.debug.lc; } 
			try {
				var rv;
				try {
					this.enter(xpr);
					rv = cb(this);
				} catch(err) { this.abort(rv); throw nul.exception.notice(err); }
				return this.leave(rv);
			} finally { if(nul.debug.assert) assert(assertKbLen== this.knowledge.length,
				'Knowledge enter/leave paired while knowing ['+assertLc+']'); }
		}.perform('nul.kb->knowing'),

		//<dsc> string desc (for failure desc)
		//<cs> components
		//<lcls> locals if stpUp
		//<cb> callback(component, kb) of computation
		//<sbc> components call-back(computed cs) (return new cs)
		trys: function(dsc, cs, lcls, cb, scb) {
			var rv = [], chg = false;
			var kbs = [], tmpKb;

			tmpKb = nul.kb(tmpKb);
			tmpKb.protectedKb = this;
			for(var i=0; i<cs.length; ++i)
				try {
					tmpKb.knowledge = [];
					for(var k=0; k<this.knowledge.length; ++k) tmpKb.knowledge.push([]);
					
					var trv = cb(cs[i], tmpKb);
					if(trv) {
						var strv = trv.known(tmpKb, 1);
						trv = strv?strv.evaluate(tmpKb):trv;
						chg = true;
					} else trv = cs[i];
					kbs.push(tmpKb.knowledge);
					rv.push(trv);
				} catch(err) {
					if(nul.debug.assert)
						assert(tmpKb.knowledge.length==this.knowledge.length, 'Context-less temp KB')
					if(nul.failure!= err) throw nul.exception.notice(err);
					chg=true;
				}
			if(!chg) {
				if(!scb) return;
				rv = scb(cs, kbs);
				if(!rv) return;
			}
			else if(scb) rv = scb(rv, kbs) || rv;
			switch(rv.length)
			{
				case 0: nul.fail('No valid case in '+dsc);
				case 1:
				if(kbs[0])	//Validate knowledge in this kb
					for(var d=0; d<kbs[0].length; ++d)
						for(var v=0; v<kbs[0][d].length; ++v)
							if(kbs[0][d][v])
								this.knowledge[d][v] = kbs[0][d][v];
				return rv[0].stpUp(lcls, this);
			}
			return map(rv, function(c, i) {
				if(kbs[i]) return c.fuzzyPremiced(kbs[i]);
				return c;
			});
		}.perform('nul.kb->trys')
	};
};