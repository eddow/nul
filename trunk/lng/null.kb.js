/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.inside = function(iv) {
	return ('dbg'== iv) ? {
		leave: function() { throw nul.internalException('One too much context exit.') }
	} : (nul.debug.logging || nul.debug.watches) ? {
		stck: iv?['']:[],
		origHTML: iv?['']:[],
		enter: function(xpr) {
			this.origHTML.unshift(nul.text.tblHTML(xpr)); 
			this.stck.unshift(xpr);
		},
		//return weither the we get out of this inside 
		leave: function() {
			this.stck.shift();
			this.origHTML.shift();
			return 0==this.stck.length; }
	} : {	//TODO: non-debug version don't keep 'inside' :
			//either it's a set then knowledge move on enter/leave/abort either nothing
			//note: the abort should take sth to specify when it's a set then
		iv: iv||0,
		enter: function() { ++this.iv; },
		leave: function() { return !--this.iv; }
	};
}

nul.kb = function(knowledge) {
	return {
		//The effective data : a list of contexts where
		// the last one is the root context, the first specified
		// the first one knowledg[0] is the crrent-level context
		knowledge: knowledge || [],
		insides: [nul.inside(1)],
		//Add knowledge to this knowledge base.
		//State that the context <ctxDelta> has for the index <lindx> the value <xpr>. 
		know: function(lcl, xpr, vDelta) {
			var lclzd = xpr.localise(lcl.ctxDelta+(vDelta||0));
			if('string'== typeof lcl) lcl = {ctxDelta: 0, lindx: lcl};
			if(nul.debug) {
				var _lcl;
				var _xpr;
				if(nul.debug.logging || nul.debug.watches) {
					_lcl = nul.build().local(
						'+'+(this.knowledge.length-lcl.ctxDelta), lcl.lindx, lcl.dbgName||'')
						.toHTML();
					_xpr = lclzd.toHTML();
					nul.debug.kevol.log(_lcl, _xpr);
				}
				nul.debug.log('knowledgeLog')('Know', _lcl + ' as ' + _xpr);
				if(nul.debug.assert) assert(this.knowledge[lcl.ctxDelta], _lcl+' is valid');
				if(nul.debug.watches)
					if(!this.protectedKb)	//TODO: afficher plusieurs KB, le protégé et l'actuel en colonnes ?
					//TODO: standardiser le "context change debug"
						nul.debug.kbase.item(lcl.ctxDelta).set(nul.debug.ctxTable(
							this.knowledge[lcl.ctxDelta], this.insides[lcl.ctxDelta]));
			}
			this.knowledge[lcl.ctxDelta][lcl.lindx] = nul.build().set(lclzd);
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
			return this.knowledge[lcl.ctxDelta][lcl.lindx];
		},
		//Gets what is known about a local (or nothing if nothing is known)
		isKnown: function(lcl) {
			var rv = this.holder(lcl);
			return (rv && rv.isXpr) ||
				(this.protectedKb && this.protectedKnowledge(lcl,'isKnown'));
		}.perform('nul.kb->isKnown'),
		createLocal: function(name) {
			name = name || '_';
			if(nul.debug.assert) assert(0<this.knowledge.length, 'Create local in set.');
			this.knowledge[0].push({
				kasName:name,
				dbgHTML: function() { return '&lt;'+name+'&gt;'; },
				toHTML: function() { return '&lt;'+name+'&gt;'; },
				toString: function() { return '&lt;'+name+'&gt;'; }
			});
			return nul.build().local(0, this.knowledge[0].length-1, name);
		},
		known: function(lcl) {
			var rv = this.holder(lcl);
			if(rv && !rv.isXpr) return;
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
			if(this.isKnown(lcl)) {
				var akn = this.known(lcl);
				assert(akn.take || !akn.fixed(), 'Sets are expressed in knowledge')
				var tkn;
				if(akn.take) tkn = akn.take(
					nul.build().lambda(xpr, this.createLocal()), this, xpr.x);
				if(tkn) {
					if(nul.debug.assert) assert(':-'== tkn.charact, 'Type check should leave a lambda');
					xpr = tkn.components.parms;
				} else if(';'!= xpr.charact) xpr = xpr.premiced(nul.build().application(akn, xpr));
				else xpr = xpr.premiced(nul.build().application(akn, xpr.components[0]));
			}
			xpr = xpr.finalize(this) || xpr;
			/*TODO: error on self or ok if set
			xpr = xpr.contextualize(
				nul.lcl.selfCtx(lcl.dbgName, lcl.lindx),
				lcl.ctxDelta) || xpr;*/
			xpr.kasName = this.holder(lcl).kasName;
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
			var ctx;
			if(1== xpr.length) ctx = xpr[0].makeCtx();

			nul.debug.log('leaveLog')(nul.debug.lcs.collapser('Entering'),
				nul.debug.logging?this.insides[0].origHTML[0]:'');

			if(ctx) {
				this.knowledge.unshift(ctx);
				this.insides.unshift(nul.inside());
				if(nul.debug.watches) nul.debug.kbase.push(nul.debug.ctxTable(ctx, this.insides[0]));
			}
			this.insides[0].enter(xpr)
			
			if(nul.debug) {
				if(nul.debug.watches && nul.debug.assert)
					assert(nul.debug.kbase.length()==this.knowledge.length, 'Entering debug level');
			}
		}.perform('nul.kb->enter'),
		//Leave the context for the expression <xpr>. Contextualisation occurs.
		// This means that the local variables remembered by this left context will be replaced in <xpr>.
		//Returns the contextualised <xpr>
		leave: function(xpr) {
			var unique = !isArray(xpr);
			if(unique) xpr = xpr?[xpr]:[];
			var tkb= this, ctx;
			
			nul.debug.log('leaveLog')(nul.debug.lcs.endCollapser('Leave', 'Produce'),
				nul.debug.logging?(
					(0<xpr.length?(nul.text.tblHTML(xpr)+ ' after '):'') +
					this.insides[0].origHTML[0]):'');

			if(this.insides[0].leave()) {
				ctx = this.knowledge.shift();
				this.insides.shift();
				if(nul.debug.watches) nul.debug.kbase.pop();
			}
			
			if(nul.debug.assert) {
				if(nul.debug.watches)
					assert(nul.debug.kbase.length()==this.knowledge.length, 'Leaving debug level');
			}
			if(nul.debug) {
				/*TODO: seek for duplicatas
				if(nul.debug.assert && xpr) {
					if(xpr.length == this.insides[0].stck[0].length) {
						for(var i=0; i<xpr.length; ++i)
							if(!xpr[i].cmp(this.insides[0].stck[0][i])) break;
						assert(i<xpr.length, 'Never produce duplicata');
					}
				}*/
			}
			if(ctx) {
				if(0< xpr.length) {
					assert(1==xpr.length, 'Set evaluate one by one');
					xpr = [xpr[0].takeCtx(this.knowledge.shift())];
				} else this.knowledge.shift();
				if(nul.debug.watches) nul.debug.kbase.pop();
			}
			return unique?xpr[0]:xpr;
		}.perform('nul.kb->leave'),
		//Abort a context (for failure).
		//Just returns <xpr>
		abort: function(xpr) {
			var unique = !isArray(xpr);
			if(unique) xpr = [xpr];

			nul.debug.log('leaveLog')(nul.debug.lcs.endCollapser('Abort', 'Fail'),
				nul.debug.logging?(
				(xpr && 0<xpr.length?(nul.text.tblHTML(xpr)+ ' after '):'') +
				this.insides[0].origHTML[0]):'');
				
			if(this.insides[0].leave()) {
				this.knowledge.shift();
				this.insides.shift();
				if(nul.debug.watches) nul.debug.kbase.pop();
			}

			if(nul.debug.assert) {
				if(nul.debug.watches)
					assert(nul.debug.kbase.length()==this.knowledge.length, 'Aborting debug level');
			}
			return unique?xpr[0]:xpr;
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
		//<x> locals if stpUp
		//<cb> callback(component, kb) of computation
		//<sbc> components call-back(computed cs) (return new cs)
		trys: function(dsc, cs, x, cb, scb) {
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
				return rv[0].stpUp(x, this);
			}
			return map(rv, function(i) {
				if(kbs[i]) return this.fuzzyPremiced(kbs[i]);
				return this;
			});
		}.perform('nul.kb->trys')
	};
};