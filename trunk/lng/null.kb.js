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
			ctx['+entr'] = clone1(entr);
			ctx['+entrHTML'] = function(glue) { return nul.actx.tblHTML(this['+entr'], glue); };
			return ctx;
		},
		//Add knowledge to this knowledge base.
		//State that the context <ctxDelta> has for the index <lindx> the value <xpr>. 
		know: function(lcl, xpr, vDelta) {
			if('string'== typeof lcl) lcl = {ctxDelta: 0, lindx: lcl};
			this.knowledge[lcl.ctxDelta][lcl.lindx] =
				xpr.localise(lcl.ctxDelta+(vDelta||0)).numerise();
			if(nul.debug) {
				var _lcl = nul.actx.local('+'+(this.knowledge.length-lcl.ctxDelta), lcl.lindx, lcl.dbgName||'').toHTML();
				var _xpr = this.knowledge[lcl.ctxDelta][lcl.lindx].toHTML();
				nul.debug.log('knowledgeLog')('Know', _lcl + ' as ' + _xpr);
				if(nul.debug.watches) {
					nul.debug.kevol.log(_lcl, _xpr);
					if(!this.protectedKb)	//TODO: afficher plusieurs KB, le protégé et l'actuel en colonnes ?
					//TODO: standardiser le "context change debug"
						nul.debug.kbase.item(lcl.ctxDelta).set(nul.debug.ctxTable(this.knowledge[lcl.ctxDelta]));
				}
			}
			if(this.protectedKb &&
				this.protectedKb.knowledge.length+lcl.ctxDelta > this.knowledge.length)
					return lcl;	//if xpr is not fuzzy, returns xpr */
			return xpr;	
		},
		
		protectedKnowledge: function(lcl, fct) {
			if(nul.debug.assert) assert(this.protectedKb,'Verify before !');
			var pCtxDelta = this.knowledge.length + this.protectedKb.knowledge.length;
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
		},
		known: function(lcl) {
			if('string'== typeof lcl) lcl = {ctxDelta: 0, lindx: lcl};
			if(!this.knowledge[lcl.ctxDelta]) return;
			var rv = this.knowledge[lcl.ctxDelta][lcl.lindx];
			if(rv) return rv.localise(lcl.ctxDelta).numerise(lcl.locals.lvl);
			if(this.protectedKb) return this.protectedKnowledge(lcl,'known');
		},
		//Affect an expression to a local variable.
		//<lcl> and <xpr> are both actx-s.
		affect: function(lcl, xpr) {
			if(this.affectable(xpr)) {
				if(xpr.ctxDelta == lcl.ctxDelta && xpr.lindx == lcl.lindx) return lcl;
				//Always affect to the lowest ctxDelta : the lower in the xpr hyerarchi
				//Only affect once : circle references kills
				if( lcl.ctxDelta > xpr.ctxDelta ||
					(lcl.ctxDelta < xpr.ctxDelta && (
						lcl.lindx < xpr.lindx || nul.lcl.slf== xpr.lindx)))
					{ var tmp = xpr; xpr = lcl; lcl = tmp; }
			} 
 			if(nul.debug.assert) assert('undefined'!= typeof lcl.lindx, 'Some condition should be verified before')
			xpr = xpr.contextualize(
				nul.lcl.selfCtx(lcl.dbgName, lcl.lindx),
				lcl.ctxDelta) || xpr;
			if(this.isKnown(lcl)) xpr = nul.unify.level(xpr, this.known(lcl), this);	//TODO: workaround with leave/enter
			if(nul.lcl.slf!= lcl.lindx) return this.know(lcl, xpr);
			this.know(lcl, xpr);
			return lcl;
		}.describe(function(lcl, xpr) {
			return 'Affecting to '+lcl.toHTML()+' the value '+xpr.toHTML();
		}),
		//Determine if the expression <xpr> can simply be affected a value for this knowledge base.
		affectable: function(xpr) {
			return ('undefined'!= typeof xpr.lindx) &&
				0<=xpr.ctxDelta &&
				''!==this.knowledge[xpr.ctxDelta];
		},
		//Enter a sub context. <ctx> is the context (as "lindx => actx"
		enter: function(ctxd) {
			if(!ctxd) ctxd = [];
			else if(!isArray(ctxd)) ctxd = [ctxd];
			var ctx = this.emptyCtx(ctxd);
			if(nul.debug) {
				nul.debug.log('leaveLog')(nul.debug.collapser('Entering'),ctx['+entrHTML']());
				if(nul.debug.logging) ctx['+ll'] = nul.debug.logs.length();
				if(nul.debug.watches) nul.debug.kbase.push(nul.debug.ctxTable(ctx));
			}
			var knwldgL = this.knowledge.length;
			this.knowledge.unshift(ctx);
			if(nul.debug.watches && nul.debug.assert)
				assert(nul.debug.kbase.length()==this.knowledge.length, 'Entering debug level');
			if(nul.debug.levels) map(ctxd, function(c) {
				assert(c.locals.lvl == knwldgL, 'Entering level');
			});
		},
		//Leave the context for the expression <ctxd>. Contextualisation occurs.
		// This means that the local variables remembered by this left context will be replaced in <ctxd>.
		//Returns the contextualised <ctxd>
		leave: function(ctxd) {
			var ctx = this.knowledge.shift();
			if(nul.debug.assert) {
				assert(ctx, 'Knowledge coherence');
				assert('function'== typeof ctx['+entrHTML'], 'Valid context');
				if(nul.debug.watches)
					assert(nul.debug.kbase.length()==this.knowledge.length+1, 'Leaving debug level');
			}
			var tkb = this;
			if(nul.debug) {
				nul.debug.log('leaveLog')(nul.debug.endCollapser('Leave', 'Produce'),
					(ctxd?(nul.actx.tblHTML(ctxd)+ ' after '):'') + ctx['+entrHTML']());
				if(nul.debug.watches) nul.debug.kbase.pop();
				if(nul.debug.logging) if(ctx['+ll'] == nul.debug.logs.length()) nul.debug.logs.unlog();
				if(nul.debug.levels) {
					map(ctx['+entr'], function(c) {
						assert(c.locals.lvl == tkb.knowledge.length, 'Leaving level entry preservation');
					});
					if(ctxd) m1a(ctxd, function(c) {
						return assert(c.locals.lvl == tkb.knowledge.length, 'Leaving level return value');
					});
				}
			}
			if(ctxd) {
				if(ctx[nul.lcl.slf]) delete ctx[nul.lcl.slf];
				ctxd = m1a(ctxd, function(c) {
						var sc = c.contextualize(ctx);
						//TODO: add this line and be optimised !
						//if(c.flags.dirty) sc = (sc||c);
						return sc?(sc.evaluate(tkb) || sc):c;
					});
			} else if(nul.debug.assert)
				assert(!ctx[nul.lcl.slf],'ar-developement need means changement');
			return ctxd;
		},
		//Abort a context (for failure).
		//Just returns <ctxd>
		abort: function(ctxd, orig) {
			var ctx = this.knowledge.shift();
			if(nul.debug) { 
				if(nul.debug.assert) {
					assert(ctx, 'Knowledge coherence');
					assert('function'== typeof ctx['+entrHTML'], 'Valid context');
					if(nul.debug.watches)
						assert(nul.debug.kbase.length()==this.knowledge.length+1, 'Aborting debug level');
				}
				nul.debug.log('leaveLog')(nul.debug.endCollapser('Abort', 'Fail'),
					(ctxd?(nul.actx.tblHTML(ctxd)+ ' after '):'') + ctx['+entrHTML']());
				if(nul.debug.watches) { 
					nul.debug.kbase.pop();
					if(ctx['+ll'] == nul.debug.logs.length()) nul.debug.logs.unlog();
				}
			}
			return ctxd;
		},
		//Call cb under the context <ctx>
		// shortcut to enter-anonymous function-leave
		knowing: function(ctxd, cb) {
			var assertKbLen, assertLc;
			if(nul.debug.assert) { assertKbLen = this.knowledge.length; assertLc = nul.debug.lc; } 
			try {
				var rv;
				try {
					this.enter(ctxd);
					rv = cb(this);
				} catch(err) { this.abort(rv, ctxd); throw err; }
				return this.leave(rv);
			} finally { if(nul.debug.assert) assert(assertKbLen== this.knowledge.length,
				'Knowledge enter/leave paired while knowing ['+assertLc+']'); }
		},

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
						//No contextualisation ! Locals from protected knowledge base remains as
						// they are : they can be precised "afterward" in protected knowledge base. 
						//TODO: dirty? need to evaluate ?
						trv = trv.evaluate(tmpKb) || trv;
						chg = true;
					} else {
						trv = cs[i];
					}
					kbs.push(tmpKb.knowledge);
					rv.push(trv);
				} catch(err) {
					if(nul.debug.assert)
						assert(tmpKb.knowledge.length==this.knowledge.length, 'Context-less temp KB')
					if(nul.failure!= err) throw err;
					chg=true;
				}
			if(!chg) {
				if(!scb) return;
				rv = clone1(cs);
			}
			if(scb) rv = scb(rv, kbs) || rv;
			if(rv == cs) return;
			switch(rv.length)
			{
				case 0: nul.fail('No valid case in '+dsc);
				case 1:
				if(kbs[0])	//Validate knowledge in this kb
					for(var d=0; d<kbs[0].length; ++d)
						for(var v=0; v<kbs[0][d].length; ++v)
							this.knowledge[d][v] = kbs[0][d][v];
				return rv[0].stpUp(lcls, this);
			}
			return map(rv, function(c, i) {
				var lcls = [];
				var vals = [];
				if(kbs[i]) for(var d=0; d<kbs[i].length; ++d)
					for(var v=0; v<kbs[i][d].length; ++v) if(kbs[i][d][v]) {
						lcls.push(nul.actx.local(d+4, v,'-').ctxd());
						vals.push(kbs[i][d][v].localise(d+4));
					}
				if(0< lcls.length) {
					lcls = nul.actx.staticExpr(lcls).ctxd();
					vals = nul.actx.staticExpr(vals).ctxd();
					var prem = nul.actx.unification([lcls, vals]).ctxd();
					if(nul.actx.isC(c,';')) c = c.modify(unshifted(prem,c.components));
					else c = nul.actx.and3([prem,c.wrap()]).ctxd();
				}
				return c;
			});
		}

	};
};