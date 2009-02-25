/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
 
nul.eval = {
	finalize: function(ctxd, kb) {
		var assertKbLen, assertLc;
		if(nul.debug.assert) {
			assertKbLen = kb.knowledge.length; assertLc = nul.debug.lc; } 

		ctxd = ctxd.known(kb) || ctxd;
		while(ctxd.flags.dirty) {
			try {
				var chg = false;
				if(!ctxd.evaluation || !ctxd.evaluation.management) {
					var cps, ats;
					cps = map(ctxd.components, function(o) {
						if(o.dirty) {
							o = o.evaluate(kb).numerise(ctxd).clean();
							chg = true;
						}
						return o;
					});
					ats = map(ctxd.attributes, function(o, ky) {
						if(o.dirty) {
							o = o.evaluate(kb).numerise(ctxd).clean();
							if(ctxd.deps[0]&&ctxd.deps[0][ky]) kb.know(ky, o, 1);
							chg = true;
						}
						return o;
					});
					ctxd = chg?ctxd.clone(cps, ats):ctxd;
				}
	
				var rv;
				if(ctxd.evaluation && (
					!ctxd.evaluation.evaluable ||
					ctxd.evaluation.evaluable(ctxd)
				) ) {
					rv = ctxd.evaluation.evaluated(ctxd, kb);
					if(rv) { chg = true; ctxd = rv; }
				}
				if(!rv) ctxd = ctxd.summarised().clean();
			} finally { if(nul.debug.assert)
				assert(assertKbLen== kb.knowledge.length,
					'Knowledge enter/leave paired while finalizing ['+assertLc+']'); }
			ctxd = ctxd.known(kb) || ctxd;
		}
		return ctxd;
	}.describe(function(ctxd, kb) { return 'Finalizing '+ctxd.toHTML(); })
	.perform('nul.eval.finish'),
	/*TODO: type expectations
	 * &&, || expect boolean
	 * &, |, ^ expect numbers or booleans
	 */
	cumul: function(c, asAccum, by2op, solvedActx, partialActx, accumulable) {
		var accum = [], cdp = [], tv;
		for(var i=0; i<c.length; ++i)
			if(accumulable(c[i]))
			{
				tv = asAccum(c[i])
				if(isArray(accum) && 0==accum.length) accum = tv;
				else accum = by2op(accum, tv);
			}
			else cdp.push(c[i]);
		if(cdp.length >= c.length-1) return;
		accum = solvedActx(accum);
		if(0>= cdp.length) return accum;
		cdp.push(accum);
		return partialActx(cdp);			
	}.perform('nul.eval.cumul'),

	evaluate: function(kb) {
		return {
			name: 'evaluation',
			kb: kb,
			newComponent: function(ctxd, oldComp, newComp) {
				if(oldComp!= newComp) newComp = newComp.numerise(ctxd);
				return newComp.clean();
			},
			newAttribute: function(ctxd, name, oldAttr, newAttr) {
				if(ctxd.deps[0]&&ctxd.deps[0][name]) this.kb.know(name, newAttr, 1);
				if(oldAttr!= newAttr) newAttr = newAttr.numerise(ctxd);
				return newAttr.clean();
			},
			browse: function(ctxd) {
				return !ctxd.evaluation || !ctxd.evaluation.management;
			},
			before: function(ctxd) {
				if(!ctxd.flags.dirty) throw nul.ctxd.noBrowse;
				this.kb.enter(ctxd);
			},
			finish: function(ctxd, chgd) {
				var assertKbLen, assertLc;
				if(nul.debug.assert) { assertKbLen = this.kb.knowledge.length; assertLc = nul.debug.lc; } 
				if(nul.debug.levels) assert(ctxd.locals.lvl == this.kb.knowledge.length-1, 'Evaluation level');
				try {
					try {
						var rv;
						if(ctxd.evaluation && (
							!ctxd.evaluation.evaluable ||
							ctxd.evaluation.evaluable(ctxd)
						) ) {
							rv = ctxd.evaluation.evaluated(ctxd, this.kb);
							if(rv) { chgd = true; ctxd = rv; }
						}
						if(!rv && chgd) ctxd = ctxd.summarised().clean();
					} catch(err) { this.abort(ctxd); throw err; }
					
					return this.kb.leave(chgd?ctxd:undefined);
				} finally { if(nul.debug.assert) assert(assertKbLen== this.kb.knowledge.length+1,
					'Knowledge enter/leave paired while evaluation ['+assertLc+']'); }
			}.describe(function(ctxd, chgd) { return 'Evaluating '+ctxd.toHTML(); }),
			abort: function(ctxd, chgd) {
				if(ctxd && !ctxd.flags.dirty) return;
				return this.kb.abort(chgd?ctxd:undefined, ctxd);
			}
		};
	},

	application: {
		management: true,
		evaluable: function(ctxd) {
			return (ctxd.components.applied.free() && !ctxd.components.applied.flags.fuzzy)
				|| !ctxd.components.object.deps[0]
				|| !ctxd.components.object.deps[0][nul.lcl.slf];
		},
		evaluated: function(ctxd, kb) {
			var obj = ctxd.components.object.evaluate(kb) || ctxd.components.object;
			var apl = ctxd.components.applied.evaluate(kb) || ctxd.components.applied;
			if(obj.take) {
				//var rv = kb.knowing([obj, apl], function(kb) {
					var rv = obj.take(apl, kb, ctxd.locals);
				//});
				if(!rv) return rv;
				if(rv.deps[0] && rv.deps[0][nul.lcl.rcr])	//TODO: optimise :)
					rv = rv.rDevelop(obj, 0, nul.lcl.rcr).dirty();
						
				return rv;
			}
			if(ctxd.components.object.free())
				throw nul.semanticException('Not a set : '+ ctxd.components.object.toHTML());
			
		}.describe(function(ctxd, kb) {
			return ''+
				'Applying '+ctxd.components.applied.toHTML()+
				' to '+ctxd.components.object.toHTML();
		}).perform('nul.eval.application.evaluated')
	},
	biExpr: {
		evaluable: function(ctxd)
		{
			return ctxd.components[0].free() && ctxd.components[1].free();
		},
		evaluated: function(ctxd, kb)
		{
			return nul.actx.atom(eval('' +
				nul.asJs(ctxd.components[0], ctxd.charact) +
				ctxd.charact +
				nul.asJs(ctxd.components[1], ctxd.charact) )).withLocals(ctxd.locals);
		}.perform('nul.eval.biExpr.evaluated')
	},
	cumulExpr: {
		evaluable: function(ctxd)
		{
			return ctxd.free();	//TODO: manage: numbers commutatives but not strings!
			/*var nbrCumulable = 0;
			for(var i=0; i<ctxd.components.length; ++i)
				if(ctxd.components[i].free() && !ctxd.components.fuzzy
					&& 1< ++nbrCumulable) return true;*/
		}.perform('nul.eval.cumulExpr.evaluable'),
		evaluated: function(ctxd, kb)
		{
			var rv = nul.eval.cumul(
				ctxd.components,
				function(o) { return nul.asJs(o,ctxd.charact); },
				function(a,b) { return eval( ''+nul.jsVal(a) + ctxd.charact + nul.jsVal(b) ); },
				function(v) { return nul.actx.atom(v).withLocals(ctxd.locals); },
				function(ops) { return nul.actx.cumulExpr(ctxd.charact, ops).numerise(ctxd.locals.lvl); },
				function(o) { return !o.flags.fuzzy && o.free(); }
			);
			if(rv) return rv.clean();
		}.perform('nul.eval.cumulExpr.evaluated')
	},
	preceded: {
		evaluable: function(ctxd)
		{
			return ctxd.free() && !ctxd.flags.fuzzy;
		},
		evaluated: function(ctxd, kb)
		{
			return nul.actx.atom(eval( ctxd.charact + nul.asJs(ctxd.components[0],ctxd.charact) ))
				.withLocals(ctxd.locals);
		}.perform('nul.eval.preceded.evaluated')
	},
	assert: {
		evaluable: function(ctxd)
		{
			return ctxd.free();
		},
		evaluated: function(ctxd, kb)
		{
			var v = nul.asJs(ctxd.components[0],'?');
			if('boolean'!= typeof v)
				throw nul.semanticException('Boolean expected instead of ' +
					ctxd.components[0].toString());
			if(v) return ctxd.components[0].withLocals(ctxd.locals);
			nul.fail('Assertion not provided');
		}.perform('nul.eval.assert.evaluated')
	},
	extraction: {
		//TODO: nul.eval.extraction
	},
	unification: {
		evaluated: function(ctxd, kb)
		{
			var rv = nul.unify.multiple(ctxd.components, kb, ctxd.locals)
			if(!rv) return;
			if(1== rv.length)
				return rv[0].stpUp(ctxd.locals, kb);

			return ctxd.clone(rv);
		}.perform('nul.eval.unification.evaluated')
	},
	and3: {
		evaluated: function(ctxd, kb)
		{
			var cdp = [], i;
			for(i=0; i<ctxd.components.length-1; ++i)
				if(ctxd.components[i].flags.failable)
					cdp.push(ctxd.components[i]);
			if(0== cdp.length)
				return ctxd.components[i].stpUp(ctxd.locals, kb);
			cdp.push(ctxd.components[i]);
			if(cdp.length < ctxd.components.length) return ctxd.clone(cdp).clean();
		}.perform('nul.eval.and3.evaluated')
	},
	or3: {
		management: true,
		evaluated: function(ctxd, kb)
		{
			var rv = kb.trys(
				'OR3', ctxd.components, ctxd.locals,
				function(c, kb) { return c.browse(nul.eval.evaluate(kb)); });
			if(rv && isArray(rv)) return nul.actx.or3(rv).withLocals(ctxd.locals).clean();
			return rv;
		}.perform('nul.eval.or3.evaluated')
	},
	xor3: {
		management: true,
		evaluated: function(ctxd, kb)
		{
			var rv = kb.trys(
				'XOR3', ctxd.components, ctxd.locals,
				function(c, kb) { return c.browse(nul.eval.evaluate(kb)); },
				function(cs, kbs) {
					for(var i=0; i<cs.length-1; ++i) {
						var d=0;
						while(d<kbs[i].length && 0>=kbs[i][d].length) ++d;
						if(!cs[i].flags.failable && d>=kbs[i].length) return cs.splice(0,i+1);
					}
				});
			if(rv && isArray(rv)) rv = ctxd.clone(rv);
			return rv;
		}.perform('nul.eval.xor3.evaluated')
	},
	objectivity: {
		evaluated: function(ctxd, kb)
		{
			var itm = ctxd.components.item.contextualize(ctxd.components.object.attributes, 1);
			if(itm) return (itm.evaluate(kb) || itm).stpUp(ctxd.locals, kb);
			return;
			//TODO: once locals get down to more specific,
			//  if a specific local don't give an attribute, we can consider the attribute is
			//  absent and throw an error. Beside, the value can still be modified beside.
			throw nul.semanticException(
				'No such attribute declared : '+keys(itm.deps[1]).join(', '));
		}.perform('nul.eval.objectivity.evaluated')
	}
};